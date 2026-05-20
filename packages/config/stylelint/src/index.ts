export function defineConfig() {
    return {
        extends: [
            'stylelint-config-standard',
            // 'stylelint-config-recommended-scss',
            // 支持 CSS Modules 的约定规则
            'stylelint-config-css-modules',
            // 不使用 stylelint-config-prettier（与 stylelint@17 存在兼容性问题），建议使用 Prettier 单独格式化并让 Stylelint 负责风格校验
        ],
        plugins: [
            'stylelint-order', // 属性排序
            'stylelint-plugin-defensive-css', // 防御式 CSS 检查
            // 'stylelint-scss', // SCSS 规则支持
        ],
        rules: {
            // 禁止在同一个选择器中重复声明同一属性
            'declaration-block-no-duplicate-properties': true,

            // 禁止空的样式块
            'block-no-empty': true,

            // 禁止重复的 @import
            'no-duplicate-at-import-rules': true,

            'unit-no-unknown': [true, { ignoreUnits: ['rpx'] }],
            'selector-class-pattern': [
                '^([a-z][a-z0-9]*)((-|__)[a-z0-9]+)*$',
                {
                    message:
                        'Expected class selector to be kebab-case、kebab__case',
                },
            ],
            'order/order': [
                'custom-properties',
                'dollar-variables',
                {
                    type: 'at-rule',
                    name: 'include',
                },
                'declarations',
                {
                    type: 'rule',
                    selector: '^&',
                },
                'rules',
            ],
            'order/properties-order': [
                'display',
                'position',
                'top',
                'right',
                'bottom',
                'left',
                'z-index',
                'box-sizing',
                'width',
                'height',
                'min-width',
                'min-height',
                'max-width',
                'max-height',
                'margin',
                'margin-top',
                'margin-right',
                'margin-bottom',
                'margin-left',
                'padding',
                'padding-top',
                'padding-right',
                'padding-bottom',
                'padding-left',
                'border',
                'border-style',
                'border-width',
                'border-color',
                'border-radius',
                'background',
                'background-color',
                'background-image',
                'background-repeat',
                'font',
                'font-family',
                'font-size',
                'font-weight',
                'font-style',
                'text-align',
                'color',
                'content',
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
