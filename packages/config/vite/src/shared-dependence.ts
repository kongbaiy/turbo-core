export const sharedDependenceConfig = {
    external: (id: string) =>
        /^(react|react-dom)(\/|$)/.test(id) ||
        /^antd(\/|$)/.test(id) || // antd 及 antd/es/xxx 深路径
        /^@ant-design\/(pro-|icons|cssinjs)/.test(id), // pro-* 子包 + icons

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
    },
}
