import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    entries: [{ input: './src/index.ts', name: 'index' }],
    clean: true,
    declaration: true,
    failOnWarn: false,
    externals: ['vite'],
    rollup: {
        emitCJS: true,
    },
})
