---
id: caching
title: Response Caching
sidebar_label: Response Caching
slug: /server/caching
---

以下示例使用 Vercel 的[边缘缓存（Edge caching）](https://vercel.com/docs/serverless-functions/edge-caching)尽快向用户提供数据。

:::info
始终对缓存保持警惕，特别是如果涉及个人信息。

&nbsp;  
由于默认启用了批处理，建议在 `responseMeta` 函数中设置缓存头，并确保没有可能包含个人数据的并发调用，或者如果存在身份验证头或cookie，则应完全省略缓存标头。

&nbsp;  
你还可以使用 [`splitLink`](../client/links/splitLink.mdx) 来分割公共请求和应保持私密和不缓存的请求。
:::

## 应用程序缓存

如果在应用程序中启用了SSR，你可能会发现你的应用程序在例如 Vercel 这样的服务上加载缓慢，但实际上你可以完全静态渲染整个应用程序而不使用 SSG；查看[这个 Twitter thread](https://twitter.com/alexdotjs/status/1386274093041950722)以获取更多见解。

### 示例代码

```tsx title='utils/trpc.tsx'
import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '../server/routers/_app';

export const trpc = createTRPCNext<AppRouter>({
  config(opts) {
    if (typeof window !== 'undefined') {
      return {
        links: [
          httpBatchLink({
            url: '/api/trpc',
          }),
        ],
      };
    }

    const url = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/trpc`
      : 'http://localhost:3000/api/trpc';

    return {
      links: {
        http: httpBatchLink({
          url,
        }),
      },
    };
  },
  ssr: true,
  responseMeta(opts) {
    const { clientErrors } = opts;

    if (clientErrors.length) {
      // 返回来自 API 调用的第一个错误的 http 状态码
      return {
        status: clientErrors[0].data?.httpStatus ?? 500,
      };
    }

    // 缓存请求 1天 + 每秒重新验证一次
    const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
    return {
      headers: {
        'cache-control': `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
      },
    };
  },
});
```

## API 响应缓存

由于所有的查询都是普通的 HTTP `GET` 请求，我们可以使用普通的 HTTP 头来缓存响应，使响应更快，让数据库休息一下，并且轻松地将 API 扩展到数以亿计的用户。

### 使用 `responseMeta` 缓存响应

> 假设你将 API 部署在能够处理过期-同时重新验证缓存头部（如 Vercel）的地方。

```tsx title='server.ts'
import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';

export const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions) => {
  return {
    req,
    res,
    prisma,
  };
};

type Context = inferAsyncReturnType<typeof createContext>;

export const t = initTRPC.context<Context>().create();

const waitFor = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const appRouter = t.router({
  public: t.router({
    slowQueryCached: t.procedure.query(async (opts) => {
      await waitFor(5000); // 等待 5s

      return {
        lastUpdated: new Date().toJSON(),
      };
    }),
  }),
});

// 只导出类型 `AppRouter` 用于推断类型
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
export type AppRouter = typeof appRouter;

// 导出 API 处理程序
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  responseMeta(opts) {
    const { ctx, paths, errors, type } = opts;
    // 假设你所有的公共路由都包含关键字 `public`
    const allPublic = paths && paths.every((path) => path.includes('public'));
    // 检查是否没有出错的过程
    const allOk = errors.length === 0;
    // 检查是否为查询请求
    const isQuery = type === 'query';

    if (ctx?.res && allPublic && allOk && isQuery) {
      // 缓存请求 1 天 + 每秒重新验证一次
      const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
      return {
        headers: {
          'cache-control': `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
        },
      };
    }
    return {};
  },
});
```
