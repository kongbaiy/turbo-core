import type { AppFormRuntimeValue } from '../../app-form-runtime/types'

type ListOperation = 'add' | 'edit' | 'delete'
type LooseRecord = Record<string, unknown>

export const applyRuntimeListRow = (
    value: AppFormRuntimeValue,
    domainCode: string,
    operation: ListOperation,
    row?: LooseRecord,
    rowIndex?: number,
): AppFormRuntimeValue => {
    const domainValue = value.dataDomains[domainCode]
    const rows = Array.isArray(domainValue) ? [...domainValue] : []

    if (operation === 'add' && row) rows.push(row)
    if (operation === 'edit' && row && rowIndex !== undefined) {
        rows[rowIndex] = row
    }
    if (operation === 'delete' && rowIndex !== undefined) {
        rows.splice(rowIndex, 1)
    }

    return {
        ...value,
        dataDomains: {
            ...value.dataDomains,
            [domainCode]: rows,
        },
    }
}
