import { expect, test } from 'vitest'

import type { AppFormRenderSchema } from '../../app-form-runtime/types'
import { generatePreviewRecords } from './preview-data-generator'

const schema: AppFormRenderSchema = {
    schemaVersion: '2.2',
    form: {
        formCode: 'EXPENSE_APPLICATION',
        versionId: 'VERSION_5',
        versionNo: 'v5',
    },
    dataDomains: [
        {
            domainCode: 'baseInfo',
            domainType: 'OBJECT',
            fields: [
                {
                    fieldCode: 'applicantName',
                    fieldLabel: '申请人',
                    valueType: 'STRING',
                    controlType: 'TEXT_INPUT',
                },
                {
                    fieldCode: 'amount',
                    fieldLabel: '金额',
                    valueType: 'DECIMAL',
                    controlType: 'DECIMAL',
                },
                {
                    fieldCode: 'applicationDate',
                    fieldLabel: '申请日期',
                    valueType: 'DATE',
                    controlType: 'DATE',
                },
                {
                    fieldCode: 'departmentId',
                    fieldLabel: '部门',
                    referenceFlag: true,
                    controlType: 'SELECT',
                },
            ],
        },
        {
            domainCode: 'details',
            domainType: 'LIST',
            fields: [
                {
                    fieldCode: 'description',
                    fieldLabel: '费用说明',
                    valueType: 'STRING',
                    controlType: 'TEXT_INPUT',
                },
                {
                    fieldCode: 'enabled',
                    fieldLabel: '是否启用',
                    valueType: 'BOOLEAN',
                    controlType: 'SWITCH',
                },
            ],
        },
    ],
}

test('按 Schema 生成包含对象域和列表域的会话记录', () => {
    const records = generatePreviewRecords(schema, { seed: 7, count: 18 })

    expect(records).toHaveLength(18)
    expect(records[0]?.dataDomains?.baseInfo).toMatchObject({
        applicantName: expect.any(String),
        amount: expect.any(Number),
        applicationDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        departmentId: undefined,
    })
    expect(Array.isArray(records[0]?.dataDomains?.details)).toBe(true)
    expect(records[0]?.dataDomains?.details).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                description: expect.any(String),
                enabled: expect.any(Boolean),
            }),
        ]),
    )
})

test('相同 seed 生成稳定数据且不同 seed 会变化', () => {
    const first = generatePreviewRecords(schema, { seed: 3, count: 3 })
    const second = generatePreviewRecords(schema, { seed: 3, count: 3 })
    const different = generatePreviewRecords(schema, { seed: 4, count: 3 })

    expect(second).toEqual(first)
    expect(different).not.toEqual(first)
})
