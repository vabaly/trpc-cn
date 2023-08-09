---
id: context
title: Context
sidebar_label: Context
slug: /server/context
---

你的上下文（context）保存着所有的 tRPC 过程（procedures）都可以访问的数据，是存放数据库连接或身份验证信息等内容的理想位置。

设置上下文分为两步：在初始化时定义上下文类型，然后为每个请求创建运行时上下文。

## 定义上下文类型

在使用 `initTRPC` 初始化 tRPC 时，应在调用 `.create() 之前`，将 `.context<TContext>()` 管道传递给 initTRPC 构建函数。类型 `TContext` 可以从函数的返回类型中推断出来，也可以显式定义。

这将确保你在过程（procedures）和中间件中正确地获得上下文的类型。

```ts twoslash
import { initTRPC, type inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getSession } from 'next-auth/react';

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getSession({ req: opts.req });

  return {
    session,
  };
};

const t1 = initTRPC.context<typeof createContext>().create();
// @noErrors
t1.procedure.use(({ ctx }) => { ... });
//                  ^?

type Context = inferAsyncReturnType<typeof createContext>;
const t2 = initTRPC.context<Context>().create();
// @noErrors
t2.procedure.use(({ ctx }) => { ... });
//                  ^?
```

## 创建上下文

`createContext()` 函数必须传递给挂载 appRouter 的处理程序，可以通过 HTTP、[服务端调用](server-side-calls)或我们的[服务端辅助函数](/docs/client/nextjs/server-side-helpers)进行挂载。

`createContext()` 函数在每次 tRPC 调用时都会被调用，所以批量请求将共享一个上下文。

```ts
// 1. HTTP 请求
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { createContext } from './context';
import { appRouter } from './router';

const handler = createHTTPHandler({
  router: appRouter,
  createContext,
});
```

```ts
// 2. 服务端调用
import { createContext } from './context';
import { appRouter } from './router';

const caller = appRouter.createCaller(await createContext());
```

```ts
// 3. 服务端辅助函数
import { createServerSideHelpers } from '@trpc/react-query/server';
import { createContext } from './context';
import { appRouter } from './router';

const helpers = createServerSideHelpers({
  router: appRouter,
  ctx: await createContext(),
});
```

## 示例代码

<!-- prettier-ignore-start -->

```tsx twoslash
// -------------------------------------------------
// @filename: context.ts
// -------------------------------------------------
import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getSession } from 'next-auth/react';

/**
 * 为传入的请求创建上下文
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: CreateNextContextOptions) {
  const session = await getSession({ req: opts.req });

  return {
    session,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

// -------------------------------------------------
// @filename: trpc.ts
// -------------------------------------------------
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user?.email) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
    });
  }
  return next({
    ctx: {
      // 推断 `session` 为非空类型
      session: ctx.session,
    },
  });
});

export const middleware = t.middleware;
export const router = t.router;

/**
 * 无需身份验证的 “过程（procedure）”
 */
export const publicProcedure = t.procedure;

/**
 * 需要身份验证的 “过程（procedure）”
 */
export const protectedProcedure = t.procedure.use(isAuthed);
```

<!-- prettier-ignore-end -->

## 内部和外部上下文

在某些情况下，将上下文拆分为 “内部” 和 “外部” 函数可能是有意义的。

**内部上下文（Inner context）** 是你定义与请求无关的上下文的地方，例如数据库连接。你可以在集成测试或[服务端辅助功能](/docs/client/nextjs/server-side-helpers)中使用此函数，在这些情况下，没有请求对象可用。在这里定义的任何内容将**始终**在你的 “过程（Procedures）” 中可用。

**外部上下文（Outer context）** 是你定义与请求有关的上下文的地方，例如用户会话。在这里定义的内容仅在通过 HTTP 调用的 “过程（Procedures）” 中可用。

## 内部和外部上下文示例

```ts
import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getSessionFromCookie, type Session } from './auth';

/**
 * 定义内部上下文的类型。
 * 在这里添加内部上下文的字段。
 */
interface CreateInnerContextOptions extends Partial<CreateNextContextOptions> {
  session: Session | null;
}

/**
 * 内部上下文。将始终在你的 “过程（procedures）” 中可用，这与外部上下文形成对比。
 *
 * 还适用于：
 * - 测试，这样你就不必模拟 Next.js 的 `req`/`res`
 * - tRPC 的 `createServerSideHelpers` 函数，它没有 `req`/`res`
 *
 * @see https://trpc.io/docs/context#inner-and-outer-context
 */
export async function createContextInner(opts?: CreateInnerContextOptions) {
  return {
    prisma,
    session: opts.session,
  };
}

/**
 * 外部上下文。在上下文中加上 `req` 和 `res` 属性，可在路由中使用它们，并确保它们不为 `undefined`。
 *
 * @see https://trpc.io/docs/context#inner-and-outer-context
 */
export async function createContext(opts: CreateNextContextOptions) {
  const session = getSessionFromCookie(opts.req);

  const contextInner = await createContextInner({ session });

  return {
    ...contextInner,
    req: opts.req,
    res: opts.res,
  };
}

export type Context = inferAsyncReturnType<typeof createContextInner>;

// 在路由中使用方法与前面的示例相同。
```

重要的是可以从**内部上下文（inner context）**中推断出你的 Context 的类型，并且只有在这里定义的内容才真正始终可用于你的所有 “过程（Procedures）” 中。

如果你不想在每个 “过程（Procedure）” 中都检查 `req` 或 `res` 是否为 `undefined`，你可以构建一个小型可重用的 “过程（procedure）” 来处理这个问题：

```ts
export const apiProcedure = publicProcedure.use((opts) => {
  if (!opts.ctx.req || !opts.ctx.res) {
    throw new Error('You are missing `req` or `res` in your call.');
  }
  return opts.next({
    ctx: {
      // 我们在上下文中使用真实的 `req` 和 `res`，这也将影响到 “过程（Procedure）” 中使用的这两个字段的类型。
      req: opts.ctx.req,
      res: opts.ctx.res,
    },
  });
});
```
