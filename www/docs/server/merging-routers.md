---
id: merging-routers
title: Merging Routers
sidebar_label: Merging Routers
slug: /server/merging-routers
---

在同一个文件中编写所有的 API 代码并不是一个好主意。（译者注；因此，你需要把不同模块的路由写在不同文件里，然后再把它们合并起来。）而将不同文件的路由合并在一起是非常容易的。

## 子路由合并

```ts twoslash title='server.ts'
// @filename: trpc.ts
import { initTRPC } from '@trpc/server';
const t = initTRPC.create();


export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

// @filename: routers/_app.ts
import { router } from '../trpc';
import { z } from 'zod';

import { userRouter } from './user';
import { postRouter } from './post';

const appRouter = router({
  user: userRouter, // 将 “过程（Procedures）” 放在 "user" 命名空间下
  post: postRouter, // 将 “过程（Procedures）” 放在 "post" 命名空间下
});

// 然后可以通过以下方式访问合并后的路由
// http://localhost:3000/trpc/<NAMESPACE>.<PROCEDURE>

export type AppRouter = typeof appRouter;


// @filename: routers/post.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
export const postRouter = router({
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
      }),
    )
    .mutation((opts) => {
      const { input } = opts;
      //        ^?
      // [...]
    }),
  list: publicProcedure.query(() => {
    // ...
    return [];
  }),
});

// @filename: routers/user.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
export const userRouter = router({
  list: publicProcedure.query(() => {
    // [..]
    return [];
  }),
});

```

## 使用 `t.mergeRouters` 合并

如果你更喜欢在一个单一的命名空间中扁平地拥有所有的 “过程（Procedures）”，你可以使用 `t.mergeRouters`。

```ts twoslash title='server.ts'
// @filename: trpc.ts
import { initTRPC } from '@trpc/server';
const t = initTRPC.create();


export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;



// ---cut---

// @filename: routers/_app.ts
import { router, publicProcedure, mergeRouters } from '../trpc';
import { z } from 'zod';

import { userRouter } from './user';
import { postRouter } from './post';

const appRouter = mergeRouters(userRouter, postRouter)

export type AppRouter = typeof appRouter;

// @filename: routers/post.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
export const postRouter = router({
  postCreate: publicProcedure
    .input(
      z.object({
        title: z.string(),
      }),
    )
    .mutation((opts) => {
      const { input } = opts;
      //        ^?
      // [...]
    }),
  postList: publicProcedure.query(() => {
    // ...
    return [];
  }),
});


// @filename: routers/user.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
export const userRouter = router({
  userList: publicProcedure.query(() => {
    // [..]
    return [];
  }),
});

```
