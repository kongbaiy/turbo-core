import { getPrimaryObjectDomain, getSearchFields } from '../../app-form-runtime/schema'
import type {
    AppFormRenderSchema,
    AppFormRuntimeField,
    AppFormRuntimeValue,
} from '../../app-form-runtime/types'

type LooseRecord = Record<string, unknown>

export interface RuntimeQueryCondition extends LooseRecord {
    dataDomainCode: string
    fieldCode: string
    operator: 'LIKE' | 'EQ' | 'BETWEEN'
    value: unknown
    secondValue?: unknown
}

export interface RuntimePageRequest {
    pageNo: number
    pageSize: number
    formVersionId?: string
    formVersionNo?: string
    conditions: RuntimeQueryCondition[]
    sorts: Array<{ fieldCode: string; direction: 'ASC' | 'DESC' }>
}

export interface RuntimeRecord extends LooseRecord {
    id: string
    version?: number
    recordVersion?: number
    formVersionId?: string
    formVersionNo?: string
    dataDomains?: AppFormRuntimeValue['dataDomains']
    referenceLabels?: AppFormRuntimeValue['referenceLabels']
}

const isEmptyValue = (value: unknown) =>
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)

const normalizedValue = (value: unknown) =>
    typeof value === 'string' ? value.trim() : value

const toCondition = (
    field: AppFormRuntimeField,
    value: unknown,
    defaultDomainCode: string,
): RuntimeQueryCondition | undefined => {
    const normalized = normalizedValue(value)
    if (isEmptyValue(normalized)) return undefined

    const controlType = (field.controlType || '').toUpperCase()
    if (
        controlType === 'DATE_RANGE' &&
        Array.isArray(normalized) &&
        normalized.length === 2
    ) {
        return {
            dataDomainCode: field.dataDomainCode || defaultDomainCode,
            fieldCode: field.fieldCode,
            operator: 'BETWEEN',
            value: normalized[0],
            secondValue: normalized[1],
        }
    }

    return {
        dataDomainCode: field.dataDomainCode || defaultDomainCode,
        fieldCode: field.fieldCode,
        operator: controlType.startsWith('TEXT_') ? 'LIKE' : 'EQ',
        value: normalized,
    }
}

export const buildRuntimePageRequest = (
    schema: AppFormRenderSchema,
    params: LooseRecord,
): RuntimePageRequest => {
    const defaultDomainCode = getPrimaryObjectDomain(schema)?.domainCode || ''
    const conditions = getSearchFields(schema)
        .map((field) =>
            toCondition(field, params[field.fieldCode], defaultDomainCode),
        )
        .filter((item): item is RuntimeQueryCondition => Boolean(item))

    return {
        pageNo: Number(params.current) || 1,
        pageSize: Number(params.pageSize) || 20,
        formVersionId: schema.form?.versionId,
        formVersionNo: schema.form?.versionNo,
        conditions,
        sorts: [],
    }
}

export const flattenRuntimeRecord = (
    schema: AppFormRenderSchema,
    record: RuntimeRecord,
): LooseRecord => {
    const {
        dataDomains,
        referenceLabels: _referenceLabels,
        dataDomainFieldAccess: _dataDomainFieldAccess,
        ...recordControl
    } = record
    const primaryDomain = getPrimaryObjectDomain(schema)
    const primaryValue = primaryDomain
        ? dataDomains?.[primaryDomain.domainCode]
        : undefined

    return {
        ...recordControl,
        ...(primaryValue && !Array.isArray(primaryValue)
            ? primaryValue
            : {}),
    }
}

export const toRuntimeValue = (record: RuntimeRecord): AppFormRuntimeValue => ({
    recordId: record.id,
    dataDomains: record.dataDomains || {},
    referenceLabels: record.referenceLabels,
})

export const toRuntimeSavePayload = (
    schema: AppFormRenderSchema,
    value: AppFormRuntimeValue,
    record?: RuntimeRecord,
) => ({
    recordId: value.recordId,
    expectedVersion: record?.version,
    recordVersion: record?.recordVersion,
    formVersionId: record?.formVersionId || schema.form?.versionId,
    formVersionNo: record?.formVersionNo || schema.form?.versionNo,
    dataDomains: value.dataDomains,
})
