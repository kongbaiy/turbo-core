import type { StoredAccessToken } from './token-refresh'

/**
 * 访问令牌
 */
export const ACCESS_TOKEN_KEY = '__ACCESS_TOKEN_KEY__'
const ACCESS_TOKEN_LOGOUT_KEY = '__ACCESS_TOKEN_LOGOUT_KEY__'

/**
 * 图片服务地址
 */
export const PICTURE_SERVICES_URL_KEY = '__PICTURE_SERVICES_URL_KEY__'

/**
 * 设置用户访问令牌
 */
export function setAccessToken(value: StoredAccessToken) {
    const token = JSON.stringify(value)
    getWebStorage('local')?.removeItem(ACCESS_TOKEN_LOGOUT_KEY)
    getWebStorage('local')?.setItem(ACCESS_TOKEN_KEY, token)
    getWebStorage('session')?.setItem(ACCESS_TOKEN_KEY, token)
}

/**
 * 获取用户访问令牌
 */
export function getAccessToken() {
    const localToken = readAccessToken(getWebStorage('local'))
    if (localToken) {
        getWebStorage('session')?.setItem(
            ACCESS_TOKEN_KEY,
            JSON.stringify(localToken),
        )
        return localToken
    }

    if (getWebStorage('local')?.getItem(ACCESS_TOKEN_LOGOUT_KEY)) return {}

    const sessionToken = readAccessToken(getWebStorage('session'))
    if (sessionToken) {
        getWebStorage('local')?.setItem(
            ACCESS_TOKEN_KEY,
            JSON.stringify(sessionToken),
        )
        return sessionToken
    }

    return {}
}

/**
 * 清除用户访问令牌
 */
export function removeAccessToken() {
    getWebStorage('local')?.removeItem(ACCESS_TOKEN_KEY)
    getWebStorage('local')?.setItem(ACCESS_TOKEN_LOGOUT_KEY, String(Date.now()))
    getWebStorage('session')?.removeItem(ACCESS_TOKEN_KEY)
}

function getWebStorage(type: 'local' | 'session'): Storage | undefined {
    try {
        if (type === 'local' && typeof localStorage !== 'undefined') {
            return localStorage
        }
        if (type === 'session' && typeof sessionStorage !== 'undefined') {
            return sessionStorage
        }
    } catch {
        return undefined
    }
}

function readAccessToken(storage?: Storage) {
    try {
        const token = storage?.getItem(ACCESS_TOKEN_KEY)
        return token ? (JSON.parse(token) as StoredAccessToken) : undefined
    } catch {
        storage?.removeItem(ACCESS_TOKEN_KEY)
        return undefined
    }
}
