import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import UnoCSS from 'unocss/vite'
import { presetAttributify } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'

export default defineConfig({
    plugins: [
        react(),
        UnoCSS({
            presets: [presetWind3(), presetAttributify()],
            // 可选：配置规则、 shortcuts 等
        }),
    ],
    css: {
        modules: {
            // 将 kebab-case 转换为 camelCase
            localsConvention: 'camelCase',
        },
    },
})
