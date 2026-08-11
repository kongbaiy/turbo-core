import { beforeEach, expect, test, vi } from 'vitest'

import type {
    AppFormRenderSchema,
    AppFormRuntimeField,
} from '../../app-form-runtime/types'
import { createPreviewRuntimeClient } from './preview-runtime-client'

const schemaWithProductionBindings: AppFormRenderSchema = {
    schemaVersion: '2.2',
    scene: 'LIST',
    form: { formCode: 'FORMAL_FORM', versionId: 'PUBLISHED_VERSION' },
    apiBindings: {
        page: { method: 'POST', url: '/admin/enterprise/formal/page' },
        save: { method: 'POST', url: '/admin/enterprise/formal/save' },
        detail: { method: 'GET', url: '/admin/enterprise/formal/detail/{recordId}' },
        delete: { method: 'DELETE', url: '/admin/enterprise/formal/delete/{recordId}' },
    },
}

const store = {
    page: vi.fn(),
    detail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
}

const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
}

beforeEach(() => {
    vi.clearAllMocks()
})

test('预览 CRUD 永远委托会话存储且不解析正式 bindings', async () => {
    store.page.mockResolvedValue({ records: [], total: 0 })
    store.detail.mockResolvedValue({ id: 'P1', dataDomains: {} })
    store.save.mockResolvedValue('P1')
    const client = createPreviewRuntimeClient({
        formId: 'F1',
        versionId: 'V5',
        schemas: { LIST: schemaWithProductionBindings },
        store,
        api,
    })
    const pageRequest = { pageNo: 1, pageSize: 20, conditions: [], sorts: [] }

    await client.page(schemaWithProductionBindings, pageRequest)
    await client.detail(schemaWithProductionBindings, 'P1')
    await client.save(schemaWithProductionBindings, { dataDomains: {} })
    await client.delete(schemaWithProductionBindings, 'P1')

    expect(store.page).toHaveBeenCalledWith(pageRequest)
    expect(store.detail).toHaveBeenCalledWith('P1')
    expect(store.save).toHaveBeenCalledWith({ dataDomains: {} })
    expect(store.delete).toHaveBeenCalledWith('P1')
    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
    expect(api.delete).not.toHaveBeenCalled()
})

test('选项只调用指定草稿字段 preview-options 接口', async () => {
    api.post.mockResolvedValue({
        data: {
            records: [{ value: 'D1', label: '财务部', disabled: false }],
        },
    })
    const client = createPreviewRuntimeClient({
        formId: 'FORM /1',
        versionId: 'V 5',
        schemas: { LIST: schemaWithProductionBindings },
        store,
        api,
    })
    const field: AppFormRuntimeField = {
        fieldCode: 'department/id',
        dataDomainCode: 'BASE INFO',
        referenceFlag: true,
        optionSource: {
            cascadeValues: { companyId: 'C1' },
        },
    }

    await expect(client.loadOptions(schemaWithProductionBindings, field, '财务'))
        .resolves.toEqual([{ value: 'D1', label: '财务部', disabled: false }])
    expect(api.post).toHaveBeenCalledWith(
        '/api/admin/basic/app-forms/FORM%20%2F1/versions/V%205/data-domains/BASE%20INFO/fields/department%2Fid/preview-options',
        {
            keyword: '财务',
            selectedValues: [],
            cascadeValues: { companyId: 'C1' },
            pageNo: 1,
            pageSize: 50,
        },
    )
})

test('预加载 Schema 按场景返回且非引用字段不请求选项', async () => {
    const formSchema = { ...schemaWithProductionBindings, scene: 'FORM' } as AppFormRenderSchema
    const client = createPreviewRuntimeClient({
        formId: 'F1',
        versionId: 'V5',
        schemas: { LIST: schemaWithProductionBindings, FORM: formSchema },
        store,
        api,
    })

    await expect(client.getSchemaByPermission('IGNORED', 'LIST'))
        .resolves.toBe(schemaWithProductionBindings)
    await expect(client.getSchema('IGNORED', 'FORM')).resolves.toBe(formSchema)
    await expect(client.loadOptions(schemaWithProductionBindings, {
        fieldCode: 'title',
        referenceFlag: false,
    })).resolves.toEqual([])
    expect(api.post).not.toHaveBeenCalled()
})
