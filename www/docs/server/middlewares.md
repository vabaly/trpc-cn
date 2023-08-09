---
id: middlewares
title: Middlewares
sidebar_label: Middlewares
slug: /server/middlewares
---

你可以使用 `t.procedure.use()` 方法给 “过程（procedure）” 添加中间件（Middleware）。中间件将包装 “过程（procedure）” 的调用，并且必须将它的返回值传递给下一个中间件或最终的调用方。

## 授权

下面的示例中，在执行 `adminProcedure` 之前都会确保用户是 “管理员”。

```twoslash include admin
import { TRPCError, initTRPC } from '@trpc/server';

interface Context {
  user?: {
    id: string;
    isAdmin: boolean;
    // [..]
  };
}

const t = initTRPC.context<Context>().create();
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const router = t.router;

const isAdmin = middleware(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user?.isAdmin) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return opts.next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const adminProcedure = publicProcedure.use(isAdmin);
```

```ts twoslash
// @include: admin
```

```ts twoslash
// @filename: trpc.ts
// @include: admin
// @filename: _app.ts
// ---cut---
import { adminProcedure, publicProcedure, router } from './trpc';

const adminRouter = router({
  secretPlace: adminProcedure.query(() => 'a key'),
});

export const appRouter = router({
  foo: publicProcedure.query(() => 'bar'),
  admin: adminRouter,
});
```

:::tip
了解有关上面示例中抛出的 `TRPCError` 的更多信息，请参阅[错误处理](error-handling.md)。
:::

## 日志记录

在下面的示例中，将自动记录查询的时间。

```twoslash include trpclogger
import { initTRPC } from '@trpc/server';
const t = initTRPC.create();

export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const router = t.router;

declare function logMock(...args: any[]): void;
// ---cut---
const loggerMiddleware = middleware(async (opts) => {
  const start = Date.now();

  const result = await opts.next();

  const durationMs = Date.now() - start;
  const meta = { path: opts.path, type: opts.type, durationMs };

  result.ok
    ? console.log('OK request timing:', meta)
    : console.error('Non-OK request timing', meta);

  return result;
});

export const loggedProcedure = publicProcedure.use(loggerMiddleware);
```

```ts twoslash
// @include: trpclogger
```

```ts twoslash
// @filename: trpc.ts
// @include: trpclogger
// @filename: _app.ts
// ---cut---
import { loggedProcedure, router } from './trpc';

export const appRouter = router({
  foo: loggedProcedure.query(() => 'bar'),
  abc: loggedProcedure.query(() => 'def'),
});
```

## 上下文扩展

“上下文扩展” 使得中间件可以以类型安全的方式动态添加和覆盖 “基础过程” 上下文中的属性。

下面是一个示例，其中会在一个中间件上更改上下文的属性，然后所有后续的消费者（如其他中间件或 “过程（procedures）”）都可以使用这些更改：

```ts twoslash
// @target: esnext
import { initTRPC, TRPCError } from '@trpc/server';

const t = initTRPC.context<Context>().create();
const publicProcedure = t.procedure;
const router = t.router;
const middleware = t.middleware;

// ---cut---

type Context = {
  // 用户可为空
  user?: {
    id: string;
  };
};

const isAuthed = middleware((opts) => {
  const { ctx } = opts;
  // `ctx.user` 可为空
  if (!ctx.user) {
    //     ^?
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return opts.next({
    ctx: {
      // ✅ 现在已经从类型上就确定 `user` 值不为空了
      user: ctx.user,
      // ^?
    },
  });
});

const protectedProcedure = publicProcedure.use(isAuthed);
protectedProcedure.query(({ ctx }) => ctx.user);
//                                        ^?
```

## 扩展中间件

:::info
我们将其前缀设置为 `unstable_`，这是因为它是一个新的 API，但你可以放心使用！[了解更多](/docs/faq#unstable)。
:::

我们有一个强大的功能叫做 `.pipe()`，它可以以类型安全的方式扩展中间件。

下面是一个扩展基础中间件（foo）的中间件的示例。就像上面的上下文扩展示例一样，管道中间件也可以更改上下文的属性，并且 “过程（Procedure）” 将接收到新的上下文值。  

```ts twoslash
// @target: esnext
import { initTRPC, TRPCError } from '@trpc/server';

const t = initTRPC.create();
const publicProcedure = t.procedure;
const router = t.router;
const middleware = t.middleware;

// ---cut---

const fooMiddleware = middleware((opts) => {
  return opts.next({
    ctx: {
      foo: 'foo' as const,
    },
  });
});

const barMiddleware = fooMiddleware.unstable_pipe((opts) => {
  const { ctx } = opts;
  ctx.foo;
  //   ^?
  return opts.next({
    ctx: {
      bar: 'bar' as const,
    },
  });
});

const barProcedure = publicProcedure.use(barMiddleware);
barProcedure.query(({ ctx }) => ctx.bar);
//                              ^?
```

请注意，管道中间件的顺序很重要，因为上下文是共享的。下面是一个错误的管道示例。在这个示例中，`fooMiddleware` 覆盖了 `ctx.a`，而 `barMiddleware` 仍然期望获得从 `initTRPC` 的初始化中产生的上下文（译者注：先执行 `fooMiddleware` 改变了 `ctx.a`，再执行 `barMiddleware` 想获得一开始的 `ctx.a` 就行不通了） - 因此按照先 `fooMiddleware` 再 `barMiddleware` 的顺序进行管道连接将无法工作，而按照先 `barMiddleware` 再 `fooMiddleware` 的顺序就可以正常工作。

```ts twoslash
import { initTRPC } from '@trpc/server';

const t = initTRPC
  .context<{
    a: {
      b: 'a';
    };
  }>()
  .create();

const fooMiddleware = t.middleware((opts) => {
  const { ctx } = opts;
  ctx.a; // 👈 fooMiddleware期望 `ctx.a`是一个对象
  //  ^?
  return opts.next({
    ctx: {
      a: 'a' as const, // 👈 `ctx.a` 不再是一个对象
    },
  });
});

const barMiddleware = t.middleware((opts) => {
  const { ctx } = opts;
  ctx.a; // 👈 barMiddleware 期望 `ctx.a` 是一个对象
  //  ^?
  return opts.next({
    ctx: {
      foo: 'foo' as const,
    },
  });
});

// @errors: 2345
// ❌ `ctx.a`从 `fooMiddleware` 到 `barMiddleware` 没有被共享
fooMiddleware.unstable_pipe(barMiddleware);

// ✅ `ctx.a` 在 `barMiddleware` 和 `fooMiddleware` 中是共享的
barMiddleware.unstable_pipe(fooMiddleware);
```
