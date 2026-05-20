export function defineConfig() {
    return {
        extends: ['stylelint-config-standard'],
        plugins: [
            'stylelint-order', // 属性排序
            'stylelint-plugin-defensive-css', // 防御式 CSS 检查
        ],
        rules: {
            // 禁止在同一个选择器中重复声明同一属性
            'declaration-block-no-duplicate-properties': true,

            // 禁止空的样式块
            'block-no-empty': true,

            // 禁止重复的 @import
            'no-duplicate-at-import-rules': true,

            // ========== 7. SCSS 特有规则（如果使用 SCSS） ==========
            // 禁止嵌套深度超过 3 层（同上，SCSS 版本）
            // 禁止与父选择器拼接形成无意义的类
            'scss/selector-no-union-class-name': true,
            // 变量命名规范
            'scss/dollar-variable-pattern': '^[a-z][a-z0-9-]*$',
            // mixin 命名规范
            'scss/at-mixin-pattern': '^[a-z][a-z0-9-]*$',

            'unit-no-unknown': [true, { ignoreUnits: ['rpx'] }],
            'selector-class-pattern': [
                '^([a-z][a-z0-9]*)((-|__)[a-z0-9]+)*$',
                {
                    message:
                        'Expected class selector to be kebab-case、kebab__case',
                },
            ],
        },
        overrides: [
            {
                files: ['*.html', '**/*.html'],
                customSyntax: 'postcss-html',
            },
        ],
    }
}
