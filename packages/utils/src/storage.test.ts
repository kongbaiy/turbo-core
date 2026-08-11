/// <reference types="node" />

import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
    ACCESS_TOKEN_KEY,
    getAccessToken,
    removeAccessToken,
    setAccessToken,
} from './storage'

class MemoryStorage {
    private readonly values = new Map<string, string>()

    getItem(key: string) {
        return this.values.get(key) ?? null
    }

    setItem(key: string, value: string) {
        this.values.set(key, value)
    }

    removeItem(key: string) {
        this.values.delete(key)
    }

    clear() {
        this.values.clear()
    }
}

const sessionStorageMock = new MemoryStorage()
const localStorageMock = new MemoryStorage()

Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
})
Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
})

test('persists access token to localStorage so a new tab can read it', () => {
    sessionStorageMock.clear()
    localStorageMock.clear()

    setAccessToken({
        Authorization: 'access-token',
        refreshToken: 'refresh-token',
        sessionId: 'session-id',
    })
    sessionStorageMock.clear()

    assert.equal(getAccessToken().Authorization, 'access-token')
    assert.equal(getAccessToken().refreshToken, 'refresh-token')
})

test('removes access token from both storage scopes', () => {
    setAccessToken({ Authorization: 'access-token' })

    removeAccessToken()

    assert.deepEqual(getAccessToken(), {})
    assert.equal(sessionStorage.getItem(ACCESS_TOKEN_KEY), null)
    assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), null)
})

test('does not restore stale session token after logout in another tab', () => {
    sessionStorageMock.clear()
    localStorageMock.clear()

    sessionStorage.setItem(
        ACCESS_TOKEN_KEY,
        JSON.stringify({ Authorization: 'stale-access-token' }),
    )

    removeAccessToken()
    sessionStorage.setItem(
        ACCESS_TOKEN_KEY,
        JSON.stringify({ Authorization: 'stale-access-token' }),
    )

    assert.deepEqual(getAccessToken(), {})
})
