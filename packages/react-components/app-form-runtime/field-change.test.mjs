import assert from 'node:assert/strict'
import { test } from 'vitest'

import { extractRuntimeFieldChanges } from './field-change.ts'

test('extractRuntimeFieldChanges exposes domain field changes with the latest runtime value', () => {
    const runtimeValue = {
        recordId: 'EMPLOYEE_001',
        dataDomains: {
            employee: {
                employeeNo: 'E-001',
                name: '张三',
            },
        },
    }

    assert.deepEqual(
        extractRuntimeFieldChanges(
            { employee: { employeeNo: 'E-001' } },
            runtimeValue,
        ),
        [
            {
                domainCode: 'employee',
                fieldCode: 'employeeNo',
                value: 'E-001',
                dataDomains: runtimeValue.dataDomains,
                runtimeValue,
            },
        ],
    )
})
