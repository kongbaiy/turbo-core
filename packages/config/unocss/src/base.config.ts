import { defineConfig } from 'unocss'

export function baseConfig() {
    return defineConfig({
        theme: {
            colors: {
                // 主色
                theme: 'var(--el-color-primary)',

                // 辅助色
                success: 'var(--el-color-success)',
                warning: 'var(--el-color-warning)',
                danger: 'var(--el-color-danger)',
                info: 'var(--el-color-info)',

                // 字体色
                primary: 'var(--el-text-color-primary)',
                regular: 'var(--el-text-color-regular)',
                secondary: 'var(--el-text-color-secondary)',
                placeholder: 'var(--el-text-color-placeholder)',
            },

            textColor: {
                h1: '#33333',
                h2: '#898DA4',
            },

            backgroundColor: {
                base: 'var(--el-bg-color-base)',
            },

            borderColor: {
                base: 'var(--el-border-color)',
                light: 'var(--el-border-color-light)',
            },

            fontSize: {
                xs: ['var(--el-font-size-small)', '18px'],
                sm: ['var(--el-font-size-base)', '20px'],
                base: ['var(--el-font-size-medium)', '22px'],
                lg: ['var(--el-font-size-large)', '24px'],
            },
        },
        shortcuts: {
            // 宽高满屏
            'wh-full': 'w-full h-full',

            // position 满屏
            'pos-full': 'fixed top-0 left-0 right-0 bottom-0',

            // position 水平居中 horizontal
            'pos-h-center': 'absolute left-50% transform -translate-x-50%',

            // flex 水平居中 horizontal
            'flex-h-center': 'flex justify-center',

            // position 垂直居中 vertical
            'pos-v-center': 'absolute top-50% transform -translate-y-50%',

            // flex 垂直居中 vertical
            'flex-v-center': 'flex items-center',

            // position 水平垂直居中
            'pos-center': 'absolute top-50% left-50% transform -translate-50%',

            // flex 水平垂直居中
            'flex-center': 'flex justify-center items-center',
        },
    })
}
