import path from 'node:path'
import { defineConfig, PluginOption, loadEnv, ConfigEnv } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import qiankun from 'vite-plugin-qiankun'
import viteCompression from 'vite-plugin-compression'
import { buildStamp } from 'vite-plugin-build-stamp'

import { createProxy } from './proxy'
import { sharedDependenceConfig } from './shared-dependence'

export interface Env {
    mode: string
    process: NodeJS.Process
    env: Record<string, string>
}

interface ExtendOptions {
    envDir?: string
    envDirAuto?: boolean
    root?: (mode: string, process: NodeJS.Process) => string | string
    base?: string | ((env: Record<string, any>, config: ConfigEnv) => string)
    plugins?: PluginOption[]
    qiankun?: (plugin: typeof qiankun) => ReturnType<typeof qiankun>
    server?:
        | Record<string, unknown>
        | ((options: Env) => Record<string, unknown>)
    preview?: Record<string, unknown>
    css?:
        | Record<string, unknown>
        | (<T extends unknown[]>(...args: T) => Record<string, unknown>)
    sharedDependence?: boolean
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
        preview = {},
        css = {},
        sharedDependence = true,
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
        const newCss =
            typeof css === 'function' ? css({ mode, process, env }) : css || {}

        return {
            root: newRoot,
            base: newBasePath,
            plugins: [
                buildStamp(),

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

                viteCompression({
                    verbose: true,
                    disable: false,
                    threshold: 10240,
                    algorithm: 'gzip',
                    ext: '.gz',
                    deleteOriginFile: false,
                }),
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
                    'dayjs',
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

            preview,

            build: {
                cssCodeSplit: sharedDependence ? false : true,
                rollupOptions: sharedDependence
                    ? {
                          external: sharedDependenceConfig.external,
                          output: {
                              format: 'umd',
                              inlineDynamicImports: true,
                              globals: sharedDependenceConfig.globals,
                          },
                      }
                    : {
                          output: {
                              manualChunks(id: string) {
                                  if (
                                      id.includes('node_modules/react/') ||
                                      id.includes('node_modules/react-dom/')
                                  )
                                      return 'react-vendor'

                                  if (
                                      id.includes('node_modules/antd/') ||
                                      id.includes('node_modules/@ant-design/')
                                  )
                                      return 'antd-vendor'
                              },
                          },
                      },
            },
        }
    })
}

export default defineAppConfig
