import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

import type { AppFormFieldOption, AppFormRuntimeControlProps } from '../types'

export const emptyText = '-'

export const asText = (value: unknown) =>
    value === undefined || value === null ? '' : String(value)

export const displayValue = (value: unknown, label?: string) => {
    if (label) return label
    if (value === undefined || value === null || value === '') return emptyText
    if (Array.isArray(value)) return value.map(String).join('、') || emptyText
    if (typeof value === 'boolean') return value ? '是' : '否'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

export const optionValue = (value: unknown) =>
    typeof value === 'boolean' || typeof value === 'number'
        ? value
        : asText(value)

export const getOptions = (
    field: AppFormRuntimeControlProps['field'],
): AppFormFieldOption[] =>
    (field.options || []).map((item) => ({
        ...item,
        value: optionValue(item.value),
    }))

export const findOptionByValue = (
    options: AppFormFieldOption[],
    value: unknown,
) => {
    if (value === undefined || value === null || value === '') return undefined
    const valueText = String(value)
    return options.find((item) => String(item.value) === valueText)
}

export const asDate = (value: unknown) => {
    if (!value) return null
    const parsed = dayjs(value as string)
    return parsed.isValid() ? parsed : null
}

export const asDateRange = (value: unknown) => {
    if (!Array.isArray(value) || value.length !== 2) return null
    const start = asDate(value[0])
    const end = asDate(value[1])
    return start && end ? ([start, end] as [Dayjs, Dayjs]) : null
}

export const asTime = (value: unknown) => {
    if (!value) return null
    const text = asText(value)
    const parsed = dayjs(
        text.includes('T') || text.includes(' ') ? text : `2000-01-01 ${text}`,
    )
    return parsed.isValid() ? parsed : null
}

export const stringList = (value: unknown) => {
    if (Array.isArray(value)) return value.map(String).filter(Boolean)
    if (typeof value !== 'string') return []
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}
