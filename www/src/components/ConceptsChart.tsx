import React from 'react';

export function ConceptsChart() {
  return (
    <table width="100%">
      <thead>
        <tr>
          <th>术语</th>
          <th>描述</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <a href="/docs/server/procedures">
              <strong className="text-green-600 dark:text-green-400">
                Procedure（过程）&nbsp;↗
              </strong>
            </a>
          </td>
          <td>
            API 端点 - 可以是一个{' '}
            <strong className="text-teal-700 dark:text-teal-400">查询（Query）</strong>,{' '}
            <strong className="text-teal-700 dark:text-teal-400">
              变更（Mutation）
            </strong>
            , 或{' '}
            <strong className="text-teal-700 dark:text-teal-400">
              订阅（Subscription）
            </strong>
            .
          </td>
        </tr>
        <tr>
          <td>
            <strong className="text-teal-700 dark:text-teal-400">Query（查询）</strong>
          </td>
          <td>
            获取某些数据的{' '}
            <strong className="text-green-600 dark:text-green-400">
              Procedure（过程）
            </strong>{' '}
            。
          </td>
        </tr>
        <tr>
          <td>
            <strong className="text-teal-700 dark:text-teal-400">
              Mutation（变更）
            </strong>
          </td>
          <td>
            创建、更新或删除某些数据的{' '}
            <strong className="text-green-600 dark:text-green-400">
              Procedure（过程）
            </strong>{' '}
            。
          </td>
        </tr>
        <tr>
          <td>
            <a href="/docs/subscriptions">
              <strong className="text-teal-700 dark:text-teal-400">
                Subscription（订阅）
              </strong>
            </a>
          </td>
          <td>
            创建持久连接并监听更改的{' '}
            <strong className="text-green-600 dark:text-green-400">
              Procedure（过程）
            </strong>{' '}
            。
          </td>
        </tr>
        <tr>
          <td>
            <a href="/docs/server/routers">
              <strong className="text-blue-700 dark:text-blue-400">
                Router（路由）&nbsp;↗
              </strong>
            </a>
          </td>
          <td>
            一组共享命名空间下的{' '}
            <strong className="text-green-600 dark:text-green-400">
              Procedure（过程）
            </strong>{' '}
            （和/或其他路由）的集合。
          </td>
        </tr>
        <tr>
          <td>
            <a href="/docs/server/context">
              <strong className="text-violet-700 dark:text-violet-400">
                Context（上下文）&nbsp;↗
              </strong>
            </a>
          </td>
          <td>
            每个{' '}
            <strong className="text-green-600 dark:text-green-400">
              Procedure（过程）
            </strong>{' '}
            都可以访问的内容。通常用于会话状态和数据库连接等内容。
          </td>
        </tr>
        <tr>
          <td>
            <a href="/docs/server/middlewares">
              <strong className="text-blue-600 dark:text-blue-400">
                Middleware（中间件）&nbsp;↗
              </strong>
            </a>
          </td>
          <td>
            在{' '}
            <strong className="text-green-600 dark:text-green-400">
              Procedure（过程）
            </strong>
            之前和之后运行代码的函数。可以修改{' '}
            <strong className="text-violet-700 dark:text-violet-400">
              Context（上下文）
            </strong>
            。
          </td>
        </tr>
        <tr>
          <td>
            <a href="/docs/server/procedures#input-validation">
              <strong className="text-blue-600 dark:text-blue-400">
                Validation（验证）&nbsp;↗
              </strong>
            </a>
          </td>
          <td>“输入的数据是否包含正确的内容？”</td>
        </tr>
      </tbody>
    </table>
  );
}
