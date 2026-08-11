import { expect, test } from 'vitest'

import type { AppFormRenderSchema } from '../../app-form-runtime/types'
import { PreviewSessionStore } from './preview-session-store'

const schema: AppFormRenderSchema = {
    schemaVersion: '2.2',
    form: { versionId: 'VERSION_5', versionNo: 'v5' },
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
            ],
        },
    ],
}

test('查询和分页只读取当前会话模拟数据', async () => {
    const store = new PreviewSessionStore(schema, { seed: 8, count: 8 })
    const firstPage = await store.page({
        pageNo: 1,
        pageSize: 3,
        conditions: [],
        sorts: [],
    })
    const name = String(
        firstPage.records?.[0]?.dataDomains?.baseInfo &&
            !Array.isArray(firstPage.records[0].dataDomains?.baseInfo)
            ? firstPage.records[0].dataDomains?.baseInfo.applicantName
            : '',
    )
    const filtered = await store.page({
        pageNo: 1,
        pageSize: 20,
        conditions: [
            {
                dataDomainCode: 'baseInfo',
                fieldCode: 'applicantName',
                operator: 'LIKE',
                value: name,
            },
        ],
        sorts: [],
    })

    expect(firstPage.records).toHaveLength(3)
    expect(firstPage.total).toBe(8)
    expect(filtered.records?.length).toBeGreaterThan(0)
    expect(filtered.records?.every((record) => {
        const value = record.dataDomains?.baseInfo
        return !Array.isArray(value) && String(value?.applicantName).includes(name)
    })).toBe(true)
})

test('新增编辑和删除只改变当前 Session', async () => {
    const store = new PreviewSessionStore(schema, { seed: 3, count: 2 })
    const id = await store.save({
        dataDomains: { baseInfo: { applicantName: '王五', amount: 500 } },
    })
    expect((await store.detail(id)).dataDomains?.baseInfo).toMatchObject({
        applicantName: '王五',
        amount: 500,
    })

    await store.save({
        recordId: id,
        dataDomains: { baseInfo: { applicantName: '赵六', amount: 800 } },
    })
    expect((await store.detail(id)).dataDomains?.baseInfo).toMatchObject({
        applicantName: '赵六',
        amount: 800,
    })

    await store.delete(id)
    await expect(store.detail(id)).rejects.toThrow('模拟记录不存在')
})

test('刷新草稿时按原 seed 重建会话数据', async () => {
    const store = new PreviewSessionStore(schema, { seed: 5, count: 3 })
    const initial = await store.page({ pageNo: 1, pageSize: 20, conditions: [], sorts: [] })
    await store.delete(initial.records![0]!.id)

    store.reset(schema)

    const reset = await store.page({ pageNo: 1, pageSize: 20, conditions: [], sorts: [] })
    expect(reset).toEqual(initial)
})
