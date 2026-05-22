import path from 'node:path'
import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import qiankun from 'vite-plugin-qiankun'

interface ExtendOptions {
    plugins?: PluginOption[]
    qiankun?: (plugin: typeof qiankun) => ReturnType<typeof qiankun>
    server?: Record<string, unknown>
}

function defineAppConfig(extendOptions?: ExtendOptions) {
    const {
        qiankun: setQiankun,
        plugins = [],
        server = {},
    } = extendOptions || {}
    const mountQiankunApp = typeof setQiankun === 'function' ? setQiankun(qiankun) : undefined

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

            ...(plugins || []),
        ],

        css: {
            modules: {
                // 将 kebab-case 转换为 camelCase
                localsConvention: 'camelCase',
            },
        },

        server: {
            host: '0.0.0.0',
            ...server,
        },

        build: {
            rollupOptions: {
                output: {
                    // 统一抽离公共依赖，避免重复打包
                    manualChunks(id: string) {
                        if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
                        if (id.includes('node_modules/antd')) return 'antd-vendor';
                    }
                },
            },
        },
    })
}

export default defineAppConfig
