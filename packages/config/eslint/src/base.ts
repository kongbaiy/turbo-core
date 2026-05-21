import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'
import onlyWarn from 'eslint-plugin-only-warn'
import { globalIgnores } from 'eslint/config'

export const baseConfig = [
    // 全局忽略放在最前面
    globalIgnores([
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
        },
    },
    {
        plugins: {
            onlyWarn,
        },
    },
]
