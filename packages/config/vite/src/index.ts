import path from 'node:path'
import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import qiankun from 'vite-plugin-qiankun'

interface ExtendOptions {
    plugins?: PluginOption[]
    qiankun?: (...args: unknown[]) => any
    server?: Record<string, unknown>
}

function defineAppConfig(extendOptions?: ExtendOptions) {
    const {
        qiankun: setQiankun,
        plugins = [],
        server = {}
    } = extendOptions || {}
    const mountQiankunApp = typeof setQiankun === 'function' ? setQiankun(qiankun) : ''

    return defineConfig({
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

            mountQiankunApp,

            ...(plugins || [])
        ],
        css: {
            modules: {
                // 将 kebab-case 转换为 camelCase
                localsConvention: 'camelCase',
            },
        },

        server: {
            host: '0.0.0.0',
            ...server
        }
    })
}

export default defineAppConfig