import axios from 'axios'
import type { AxiosError, RequestConfig } from 'axios'
import { getAccessToken, removeAccessToken, setAccessToken } from './storage'
import type { StoredAccessToken } from './token-refresh'
import {
    shouldRefreshAccessToken,
    shouldReuseStoredTokenForRetry,
    toStoredAccessToken,
} from './token-refresh'
import { formatApiError } from './api-error'
import { getModal, getMessage } from '@repo/utils'

const api = axios.create()
const REFRESH_TOKEN_URL = '/api/auth/token/refresh'

type ApiResult<T> = {
    code: number
    message?: string
    data?: T
}

type RefreshTokenPayload = {
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
    refreshExpiresAt?: string
    sessionId?: string
    tenantId?: string
}

type RetriableRequestConfig = RequestConfig & {
    __tokenRetried?: boolean
}

const isJsonContentType = (contentType: unknown) =>
    String(contentType || '').toLowerCase().includes('json')

const readBlobText = (blob: Blob) => {
    if (typeof blob.text === 'function') {
        return blob.text()
    }
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob)
    })
}

const parseBinaryJson = async (data: unknown) => {
    if (data instanceof Blob) {
        return JSON.parse(await readBlobText(data))
    }
    if (data instanceof ArrayBuffer) {
        return JSON.parse(new TextDecoder().decode(data))
    }
    return data
}

let refreshTokenTask: Promise<StoredAccessToken> | null = null
// let alertInit = false

window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('alertInit')
    window.removeEventListener('beforeunload', () => {})
})

function setTokenHeaders(
    config: RequestConfig,
    accessToken: StoredAccessToken,
) {
    config.headers = config.headers ?? {}
    if (accessToken.Authorization) {
        config.headers.Authorization = accessToken.Authorization
    }
    if (accessToken.sessionId) {
        config.headers.sessionId = accessToken.sessionId
    }
}

async function refreshAccessToken(force = false) {
    const accessToken = getAccessToken()
    if (
        !accessToken.refreshToken ||
        (!force && !shouldRefreshAccessToken({ token: accessToken }))
    ) {
        return accessToken
    }

    if (!refreshTokenTask) {
        refreshTokenTask = axios
            .post<ApiResult<RefreshTokenPayload>>(REFRESH_TOKEN_URL, {
                refreshToken: accessToken.refreshToken,
            })
            .then((response) => {
                const res = response.data
                if (res.code !== 200 || !res.data?.accessToken) {
                    return Promise.reject(res)
                }

                const nextToken = toStoredAccessToken(res.data, accessToken)
                setAccessToken(nextToken)
                return nextToken
            })
            .finally(() => {
                refreshTokenTask = null
            })
    }

    return refreshTokenTask
}

function showTokenInvalidConfirm(content: string) {
    const modal = getModal()
    let alertInit = parseInt(sessionStorage.getItem('alertInit')!)

    if (alertInit) return

    sessionStorage.setItem('alertInit', '1')
    modal.confirm({
        title: '提示',
        content,
        cancelText: '取消',
        okText: '重新登录',
        onOk: () => {
            sessionStorage.removeItem('alertInit')
            removeAccessToken()
            location.replace('/login')
        },
        onCancel: () => {
            sessionStorage.removeItem('alertInit')
        },
    })
}

api.interceptors.request.use(
    async (config) => {
        let accessToken = getAccessToken()
        try {
            accessToken = await refreshAccessToken()
        } catch {
            removeAccessToken()
            accessToken = {}
        }

        setTokenHeaders(config, accessToken)
        return config
    },
    (error) => Promise.reject(error),
)

api.interceptors.response.use(
    async (response) => {
        const config = response.config as RetriableRequestConfig
        const { defaultResponse, silentError } = config.meta ?? {}
        const binaryResponse = ['blob', 'arraybuffer'].includes(
            String(config.responseType),
        )
        const jsonResponse = isJsonContentType(
            response.headers['content-type'],
        )
        if (defaultResponse && binaryResponse && !jsonResponse) {
            return response
        }

        let res = response.data
        if (binaryResponse && jsonResponse) {
            try {
                res = await parseBinaryJson(res)
            } catch {
                res = undefined
            }
        }

        if (res?.code === 200) {
            // 判断是否返回默认的响应数据
            return defaultResponse ? response : { ...res, status: true }
        }

        // 处理token失效或者异地登录
        if ([40101].includes(res?.code)) {
            if (!config.__tokenRetried && getAccessToken().refreshToken) {
                try {
                    config.__tokenRetried = true
                    const currentToken = getAccessToken()
                    const requestAuthorization = String(
                        config.headers?.Authorization ?? '',
                    )
                    const accessToken = shouldReuseStoredTokenForRetry({
                        requestAuthorization,
                        token: currentToken,
                    })
                        ? currentToken
                        : await refreshAccessToken(true)
                    setTokenHeaders(config, accessToken)
                    return api(config)
                } catch {
                    removeAccessToken()
                }
            }

            showTokenInvalidConfirm(res.message)
            return Promise.reject({ ...res, status: false })
        }

        if (!silentError) {
            getMessage().error(formatApiError(res, response.status))
        }
        return Promise.reject({ ...res, status: false })
    },
    async (error: AxiosError) => {
        const message = getMessage()
        const errorConfig = error.config as RequestConfig | undefined

        if (errorConfig?.meta?.silentError) {
            return Promise.reject(error)
        }

        if (error.response) {
            const { data = {} } = error.response as any

            message.error(formatApiError(data, error.response.status))
        } else if (error.code === 'ERR_NETWORK') {
            message.error('网络不可用')
        } else {
            message.error('网络未知错误')
        }

        return Promise.reject(error)
    },
)

export { api }
