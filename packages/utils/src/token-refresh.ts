export type StoredAccessToken = {
    Authorization?: string
    refreshToken?: string
    expiresAt?: string
    refreshExpiresAt?: string
    sessionId?: string
    tenantId?: string
}

export type LoginTokenPayload = {
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
    refreshExpiresAt?: string
    sessionId?: string
    tenantId?: string
}

export function toStoredAccessToken(
    payload: LoginTokenPayload,
    previous: StoredAccessToken = {},
): StoredAccessToken {
    return {
        Authorization: payload.accessToken ?? previous.Authorization,
        refreshToken: payload.refreshToken ?? previous.refreshToken,
        expiresAt: payload.expiresAt ?? previous.expiresAt,
        refreshExpiresAt:
            payload.refreshExpiresAt ?? previous.refreshExpiresAt,
        sessionId: payload.sessionId ?? previous.sessionId,
        tenantId: payload.tenantId ?? previous.tenantId,
    }
}

export function shouldRefreshAccessToken({
    token,
    now = Date.now(),
    thresholdMs = 5 * 60 * 1000,
}: {
    token: Pick<StoredAccessToken, 'expiresAt' | 'refreshToken'>
    now?: number
    thresholdMs?: number
}) {
    if (!token.refreshToken || !token.expiresAt) return false

    const expiresAt = Date.parse(token.expiresAt.replace(' ', 'T'))
    if (Number.isNaN(expiresAt)) return false

    return expiresAt - now <= thresholdMs
}

export function shouldReuseStoredTokenForRetry({
    requestAuthorization,
    token,
}: {
    requestAuthorization?: string
    token: Pick<StoredAccessToken, 'Authorization'>
}) {
    return Boolean(
        token.Authorization &&
            requestAuthorization &&
            token.Authorization !== requestAuthorization,
    )
}
