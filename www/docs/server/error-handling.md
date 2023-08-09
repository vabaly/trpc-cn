---
id: error-handling
title: Error Handling
sidebar_label: Error Handling
slug: /server/error-handling
---

每当在 “过程（procedure）” 中发生错误时，tRPC 会向客户端响应一个包含 "error" 属性的对象。这个属性包含了在客户端处理错误所需的所有信息。

下面是由于错误的请求输入而导致的错误响应示例：

```json
{
  "id": null,
  "error": {
    "message": "\"password\" must be at least 4 characters",
    "code": -32600,
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "stack": "...",
      "path": "user.changepassword"
    }
  }
}
```

**注意**：返回的堆栈跟踪仅在开发环境中可用。

## 错误码

tRPC 定义了一系列错误码，每个错误码代表不同类型的错误，并使用不同的 HTTP 状态码进行响应。

| 错误码                  | 描述                                                                                                             | HTTP状态码 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------- |
| BAD_REQUEST           | 此为客户端错误，服务器无法处理请求或不会处理请求。              | 400       |
| UNAUTHORIZED          | 由于缺乏对请求资源的有效身份验证凭据，客户端请求未完成。 | 401       |
| FORBIDDEN             | 服务器未被授权访问所需的数据源，比如 REST API。	                                       | 403       |
| NOT_FOUND             | 服务器无法找到请求的资源。 resource.                                                                          | 404       |
| TIMEOUT               | 服务器希望关闭此未使用的连接。	                                                              | 408       |
| CONFLICT              | 服务器请求的资源与目标资源的当前状态冲突。                                     | 409       |
| PRECONDITION_FAILED   | 拒绝访问目标资源。	                                                                          | 412       |
| PAYLOAD_TOO_LARGE     | 请求实体超过服务器定义的限制。                                                                 | 413       |
| METHOD_NOT_SUPPORTED  | 服务器能接受请求方法，但目标资源不支持此方法。                               | 405       |
| UNPROCESSABLE_CONTENT | 服务器接受请求方法，并且请求实体是正确的，但服务器无法处理它。	  | 422       |
| TOO_MANY_REQUESTS     | 超过了速率限制或向服务器发送了过多的请求。                                     | 429       |
| CLIENT_CLOSED_REQUEST | 拒绝访问资源。                                                                                 | 499       |
| INTERNAL_SERVER_ERROR | 发生了未知的错误。                                                                                          | 500       |

tRPC 提供了一个辅助函数 `getHTTPStatusCodeFromError`，帮助你从错误中提取 HTTP 状态码：

```ts twoslash
import { TRPCError } from '@trpc/server';
// ---cut---
import { getHTTPStatusCodeFromError } from '@trpc/server/http';

// 你可能会在输入验证失败时收到的错误示例
const error: TRPCError = {
  name: 'TRPCError',
  code: 'BAD_REQUEST',
  message: '"password" must be at least 4 characters',
};

if (error instanceof TRPCError) {
  const httpCode = getHTTPStatusCodeFromError(error);
  console.log(httpCode); // 400
}
```

:::tip

在[服务端调用文档](server-side-calls)中，有一个完整的示例，展示了如何在 Next.js API 端点中使用它。

:::

## 抛出错误

tRPC 提供了一个错误子类 `TRPCError`，你可以使用它来表示在 “过程（procedure）” 中发生的错误。

例如，抛出以下错误：

```ts title='server.ts'
import { initTRPC, TRPCError } from '@trpc/server';

const t = initTRPC.create();

const appRouter = t.router({
  hello: t.procedure.query(() => {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred, please try again later.',
      // 可选：传递原始错误以保留堆栈
      cause: theError,
    });
  }),
});

// [...]
```

将得到以下响应：

```json
{
  "id": null,
  "error": {
    "message": "An unexpected error occurred, please try again later.",
    "code": -32603,
    "data": {
      "code": "INTERNAL_SERVER_ERROR",
      "httpStatus": 500,
      "stack": "...",
      "path": "hello"
    }
  }
}
```

## 处理错误

在将错误发送给客户端之前，所有在 “过程（procedure）” 中发生的错误都会经过 `onError` 方法。在这里，你可以处理或修改错误。

```ts title='pages/api/trpc/[trpc].ts'
export default trpcNext.createNextApiHandler({
  // ...
  onError(opts) {
    const { error, type, path, input, ctx, req } = opts;
    console.error('Error:', error);
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      // 发送以报告错误
    }
  },
});
```

`onError` 的参数是一个包含有关错误及其发生上下文等所有信息的对象：

```ts
{
  error: TRPCError; // 原始错误
  type: 'query' | 'mutation' | 'subscription' | 'unknown';
  path: string | undefined; // 触发错误的 “过程（procedure）” 的路径
  input: unknown;
  ctx: Context | undefined;
  req: BaseRequest; // 请求对象
}
```
