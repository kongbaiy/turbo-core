import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'
import onlyWarn from 'eslint-plugin-only-warn'
import { globalIgnores } from 'eslint/config'

export const baseConfig: any[] = [
    // 全局忽略放在最前面
    globalIgnores([
        /*。start */
        /**
         * 在根目录下（core）运行时排除，在apps、mobile-app下运行时不排除，根据 process.cwd() 实现，
         * 子应用提交时（husky 在子仓库触发，cwd = 子应用目录），如：cwd + /apps/**  =  apps/sc-cloud-platform/apps/**，
         * 这个路径不存在，所以完全不会命中，ESLint 照常检查子应用自己的代码，而根目录下时则反之 。
         **/
        'apps/**',
        'mobile-apps/**',
        /* end */

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
