import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
    normalizeDeptSelection,
    resolveDeptSelectionLabels,
    shouldResolveDeptLabel,
    toStrictDeptCheckedKeys,
} from './dept-selector'

test('department selector uses strict checked key shape to avoid cascading children', () => {
    assert.deepEqual(toStrictDeptCheckedKeys(['parent-dept']), {
        checked: ['parent-dept'],
        halfChecked: [],
    })
})

test('department selector keeps only one department in single mode', () => {
    const departments = [
        {
            deptId: 'parent',
            deptName: '父部门',
            children: [{ deptId: 'child', deptName: '子部门' }],
        },
        { deptId: 'child', deptName: '子部门' },
    ]

    assert.deepEqual(normalizeDeptSelection(departments, false), [
        { deptId: 'parent', deptName: '父部门' },
    ])
    assert.deepEqual(normalizeDeptSelection(departments, true), [
        { deptId: 'parent', deptName: '父部门' },
        { deptId: 'child', deptName: '子部门' },
    ])
})

test('department selector resolves display name from tree when only id is bound', () => {
    const tree = [
        {
            key: 'dept-1',
            title: '综合管理部',
            raw: { deptId: 'dept-1', deptName: '综合管理部' },
        },
    ]

    assert.equal(shouldResolveDeptLabel({ deptId: 'dept-1' }), true)
    assert.deepEqual(
        resolveDeptSelectionLabels([{ deptId: 'dept-1' }], tree),
        [{ deptId: 'dept-1', deptName: '综合管理部' }],
    )
})
