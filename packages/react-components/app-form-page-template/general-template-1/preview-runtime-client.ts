import type {
    AppFormFieldOption,
    AppFormRenderSchema,
    AppFormScene,
} from '../../app-form-runtime/types'
import type {
    RuntimePageRequest,
    RuntimeRecord,
} from './runtime-data-adapter'
import type {
    GeneralTemplateRuntimeClient,
    RuntimePageResult,
} from './runtime-client'

interface PreviewSessionRuntimeStore {
    page(request: RuntimePageRequest): Promise<RuntimePageResult>
    detail(recordId: string): Promise<RuntimeRecord>
    save(payload: Record<string, unknown>): Promise<string>
    delete(recordId: string): Promise<void>
}

interface PreviewRuntimeHttpClient {
    post<T>(
        url: string,
        payload?: unknown,
    ): Promise<{ data?: T }>
}

export interface CreatePreviewRuntimeClientOptions {
    formId: string
    versionId: string
    schemas: Partial<Record<AppFormScene, AppFormRenderSchema>>
    store: PreviewSessionRuntimeStore
    api: PreviewRuntimeHttpClient
}

interface PreviewOptionPageResult {
    records?: Array<{
        label: string
        value: string
        disabled?: boolean
    }>
}

const previewOptionsUrl = (
    formId: string,
    versionId: string,
    dataDomainCode: string,
    fieldCode: string,
) => `/api/admin/basic/app-forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(versionId)}/data-domains/${encodeURIComponent(dataDomainCode)}/fields/${encodeURIComponent(fieldCode)}/preview-options`

const objectValue = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : undefined

const stringArray = (value: unknown) =>
    Array.isArray(value) ? value.map(String) : []

export const createPreviewRuntimeClient = ({
    formId,
    versionId,
    schemas,
    store,
    api,
}: CreatePreviewRuntimeClientOptions): GeneralTemplateRuntimeClient => {
    const requireSchema = (scene: AppFormScene) => {
        const schema = schemas[scene]
        if (!schema) throw new Error(`${scene}预览Schema尚未加载`)
        return schema
    }

    return {
        async getSchemaByPermission(_permissionId, scene) {
            return requireSchema(scene)
        },

        async getSchema(_formCode, scene) {
            return requireSchema(scene)
        },

        async page(_schema, payload) {
            return store.page(payload)
        },

        async detail(_schema, recordId) {
            return store.detail(recordId)
        },

        async save(_schema, payload) {
            return store.save(payload)
        },

        async delete(_schema, recordId) {
            return store.delete(recordId)
        },

        async loadOptions(_schema, field, keyword): Promise<AppFormFieldOption[]> {
            if (field.referenceFlag !== true) return []
            const dataDomainCode = field.dataDomainCode?.trim()
            const fieldCode = field.fieldCode?.trim()
            if (!dataDomainCode || !fieldCode) return []
            const optionSource = objectValue(field.optionSource)
            const controlProps = objectValue(field.controlProps)
            const selectedValues = stringArray(
                optionSource?.selectedValues || controlProps?.selectedValues,
            )
            const cascadeValues = objectValue(
                optionSource?.cascadeValues || controlProps?.cascadeValues,
            ) || {}
            const { data } = await api.post<PreviewOptionPageResult>(
                previewOptionsUrl(
                    formId,
                    versionId,
                    dataDomainCode,
                    fieldCode,
                ),
                {
                    keyword,
                    selectedValues,
                    cascadeValues,
                    pageNo: 1,
                    pageSize: 50,
                },
            )
            return (data?.records || []).map((option) => ({
                label: option.label,
                value: option.value,
                disabled: option.disabled,
            }))
        },
    }
}
