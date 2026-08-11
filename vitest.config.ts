import { defineConfig } from 'vitest/config'

export default defineConfig({
    server: {
        deps: {
            inline: [/^@ant-design\/pro-/],
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.ts', './test/vitest.setup.ts'],
        include: [
            'apps/**/*.{test,spec}.{js,mjs,ts,tsx}',
            'packages/**/*.{test,spec}.{js,mjs,ts,tsx}',
        ],
        clearMocks: true,
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.contract.test.ts',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: [
                'apps/*/src/**/*.{ts,tsx}',
                'packages/**/src/**/*.{ts,tsx}',
            ],
            exclude: [
                '**/*.{test,spec}.{ts,tsx}',
                '**/*.d.ts',
                '**/node_modules/**',
                '**/dist/**',
            ],
        },
    },
})
