import type { DataNode } from 'antd/es/tree'
import type { SelectorPersonRecord } from '@repo/react-components'

import type {
    DepartmentDrawerState,
    DepartmentFormValues,
    PersonIdFieldName,
} from './model'
import type {
    OrgUnitExtensionOptionRVO,
    OrgUnitManagementRoleRVO,
    OrgUnitMemberRVO,
    OrgUnitRVO,
    OrgUnitSaveQVO,
} from './types'

export const orgNatureTextMap: Record<string, string> = {
    DEPARTMENT: '部门',
    PROJECT: '项目',
    VIRTUAL: '虚拟组织',
}

export const orgStatusTextMap: Record<string, string> = {
    NORMAL: '正常',
    DISABLED: '停用',
}

export const toExtensionNameMap = (items: OrgUnitExtensionOptionRVO[]) => {
    const result: Record<string, string> = {}
    const visit = (nodes: OrgUnitExtensionOptionRVO[]) => {
        nodes.forEach((item) => {
            result[item.value] = item.label
            visit(item.children || [])
        })
    }
    visit(items)
    return result
}

export const splitTagValues = (value?: string | string[]) => {
    if (Array.isArray(value)) return value
    return (value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

export const joinTagValues = (value?: string[]) => value?.join(',')

export const toPersonValue = (id?: string, name?: string) =>
    id || name
        ? {
              userId: id,
              userName: name || id,
          }
        : undefined

export const personIdOf = (person?: SelectorPersonRecord | null) =>
    person?.userId || person?.employeeId || person?.memberId || ''

export const createPersonPayload = (
    values: DepartmentFormValues,
): Pick<OrgUnitSaveQVO, PersonIdFieldName> => ({
    departmentResponsibleId: personIdOf(values.departmentResponsibleId),
    departmentLeaderId: personIdOf(values.departmentLeaderId),
})

export const toTreeData = (items: OrgUnitRVO[]): DataNode[] =>
    items.map((item) => ({
        key: item.id,
        title: item.orgName,
        children: item.children ? toTreeData(item.children) : [],
    }))

export const findNode = (
    items: OrgUnitRVO[],
    id?: string,
): OrgUnitRVO | null => {
    if (!id) return null
    for (const item of items) {
        if (item.id === id) return item
        const found = findNode(item.children || [], id)
        if (found) return found
    }
    return null
}

export const toSaveValues = (
    record: Partial<OrgUnitRVO>,
): Partial<DepartmentFormValues> => ({
    id: record.id,
    parentId: record.parentId,
    orgCode: record.orgCode,
    orgName: record.orgName,
    orgNature: record.orgNature,
    departmentLevel: record.departmentLevel,
    createSpaceFlag: record.createSpaceFlag,
    postName: record.postName,
    remark: record.remark,
    relatedProjectId: record.relatedProjectId,
    relatedProjectName: record.relatedProjectName,
    unitTag: splitTagValues(record.unitTag),
    departmentResponsibleId: toPersonValue(
        record.departmentResponsibleId,
        record.departmentResponsibleName,
    ),
    departmentLeaderId: toPersonValue(
        record.departmentLeaderId,
        record.departmentLeaderName,
    ),
    sortNo: record.sortNo,
    orgStatus: record.orgStatus,
    extensionValues: record.extensionValues || {},
    managementRoleUsers: Object.fromEntries(
        (record.managementRoles || []).map((role) => [
            role.roleId,
            toPersonValue(role.userId, role.userName),
        ]),
    ),
})

export const toSavePayload = (
    values: DepartmentFormValues,
    state: DepartmentDrawerState,
    managementRoles?: OrgUnitManagementRoleRVO[],
): OrgUnitSaveQVO => {
    const {
        departmentResponsibleId,
        departmentLeaderId,
        managementRoleUsers,
        unitTag,
        ...baseValues
    } = values

    return {
        ...baseValues,
        departmentResponsibleId: personIdOf(departmentResponsibleId),
        departmentLeaderId: personIdOf(departmentLeaderId),
        id: state.mode === 'edit' ? state.initialValues?.id : undefined,
        parentId: state.initialValues?.parentId,
        unitTag: joinTagValues(unitTag),
        ...(managementRoles
            ? {
                  managementRoles: managementRoles.map((role) => ({
                      roleId: role.roleId,
                      userId: personIdOf(managementRoleUsers?.[role.roleId]),
                  })),
              }
            : {}),
    }
}

export const buildMemberCsv = (members: OrgUnitMemberRVO[]) => {
    const header = '员工姓名,员工编号,岗位,手机号后缀,是否主任职,状态'
    const rows = members.map((member) =>
        [
            member.employeeName || '',
            member.employeeNo || '',
            member.postName || '',
            member.mobileSuffix || '',
            member.primaryFlag === 1 ? '是' : '否',
            member.memberStatus || '',
        ].join(','),
    )
    return `\uFEFF${[header, ...rows].join('\n')}`
}
