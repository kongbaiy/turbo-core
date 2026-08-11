type ApiErrorPayload = {
    code?: string | number
    message?: string
    msg?: string
    error?: string
}

const serviceUnavailableStatuses = new Set([502, 503, 504])

function nonBlank(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function formatApiError(payload: unknown, status?: number) {
    const data =
        payload && typeof payload === 'object'
            ? (payload as ApiErrorPayload)
            : undefined
    const code = data?.code
    const detail =
        nonBlank(data?.message) ?? nonBlank(data?.msg) ?? nonBlank(data?.error)

    if (code !== undefined && code !== null && detail) {
        return `【${code}】${detail}`
    }
    if (detail) return detail
    if (status && serviceUnavailableStatuses.has(status)) {
        return `服务暂不可用（HTTP ${status}）`
    }
    if (status) return `请求失败（HTTP ${status}）`
    return '网络未知错误'
}
