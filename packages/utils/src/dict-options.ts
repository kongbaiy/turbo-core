export interface DictOption {
    dictCode: string
    itemCode: string
    itemName: string
    itemValue?: string
    colorTag?: string
    disabled?: boolean
    sortNo?: number
    children?: DictOption[]
}

export interface DictOptionsBatch {
    dictCodes: string[]
}

export interface DictSelectOption {
    label: string
    value: string
    disabled?: boolean
    children?: DictSelectOption[]
}

export interface DictValueEnumItem {
    text: string
    disabled?: boolean
}

export type DictOptionsMap = Record<string, DictOption[]>

export const toSelectOptions = (
    options?: DictOption[],
): DictSelectOption[] =>
    (options || []).map((item) => ({
        label: item.itemName,
        value: item.itemCode,
        disabled: item.disabled,
        children: item.children?.length
            ? toSelectOptions(item.children)
            : undefined,
    }))

export const toValueEnum = (
    options?: DictOption[],
): Record<string, DictValueEnumItem> =>
    (options || []).reduce<Record<string, DictValueEnumItem>>((result, item) => {
        result[item.itemCode] = {
            text: item.itemName,
            disabled: item.disabled,
        }
        return result
    }, {})

export const findDictOption = (
    options: DictOption[] | undefined,
    value?: string | number | boolean | null,
): DictOption | undefined => {
    if (value === undefined || value === null) return undefined

    const valueText = String(value)

    for (const item of options || []) {
        if (item.itemCode === valueText || item.itemValue === valueText) {
            return item
        }

        const matchedChild = findDictOption(item.children, valueText)
        if (matchedChild) return matchedChild
    }

    return undefined
}

export const getDictLabel = (
    options: DictOption[] | undefined,
    value?: string | number | boolean | null,
    fallback = '-',
) => findDictOption(options, value)?.itemName || fallback

export const getDictColor = (
    options: DictOption[] | undefined,
    value?: string | number | boolean | null,
    fallback = 'default',
) => findDictOption(options, value)?.colorTag || fallback
