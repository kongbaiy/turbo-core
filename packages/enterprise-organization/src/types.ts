export type OrgNature = 'DEPARTMENT' | 'PROJECT' | 'VIRTUAL'

export type OrgStatus = 'NORMAL' | 'DISABLED'

export interface OrgUnitRVO {
    id: string
    parentId?: string
    orgCode?: string
    orgName: string
    orgNature?: OrgNature
    orgAttribute?: string
    departmentLevel?: string
    createSpaceFlag?: number
    leaderId?: string
    leaderName?: string
    viceLeaderId?: string
    viceLeaderName?: string
    managerId?: string
    managerName?: string
    documentReceiverId?: string
    documentReceiverName?: string
    documentExchangeId?: string
    documentExchangeName?: string
    projectManagerId?: string
    projectManagerName?: string
    customerServiceManagerId?: string
    customerServiceManagerName?: string
    propertyOperationDirectorId?: string
    propertyOperationDirectorName?: string
    postName?: string
    remark?: string
    businessLine?: string
    businessFormat?: string
    businessFormatLevel?: string
    relatedProjectId?: string
    relatedProjectName?: string
    virtualOrgFlag?: number
    externalOrgFlag?: number
    budgetOrgFlag?: number
    accountingOrgFlag?: number
    unitTag?: string
    departmentResponsibleId?: string
    departmentResponsibleName?: string
    departmentLeaderId?: string
    departmentLeaderName?: string
    archiveManagerId?: string
    archiveManagerName?: string
    planManagerId?: string
    planManagerName?: string
    virtualRootFlag?: number
    sortNo?: number
    orgStatus?: OrgStatus
    extensionValues?: Record<string, unknown>
    managementRoles?: OrgUnitManagementRoleRVO[]
    children?: OrgUnitRVO[]
}

export interface OrgUnitManagementRoleRVO {
    roleId: string
    roleCode?: string
    roleName: string
    userId?: string
    userName?: string
    sortNo?: number
}

export interface OrgUnitManagementRoleAssignmentQVO {
    roleId: string
    userId?: string
}

export interface OrgUnitSaveQVO {
    id?: string
    parentId?: string
    orgCode?: string
    orgName: string
    orgNature?: OrgNature
    orgDimensionType?: string
    orgAttribute?: string
    departmentLevel?: string
    duplicateSortPolicy?: 'INSERT' | 'REPEAT'
    createSpaceFlag?: number
    leaderId?: string
    leaderName?: string
    viceLeaderId?: string
    viceLeaderName?: string
    managerId?: string
    managerName?: string
    documentReceiverId?: string
    documentReceiverName?: string
    documentExchangeId?: string
    documentExchangeName?: string
    projectManagerId?: string
    projectManagerName?: string
    customerServiceManagerId?: string
    customerServiceManagerName?: string
    propertyOperationDirectorId?: string
    propertyOperationDirectorName?: string
    postName?: string
    remark?: string
    businessLine?: string
    businessFormat?: string
    businessFormatLevel?: string
    relatedProjectId?: string
    relatedProjectName?: string
    virtualOrgFlag?: number
    externalOrgFlag?: number
    budgetOrgFlag?: number
    accountingOrgFlag?: number
    unitTag?: string
    departmentResponsibleId?: string
    departmentResponsibleName?: string
    departmentLeaderId?: string
    departmentLeaderName?: string
    archiveManagerId?: string
    archiveManagerName?: string
    planManagerId?: string
    planManagerName?: string
    sortNo?: number
    orgStatus?: OrgStatus
    extensionValues?: Record<string, unknown>
    managementRoles?: OrgUnitManagementRoleAssignmentQVO[]
}

export interface OrgUnitMoveQVO {
    parentId?: string
    sortNo?: number
}

export interface OrgUnitMemberRVO {
    memberId: string
    userId?: string
    employeeId?: string
    employeeName?: string
    employeeNo?: string
    mobileSuffix?: string
    postName?: string
    primaryFlag?: number
    memberStatus?: string
}

export interface OrgUnitExtensionFieldRVO {
    fieldId: string
    metadataFieldId?: string
    fieldCode: string
    fieldName?: string
    fieldLabel: string
    physicalColumnName: string
    dataType?: string
    uiComponent?: string
    valueType?: string
    controlType?: string
    dataSourceType?: string
    dataSourceCode?: string
    dataSourceName?: string
    requiredFlag?: number
    visibleFlag?: number
    readonlyFlag?: number
    enabledFlag?: number
    sortNo?: number
    storageMode?: 'PHYSICAL_TABLE' | 'EXTENSION_VALUE'
    customFlag?: number
}

export interface OrgUnitCustomPropertyCreateQVO {
    fieldLabel: string
    dataType: string
    uiComponent: string
    requiredFlag?: number
}

export interface OrgUnitCustomPropertyUpdateQVO {
    fieldLabel: string
    dataType: string
    uiComponent: string
    requiredFlag?: number
}

export interface OrgUnitPlatformFieldImportQVO {
    platformFieldId: string
    requiredFlag?: number
}

export interface OrgUnitExtensionOptionRVO {
    value: string
    label: string
    children?: OrgUnitExtensionOptionRVO[]
}

export interface OrgUnitExtensionFieldSettingsQVO {
    fields: Array<{
        fieldCode: string
        enabledFlag: number
        sortNo?: number
    }>
}
