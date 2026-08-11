export const getFieldValue = (
    value: any | Record<string, unknown>[],
    separator: string = '/',
) => {
    if (Array.isArray(value)) {
        const filteredValue = value.filter((v) => v?.toString()?.trim())

        return filteredValue.join(separator) || '-'
    } else if (!value?.toString()?.trim()) {
        return '-'
    }

    return value
}

export const classGroup = (...args: any[]): string => {
    return args.join(' ')
}
