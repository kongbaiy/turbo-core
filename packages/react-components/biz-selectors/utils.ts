import type { DataNode } from 'antd/es/tree'

import type {
    AreaCascaderValue,
    AreaRecord,
    SelectorDeptRecord,
    SelectorJobLevelRecord,
    SelectorPageResult,
    SelectorPersonRecord,
    SelectorPostRecord,
    SelectorPositionRecord,
} from './types'

export interface SelectorTreeNode extends DataNode {
    key: string
    title: string
    raw?: SelectorDeptRecord
    selectable?: boolean
    children?: SelectorTreeNode[]
}

export const personIdOf = (person?: SelectorPersonRecord | null) =>
    person?.memberId || person?.employeeId || person?.userId || ''

export const personNameOf = (person?: SelectorPersonRecord | null) =>
    person?.employeeName || person?.userName || '-'

const normalizePathName = (value?: string) => {
    const segments = String(value || '')
        .split('/')
        .map((item) => item.trim())
        .filter(Boolean)
    return segments
        .filter((item, index) => index === 0 || item !== segments[index - 1])
        .join('/')
}

const firstText = (...values: Array<string | undefined>) =>
    values.map((item) => item?.trim()).find(Boolean) || ''

export const personDeptNameOf = (person?: SelectorPersonRecord | null) =>
    firstText(
        normalizePathName(person?.deptFullName),
        normalizePathName(person?.mainDuty?.deptFullName),
        person?.deptName,
        person?.mainDuty?.deptName,
    )

export const personPostNameOf = (person?: SelectorPersonRecord | null) =>
    firstText(
        person?.postName,
        person?.mainPostName,
        person?.mainDuty?.postName,
        person?.basePostName,
        person?.mainDuty?.basePostName,
    )

export const postIdOf = (post?: SelectorPostRecord | null) =>
    post?.postId || ''

export const postNameOf = (post?: SelectorPostRecord | null) =>
    post?.postName || post?.postCode || '-'

export const positionIdOf = (position?: SelectorPositionRecord | null) =>
    position?.positionId || position?.id || ''

export const positionNameOf = (position?: SelectorPositionRecord | null) =>
    position?.positionName ||
    position?.dutyName ||
    position?.positionCode ||
    position?.dutyCode ||
    '-'

export const positionCodeOf = (position?: SelectorPositionRecord | null) =>
    position?.positionCode || position?.dutyCode || ''

export const jobLevelIdOf = (jobLevel?: SelectorJobLevelRecord | null) =>
    jobLevel?.jobLevelId || jobLevel?.rankLevelId || ''

export const jobLevelNameOf = (jobLevel?: SelectorJobLevelRecord | null) =>
    jobLevel?.jobLevelName ||
    jobLevel?.rankLevelName ||
    jobLevel?.jobLevelCode ||
    jobLevel?.rankLevelCode ||
    '-'

export const jobLevelCodeOf = (jobLevel?: SelectorJobLevelRecord | null) =>
    jobLevel?.jobLevelCode || jobLevel?.rankLevelCode || ''

export const deptIdOf = (dept?: SelectorDeptRecord | null) =>
    dept?.deptId || ''

export const deptNameOf = (dept?: SelectorDeptRecord | null) =>
    dept?.deptName || '-'

export const normalizeSelectorDeptId = (deptId?: string) => {
    const value = deptId?.trim()
    if (!value || value === 'undefined' || value === 'null') return undefined
    return value
}

export const getPageRecords = <T,>(data?: SelectorPageResult<T> | T[]) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.records)) return data.records
    if (Array.isArray(data?.list)) return data.list
    return []
}

export const getPageTotal = <T,>(
    data: SelectorPageResult<T> | T[] | undefined,
    fallback: number,
) => {
    if (Array.isArray(data)) return fallback
    return Number(data?.total ?? fallback)
}

export const uniqPeople = (items: SelectorPersonRecord[]) => {
    const map = new Map<string, SelectorPersonRecord>()
    for (const item of items) {
        const id = personIdOf(item)
        if (id && !map.has(id)) {
            map.set(id, item)
        }
    }
    return Array.from(map.values())
}

export const uniqDepts = (items: SelectorDeptRecord[]) => {
    const map = new Map<string, SelectorDeptRecord>()
    for (const item of items) {
        const id = deptIdOf(item)
        if (id && !map.has(id)) {
            map.set(id, item)
        }
    }
    return Array.from(map.values())
}

export const uniqPosts = (items: SelectorPostRecord[]) => {
    const map = new Map<string, SelectorPostRecord>()
    for (const item of items) {
        const id = postIdOf(item)
        if (id && !map.has(id)) {
            map.set(id, item)
        }
    }
    return Array.from(map.values())
}

export const uniqPositions = (items: SelectorPositionRecord[]) => {
    const map = new Map<string, SelectorPositionRecord>()
    for (const item of items) {
        const id = positionIdOf(item)
        if (id && !map.has(id)) {
            map.set(id, item)
        }
    }
    return Array.from(map.values())
}

export const uniqJobLevels = (items: SelectorJobLevelRecord[]) => {
    const map = new Map<string, SelectorJobLevelRecord>()
    for (const item of items) {
        const id = jobLevelIdOf(item)
        if (id && !map.has(id)) {
            map.set(id, item)
        }
    }
    return Array.from(map.values())
}

export const toDeptTreeData = (
    items: SelectorDeptRecord[],
    options?: { allowSelectParent?: boolean },
): SelectorTreeNode[] =>
    items.map((item) => {
        const children = item.children?.length
            ? toDeptTreeData(item.children, options)
            : undefined
        const hasChildren = Boolean(children?.length)

        return {
            key: deptIdOf(item),
            title: deptNameOf(item),
            raw: item,
            selectable: options?.allowSelectParent === false ? !hasChildren : true,
            children,
        }
    })

export const flattenDeptTree = (items: SelectorTreeNode[]) => {
    const result: SelectorTreeNode[] = []
    const walk = (nodes: SelectorTreeNode[]) => {
        for (const node of nodes) {
            result.push(node)
            if (node.children?.length) {
                walk(node.children)
            }
        }
    }
    walk(items)
    return result
}

export const firstSelectableDeptKey = (items: SelectorTreeNode[]) =>
    flattenDeptTree(items).find(
        (item) => item.key && item.selectable !== false,
    )?.key

export interface AreaCascaderOption {
    label: string
    value: string
    raw: AreaRecord
    isLeaf?: boolean
    children?: AreaCascaderOption[]
}

export const toAreaCascaderOptions = (
    items?: AreaRecord[],
): AreaCascaderOption[] =>
    (items || [])
        .filter((item) => item.areaStatus === 'ENABLED')
        .map((item) => {
            const children = toAreaCascaderOptions(item.children)

            return {
                label: item.areaName || item.areaCode || '-',
                value: item.areaCode || '',
                raw: item,
                isLeaf: item.levelNo === 3,
                children: children.length ? children : undefined,
            }
        })
        .filter((item) => Boolean(item.value))

export const areaValueToPath = (value?: AreaCascaderValue | null) =>
    [
        value?.provinceCode,
        value?.cityCode,
        value?.districtCode,
    ].filter(Boolean) as string[]

export const areaPathToValue = (
    selectedOptions?: AreaCascaderOption[],
): AreaCascaderValue | undefined => {
    const [province, city, district] = selectedOptions || []

    if (!province || !city || !district) return undefined

    return {
        provinceCode: province.raw.areaCode,
        provinceName: province.raw.areaName,
        cityCode: city.raw.areaCode,
        cityName: city.raw.areaName,
        districtCode: district.raw.areaCode,
        districtName: district.raw.areaName,
    }
}
