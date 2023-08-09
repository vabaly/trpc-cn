---
id: validators
title: Input & Output Validators
sidebar_label: Input & Output Validators
slug: /server/validators
---

tRPC 可以为 “过程（Procedures）” 的输入和（或）输出定义验证逻辑，并且验证器还用于推断输入和输出的类型。我们对许多流行的验证器提供了一流的支持，并且你可以[集成我们没有直接支持的验证器]((#contributing-your-own-validator-library)。

## 输入验证器

通过定义输入验证器，tRPC 可以检查 “过程（Procedure）” 调用是否正确，并在不正确的情况下返回验证的错误信息。

要设置输入验证器，请使用 `procedure.input()` 方法：

```ts twoslash
// @target: esnext
import { initTRPC } from '@trpc/server';
// ---cut---

// 我们的示例默认使用 Zod，但与其他库的用法相同
import { z } from 'zod';

export const t = initTRPC.create();
const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(
      // 译者注：下面代码会返回一个 ZodObject 实例，是这样的形式 => ZodObject { shape: { name: ZodString } }
      z.object({
        name: z.string(),
      }),
    )
    .query((opts) => {
      const name = opts.input.name;
      //    ^?
      return {
        greeting: `Hello ${opts.input.name}`,
      };
    }),
});
```

### 输入合并

`.input()` 可以叠加使用，以构建更复杂的类型验证，这在你希望将某些常见输入应用于一组过程时非常有用，尤其是在使用[中间件](middlewares)时。

```ts twoslash
// @target: esnext
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

export const t = initTRPC.create();

// ---cut---

const baseProcedure = t.procedure
  .input(z.object({ townName: z.string() }))
  .use((opts) => {
    const input = opts.input;
    //    ^?

    console.log(`Handling request with user from: ${input.townName}`);

    return opts.next();
  });

export const appRouter = t.router({
  hello: baseProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .query((opts) => {
      const input = opts.input;
      //    ^?
      return {
        greeting: `Hello ${input.name}, my friend from ${input.townName}`,
      };
    }),
});
```

## 输出验证器

与定义输入验证器相比，输出验证器显得并不总是那么重要，因为 tRPC 会通过推断 “过程（Procedures）” 的返回类型来自动为你提供类型安全保障。定义输出验证器的一些原因包括：

- 检查从不受信任的源返回的数据是否正确
- 确保你不会向客户端返回非必要的数据

:::info
如果输出验证失败，服务器将以 `INTERNAL_SERVER_ERROR` 进行响应。
:::

```ts twoslash
// @target: esnext
import { initTRPC } from '@trpc/server';
// @noErrors
// ---cut---

import { z } from 'zod';

export const t = initTRPC.create();
const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .output(
      z.object({
        greeting: z.string(),
      }),
    )
    .query((opts) => {
      return {
        gre,
        // ^|
      };
    }),
});
```

## 最基本的验证器：函数

你可以使用函数定义验证器从而无需任何第三方依赖。

:::info
我们不建议在没有特定需求的情况下创建自定义验证器，但重要的是要了解这里没有任何神奇之处 - 它 _只是 typescript_！

在大多数情况下，我们建议你使用[验证库](#library-integrations)。
:::

```ts twoslash
import { initTRPC } from '@trpc/server';

export const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input((value): string => {
      if (typeof value === 'string') {
        return value;
      }
      throw new Error('Input is not a string');
    })
    .output((value): string => {
      if (typeof value === 'string') {
        return value;
      }
      throw new Error('Output is not a string');
    })
    .query((opts) => {
      const { input } = opts;
      //      ^?
      return `hello ${input}`;
    }),
});

export type AppRouter = typeof appRouter;
```

## 集成的库

tRPC 与许多流行的 “验证、解析库” 可以直接配合使用。以下是我们官方支持的一些验证器的使用示例。

### With [Zod](https://github.com/colinhacks/zod)
### 使用 [Zod](https://github.com/colinhacks/zod)

Zod is our default recommendation, it has a strong ecosystem which makes it a great choice to use in multiple parts of your codebase. If you have no opinion of your own and want a powerful library which won't limit future needs, Zod is a great choice.
Zod 是我们默认推荐的选项，它有一个强大的生态系统，可以在代码库的多个部分中使用，是一个很好的选择。如果你对此没有自己的看法，并且想要一个功能强大的库，不会限制未来的需求，那么 Zod 是一个很好的选择。

```ts twoslash
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

export const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .output(
      z.object({
        greeting: z.string(),
      }),
    )
    .query(({ input }) => {
      //      ^?
      return {
        greeting: `hello ${input.name}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### 使用 [Yup](https://github.com/jquense/yup)

```ts twoslash
import { initTRPC } from '@trpc/server';
import * as yup from 'yup';

export const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(
      yup.object({
        name: yup.string().required(),
      }),
    )
    .output(
      yup.object({
        greeting: yup.string().required(),
      }),
    )
    .query(({ input }) => {
      //      ^?
      return {
        greeting: `hello ${input.name}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### 使用 [Superstruct](https://github.com/ianstormtaylor/superstruct)

```ts twoslash
import { initTRPC } from '@trpc/server';
import { object, string } from 'superstruct';

export const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(object({ name: string() }))
    .output(object({ greeting: string() }))
    .query(({ input }) => {
      //      ^?
      return {
        greeting: `hello ${input.name}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### 使用 [scale-ts](https://github.com/paritytech/scale-ts)

```ts twoslash
import { initTRPC } from '@trpc/server';
import * as $ from 'scale-codec';

export const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input($.object($.field('name', $.str)))
    .output($.object($.field('greeting', $.str)))
    .query(({ input }) => {
      //      ^?
      return {
        greeting: `hello ${input.name}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### 使用 [Typia](https://typia.io/docs/utilization/trpc/)

```ts
import { initTRPC } from '@trpc/server';
import typia from 'typia';
import { v4 } from 'uuid';
import { IBbsArticle } from '../structures/IBbsArticle';

const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  store: publicProcedure
    .input(typia.createAssert<IBbsArticle.IStore>())
    .output(typia.createAssert<IBbsArticle>())
    .query(({ input }) => {
      return {
        id: v4(),
        writer: input.writer,
        title: input.title,
        body: input.body,
        created_at: new Date().toString(),
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### 使用 [ArkType](https://github.com/arktypeio/arktype#trpc)

```ts twoslash
import { initTRPC } from '@trpc/server';
import { type } from 'arktype';

export const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(type({ name: 'string' }).assert)
    .output(type({ greeting: 'string' }).assert)
    .query(({ input }) => {
      //      ^?
      return {
        greeting: `hello ${input.name}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### 使用 [@effect/schema](https://github.com/Effect-TS/schema)

```ts twoslash
import * as S from '@effect/schema/Schema';
import { initTRPC } from '@trpc/server';

export const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(S.parseSync(S.struct({ name: S.string })))
    .output(S.parseSync(S.struct({ greeting: S.string })))
    .query(({ input }) => {
      //      ^?
      return {
        greeting: `hello ${input.name}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### 使用 [runtypes](https://github.com/pelotom/runtypes)

```ts twoslash
import { initTRPC } from '@trpc/server';
import * as T from 'runtypes';

const t = initTRPC.create();
const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(T.Record({ name: T.String }))
    .output(T.Record({ greeting: T.String }))
    .query(({ input }) => {
      //      ^?
      return {
        greeting: `hello ${input.name}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### 使用 [Valibot](https://github.com/fabian-hiller/valibot)

```ts twoslash
import { initTRPC } from '@trpc/server';
import { object, string } from 'valibot';

export const t = initTRPC.create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(
      object({
        name: string(),
      }),
    )
    .output(
      object({
        greeting: string(),
      }),
    )
    .query(({ input }) => {
      //      ^?
      return {
        greeting: `hello ${input.name}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

## 贡献你自己的验证器库

如果你正在开发一个支持 tRPC 使用的验证器库，请随时在此页面上提交 PR，示例代码与其他示例相同，并提供你的文档链接。

在大多数情况下，与 tRPC 集成非常简单，只需满足几个现有的类型接口之一即可，但在某些情况下，我们可能会接受一个 PR 来添加一个新的支持接口。请随时提交问题以进行讨论。你可以在这里查看现有的支持接口：

- [用于推断的类型](https://github.com/trpc/trpc/blob/main/packages/server/src/core/parser.ts)
- [用于解析/验证的函数](https://github.com/trpc/trpc/blob/main/packages/server/src/core/internals/getParseFn.ts)
