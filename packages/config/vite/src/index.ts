import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
    plugins: [
        react(),
        AutoImport({
            imports: ['react'],
            dts: './auto-imports.d.ts',
            dirs: [path.resolve(__dirname, '../../../react-components')],
            eslintrc: {
                enabled: true,
                filepath: './.eslintrc-auto-import.json',
                globalsPropValue: true,
            },
        }),
        UnoCSS(),
    ],
    css: {
        modules: {
            // 将 kebab-case 转换为 camelCase
            localsConvention: 'camelCase',
        },
    },
})
