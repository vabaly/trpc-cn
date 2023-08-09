---
id: data-transformers
title: Data Transformers
sidebar_label: Data Transformers
slug: /server/data-transformers
---

你可以序列化响应数据和输入参数。转换器（Transformers）需要同时添加到服务器和客户端。

## 使用 [superjson](https://github.com/blitz-js/superjson)

SuperJSON 允许我们在服务器和客户端之间透明地使用标准的 `Date`/`Map`/`Set` 类型。也就是说，你可以从 API 解析器（resolver）返回这些类型之一，并在客户端中使用它们，而无需重新创建 JSON 对象。

### 如何操作

#### 1. 安装

```bash
yarn add superjson
```

#### 2. 添加到 `initTRPC`

```ts title='routers/router/_app.ts'
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

export const t = initTRPC.create({
  transformer: superjson,
});
```

#### 3. 添加到 `createTRPCProxyClient()` 或 `createTRPCNext()`

```ts
import { createTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from '~/server/routers/_app';
import superjson from 'superjson';

export const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson, // <--
  // [...]
});
```

```ts title='utils/trpc.ts'
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '~/server/routers/_app';
import superjson from 'superjson';

// [...]

export const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      transformer: superjson, // <--
    };
  },
  // [...]
});
```

## 上传和下载使用不同的转换器

如果一个转换器只应用于一个方向，或者上传和下载应使用不同的转换器（例如出于性能原因），你可以为上传和下载提供单独的转换器。确保在所有地方使用相同的转换器组合。

### 如何操作

这里使用 [superjson](https://github.com/blitz-js/superjson) 用于上传，使用 [devalue](https://github.com/Rich-Harris/devalue) 用于下载数据，因为 devalue 速度更快，但在服务器上使用不安全。

#### 1. 安装

```bash
yarn add superjson devalue
```

#### 2. 添加到 `utils/trpc.ts`

```ts title='utils/trpc.ts'
import { uneval } from 'devalue';
import superjson from 'superjson';

// [...]

export const transformer = {
  input: superjson,
  output: {
    serialize: (object) => uneval(object),
    // 此 `eval` 仅在 **客户端** 上发生
    deserialize: (object) => eval(`(${object})`),
  },
};
```

#### 3. 添加到 `AppRouter`

```ts title='server/routers/_app.ts'
import { initTRPC } from '@trpc/server';
import { transformer } from '../../utils/trpc';

export const t = initTRPC.create({
  transformer,
});

export const appRouter = t.router({
  // [...]
});
```

#### 4. 添加到 `createTRPCProxyClient()`

```ts title='client.ts'
import { createTRPCProxyClient } from '@trpc/client';
import { transformer } from '../utils/trpc';

export const client = createTRPCProxyClient<AppRouter>({
  transformer, // <--
  // [...]
});
```

## `DataTransformer` 接口

```ts
export interface DataTransformer {
  serialize(object: any): any;
  deserialize(object: any): any;
}

interface InputDataTransformer extends DataTransformer {
  /**
   * 这个函数在**客户端**上运行，时机是在将数据发送到服务器之前。
   */
  serialize(object: any): any;
  /**
   * 这个函数在**服务器端**上运行，时机是在将数据传递给解析器（resolver）之前进行转换。
   */
  deserialize(object: any): any;
}

interface OutputDataTransformer extends DataTransformer {
  /**
   * 这个函数在**服务器端**上运行，时机是在将数据发送到客户端之前。
   */
  serialize(object: any): any;
  /**
   * 这个函数仅在**客户端上**运行，用于转换从服务器发送的数据。
   */
  deserialize(object: any): any;
}

export interface CombinedDataTransformer {
  /**
   * 指定从客户端发送到服务器的数据应该如何转换。
   */
  input: InputDataTransformer;
  /**
   * 指定从服务器发送到客户端的数据应该如何转换。
   */
  output: OutputDataTransformer;
}
```
