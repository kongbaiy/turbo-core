import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './test/e2e',
    fullyParallel: false,
    reporter: 'html',
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173',
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
})
