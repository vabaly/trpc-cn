---
id: error-formatting
title: Error Formatting
sidebar_label: Error Formatting
slug: /server/error-formatting
---

你路由中的错误格式将一直传递到客户端（React 组件）。

## 用法示例

### 添加自定义格式

```ts title='server.ts'
import { initTRPC } from '@trpc/server';

export const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});
```

### 在 React 中使用


```tsx title='components/MyComponent.tsx'
export function MyComponent() {
  const mutation = trpc.addPost.useMutation();

  useEffect(() => {
    mutation.mutate({ title: 'example' });
  }, []);

  if (mutation.error?.data?.zodError) {
    // zodError 的类型将被推断出来
    return (
      <pre>Error: {JSON.stringify(mutation.error.data.zodError, null, 2)}</pre>
    );
  }
  return <>[...]</>;
}
```

## All properties sent to `errorFormatter()`
## 发送到errorFormatter()的所有属性

> 从 `v8.x` 开始，tRPC 符合 [JSON-RPC 2.0](https://www.jsonrpc.org/specification) 规范

```ts
{
  error: TRPCError;
  type: ProcedureType | 'unknown';
  path: string | undefined;
  input: unknown;
  ctx: undefined | TContext;
  shape: DefaultErrorShape; // 默认的错误结构
}
```

**`DefaultErrorShape`:**

```ts
interface DefaultErrorData {
  code: TRPC_ERROR_CODE_KEY;
  httpStatus: number;
  path?: string;
  stack?: string;
}

interface DefaultErrorShape
  extends TRPCErrorShape<TRPC_ERROR_CODE_NUMBER, DefaultErrorData> {
  message: string;
  code: TRPC_ERROR_CODE_NUMBER;
}
```
