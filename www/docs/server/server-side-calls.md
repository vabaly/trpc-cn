---
id: server-side-calls
title: Server Side Calls
sidebar_label: Server Side Calls
slug: /server/server-side-calls
---

你可能需要直接从托管 “过程（Procedures）” 的同一台服务器上调用它们。`router.createCaller()` 可用于实现这一目的。

:::info

不应该使用 `createCaller` 来从其他 “过程（procedures）” 内部调用 “过程（procedures）”。这会增加开销，可能会再次创建上下文，执行所有中间件，并验证输入，而这些都已经由当前 “过程（procedures）” 完成。相反，你应该将共享逻辑提取到单独的函数中，并从 “过程（procedures）” 内部调用该函数，如下所示：

<div className="flex gap-2 w-full justify-between pt-2">
  <img src="https://user-images.githubusercontent.com/51714798/212568342-0a8440cb-68ed-48ae-9849-8c7bc417633e.png" className="w-[49.5%]" />
  <img src="https://user-images.githubusercontent.com/51714798/212568254-06cc56d0-35f6-4bb5-bff9-d25caf092c2c.png" className="w-[49.5%]" />
</div>

:::

## 创建调用者（Create caller）

使用 `router.createCaller({})` 函数（第一个参数是 `Context`），我们可以获取一个 `RouterCaller` 的实例。

### Input 和 Query 示例

我们使用 `input` 和 `query` 创建路由，然后调用异步的 `greeting` 过程（procedure）以获取结果。

```ts twoslash
// @target: esnext
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

const router = t.router({
  // 在路径 'greeting' 上创建 “过程（procedure）”
  greeting: t.procedure
    .input(z.object({ name: z.string() }))
    .query((opts) => `Hello ${opts.input.name}`),
});

const caller = router.createCaller({});
const result = await caller.greeting({ name: 'tRPC' });
//     ^?
```

### 变更（Mutation）示例

我们使用 mutation 创建路由，然后调用异步的 `post` 过程（procedure）以获取结果。

```ts twoslash
// @target: esnext
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const posts = ['One', 'Two', 'Three'];

const t = initTRPC.create();
const router = t.router({
  post: t.router({
    add: t.procedure.input(z.string()).mutation((opts) => {
      posts.push(opts.input);
      return posts;
    }),
  }),
});

const caller = router.createCaller({});
const result = await caller.post.add('Four');
//     ^?
```

### 中间件示例

我们创建一个中间件来在执行 `secret` 过程（procedure）之前检查上下文。以下是两个示例：前者失败，因为上下文不符合中间件逻辑，而后者正常工作。

<br />

:::info

中间件在调用任何过程（procedures）之前执行。

:::

<br />

```ts twoslash
// @target: esnext
import { initTRPC, TRPCError } from '@trpc/server';

type Context = {
  user?: {
    id: string;
  };
};
const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware((opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You are not authorized',
    });
  }

  return opts.next({
    ctx: {
      // 推断出 `user` 是非空的
      user: ctx.user,
    },
  });
});

const protectedProcedure = t.procedure.use(isAuthed);

const router = t.router({
  secret: protectedProcedure.query((opts) => opts.ctx.user),
});

{
  // ❌ 这会返回一个错误，因为没有正确的上下文参数
  const caller = router.createCaller({});

  const result = await caller.secret();
}

{
  // ✅ 这将正常工作，因为上下文参数中存在 user 属性
  const authorizedCaller = router.createCaller({
    user: {
      id: 'KATT',
    },
  });
  const result = await authorizedCaller.secret();
  //     ^?
}
```

### Next.js API 端点的示例

:::tip

此示例展示了如何在 Next.js API 端点中使用调用者（caller）。tRPC 已经为你创建了 API 端点，因此此文件仅用于展示如何从其他自定义端点调用 “过程（Procedure）”。

:::

```ts twoslash
// @noErrors
// ---cut---
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { appRouter } from '~/server/routers/_app';
import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  data?: {
    postTitle: string;
  };
  error?: {
    message: string;
  };
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) => {
  /** 我们想模拟一个错误，因此选择一个在数据库中不存在的帖子 ID。 */
  const postId = `this-id-does-not-exist-${Math.random()}`;

  const caller = appRouter.createCaller({});

  try {
    // 服务端调用
    const postResult = await caller.post.byId({ id: postId });

    res.status(200).json({ data: { postTitle: postResult.title } });
  } catch (cause) {
    // If this a tRPC error, we can extract additional information.
    // 如果这是一个 tRPC 错误，我们可以提取额外的信息。
    if (cause instanceof TRPCError) {
      // 我们可以获取来自 tRPC 的具体 HTTP 状态码（例如，对于 `NOT_FOUND` 是 404）。
      const httpStatusCode = getHTTPStatusCodeFromError(cause);

      res.status(httpStatusCode).json({ error: { message: cause.message } });
      return;
    }

    // 这不是 tRPC 错误，因此我们没有具体的信息。
    res.status(500).json({
      error: { message: `Error while accessing post with ID ${postId}` },
    });
  }
};
```
