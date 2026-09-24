export const sharedDependenceConfig = {
    // antd/dayjs 的 locale 与 plugin 子路径、antd 的 reset.css 不 external，由子应用内联，避免主应用 window.require map 缺失子路径映射导致线上国际化失效或 dayjs.extend(undefined) 抛错
    external: (id: string) => {
        if (/^antd\/locale\//.test(id)) return false
        if (/^antd\/(es|lib)\/locale\//.test(id)) return false
        if (
            /^antd\/(es|lib)\/(calendar|date-picker|time-picker)\/locale\//.test(
                id,
            )
        )
            return false
        if (/^antd\/dist\//.test(id)) return false
        if (/^dayjs\/locale\//.test(id)) return false
        if (/^dayjs\/plugin\//.test(id)) return false
        return (
            /^(react|react-dom)(\/|$)/.test(id) ||
            /^antd(\/|$)/.test(id) || // antd 及 antd/es/xxx 深路径
            /^@ant-design\/(pro-|icons|cssinjs)/.test(id) || // pro-* 子包 + icons
            /^dayjs(\/|$)/.test(id)
        )
    },

    globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOMClient',
        'react/jsx-runtime': 'ReactJSXRuntime', // 必须补，否则又变回 react_jsx_runtime
        'react/jsx-dev-runtime': 'ReactJSXRuntime',
        antd: 'antd',
        '@ant-design/pro-components': 'ProComponents',
        '@ant-design/icons': 'antdIcons',
        '@ant-design/cssinjs': 'cssinjs',
        dayjs: 'dayjs',
    },
}
