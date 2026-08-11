import type { AppFormDesignNode, AppFormRuntimeField } from './types'

export const enabled = (value: unknown) =>
    value === true || value === 1 || value === '1'

export const fieldLabel = (field: AppFormRuntimeField) =>
    field.uiLabel || field.fieldLabel || field.fieldName || field.fieldCode

export const nodeKey = (node: AppFormDesignNode, index = 0) =>
    node.id || node.nodeCode || `${node.nodeType}-${index}`

export const nodeTitle = (node: AppFormDesignNode, fallback: string) =>
    node.nodeName || node.nodeCode || fallback

export const sortNodes = (nodes: AppFormDesignNode[] = []) =>
    [...nodes].sort((left, right) => (left.sortNo ?? 0) - (right.sortNo ?? 0))

export const normalizeSpan = (value?: number) => {
    if (!value) return 6
    return Math.min(24, Math.max(6, value))
}
