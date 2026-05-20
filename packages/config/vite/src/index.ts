import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import UnoCSS from 'unocss/vite'

export default defineConfig({
    plugins: [react(), UnoCSS()],
    css: {
        modules: {
            // 将 kebab-case 转换为 camelCase
            localsConvention: 'camelCase',
        },
    },
})
