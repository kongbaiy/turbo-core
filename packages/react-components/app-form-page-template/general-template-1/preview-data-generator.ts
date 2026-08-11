import type {
    AppFormRenderSchema,
    AppFormRuntimeField,
} from '../../app-form-runtime/types'
import type { RuntimeRecord } from './runtime-data-adapter'

export interface PreviewDataGeneratorOptions {
    seed?: number
    count?: number
}

const createRandom = (seed: number) => {
    let state = seed >>> 0
    return () => {
        state += 0x6d2b79f5
        let value = state
        value = Math.imul(value ^ (value >>> 15), value | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296
    }
}

const padded = (value: number) => String(value).padStart(2, '0')

const previewDate = (offset: number) => {
    const day = (offset % 28) + 1
    const month = (Math.floor(offset / 28) % 12) + 1
    return `2026-${padded(month)}-${padded(day)}`
}

const isReferenceField = (field: AppFormRuntimeField) =>
    field.referenceFlag === true

const fieldValue = (
    field: AppFormRuntimeField,
    recordIndex: number,
    rowIndex: number,
    random: () => number,
) => {
    if (isReferenceField(field)) {
        return String(field.controlProps?.mode || '').toLowerCase() === 'multiple'
            ? []
            : undefined
    }

    const controlType = (field.controlType || '').toUpperCase()
    const valueType = (field.valueType || '').toUpperCase()
    const sequence = recordIndex * 3 + rowIndex + Math.floor(random() * 17)
    if (controlType.includes('DATE_RANGE')) {
        return [previewDate(sequence), previewDate(sequence + 5)]
    }
    if (controlType.includes('DATETIME') || valueType.includes('DATETIME')) {
        return `${previewDate(sequence)} ${padded(8 + (sequence % 10))}:30:00`
    }
    if (controlType.includes('DATE') || valueType === 'DATE') {
        return previewDate(sequence)
    }
    if (
        controlType.includes('SWITCH') ||
        controlType.includes('CHECKBOX') ||
        valueType === 'BOOLEAN'
    ) {
        return sequence % 2 === 0
    }
    if (
        controlType.includes('UPLOAD') ||
        controlType.includes('FILE') ||
        valueType === 'FILE'
    ) {
        return [
            {
                fileId: `PREVIEW_FILE_${recordIndex + 1}_${rowIndex + 1}`,
                fileName: `${field.fieldLabel || field.fieldCode}-${recordIndex + 1}.pdf`,
                contentType: 'application/pdf',
                size: 1024 + sequence * 10,
                preview: true,
            },
        ]
    }
    if (valueType === 'INTEGER' || controlType.includes('NUMBER')) {
        return 10 + sequence
    }
    if (
        valueType === 'FLOAT' ||
        valueType === 'DECIMAL' ||
        controlType.includes('DECIMAL') ||
        controlType.includes('MONEY') ||
        controlType.includes('AMOUNT')
    ) {
        return Number((100 + sequence * 37.25).toFixed(2))
    }
    if (valueType === 'JSON') {
        return { preview: true, sequence: recordIndex + 1 }
    }
    return `${field.fieldLabel || field.fieldName || field.fieldCode}${recordIndex + 1}-${rowIndex + 1}`
}

const domainRow = (
    fields: AppFormRuntimeField[],
    recordIndex: number,
    rowIndex: number,
    random: () => number,
) => Object.fromEntries(
    fields.map((field) => [
        field.fieldCode,
        fieldValue(field, recordIndex, rowIndex, random),
    ]),
)

export const generatePreviewRecords = (
    schema: AppFormRenderSchema,
    options: PreviewDataGeneratorOptions = {},
): RuntimeRecord[] => {
    const seed = options.seed ?? 20260802
    const count = Math.max(0, options.count ?? 18)
    const random = createRandom(seed)
    return Array.from({ length: count }, (_, recordIndex) => {
        const dataDomains = Object.fromEntries(
            (schema.dataDomains || []).map((domain) => {
                const fields = domain.fields || []
                if (domain.domainType === 'LIST') {
                    const rowCount = 1 + Math.floor(random() * 3)
                    return [
                        domain.domainCode,
                        Array.from({ length: rowCount }, (_, rowIndex) => ({
                            rowKey: `PREVIEW_ROW_${recordIndex + 1}_${rowIndex + 1}`,
                            ...domainRow(fields, recordIndex, rowIndex, random),
                        })),
                    ]
                }
                return [
                    domain.domainCode,
                    domainRow(fields, recordIndex, 0, random),
                ]
            }),
        )
        return {
            id: `PREVIEW_${seed}_${recordIndex + 1}`,
            recordCode: `PREVIEW-${seed}-${padded(recordIndex + 1)}`,
            version: 1,
            recordVersion: 1,
            formVersionId: schema.form?.versionId,
            formVersionNo: schema.form?.versionNo,
            dataDomains,
            referenceLabels: {},
        }
    })
}
