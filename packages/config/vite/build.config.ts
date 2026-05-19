import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    entries: [{ input: './src/index.ts', name: 'index' }],
    clean: true,
    declaration: true,
    failOnWarn: false,
    externals: ['vite', '@vitejs/plugin-react-swc'],
    rollup: {
        emitCJS: true,
    },
})
