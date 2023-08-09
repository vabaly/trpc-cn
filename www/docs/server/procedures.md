---
id: procedures
title: Define Procedures
sidebar_label: Define Procedures
slug: /server/procedures
---

过程（Procedure）是在 tRPC 中向客户端公开的函数，它可以是以下类型之一：

> 译者注：“Procedure” 这个词的使用可能源自早期的计算机科学和编程领域，它是一种常见的术语，用于描述具有输入和输出（输出空也算）的可执行代码块，“Procedure” 常常和 “Function（函数）” 是一个意思，所以从表层形式上看，调用远程可执行的代码块就是调用远程的一个函数。

- 查询（Query）：用于获取数据，通常不会更改任何数据。
- 变更（Mutation）：用于发送数据，通常用于创建、更新或删除操作。
- a `Subscription` - you might not need this, and we have [dedicated documentation](/docs/subscriptions)
- 订阅（Subscription）：你可能不会使用到此类型，不过 tRPC 提供了[专门的文档](/docs/subscriptions)来介绍订阅功能。

在 tRPC 中，过程是创建后端函数的一个非常灵活的基本组件。它们采用了不可变的构建器模式，这意味着你可以创建[可重用的基本过程（Base Procedures）](#reusable-base-procedures)，以在多个过程之间共享功能。

## 编写过程（Procedures）代码

在编写 tRPC 过程时，你可以使用在 tRPC 初始化时创建的 `t` 对象。该对象提供了一个 `t.procedure` 对象，它包含了其他过程的方法。以下是一个示例：

```ts twoslash
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context<{ signGuestBook: () => Promise<void> }>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const appRouter = router({
  // 查询（Queries）是获取数据的最佳位置。
  hello: publicProcedure.query(() => {
    return {
      message: 'hello world',
    };
  }),

  // 变更（Mutations）是执行诸如更新数据库等操作的最佳位置。
  goodbye: publicProcedure.mutation(async (opts) => {
    await opts.ctx.signGuestBook();

    return {
      message: 'goodbye!',
    };
  }),
});
```

## 可重用的 “基本过程（Base Procedures）” {#reusable-base-procedures}

作为一般模式，我们建议你将 `t.procedure` 重命名并导出为 `publicProcedure`，然后你可以为特定用例创建其他命名的 procedures 并导出它们。这种模式被称为 “基本过程（Base Procedures）”，是 tRPC 中代码和行为重用的关键模式；每个应用程序都可能需要它。

下面的示例接受用户的输入并像保护城镇居民一样对其进行[授权](https://en.wikipedia.org/wiki/Authorization)。显然，这只是一个为简单起见而虚构的示例，并不是安全授权应用程序的适当方式，因此在实际应用中，你可能希望使用 [头部（Headers）](/docs/client/headers)、[上下文（Context）](context)、[中间件（Middleware）](middlewares) 和 [元数据（Metadata）](metadata) 的组合来对用户进行[身份验证](https://en.wikipedia.org/wiki/Authentication)和授权。

```ts twoslash
// @target: esnext
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context<{ signGuestBook: () => Promise<void> }>().create();

export const publicProcedure = t.procedure;

// ---分割线---

export const authorizedProcedure = publicProcedure
  .input(z.object({ townName: z.string() }))
  .use((opts) => {
    if (opts.input.townName !== 'Pucklechurch') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: "We don't take kindly to out-of-town folk",
      });
    }

    return opts.next();
  });

export const appRouter = t.router({
  hello: authorizedProcedure.query(() => {
    return {
      message: 'hello world',
    };
  }),
  goodbye: authorizedProcedure.mutation(async (opts) => {
    await opts.ctx.signGuestBook();

    return {
      message: 'goodbye!',
    };
  }),
});
```
