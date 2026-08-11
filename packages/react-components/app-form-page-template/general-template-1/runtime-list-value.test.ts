import assert from 'node:assert/strict'
import { test } from 'vitest'

import type { AppFormRuntimeValue } from '../../app-form-runtime/types'
import { applyRuntimeListRow } from './runtime-list-value'

const value: AppFormRuntimeValue = {
    dataDomains: {
        baseInfo: { title: '报销申请' },
        details: [{ id: 'ROW_1', amount: 100 }],
    },
}

test('新增明细行时保留其他数据域且不修改原值', () => {
    const next = applyRuntimeListRow(value, 'details', 'add', { amount: 200 })

    assert.deepEqual(next.dataDomains.details, [
        { id: 'ROW_1', amount: 100 },
        { amount: 200 },
    ])
    assert.deepEqual(next.dataDomains.baseInfo, { title: '报销申请' })
    assert.deepEqual(value.dataDomains.details, [{ id: 'ROW_1', amount: 100 }])
})

test('编辑和删除明细行只作用于指定索引', () => {
    const edited = applyRuntimeListRow(
        value,
        'details',
        'edit',
        { id: 'ROW_1', amount: 300 },
        0,
    )
    const deleted = applyRuntimeListRow(edited, 'details', 'delete', undefined, 0)

    assert.deepEqual(edited.dataDomains.details, [
        { id: 'ROW_1', amount: 300 },
    ])
    assert.deepEqual(deleted.dataDomains.details, [])
})
