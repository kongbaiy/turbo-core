import type { ThemeConfig } from 'antd'

export const lightTheme: ThemeConfig = {
    token: {
        colorPrimary: '#fe873e',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        borderRadius: 6,
        fontSize: 14,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        controlHeight: 32,
    },
    components: {
        Button: {
            controlHeight: 36,
            borderRadius: 4,
            ghostBg: '#fff5ed',
            defaultGhostColor: 'red',
            defaultGhostBorderColor: '#b65922',
            defaultBgDisabled: '#f3f4f6',
            colorBgContainerDisabled: '#f3f4f6',
            colorTextDisabled: '#b6b6bf',
            textTextColor: '#e77f54'
        },
        Card: {
            borderRadiusLG: 8,
        },
        Modal: {
            borderRadiusLG: 8,
        },
        // 可以继续覆盖其他组件样式
    },
};

// 可预定义暗色主题
export const darkTheme: ThemeConfig = {
    token: {
        colorPrimary: '#1677ff',
        colorBgBase: '#141414',
        colorTextBase: '#ffffff',
    },
};