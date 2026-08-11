import { api } from '@repo/utils'

import type {
    OrgUnitCustomPropertyCreateQVO,
    OrgUnitCustomPropertyUpdateQVO,
    OrgUnitExtensionFieldRVO,
    OrgUnitExtensionFieldSettingsQVO,
    OrgUnitExtensionOptionRVO,
    OrgUnitManagementRoleRVO,
    OrgUnitMemberRVO,
    OrgUnitMoveQVO,
    OrgUnitPlatformFieldImportQVO,
    OrgUnitRVO,
    OrgUnitSaveQVO,
} from './types'

export const getDepartmentTree = () =>
    api.get<OrgUnitRVO[]>('/api/admin/enterprise/basic/org/units/tree')

export const getDepartmentDetail = (orgId: string) =>
    api.get<OrgUnitRVO>(`/api/admin/enterprise/basic/org/units/${orgId}`)

export const saveDepartment = (data: OrgUnitSaveQVO) =>
    api.post<string>('/api/admin/enterprise/basic/org/units', data)

export const moveDepartment = (orgId: string, data: OrgUnitMoveQVO) =>
    api.post(`/api/admin/enterprise/basic/org/units/${orgId}/move`, data)

export const disableDepartment = (orgId: string) =>
    api.post(`/api/admin/enterprise/basic/org/units/${orgId}/disable`)

export const deleteDepartment = (orgId: string) =>
    api.delete(`/api/admin/enterprise/basic/org/units/${orgId}`)

export const getDepartmentMembers = (orgId: string) =>
    api.get<OrgUnitMemberRVO[]>(
        `/api/admin/enterprise/basic/org/units/${orgId}/members`,
    )

export const getDepartmentExtensionFields = () =>
    api.get<OrgUnitExtensionFieldRVO[]>(
        '/api/admin/enterprise/basic/org/units/extension-fields',
    )

export const createDepartmentCustomProperty = (
    data: OrgUnitCustomPropertyCreateQVO,
) =>
    api.post<OrgUnitExtensionFieldRVO>(
        '/api/admin/enterprise/basic/org/units/extension-fields/custom',
        data,
    )

export const importDepartmentPlatformField = (
    data: OrgUnitPlatformFieldImportQVO,
) =>
    api.post<OrgUnitExtensionFieldRVO>(
        '/api/admin/enterprise/basic/org/units/extension-fields/platform',
        data,
    )

export const updateDepartmentCustomProperty = (
    fieldCode: string,
    data: OrgUnitCustomPropertyUpdateQVO,
) =>
    api.put<OrgUnitExtensionFieldRVO>(
        `/api/admin/enterprise/basic/org/units/extension-fields/custom/${fieldCode}`,
        data,
    )

export const deleteDepartmentCustomProperty = (fieldCode: string) =>
    api.delete(
        `/api/admin/enterprise/basic/org/units/extension-fields/custom/${fieldCode}`,
    )

export const saveDepartmentExtensionFields = (
    data: OrgUnitExtensionFieldSettingsQVO,
) => api.put('/api/admin/enterprise/basic/org/units/extension-fields', data)

export const getDepartmentExtensionFieldOptions = (fieldCode: string) =>
    api.get<OrgUnitExtensionOptionRVO[]>(
        `/api/admin/enterprise/basic/org/units/extension-fields/${fieldCode}/options`,
    )

export const getDepartmentManagementRoleDefinitions = () =>
    api.get<OrgUnitManagementRoleRVO[]>(
        '/api/admin/enterprise/basic/org/units/management-role-definitions',
    )
