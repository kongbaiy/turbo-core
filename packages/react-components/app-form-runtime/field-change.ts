import type {
    AppFormRuntimeFieldChange,
    AppFormRuntimeValue,
} from './types'

type LooseRecord = Record<string, unknown>

const isRecord = (value: unknown): value is LooseRecord =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const extractRuntimeFieldChanges = (
    changedValues: LooseRecord | undefined,
    runtimeValue: AppFormRuntimeValue,
): AppFormRuntimeFieldChange[] => {
    if (!isRecord(changedValues)) return []

    return Object.entries(changedValues).flatMap(([domainCode, domainValue]) => {
        if (!isRecord(domainValue)) return []

        return Object.entries(domainValue).map(([fieldCode, value]) => ({
            domainCode,
            fieldCode,
            value,
            dataDomains: runtimeValue.dataDomains,
            runtimeValue,
        }))
    })
}
