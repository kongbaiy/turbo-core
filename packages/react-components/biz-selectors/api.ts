import { api } from '@repo/utils'

import type {
    AreaCascaderValue,
    AreaRecord,
    SelectorDeptRecord,
    SelectorJobLevelRecord,
    SelectorPageParams,
    SelectorPageResult,
    SelectorPersonRecord,
    SelectorPostRecord,
    SelectorPositionRecord,
} from './types'

const baseUrl = '/api/admin/enterprise/basic/org/selectors'
const dutyBaseUrl = '/api/admin/enterprise/basic/personnel/duties'
const areaBaseUrl = '/api/admin/basic/areas'

export const getSelectorPersons = (params?: SelectorPageParams) =>
    api.get<SelectorPageResult<SelectorPersonRecord>>(`${baseUrl}/persons`, {
        params,
    })

export const getSelectorPosts = (
    params?: Pick<
        SelectorPageParams,
        'current' | 'pageSize' | 'keyword' | 'deptId'
    >,
) =>
    api.get<SelectorPageResult<SelectorPostRecord>>(`${baseUrl}/posts`, {
        params,
    })

export const getSelectorPost = (postId: string) =>
    api.get<SelectorPostRecord>(
        `${baseUrl}/posts/${encodeURIComponent(postId)}`,
    )

export const getSelectorPositions = (
    params?: Pick<SelectorPageParams, 'current' | 'pageSize' | 'keyword'>,
) =>
    api.get<SelectorPageResult<SelectorPositionRecord>>(dutyBaseUrl, {
        params,
    })

export const getSelectorPosition = (positionId: string) =>
    api.get<SelectorPositionRecord>(
        `${dutyBaseUrl}/${encodeURIComponent(positionId)}`,
    )

export const getSelectorJobLevels = (
    params?: Pick<SelectorPageParams, 'current' | 'pageSize' | 'keyword'>,
) =>
    api.get<SelectorPageResult<SelectorJobLevelRecord>>(`${baseUrl}/ranks`, {
        params,
    })

export const getSelectorJobLevel = (jobLevelId: string) =>
    api.get<SelectorJobLevelRecord>(
        `${baseUrl}/ranks/${encodeURIComponent(jobLevelId)}`,
    )

export const getSelectorDepartmentTree = (params?: Pick<SelectorPageParams, 'parentId'>) =>
    api.get<SelectorDeptRecord[]>(`${baseUrl}/departments/tree`, { params })

export const getSelectorDepartmentChildren = (
    params?: Pick<SelectorPageParams, 'parentId' | 'usePermission'>,
) =>
    api.get<SelectorDeptRecord[]>(`${baseUrl}/departments/children`, {
        params,
    })

export const getAreaTree = () =>
    api.get<AreaRecord[]>(`${areaBaseUrl}/tree`)

export const getAreaChildren = (params?: { parentCode?: string }) =>
    api.get<AreaRecord[]>(`${areaBaseUrl}/children`, { params })

export const getAreaNameChain = (params: { areaCode: string }) =>
    api.get<AreaCascaderValue>(`${areaBaseUrl}/name-chain`, { params })

export const getAreaNameChains = (data: { areaCodes: string[] }) =>
    api.post<AreaCascaderValue[]>(
        `${areaBaseUrl}/name-chains`,
        data,
    )
