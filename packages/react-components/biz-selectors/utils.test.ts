// @ts-nocheck
import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
    firstSelectableDeptKey,
    normalizeSelectorDeptId,
    personDeptNameOf,
    personPostNameOf,
} from './utils.ts'

test('normalizes selector department ids before requesting persons', () => {
    assert.equal(normalizeSelectorDeptId(undefined), undefined)
    assert.equal(normalizeSelectorDeptId(''), undefined)
    assert.equal(normalizeSelectorDeptId('   '), undefined)
    assert.equal(normalizeSelectorDeptId('undefined'), undefined)
    assert.equal(normalizeSelectorDeptId('null'), undefined)
    assert.equal(normalizeSelectorDeptId(' DEPT_001 '), 'DEPT_001')
})

test('finds the first selectable department node', () => {
    assert.equal(
        firstSelectableDeptKey([
            {
                key: 'ORG_ROOT',
                title: '单位',
                selectable: false,
                children: [
                    { key: 'DEPT_001', title: '财务部' },
                    { key: 'DEPT_002', title: '人力部' },
                ],
            },
        ]),
        'DEPT_001',
    )
    assert.equal(
        firstSelectableDeptKey([
            {
                key: 'ORG_ROOT',
                title: '单位',
                selectable: false,
                children: [
                    { key: '', title: '空节点' },
                    { key: 'DEPT_003', title: '行政部', selectable: false },
                ],
            },
        ]),
        undefined,
    )
})

test('formats person department and post names for selector display', () => {
    assert.equal(
        personDeptNameOf({
            deptFullName: '晟城城市服务/晟城城市服务/',
            deptName: '晟城城市服务',
        }),
        '晟城城市服务',
    )
    assert.equal(
        personPostNameOf({
            mainDuty: {
                postName: '',
                basePostName: '综合管理岗',
            },
        }),
        '综合管理岗',
    )
})
