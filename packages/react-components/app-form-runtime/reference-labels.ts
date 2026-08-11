type LooseRecord = Record<string, unknown>

export const mergeReferenceLabel = (
    referenceLabels: Record<string, unknown>,
    domainCode: string,
    fieldCode: string,
    label?: string,
    metadata?: Record<string, unknown>,
) => ({
    ...referenceLabels,
    [domainCode]: {
        ...((referenceLabels[domainCode] &&
        typeof referenceLabels[domainCode] === 'object'
            ? referenceLabels[domainCode]
            : {}) as Record<string, unknown>),
        [fieldCode]: label,
        ...(metadata ? { [`${fieldCode}Meta`]: metadata } : {}),
    },
    [`${domainCode}.${fieldCode}`]: label,
    [fieldCode]: label,
    ...(metadata
        ? {
              [`${domainCode}.${fieldCode}Meta`]: metadata,
              [`${fieldCode}Meta`]: metadata,
          }
        : {}),
})

export const getReferenceLabel = (
    referenceLabels: Record<string, unknown> | undefined,
    domainCode: string,
    fieldCode: string,
) => {
    const labels = referenceLabels || {}
    const domainLabels = labels[domainCode]
    if (domainLabels && typeof domainLabels === 'object') {
        const label = (domainLabels as LooseRecord)[fieldCode]
        if (label !== undefined) return String(label)
    }
    const direct = labels[`${domainCode}.${fieldCode}`] ?? labels[fieldCode]
    return direct === undefined ? undefined : String(direct)
}

export const getReferenceMetadata = (
    referenceLabels: Record<string, unknown> | undefined,
    domainCode: string,
    fieldCode: string,
) => {
    const labels = referenceLabels || {}
    const domainLabels = labels[domainCode]
    if (domainLabels && typeof domainLabels === 'object') {
        const metadata = (domainLabels as LooseRecord)[`${fieldCode}Meta`]
        if (metadata && typeof metadata === 'object') {
            return metadata as Record<string, unknown>
        }
    }
    const direct =
        labels[`${domainCode}.${fieldCode}Meta`] ?? labels[`${fieldCode}Meta`]
    return direct && typeof direct === 'object'
        ? (direct as Record<string, unknown>)
        : undefined
}
