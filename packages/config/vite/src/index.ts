import path from 'node:path'
import { defineConfig, type Plugin, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import qiankun from 'vite-plugin-qiankun'

interface ExtendOptions {
    plugins?: PluginOption[]
    qiankun?: (plugin: typeof qiankun) => ReturnType<typeof qiankun>
    server?: Record<string, unknown>
}

/** vite-plugin-qiankun 未转换 head 内 type=module 脚本，qiankun 会按普通脚本执行并报错 */
function qiankunDevHtmlFix(): Plugin {
    return {
        name: 'qiankun-dev-html-fix',
        transformIndexHtml: {
            order: 'post',
            handler(html) {
                return html.replace(
                    /<script\s+type="module">[\s\S]*?@react-refresh[\s\S]*?<\/script>\s*/gi,
                    '',
                )
            },
        },
    }
}

function defineAppConfig(extendOptions?: ExtendOptions) {
    const {
        qiankun: setQiankun,
        plugins = [],
        server = {},
    } = extendOptions || {}
    const isQiankunChild = typeof setQiankun === 'function'
    const mountQiankunApp = isQiankunChild ? setQiankun(qiankun) : undefined

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

            ...(isQiankunChild ? [qiankunDevHtmlFix()] : []),

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
            // 子应用在 qiankun 沙箱内不需要 HMR，且 /@vite/client 与主应用冲突
            ...(isQiankunChild ? { hmr: false } : {}),
            ...server,
        },
    })
}

export default defineAppConfig
