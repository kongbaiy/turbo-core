# API 设计规范

## 1. 基本原则

### RESTful 规范

- GET: 查询资源
- POST: 创建资源
- PUT: 更新资源
- DELETE: 删除资源

### 请求路径

- 统一前缀: `/admin`
- 模块化组织: `/admin/[模块]/[资源]`

### 响应格式

```typescript
{
    code: 200,              // 状态码
    message: '成功',         // 响应消息
    data: {},               // 数据内容
    status: true            // 是否成功
}
```

## 2. API 文件结构

### 目录结构

```
src/api/
├── [模块名]/
│   ├── index.ts                  # API 导出
│   ├── index.interface.ts        # 类型定义
│   └── [功能名].ts               # 具体 API 实现 (可选)
└── index.ts                      # 统一导出
```

### 文件命名

- 模块目录: `camelCase`
- 功能文件: `camelCase`
- 类型文件: `index.interface.ts`

## 3. 类型定义规范

### 接口参数

```typescript
export interface GetUsersParams {
    keyword?: string        // 关键字
    status?: string         // 状态
    page?: number           // 页码
    pageSize?: number       // 每页条数
}
```

### 响应数据

```typescript
export interface User {
    id: string              // 唯一标识
    name: string            // 姓名
    email?: string          // 邮箱 (可选)
    phone: string           // 手机号
    status: number          // 状态
    createdAt: string       // 创建时间
    updatedAt: string       // 更新时间
}
```

### 请求数据

```typescript
export interface CreateUser {
    name: string            // 姓名 (必填)
    email: string           // 邮箱 (必填)
    phone: string           // 手机号 (必填)
    status: number          // 状态 (必填)
}
```

## 4. API 实现规范

### 基本请求

```typescript
import { api } from '@repo/utils'

export const getPlatforms = (params?: Platforms) =>
    api.get('/admin/basic/platforms', { params })
```

### POST 请求

```typescript
export const createPlatform = (data: CreatePlatform) =>
    api.post('/admin/basic/platform', data)
```

### PUT 请求

```typescript
export const updatePlatform = (data: UpdatePlatform) =>
    api.put('/admin/basic/platform', data)
```

### DELETE 请求

```typescript
export const deletePlatform = (params: DeletePlatform) =>
    api.delete('/admin/basic/platform', { params })
```

## 5. 错误处理规范

### 401 错误处理

```typescript
// 在 API 拦截器中统一处理
if ([40101].includes(res.code)) {
    // 显示确认弹窗
    // 跳转登录页
    // 清除 token
}
```

### 网络错误处理

```typescript
if (error.code === 'ERR_NETWORK') {
    message.error('网络不可用')
} else {
    message.error('网络未知错误')
}
```

## 6. 使用示例

### 在页面中使用

```typescript
import { useRequest } from '@repo/react-hooks'
import { getPlatforms } from '@/api'

const { data, loading, error } = useRequest<PlatformItem[]>(
    useCallback(() => getPlatforms({ status: '1' }), []),
)
```

### 带参数的请求

```typescript
const { data } = useRequest<DataType>(
    useCallback(() => getXXX({ id: selectedId }), [selectedId]),
)
```

### 错误处理

```typescript
const { data, error } = useRequest<DataType>(
    useCallback(() => getXXX(), []),
    {
        onError: (error) => {
            console.error('请求失败:', error)
        },
    },
)
```

## 7. API 拦截器规范

### 请求拦截器

```typescript
api.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken()

        config.headers.Authorization = accessToken.Authorization
        config.headers.sessionId = accessToken.sessionId

        return config
    },
    (error) => Promise.reject(error),
)
```

### 响应拦截器

```typescript
api.interceptors.response.use(
    async (response) => {
        const res = response.data

        if (res.code === 200) {
            return { ...res, status: true }
        }

        // 处理错误码
        if ([40101].includes(res.code)) {
            // 处理 token 失效
        }

        // 显示错误消息
        message.error(`【${res.code}】${res.message}`)

        return Promise.reject({ ...res, status: false })
    },
    async (error) => {
        // 处理网络错误
    },
)
```

## 8. 版本控制

### API 版本

```
/v1/...
/v2/...
```

### 路径规划

```
/admin/v1/[模块]/[资源]
/admin/v2/[模块]/[资源]
```

## 9. 文档规范

### API 文档

- 记录请求路径
- 记录请求参数
- 记录响应格式
- 记录错误码

### 示例

```typescript
/**
 * 获取平台列表
 * @param params 查询参数
 * @returns 平台列表
 *
 * 请求路径: GET /admin/basic/platforms
 * 请求参数:
 *   - keyword: 关键字
 *   - status: 状态
 * 响应格式:
 *   - code: 状态码
 *   - message: 响应消息
 *   - data: 平台列表
 */
export const getPlatforms = (params?: Platforms) =>
    api.get('/admin/basic/platforms', { params })
```
