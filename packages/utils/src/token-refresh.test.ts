import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
    shouldReuseStoredTokenForRetry,
    shouldRefreshAccessToken,
    toStoredAccessToken,
} from './token-refresh'

test('stores refresh token and expiry metadata from login response', () => {
    const stored = toStoredAccessToken({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: '2026-07-15T10:00:00',
        refreshExpiresAt: '2026-07-22T10:00:00',
        sessionId: 'session-id',
        tenantId: 'tenant-id',
    })

    assert.deepEqual(stored, {
        Authorization: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: '2026-07-15T10:00:00',
        refreshExpiresAt: '2026-07-22T10:00:00',
        sessionId: 'session-id',
        tenantId: 'tenant-id',
    })
})

test('refreshes before the access token expires', () => {
    assert.equal(
        shouldRefreshAccessToken({
            token: {
                expiresAt: '2026-07-15T10:04:00',
                refreshToken: 'refresh-token',
            },
            now: new Date('2026-07-15T10:00:00').getTime(),
            thresholdMs: 5 * 60 * 1000,
        }),
        true,
    )

    assert.equal(
        shouldRefreshAccessToken({
            token: {
                expiresAt: '2026-07-15T10:10:00',
                refreshToken: 'refresh-token',
            },
            now: new Date('2026-07-15T10:00:00').getTime(),
            thresholdMs: 5 * 60 * 1000,
        }),
        false,
    )
})

test('reuses a newer stored access token when retrying a failed request', () => {
    assert.equal(
        shouldReuseStoredTokenForRetry({
            requestAuthorization: 'old-access-token',
            token: { Authorization: 'new-access-token' },
        }),
        true,
    )

    assert.equal(
        shouldReuseStoredTokenForRetry({
            requestAuthorization: 'same-access-token',
            token: { Authorization: 'same-access-token' },
        }),
        false,
    )
})
