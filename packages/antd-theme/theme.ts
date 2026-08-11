import type { ThemeConfig } from 'antd'

export const lightTheme: ThemeConfig = {
    token: {
        colorPrimary: '#e75927',
        colorSuccess: '#22c55d',
        colorWarning: '#f59e0b',
        colorError: '#ee4444',
        fontSize: 14,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        controlHeight: 32,
        paddingContentHorizontal: 14,
        borderRadius: 4,
        colorLink: '#e75927',
    },
    components: {
        Button: {
            ghostBg: '#fff5ed',
            defaultGhostColor: 'red',
            defaultGhostBorderColor: '#b65922',
            colorBgContainerDisabled: '#f3f4f6',
            colorTextDisabled: '#b6b6bf',
            textTextColor: '#e77f54',
        },
        Modal: {
            borderRadiusLG: 8,
        },
        Segmented: {
            itemSelectedBg: '#e75927',
            itemSelectedColor: '#fff',
        },
    },
}

// 可预定义暗色主题
export const darkTheme: ThemeConfig = {
    token: {
        colorPrimary: '#1677ff',
        colorBgBase: '#141414',
        colorTextBase: '#ffffff',
    },
}
