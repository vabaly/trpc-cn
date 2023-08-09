---
id: authorization
title: Authorization
sidebar_label: Authorization
slug: /server/authorization
---

`createContext` 函数会在每个传入的请求上调用，所以你可以在这里通过请求对象添加关于调用用户的上下文信息。

## 根据请求头创建上下文

```ts title='server/context.ts'
import * as trpc from '@trpc/server';
import { inferAsyncReturnType } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { decodeAndVerifyJwtToken } from './somewhere/in/your/app/utils';

export async function createContext({
  req,
  res,
}: trpcNext.CreateNextContextOptions) {
  // 根据请求对象创建上下文
  // 后续在任意解析器中，可以通过 `ctx` 进行访问

  // 这只是一个你可能想在上下文函数中执行的示例操作
  async function getUserFromHeader() {
    if (req.headers.authorization) {
      const user = await decodeAndVerifyJwtToken(
        req.headers.authorization.split(' ')[1],
      );
      return user;
    }
    return null;
  }
  const user = await getUserFromHeader();

  return {
    user,
  };
}
export type Context = inferAsyncReturnType<typeof createContext>;
```

## 选项 1：使用解析器（resolver）进行授权

```ts title='server/routers/_app.ts'
import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from '../context';

export const t = initTRPC.context<Context>().create();

const appRouter = t.router({
  // 开放给任何人
  hello: t.procedure
    .input(z.string().nullish())
    .query((opts) => `hello ${opts.input ?? opts.ctx.user?.name ?? 'world'}`),
  // 在解析器（resolver）中进行检查
  secret: t.procedure.query((opts) => {
    if (!opts.ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return {
      secret: 'sauce',
    };
  }),
});
```

> 译者注：“解析器（resolver）” 就是 `.query(resolver)`、`.mutation(resolver)` 等这些 “过程（Procedure）” 函数的参数 `resolver`，这个 `resolver` 参数是一个具有输入输出的函数。 

## 选项 2：使用中间件进行授权

```ts title='server/routers/_app.ts'
import { initTRPC, TRPCError } from '@trpc/server';

export const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware((opts) => {
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

// 你可以将其用于任何 “过程（procedure）”
export const protectedProcedure = t.procedure.use(isAuthed);

t.router({
  // 所有人都可以访问
  hello: t.procedure
    .input(z.string().nullish())
    .query((opts) => `hello ${opts.input ?? opts.ctx.user?.name ?? 'world'}`),
  admin: t.router({
    // 只有管理员可以访问
    secret: protectedProcedure.query((opts) => {
      return {
        secret: 'sauce',
      };
    }),
  }),
});
```
