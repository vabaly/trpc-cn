---
id: nextjs
title: Next.js Adapter
sidebar_label: Next.js
slug: /server/adapters/nextjs
---

:::tip
tRPC 对 Next.js 的支持远不止于适配器。本页面提供了配置适配器的简要摘要，而完整的文档[可以在这里找到](../../client/nextjs/introduction.mdx)。
:::

## 示例应用

<table>
  <thead>
    <tr>
      <th>描述</th>
      <th>链接</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Next.js 最小化起始项目</td>
      <td>
        <ul>
          <li><a href="https://githubbox.com/trpc/trpc/tree/main/examples/next-minimal-starter">CodeSandbox</a></li>
          <li><a href="https://github.com/trpc/trpc/tree/main/examples/next-minimal-starter">源代码</a></li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

## Next.js 示例

在 Next.js 项目中为你的 tRPC 路由器提供服务非常简单。只需按照下面的步骤在 `pages/api/trpc/[trpc].ts` 中创建一个 API 处理器:

```ts title='pages/api/trpc/[trpc].ts'
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { createContext } from '../../../server/trpc/context';
import { appRouter } from '../../../server/trpc/router/_app';

// @see https://nextjs.org/docs/api-routes/introduction
export default createNextApiHandler({
  router: appRouter,
  createContext,
});
```

## 处理 CORS 和其他高级用法

通常情况下，你可以像上面展示的那样简单地设置 API 处理器，但有时你可能需要进一步修改它。

The API handler created by `createNextApiHandler` and equivalents in other frameworks is just a function that takes `req` and `res` objects. This means you can also modify those objects before passing them to the handler, for example to [enable CORS](/docs/client/cors).
由 `createNextApiHandler` 创建的 API 处理器及其他框架中等效的处理器只是一个接受 `req` 和 `res` 对象的函数。这意味着你可以在将它们传递给处理器之前修改这些对象，例如[启用 CORS](/docs/client/cors).。

```ts title='pages/api/trpc/[trpc].ts'
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { createContext } from '../../../server/trpc/context';
import { appRouter } from '../../../server/trpc/router/_app';

// 创建 API 处理器，但暂时不返回它
const nextApiHandler = createNextApiHandler({
  router: appRouter,
  createContext,
});

// @see https://nextjs.org/docs/api-routes/introduction
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 可以使用响应对象来启用 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // 如果你需要进行身份验证的 CORS 调用，则
  // 删除上面的代码并取消下面代码的注释

  // Allow-Origin 必须设置为你想要将凭据发送回来的请求域
  // res.setHeader('Access-Control-Allow-Origin', 'http://example:6006');
  // res.setHeader('Access-Control-Request-Method', '*');
  // res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  // res.setHeader('Access-Control-Allow-Headers', 'content-type');
  // res.setHeader('Referrer-Policy', 'no-referrer');
  // res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // 最后将请求传递给 tRPC 处理器
  return nextApiHandler(req, res);
}
```

## Route Handlers

If you're trying out the Next.js App Router and want to use [route handlers](https://beta.nextjs.org/docs/routing/route-handlers), you can do so by using the [fetch](fetch) adapter, as they build on web standard Request and Response objects:

```ts title='app/api/trpc/[trpc]/route.ts'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '~/server/api/router';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({ ... })
  });

export { handler as GET, handler as POST };
```
