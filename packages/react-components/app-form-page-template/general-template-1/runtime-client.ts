import { api } from '@repo/utils'

import type {
    AppFormFieldOption,
    AppFormRenderSchema,
    AppFormRuntimeField,
} from '../../app-form-runtime/types'
import type {
    RuntimePageRequest,
    RuntimeRecord,
} from './runtime-data-adapter'

type BindingName = 'save' | 'detail' | 'page' | 'delete'

export interface RuntimePageResult {
    records?: RuntimeRecord[]
    total?: number
}

export interface GeneralTemplateRuntimeClient {
    getSchemaByPermission(
        permissionId: string,
        scene: 'LIST' | 'FORM' | 'DETAIL',
    ): Promise<AppFormRenderSchema>
    getSchema(
        formCode: string,
        scene: 'FORM' | 'DETAIL',
    ): Promise<AppFormRenderSchema>
    page(
        schema: AppFormRenderSchema,
        payload: RuntimePageRequest,
    ): Promise<RuntimePageResult>
    detail(
        schema: AppFormRenderSchema,
        recordId: string,
    ): Promise<RuntimeRecord>
    save(schema: AppFormRenderSchema, payload: Record<string, unknown>): Promise<string>
    delete(schema: AppFormRenderSchema, recordId: string): Promise<void>
    loadOptions(
        schema: AppFormRenderSchema,
        field: AppFormRuntimeField,
        keyword?: string,
    ): Promise<AppFormFieldOption[]>
}

const requireData = <T>(data: T | undefined, message: string): T => {
    if (data === undefined || data === null) throw new Error(message)
    return data
}

const apiUrl = (url: string) => {
    if (/^https?:\/\//i.test(url)) {
        throw new Error('运行时接口必须使用同源相对地址')
    }
    if (url.startsWith('/api/')) return url
    if (url.startsWith('/')) return `/api${url}`
    return `/api/${url}`
}

export const runtimeSchemaByPermissionUrl = (permissionId: string) =>
    `/api/admin/enterprise/basic/app-forms/menu-permissions/${encodeURIComponent(permissionId)}/render-schema`

const fallbackBindingUrl = (
    formCode: string,
    binding: BindingName,
) => {
    const baseUrl = `/api/admin/enterprise/basic/app-forms/${encodeURIComponent(formCode)}`
    if (binding === 'page') return `${baseUrl}/records/page`
    if (binding === 'save') return `${baseUrl}/records`
    return `${baseUrl}/records/{recordId}`
}

export const resolveRuntimeBindingUrl = (
    schema: AppFormRenderSchema,
    binding: BindingName,
    recordId?: string,
) => {
    const configuredUrl = schema.apiBindings?.[binding]?.url
    const formCode = schema.form?.formCode?.trim()
    if (!configuredUrl && !formCode) throw new Error('应用表单编码不能为空')

    let url = configuredUrl
        ? apiUrl(configuredUrl)
        : fallbackBindingUrl(formCode!, binding)
    if (url.includes('{recordId}')) {
        if (!recordId) throw new Error('记录ID不能为空')
        url = url.replace('{recordId}', encodeURIComponent(recordId))
    }
    return url
}

const schemaUrl = (formCode: string) =>
    `/api/admin/enterprise/basic/app-forms/${encodeURIComponent(formCode)}/render-schema`

export const defaultGeneralTemplateRuntimeClient: GeneralTemplateRuntimeClient = {
    async getSchemaByPermission(permissionId, scene) {
        const { data } = await api.get<AppFormRenderSchema>(
            runtimeSchemaByPermissionUrl(permissionId),
            { params: { scene } },
        )
        return requireData(data, '页面关联的应用表单配置不存在')
    },

    async getSchema(formCode, scene) {
        const { data } = await api.get<AppFormRenderSchema>(
            schemaUrl(formCode),
            { params: { scene } },
        )
        return requireData(data, '应用表单页面配置不存在')
    },

    async page(schema, payload) {
        const { data } = await api.post<RuntimePageResult>(
            resolveRuntimeBindingUrl(schema, 'page'),
            payload,
        )
        return requireData(data, '应用表单分页结果为空')
    },

    async detail(schema, recordId) {
        const { data } = await api.get<RuntimeRecord>(
            resolveRuntimeBindingUrl(schema, 'detail', recordId),
        )
        return requireData(data, '应用表单记录不存在')
    },

    async save(schema, payload) {
        const { data } = await api.post<string>(
            resolveRuntimeBindingUrl(schema, 'save'),
            payload,
        )
        return requireData(data, '应用表单保存结果为空')
    },

    async delete(schema, recordId) {
        await api.delete(resolveRuntimeBindingUrl(schema, 'delete', recordId))
    },

    async loadOptions(schema, field, keyword) {
        if (field.referenceFlag !== true) return []
        const formCode = schema.form?.formCode?.trim()
        const domainCode = field.dataDomainCode?.trim()
        if (!formCode || !domainCode || !field.fieldCode) return []
        const url = `/api/admin/enterprise/basic/app-forms/${encodeURIComponent(formCode)}/data-domains/${encodeURIComponent(domainCode)}/fields/${encodeURIComponent(field.fieldCode)}/options`
        const { data } = await api.post<{
            records?: Array<{
                label: string
                value: string
                disabled?: boolean
            }>
        }>(url, {
            keyword,
            formVersionId: schema.form?.versionId,
            formVersionNo: schema.form?.versionNo,
            pageNo: 1,
            pageSize: 50,
        })
        return (data?.records || []).map((option) => ({
            label: option.label,
            value: option.value,
            disabled: option.disabled,
        }))
    },
}
