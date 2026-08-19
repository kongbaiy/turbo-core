import type { Plugin } from 'vite'

export const qiankunDevHtmlFix = (): Plugin => {
    return {
        name: 'qiankun-dev-html-fix',
        transformIndexHtml: {
            order: 'post',
            handler(html: string) {
                const refreshInit = [
                    'window.$RefreshReg$ = function() {};',
                    'window.$RefreshSig$ = function() { return function(type) { return type; }; };',
                    'window.__vite_plugin_react_preamble_installed__ = true;',
                    'var refreshBase = window.proxy ? (window.proxy.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ + "..") : "";',
                    'import(refreshBase + "/@react-refresh").then(function(m) {',
                    '  m.default.injectIntoGlobalHook(window);',
                    '});',
                ].join('')

                return html.replace(
                    /<script\s+type="module">[\s\S]*?@react-refresh[\s\S]*?<\/script>\s*/gi,
                    `<script>${refreshInit}</script>`,
                )
            },
        },
    }
}
