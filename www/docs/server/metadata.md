---
id: metadata
title: Metadata
sidebar_label: Metadata
slug: /server/metadata
---

可以通过 “过程（procedure）” 一个可选、特殊的属性 `meta` 来给 “过程（Procedure）” 添加元数据（Metadata），这个属性将可以在所有中间件函数的参数中取到。

:::tip
如果你希望为应用程序公开与 REST 兼容的端点，请与 [`trpc-openapi`](https://github.com/jlalmes/trpc-openapi) 一起使用元数据。
:::

## 使用元数据的类型创建路由

```tsx
import { initTRPC } from '@trpc/server';

// [...]

interface Meta {
  authRequired: boolean;
}

export const t = initTRPC.context<Context>().meta<Meta>().create();

export const appRouter = t.router({
  // [...]
});
```

## 每个路由都带有身份验证配置的示例

```tsx title='server.ts'
import { initTRPC } from '@trpc/server';

// [...]

interface Meta {
  authRequired: boolean;
}

export const t = initTRPC.context<Context>().meta<Meta>().create();

const isAuthed = t.middleware(async (opts) => {
  const { meta, next, ctx } = opts;
  // 只有在启用授权时才检查身份验证
  if (meta?.authRequired && !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});

export const authedProcedure = t.procedure.use(isAuthed);

export const appRouter = t.router({
  hello: authedProcedure.meta({ authRequired: false }).query(() => {
    return {
      greeting: 'hello world',
    };
  }),
  protectedHello: authedProcedure.meta({ authRequired: true }).query(() => {
    return {
      greeting: 'hello-world',
    };
  }),
});
```

## 默认元数据、链式调用和浅层合并

You can set default values for your meta type, and if you chain meta on top of a base procedure it will be shallow merged.
你可以为元数据设置默认值，如果在 “基础过程（Base procedure）” 之上链式调用元数据，则会进行浅层合并。

```tsx
import { initTRPC } from '@trpc/server';

interface Meta {
  authRequired: boolean;
  role?: 'user' | 'admin'
}

export const t = initTRPC
  .context<Context>()
  .meta<Meta>()
  .create({
    // 设置默认值
    defaultMeta: { authRequired: false }
  });

const publicProcedure = t.procedure
// ^ Default Meta: { authRequired: false }

const authProcedure = publicProcedure
  .use(authMiddleware)
  .meta({
    authRequired: true;
    role: 'user'
  });
// ^ Meta: { authRequired: true, role: 'user' }

const adminProcedure = authProcedure
  .meta({
    role: 'admin'
  });
// ^ Meta: { authRequired: true, role: 'admin' }
```
