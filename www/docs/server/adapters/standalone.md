---
id: standalone
title: Standalone Adapter
sidebar_label: Standalone
slug: /server/adapters/standalone
---

tRPC 的 Standalone 适配器是快速启动应用程序的最简单方法。它非常适合本地开发和基于服务器的生产环境。本质上，它只是围绕标准的 [Node.js HTTP 服务器](https://nodejs.org/api/http.html)的一个包装，具有与 tRPC 相关的常规选项。

如果你已经有一个现有的 API 部署，例如 [Express](express)、[Fastify](fastify) 或 [Next.js](nextjs)，并且想要将 tRPC 集成进去，你可以查看它们各自的适配器。同样，如果你偏好在无服务器或边缘计算上托管，我们也有适配器，例如 [AWS Lambda](aws-lambda) 和 [Fetch](fetch)，可能符合你的需求。

It's also not uncommon, where the deployed adapter is hard to run on local machines, to have 2 entry-points in your application. You could use the Standalone Adapter for local development, and a different adapter when deployed.
在某些情况下，已部署的适配器在本地机器上运行起来很困难，这并不少见。因此，你的应用程序可能有两个入口点。你可以在本地开发中使用 Standalone 适配器，而在部署时使用另一个适配器。

## 示例应用程序

<table>
  <thead>
    <tr>
      <th>描述</th>
      <th>链接</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Standalone tRPC 服务</td>
      <td>
        <ul>
          <li><a href="https://stackblitz.com/github/trpc/trpc/tree/main/examples/minimal">StackBlitz</a></li>
          <li><a href="https://github.com/trpc/trpc/blob/main/examples/minimal/server/index.ts">源代码</a></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>带有 CORS 处理 Standalone tRPC 服务</td>
      <td>
        <ul>
          <li><a href="https://stackblitz.com/github/trpc/trpc/tree/main/examples/minimal-react">StackBlitz</a></li>
          <li><a href="https://github.com/trpc/trpc/blob/main/examples/minimal-react/server/index.ts">源代码</a></li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

## 配置 Standalone tRPC 服务器

### 1. 实现你的应用程序路由

实现你的 tRPC 路由。例如：

```ts title='appRouter.ts'
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

export const t = initTRPC.create();

export const appRouter = t.router({
  getUser: t.procedure.input(z.string()).query((opts) => {
    return { id: opts.input, name: 'Bilbo' };
  }),
  createUser: t.procedure
    .input(z.object({ name: z.string().min(5) }))
    .mutation(async (opts) => {
      // 使用你喜欢的 ORM
      return await UserModel.create({
        data: opts.input,
      });
    }),
});

// 导出 API 的类型定义
export type AppRouter = typeof appRouter;
```

更多信息可以参考[快速入门指南](/docs/quickstart)

### 2. 使用 Standalone 适配器

使用 Standalone 适配器创建一个简单的 Node.js HTTP 服务器。

```ts title='server.ts'
import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './appRouter.ts';

createHTTPServer({
  router: appRouter,
  createContext() {
    console.log('context 3');
    return {};
  },
}).listen(2022);
```

## 处理 CORS 和 OPTIONS

默认情况下，standalone 服务器不会响应 HTTP OPTIONS 请求，也不会设置任何 CORS 头部。

如果你的环境无法自动处理这些请求，例如在本地开发期间，你可能需要自行处理。

### 1. 安装 cors

你可以使用流行的 `cors` 包自行添加支持

```bash
yarn add cors
yarn add -D @types/cors
```

有关如何配置此包的完整信息，请[查看文档](https://github.com/expressjs/cors#readme)

### 2. 配置 Standalone 服务器

以下示例将 CORS 完全开放给任何请求，这在开发过程中很有用，但在生产环境中，你可以并且应该更严格地配置它。

```ts title='server.ts'
import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';

createHTTPServer({
  middleware: cors(),
  router: appRouter,
  createContext() {
    console.log('context 3');
    return {};
  },
}).listen(3333);
```

`middleware` 选项将接受任何类似于 connect 或其他 node.js 中间件的函数，因此如果需要，它可以用于处理更多内容而不仅仅是 `cors`。然而，它旨在作为一种简单的应急方式，因此它本身并不能让你将多个中间件组合在一起。如果你想要这样做，可以：

1. 使用具有更全面中间件支持的替代适配器，例如 [Express 适配器](/docs/server/adapters/express)
2. 使用一种可以组合中间件的解决方案，例如 [connect](https://github.com/senchalabs/connect)
3. 使用 `createHTTPHandler` 自定义 HTTP 服务器以扩展 Standalone（见下文）

## 更进一步

如果 `createHTTPServer` 不足以满足你的需求，你还可以使用 standalone 适配器的 `createHTTPHandler` 函数创建自己的 HTTP 服务器。例如：

```ts title='server.ts'
import { createServer } from 'http';
import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';

const handler = createHTTPHandler({
  router: appRouter,
  createContext() {
    return {};
  },
});

createServer((req, res) => {
  /**
   * 以任何你喜欢的方式处理请求，
   * 当你准备好时则可以调用 tRPC handler 函数
   */

  handler(req, res);
});

server.listen(3333);
```
