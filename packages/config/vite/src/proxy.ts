import process from 'node:process'

/**
 * 创建代理
 * @param env 环境变量
 */
export function createProxy(env: Record<string, string>) {
    if (process.env.NODE_ENV === 'production') return {}

    const prefixs = JSON.parse(env.VITE_BASE_API_PREFIXS) as string[]
    const apiUrl = env.VITE_BASE_API_URL
    const proxy = prefixs.reduce((pre: Record<string, string>, cur) => {
        pre[cur] = apiUrl
        return pre
    }, {})

    return proxy
}