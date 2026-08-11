import type {
    AppFormRenderSchema,
    AppFormRuntimeValue,
} from '../../app-form-runtime/types'
import type {
    RuntimePageRequest,
    RuntimeQueryCondition,
} from './runtime-data-adapter'
import type { RuntimeRecord } from './runtime-data-adapter'
import {
    generatePreviewRecords,
    type PreviewDataGeneratorOptions,
} from './preview-data-generator'

export interface PreviewSessionPageResult {
    records: RuntimeRecord[]
    total: number
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const domainRows = (
    record: RuntimeRecord,
    domainCode: string,
): Array<Record<string, unknown>> => {
    const value = record.dataDomains?.[domainCode]
    if (Array.isArray(value)) return value
    return value ? [value] : []
}

const comparable = (value: unknown) => {
    if (value === undefined || value === null) return ''
    return typeof value === 'string' ? value : JSON.stringify(value)
}

const matchesCondition = (
    record: RuntimeRecord,
    condition: RuntimeQueryCondition,
) => domainRows(record, condition.dataDomainCode).some((row) => {
    const actual = row[condition.fieldCode]
    if (condition.operator === 'LIKE') {
        return comparable(actual)
            .toLocaleLowerCase()
            .includes(comparable(condition.value).toLocaleLowerCase())
    }
    if (condition.operator === 'BETWEEN') {
        const value = comparable(actual)
        return value >= comparable(condition.value) &&
            value <= comparable(condition.secondValue)
    }
    if (Array.isArray(actual)) {
        return actual.some((item) => comparable(item) === comparable(condition.value))
    }
    return comparable(actual) === comparable(condition.value)
})

const firstFieldValue = (record: RuntimeRecord, fieldCode: string) => {
    for (const value of Object.values(record.dataDomains || {})) {
        const rows = Array.isArray(value) ? value : [value]
        for (const row of rows) {
            if (row && Object.hasOwn(row, fieldCode)) return row[fieldCode]
        }
    }
    return undefined
}

export class PreviewSessionStore {
    private schema: AppFormRenderSchema
    private readonly options: Required<PreviewDataGeneratorOptions>
    private records = new Map<string, RuntimeRecord>()
    private sequence = 0

    constructor(
        schema: AppFormRenderSchema,
        options: PreviewDataGeneratorOptions = {},
    ) {
        this.schema = schema
        this.options = {
            seed: options.seed ?? 20260802,
            count: options.count ?? 18,
        }
        this.reset(schema)
    }

    reset(schema: AppFormRenderSchema = this.schema) {
        this.schema = schema
        const records = generatePreviewRecords(schema, this.options)
        this.records = new Map(records.map((record) => [record.id, record]))
        this.sequence = records.length
    }

    async page(request: RuntimePageRequest): Promise<PreviewSessionPageResult> {
        const pageNo = request.pageNo > 0 ? request.pageNo : 1
        const pageSize = request.pageSize > 0
            ? Math.min(request.pageSize, 200)
            : 20
        let records = [...this.records.values()].filter((record) =>
            (request.conditions || []).every((condition) =>
                matchesCondition(record, condition),
            ),
        )
        for (const sort of [...(request.sorts || [])].reverse()) {
            records = records.sort((left, right) => {
                const compared = comparable(firstFieldValue(left, sort.fieldCode))
                    .localeCompare(comparable(firstFieldValue(right, sort.fieldCode)))
                return sort.direction === 'DESC' ? -compared : compared
            })
        }
        const total = records.length
        const start = (pageNo - 1) * pageSize
        return {
            records: clone(records.slice(start, start + pageSize)),
            total,
        }
    }

    async detail(recordId: string): Promise<RuntimeRecord> {
        const record = this.records.get(recordId)
        if (!record) throw new Error('模拟记录不存在')
        return clone(record)
    }

    async save(payload: Record<string, unknown>): Promise<string> {
        const recordId = typeof payload.recordId === 'string'
            ? payload.recordId
            : undefined
        const dataDomains = payload.dataDomains as
            | AppFormRuntimeValue['dataDomains']
            | undefined
        if (!dataDomains) throw new Error('模拟记录数据域不能为空')
        if (recordId) {
            const current = this.records.get(recordId)
            if (!current) throw new Error('模拟记录不存在')
            this.records.set(recordId, {
                ...current,
                version: (current.version || 0) + 1,
                recordVersion: (current.recordVersion || 0) + 1,
                dataDomains: clone(dataDomains),
            })
            return recordId
        }

        this.sequence += 1
        const id = `PREVIEW_SESSION_${this.options.seed}_${this.sequence}`
        this.records.set(id, {
            id,
            recordCode: `PREVIEW-NEW-${this.sequence}`,
            version: 1,
            recordVersion: 1,
            formVersionId: this.schema.form?.versionId,
            formVersionNo: this.schema.form?.versionNo,
            dataDomains: clone(dataDomains),
            referenceLabels: {},
        })
        return id
    }

    async delete(recordId: string): Promise<void> {
        if (!this.records.delete(recordId)) throw new Error('模拟记录不存在')
    }
}
