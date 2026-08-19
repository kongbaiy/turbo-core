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
    base?: string | ((env: Record<string, any>, config: any) => string)
    plugins?: PluginOption[]
    qiankun?: (plugin: typeof qiankun) => ReturnType<typeof qiankun>
    server?: Record<string, any> | (<T>(options?: T) => Record<string, any>)
    css?:
        | Record<string, unknown>
        | (<T extends unknown[]>(...args: T) => Record<string, unknown>)
}

function defineAppConfig(extendOptions?: ExtendOptions) {
    const {
        envDir = '../../',
        envDirAuto,
        root = process.cwd(),
        base = '',
        qiankun: setQiankun,
        plugins = [],
        server = {},
        css = {},
    } = extendOptions || {}

    const mountQiankunApp =
        typeof setQiankun === 'function' ? setQiankun(qiankun) : undefined

    return defineConfig((config) => {
        const { mode } = config
        const newEvnDir = envDirAuto ? process.cwd() : envDir
        const env = loadEnv(mode, newEvnDir)
        const newRoot =
            typeof root === 'function' ? root(mode, process) : root || ''
        const newBasePath =
            typeof base === 'function' ? base(env, config) : base || '/'
        const newServer =
            typeof server === 'function'
                ? server({ mode, process, env })
                : server || {}
        const newCss = typeof css === 'function' ? css() : css || {}

        return {
            root: newRoot,
            base: newBasePath,
            plugins: [
                react(),

                AutoImport({
                    imports: ['react'],
                    exclude: [
                        /[\\/]node_modules[\\/]/,
                        /[\\/]\.git[\\/]/,
                        /[\\/]app-form-runtime[\\/]rule-engine[\\/]contract-validator\.ts$/,
                    ],
                    dirsScanOptions: {
                        fileFilter: (file) =>
                            !file.endsWith(
                                '/app-form-runtime/rule-engine/contract-validator.ts',
                            ),
                    },
                    dts: './auto-imports.d.ts',
                    dirs: [
                        path.resolve(__dirname, '../../../react-components'),
                    ],
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

            define: {
                // 配置 react-grid-layout process.env 变量，react-grid-layout 调用需要注入环境变量
                'process.env.NODE_ENV': JSON.stringify(mode),
            },

            resolve: {
                alias: {
                    '@': path.resolve(process.cwd(), 'src'),
                },
                dedupe: [
                    'react',
                    'react-dom',
                    'react/jsx-runtime',
                    'react/jsx-dev-runtime',
                ],
            },

            css: {
                modules: {
                    // 将 kebab-case 转换为 camelCase
                    localsConvention: 'camelCase',
                },
                ...newCss,
            },

            server: {
                host: '0.0.0.0',
                proxy: createProxy(env),
                ...newServer,
            },

            build: {
                // cssCodeSplit: false, // 合并所有 CSS
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
