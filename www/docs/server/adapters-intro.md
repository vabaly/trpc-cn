---
id: adapters-intro
title: Adapters
sidebar_label: Adapters
slug: /server/adapters
---

tRPC 本身并不是一个独立的服务器，因此必须通过其他宿主来提供服务，比如一个简单的 [Node.js HTTP 服务器](adapters/standalone)，[Express](adapters/express)，甚至是 [Next.js](adapters/nextjs)。无论你选择哪种后端，大多数 tRPC 功能都是相同的。**适配器**作为宿主和你的 tRPC API 之间的粘合剂。

适配器通常遵循一些常见的约定，允许你通过 `createContext` 创建上下文，通过 `onError` 处理全局错误，但最重要的是允许你选择适合你应用程序的宿主。

我们支持多种托管 API 的模式，你可以在这里找到相关文档。

- 对于需要服务器的 API，你可以使用我们的 [Standalone](adapters/standalone) 适配器，或者使用 [Express](adapters/express) 或 [Fastify](adapters/fastify) 适配器来连接到现有的 API
- 如果你需要无服务器解决方案，可以选择  [AWS Lambda](adapters/aws-lambda)，或者适用于边缘计算运行时的 [Fetch](adapters/fetch)
- 如果你使用的是全栈框架，并且希望进行完整集成，可以选择 [Next.js](adapters/nextjs)，或者你可以在 Next.js、Astro、Remix 或 SolidStart 中使用 [Fetch](adapters/fetch) 适配器

:::tip
对于本地开发或服务器基础架构，最简单的适配器是 [Standalone 适配器](adapters/standalone)，它可以用于运行标准的 Node.js HTTP 服务器。如果你需要快速入门并且没有现有的 HTTP 服务器进行集成，我们推荐使用它。如果你的需求发生变化，后续进行切换非常容易。
:::
