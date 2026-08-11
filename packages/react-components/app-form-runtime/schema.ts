import type {
    AppFormDesignNode,
    AppFormRenderSchema,
    AppFormRuntimeDomain,
    AppFormRuntimeField,
    AppFormScene,
} from './types'

export interface AppFormSchemaIndex {
    schema: AppFormRenderSchema
    nodeById: Map<string, AppFormDesignNode>
    fieldById: Map<string, AppFormRuntimeField>
    domainByCode: Map<string, AppFormRuntimeDomain>
    domainById: Map<string, AppFormRuntimeDomain>
}

const sortByOrder = <T extends { sortNo?: number }>(items: T[] = []) =>
    [...items].sort((left, right) => (left.sortNo ?? 0) - (right.sortNo ?? 0))

const LAYOUT_ROLE_LIST_SEARCH = 'LIST_SEARCH'
const LAYOUT_ROLE_LIST_TABLE = 'LIST_TABLE'
const NODE_CODE_LIST_SEARCH_REGION = 'LIST_SEARCH_REGION'
const NODE_CODE_LIST_TABLE_REGION = 'LIST_TABLE_REGION'

export const readNodeConfig = (node?: AppFormDesignNode) => {
    const value = node?.nodeConfigJson
    if (!value) return {} as Record<string, unknown>
    if (typeof value === 'object' && !Array.isArray(value)) return value
    if (typeof value !== 'string') return {} as Record<string, unknown>
    try {
        const parsed: unknown = JSON.parse(value)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : {}
    } catch {
        return {}
    }
}

const text = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined

const textList = (value: unknown) =>
    Array.isArray(value)
        ? value.map(String).map((item) => item.trim()).filter(Boolean)
        : []

const nodeLayoutRole = (node?: AppFormDesignNode) => {
    const role = text(readNodeConfig(node).layoutRole)
    if (role) return role
    if (node?.nodeCode === NODE_CODE_LIST_SEARCH_REGION) return LAYOUT_ROLE_LIST_SEARCH
    if (node?.nodeCode === NODE_CODE_LIST_TABLE_REGION) return LAYOUT_ROLE_LIST_TABLE
    return text(node?.nodeCode)
}

export const getNodeDomainCode = (node?: AppFormDesignNode) => {
    const config = readNodeConfig(node)
    return text(config.dataDomainCode) || text(config.domainCode)
}

const sceneValues = (node: AppFormDesignNode) => {
    const config = readNodeConfig(node)
    const configured = [text(config.scene), ...textList(config.scenes)].filter(
        (value): value is string => Boolean(value),
    )
    return new Set(configured.map((value) => value.toUpperCase()))
}

export const getSceneRoots = (
    schema: AppFormRenderSchema,
    scene: AppFormScene,
) => {
    const roots = sortByOrder(schema.pageLayout?.designTree || [])
    return roots.filter((node) => {
        const scenes = sceneValues(node)
        return scenes.size === 0 || scenes.has(scene)
    })
}

const walkNodes = (
    nodes: AppFormDesignNode[],
    result: Map<string, AppFormDesignNode>,
) => {
    nodes.forEach((node) => {
        result.set(node.id, node)
        walkNodes(node.children || [], result)
    })
}

export const createSchemaIndex = (
    schema: AppFormRenderSchema,
): AppFormSchemaIndex => {
    const nodeById = new Map<string, AppFormDesignNode>()
    walkNodes(schema.pageLayout?.designTree || [], nodeById)
    const fieldById = new Map<string, AppFormRuntimeField>()
    const domainByCode = new Map<string, AppFormRuntimeDomain>()
    const domainById = new Map<string, AppFormRuntimeDomain>()
    ;(schema.dataDomains || []).forEach((domain) => {
        domainByCode.set(domain.domainCode, domain)
        if (domain.dataDomainId) domainById.set(domain.dataDomainId, domain)
        ;(domain.fields || []).forEach((field) => {
            if (field.fieldId) fieldById.set(field.fieldId, field)
            if (field.id) fieldById.set(field.id, field)
        })
    })
    return { schema, nodeById, fieldById, domainByCode, domainById }
}

export const getRegionDomain = (
    index: AppFormSchemaIndex,
    node?: AppFormDesignNode,
) => {
    const config = readNodeConfig(node)
    const domainCode = getNodeDomainCode(node)
    if (domainCode) return index.domainByCode.get(domainCode)
    const domainId = text(config.dataDomainId)
    return domainId ? index.domainById.get(domainId) : undefined
}

export const getRegionFields = (
    index: AppFormSchemaIndex,
    node?: AppFormDesignNode,
) => {
    if (!node) return []
    const domain = getRegionDomain(index, node)
    if (!domain) return []
    const domainFields = sortByOrder(domain.fields || [])
    const explicitFields = sortByOrder(
        (node.children || []).filter((child) => child.nodeType === 'FIELD'),
    )
        .map((child) => (child.fieldId ? index.fieldById.get(child.fieldId) : undefined))
        .filter((field): field is AppFormRuntimeField => Boolean(field))
    if (explicitFields.length) return explicitFields

    const configuredCodes = textList(readNodeConfig(node).fieldCodes)
    if (!configuredCodes.length) return domainFields
    const fieldByCode = new Map(domainFields.map((field) => [field.fieldCode, field]))
    return configuredCodes
        .map((code) => fieldByCode.get(code))
        .filter((field): field is AppFormRuntimeField => Boolean(field))
}

const enabled = (value: unknown) => value === true || value === 1 || value === '1'

export const getPrimaryObjectDomain = (schema: AppFormRenderSchema) =>
    (schema.dataDomains || []).find((domain) => domain.domainType === 'OBJECT')

const collectNodesByLayoutRole = (
    nodes: AppFormDesignNode[],
    layoutRole: string,
    result: AppFormDesignNode[],
) => {
    sortByOrder(nodes).forEach((node) => {
        if (nodeLayoutRole(node) === layoutRole) result.push(node)
        collectNodesByLayoutRole(node.children || [], layoutRole, result)
    })
}

const collectFieldNodes = (
    node: AppFormDesignNode,
    result: AppFormDesignNode[],
) => {
    sortByOrder(node.children || []).forEach((child) => {
        if (child.nodeType === 'FIELD') {
            result.push(child)
            return
        }
        collectFieldNodes(child, result)
    })
}

const getListLayoutFields = (
    schema: AppFormRenderSchema,
    layoutRole: string,
) => {
    const index = createSchemaIndex(schema)
    const layoutNodes: AppFormDesignNode[] = []
    collectNodesByLayoutRole(schema.pageLayout?.designTree || [], layoutRole, layoutNodes)

    const fieldNodes: AppFormDesignNode[] = []
    layoutNodes.forEach((node) => collectFieldNodes(node, fieldNodes))

    const seen = new Set<string>()
    return fieldNodes
        .map((node) => (node.fieldId ? index.fieldById.get(node.fieldId) : undefined))
        .filter((field): field is AppFormRuntimeField => {
            if (!field) return false
            const key = field.fieldId || field.id || field.fieldCode
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
}

export const getListFields = (schema: AppFormRenderSchema) => {
    const layoutFields = getListLayoutFields(schema, LAYOUT_ROLE_LIST_TABLE)
    if (layoutFields.length) return layoutFields

    const domain = getPrimaryObjectDomain(schema)
    return sortByOrder(
        (domain?.fields || []).filter((field) =>
            enabled(field.capabilities?.listVisible),
        ),
    )
}

export const getSearchFields = (schema: AppFormRenderSchema) => {
    const layoutFields = getListLayoutFields(schema, LAYOUT_ROLE_LIST_SEARCH)
    if (layoutFields.length) return layoutFields

    const domain = getPrimaryObjectDomain(schema)
    return sortByOrder(
        (domain?.fields || []).filter((field) =>
            enabled(field.capabilities?.searchable),
        ),
    )
}
