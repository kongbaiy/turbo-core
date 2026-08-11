import type { SelectorPersonRecord } from '@repo/react-components'

import type { OrgUnitSaveQVO } from './types'

export type DrawerMode = 'add' | 'edit' | 'view'

export type PersonIdFieldName = 'departmentResponsibleId' | 'departmentLeaderId'

export interface DepartmentFormValues extends Omit<
    OrgUnitSaveQVO,
    PersonIdFieldName | 'unitTag' | 'managementRoles'
> {
    unitTag?: string[]
    departmentResponsibleId?: SelectorPersonRecord | null
    departmentLeaderId?: SelectorPersonRecord | null
    managementRoleUsers?: Record<
        string,
        SelectorPersonRecord | null | undefined
    >
}

export interface DepartmentDrawerState {
    open: boolean
    mode: DrawerMode
    initialValues?: Partial<DepartmentFormValues>
}

export interface SelectOption {
    label: string
    value: string
}
