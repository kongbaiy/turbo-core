import assert from 'node:assert/strict'
import { test } from 'vitest'

import { getPageTemplateComponent } from './template-registry'

test('只为已登记的页面模板编码返回组件', () => {
    assert.equal(
        typeof getPageTemplateComponent('GENERAL_TEMPLATE_1'),
        'function',
    )
    assert.equal(getPageTemplateComponent('UNKNOWN_TEMPLATE'), undefined)
    assert.equal(getPageTemplateComponent(undefined), undefined)
})
