import assert from 'node:assert/strict'
import { test } from 'vitest'

import type { AppFormRenderSchema } from '../../app-form-runtime/types'
import {
    buildRuntimePageRequest,
    flattenRuntimeRecord,
    toRuntimeSavePayload,
    toRuntimeValue,
} from './runtime-data-adapter'

const schema: AppFormRenderSchema = {
    schemaVersion: '2.2',
    form: {
        formCode: 'EXPENSE_APPLICATION_MINE',
        versionId: 'VERSION_1',
        versionNo: 'v1',
    },
    dataDomains: [
        {
            domainCode: 'baseInfo',
            domainName: '基本信息',
            domainType: 'OBJECT',
            fields: [
                {
                    fieldCode: 'applicantName',
                    fieldLabel: '申请人',
                    controlType: 'TEXT_INPUT',
                    capabilities: { searchable: true },
                },
                {
                    fieldCode: 'applicationStatus',
                    fieldLabel: '申请状态',
                    controlType: 'SELECT',
                    capabilities: { searchable: true },
                },
                {
                    fieldCode: 'applicationDate',
                    fieldLabel: '申请日期',
                    controlType: 'DATE_RANGE',
                    capabilities: { searchable: true },
                },
            ],
        },
        {
            domainCode: 'details',
            domainName: '费用明细',
            domainType: 'LIST',
            fields: [],
        },
    ],
}

test('把列表查询参数转换为应用表单分页条件并忽略空值', () => {
    assert.deepEqual(
        buildRuntimePageRequest(schema, {
            current: 2,
            pageSize: 10,
            applicantName: ' 张三 ',
            applicationStatus: 'DRAFT',
            applicationDate: ['2026-07-01', '2026-07-30'],
            ignoredEmpty: '',
        }),
        {
            pageNo: 2,
            pageSize: 10,
            formVersionId: 'VERSION_1',
            formVersionNo: 'v1',
            conditions: [
                {
                    dataDomainCode: 'baseInfo',
                    fieldCode: 'applicantName',
                    operator: 'LIKE',
                    value: '张三',
                },
                {
                    dataDomainCode: 'baseInfo',
                    fieldCode: 'applicationStatus',
                    operator: 'EQ',
                    value: 'DRAFT',
                },
                {
                    dataDomainCode: 'baseInfo',
                    fieldCode: 'applicationDate',
                    operator: 'BETWEEN',
                    value: '2026-07-01',
                    secondValue: '2026-07-30',
                },
            ],
            sorts: [],
        },
    )
})

test('把根对象域展平为列表行并保留记录控制字段', () => {
    assert.deepEqual(
        flattenRuntimeRecord(schema, {
            id: 'DATA_1',
            version: 3,
            recordVersion: 5,
            recordCode: 'SQ20260730001',
            dataDomains: {
                baseInfo: {
                    applicantName: '张三',
                    applicationStatus: 'DRAFT',
                },
                details: [{ amount: 100 }],
            },
        }),
        {
            id: 'DATA_1',
            version: 3,
            recordVersion: 5,
            recordCode: 'SQ20260730001',
            applicantName: '张三',
            applicationStatus: 'DRAFT',
        },
    )
})

test('详情和保存适配保留全部数据域及乐观锁版本', () => {
    const record = {
        id: 'DATA_1',
        version: 3,
        recordVersion: 5,
        formVersionId: 'VERSION_1',
        formVersionNo: 'v1',
        dataDomains: {
            baseInfo: { applicantName: '张三' },
            details: [{ amount: 100 }],
        },
        referenceLabels: {
            'baseInfo.applicantName': '张三',
        },
    }
    const value = toRuntimeValue(record)

    assert.deepEqual(value, {
        recordId: 'DATA_1',
        dataDomains: record.dataDomains,
        referenceLabels: record.referenceLabels,
    })
    assert.deepEqual(toRuntimeSavePayload(schema, value, record), {
        recordId: 'DATA_1',
        expectedVersion: 3,
        recordVersion: 5,
        formVersionId: 'VERSION_1',
        formVersionNo: 'v1',
        dataDomains: record.dataDomains,
    })
})
