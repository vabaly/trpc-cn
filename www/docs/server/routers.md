---
id: routers
title: Define Routers
sidebar_label: Define Routers
slug: /server/routers
---

开始构建基于 tRPC 的 API，首先需要定义路由。一旦掌握了基本原理，你可以[自定义路由](#advanced-usage)以应对更高级的用例。

## 初始化 tRPC

你应该在应用程序中**仅初始化一次** tRPC。多个 tRPC 实例会引起问题。

```ts twoslash title='server/trpc.ts'
// @filename: trpc.ts
// ---cut---
import { initTRPC } from '@trpc/server';

// 你可以使用任何变量名。
// 我们使用 t 来保持简洁。
const t = initTRPC.create();

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
```

你会注意到我们在此处导出了 `t` 变量的某些方法，而不是导出 `t` 本身。这是因为我们想要培养一种在代码中使用 “过程（Procedures）” 的习惯。

> 译者注：通过导出特定方法，我们可以明确指定哪些过程（Procedures）是公共的、可重用的。

## 定义路由

接下来，让我们定义一个带有 “过程（Procedures）” 的路由，用于在应用程序中使用。我们很快将创建了一个 API “端点”。

为了将这些端点暴露给前端，你的 [适配器（Adapter）](/docs/server/adapters) 应该配置为使用你的 `appRouter` 实例。

> 译者注：适配器的内容本节代码没有谈到，需要前往上述的文档链接地址去了解。

```ts twoslash title="server/_app.ts"
// @filename: trpc.ts
import { initTRPC } from '@trpc/server';
const t = initTRPC.create();


export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const router = t.router;

// @filename: _app.ts
// ---cut---
import * as trpc from '@trpc/server';
import { publicProcedure, router } from './trpc';

const appRouter = router({
  greeting: publicProcedure.query(() => 'hello tRPC v10!'),
});

// 仅需导出路由的类型！
// 这样可以防止我们在客户端导入服务器代码。
export type AppRouter = typeof appRouter;
```

## 高级用法

在初始化路由时（译者注：指的是调用 initTRPC 生成 `t` 对象的时候。因此此时也生成了路由 `t.router`，所以也可以说是初始化路由的时候），tRPC 允许你：

- 设置[请求上下文](/docs/server/context)
- 为 “过程（Procedures）” 分配[元数据](/docs/server/metadata)
- [格式化](/docs/server/error-formatting)和[处理](/docs/server/error-handling)错误
- 根据需要[转换数据](/docs/server/data-transformers)
- 自定义[运行时配置])(#runtime-configuration)

你可以将方法链式调用来在初始化时自定义 `t` 对象。例如：

```ts
const t = initTRPC.context<Context>().meta<Meta>().create({
  /* [...] */
});
```

### 运行时配置 {#runtime-configuration}

```ts
export interface RuntimeConfig<TTypes extends RootConfigTypes> {
  /**
   * 使用数据转换器
   * @link https://trpc.io/docs/data-transformers
   */
  transformer: TTypes['transformer'];

  /**
   * 使用自定义的错误格式化
   * @link https://trpc.io/docs/error-formatting
   */
  errorFormatter: ErrorFormatter<TTypes['ctx'], any>;

  /**
   * 允许 `@trpc/server` 在非服务器环境中运行
   * @warning **谨慎使用**，这可能主要在测试中使用。
   * @default false
   */
  allowOutsideOfServer: boolean;

  /**
   * 是否为服务器环境？
   * @warning **谨慎使用**，这可能主要在测试中使用。
   * @default typeof window === 'undefined' || 'Deno' in window || process.env.NODE_ENV === 'test'
   */
  isServer: boolean;

  /**
   * 是否为开发环境？
   * 将用于决定 API 是否应返回堆栈跟踪
   * @default process.env.NODE_ENV !== 'production'
   */
  isDev: boolean;
}
```
