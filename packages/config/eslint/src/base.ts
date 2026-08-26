import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'
import onlyWarn from 'eslint-plugin-only-warn'
import { globalIgnores } from 'eslint/config'

export const baseConfig: any[] = [
    // 全局忽略放在最前面
    // 注意：apps/** / mobile-apps/** 不要放在全局忽略里——baseConfig 设计目标就是
    // "eslint 总是在子仓库根执行"（见下方 tsconfigRootDir: process.cwd() 注释），
    // 若全局忽略 apps/**，子应用内 eslint 会因为命中 ignore 而报错找不到可 lint 文件。
    globalIgnores([
        /* start */
        // 根目录的也能匹配到，因为 ** 匹配 0 个或多个目录层级
        '**/dist/**',
        '**/node_modules/**',
        '**/build/**',
        '**/coverage/**',
        '**/out/**',
        '**/public/**',
        '**/.next/**',
        /* end */
        'dist/**',
        'node_modules/**',
        'build/**',
        'coverage/**',
        'out/**',
        'public/**',
        '.next/**',
        'next-env.d.ts',
        '**/*.d.ts',
        '**/*.mdx',
        '**/*.md',
        '**/*.json',
        '**/*.yml',
        '**/*.yaml',
        '**/*.css',
        '**/*.scss',
        '**/*.sass',
        '**/*.less',
        '.prettierrc.json',
        '.stylelintrc.json',
        '.eslintrc.json',
        '.eslintignore',
    ]),
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommended,
    {
        plugins: {
            turbo: turboPlugin,
        },
        rules: {
            'turbo/no-undeclared-env-vars': 'warn',
            // TypeScript 项目关闭 no-undef，由 TS 编译器负责
            'no-undef': 'off',
            // 未使用变量检查
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        languageOptions: {
            parserOptions: {
                // monorepo 多仓库（apps/* 各自独立 git 仓库）场景下，
                // eslint 总是在子仓库根执行，process.cwd() 即各自的 tsconfigRootDir，
                // 避免 typescript-eslint 推断出多个候选并报 multiple candidates 错误
                tsconfigRootDir: process.cwd(),
            },
        },
        plugins: {
            onlyWarn,
        },
    },
]
