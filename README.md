# sc-cloud-core

## 项目集成

### 引入 sc-cloud-core 库

sc-cloud-core 提供请求、响应、错误处理等核心功能和基础配置，通过 clone 来管理和集成项目，本地运行 `npm run clone` 拉取项目。

clone 采用交互式执行，在 projects.json 项目表中配置, 具体如下：

```shell
[
    {
        "name": "项目名称",
        "repoUrl": "项目git地址",
        "branch": "指定项目分支",
        "localPath": "apps/xxx", // 项目存放地址，所有项目都放在 apps 目录下
    },
]

```

### 微前端配置(qiankun)

步骤：

1. 主应用配置
2. 微应用配置
3. 微应用 router basename 配置

#### 主应用配置

根据 [qiankun](https://qiankun.umijs.org/zh/api#%E5%9F%BA%E4%BA%8E%E8%B7%AF%E7%94%B1%E9%85%8D%E7%BD%AE) 文档，配置微前端应用，在项目 src/qiankun/index.tsx 中配置：

```tsx

    {
            name: 'xxx', // 微应用名称，需要与 qiankun 配置中的 name 一致
            entry: `${platformEntry}`,
            container: '#qiankun-container',
            activeRule: '/xxx', // 微应用默认路由
            props: {
                basicActions: actions,
            },
        },

```

#### 子应用配置

在子项目 vite.config.ts 中设置相关配置（如应用名称、端口、路由等）。
注意：微应用名称、端口与主应用中配置保持一致。

```typescript

export default defineConfig({
    qiankun: (
        set: (name: string, options: { useDevMode: boolean }) => PluginOption,
    ) => {
        return set('你的微前端应用名称xxx', { useDevMode: true })
    },

    plugins: [qiankunDevHtmlFix()],

    envDirAuto: true,
    server: {
        port: 3002,  // 微应用端口
        cors: true,
        origin: 'http://localhost:3002',
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        hmr: false,
    },
})
```

路由 `basename` 配置，在子项目 src/router/index.tsx 中配置，如下：

```tsx
import { createBrowserRouter } from 'react-router-dom'

const routers = createBrowserRouter(
    [
        {
            path: '/',
            loader: () => redirect('/application-components/platforms-manage'),
        },
        {
            path: '*',
            element: <RepoNotFound name='运维平台管理' />,
        },
    ],
    {
        // 注意配置你的微前端应用路由，用于部署后访问的基础路径
        basename: qiankunWindow.__POWERED_BY_QIANKUN__ ? '/xxx' : '/',
    },
)
```

#### 启动项目

在项目根目录下，执行命令启动项目：

```shell
npm run dev
```

在子项目根目录下，执行命令启动项目：

```shell
npm run dev
```

启动所有项目，在 `sc-cloud-core` 目录下，执行命令启动项目：

```shell
npm run dev
```
