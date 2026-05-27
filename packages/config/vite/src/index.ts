import path from 'node:path'
import { defineConfig, PluginOption, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import qiankun from 'vite-plugin-qiankun'

import { createProxy } from './proxy'

interface ExtendOptions {
    envDir?: string
    envDirAuto?: boolean
    root?: (mode: string, process: NodeJS.Process) => string | string
    plugins?: PluginOption[]
    qiankun?: (plugin: typeof qiankun) => ReturnType<typeof qiankun>
    server?: Record<string, unknown>
}

function defineAppConfig(extendOptions?: ExtendOptions) {
    const {
        envDir = '../../',
        envDirAuto,
        root = process.cwd(),
        qiankun: setQiankun,
        plugins = [],
        server = {},
    } = extendOptions || {}

    const mountQiankunApp =
        typeof setQiankun === 'function' ? setQiankun(qiankun) : undefined


    return defineConfig(({ mode }) => {
        const newEvnDir = envDirAuto ? process.cwd() : envDir
        const env = loadEnv(mode, newEvnDir)
        const newBase = typeof root === 'function' ? root(mode, process) : (root || '')

        return {
            root: newBase,
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

            resolve: {
                alias: {
                    '@': path.resolve(process.cwd(), 'src'),
                },
            },

            css: {
                modules: {
                    // 将 kebab-case 转换为 camelCase
                    localsConvention: 'camelCase',
                },
            },

            server: {
                host: '0.0.0.0',
                proxy: createProxy(env),
                ...server,
            },

            build: {
                rollupOptions: {
                    output: {
                        // 统一抽离公共依赖，避免重复打包
                        manualChunks(id: string) {
                            if (
                                id.includes('node_modules/react') ||
                                id.includes('node_modules/react-dom')
                            )
                                return 'react-vendor'
                            if (id.includes('node_modules/antd'))
                                return 'antd-vendor'
                        },
                    },
                },
            },
        }
    })
}

export default defineAppConfig
