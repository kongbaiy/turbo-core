
/**
 * 访问令牌
 */
export const ACCESS_TOKEN_KEY = '__ACCESS_TOKEN_KEY__'

/**
 * 图片服务地址
 */
export const PICTURE_SERVICES_URL_KEY = '__PICTURE_SERVICES_URL_KEY__'

/**
 * 设置用户访问令牌
 */
export function setAccessToken(value: unknown) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(value))
}

/**
 * 获取用户访问令牌
 */
export function getAccessToken() {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    return token ? JSON.parse(token) : {}
}

/**
 * 清除用户访问令牌
 */
export function removeAccessToken() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}
