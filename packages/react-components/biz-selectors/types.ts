import type { CascaderProps, SelectProps } from 'antd'

export interface SelectorPageParams {
    current?: number
    pageSize?: number
    keyword?: string
    deptId?: string
    orgId?: string
    companyId?: string
    parentId?: string
    usePermission?: boolean
    isNoPage?: boolean
    viewerMemberId?: string
    applyContactPermission?: boolean
}

export interface SelectorPageResult<T> {
    records?: T[]
    list?: T[]
    total?: number
}

export interface SelectorPersonDutyRecord {
    relationId?: string
    deptId?: string
    deptName?: string
    deptFullName?: string
    postId?: string
    postName?: string
    basePostName?: string
}

export interface SelectorPersonRecord {
    employeeId?: string
    userId?: string
    userBaseId?: string
    memberId?: string
    userName?: string
    employeeName?: string
    employeeNo?: string
    mobileSuffix?: string
    deptId?: string
    deptName?: string
    deptFullName?: string
    postId?: string
    postName?: string
    mainPostName?: string
    basePostName?: string
    mainDuty?: SelectorPersonDutyRecord
}

export interface SelectorDeptRecord {
    deptId?: string
    deptCode?: string
    deptName?: string
    parentId?: string
    companyId?: string
    companyName?: string
    orgNature?: string
    orgStatus?: string
    children?: SelectorDeptRecord[]
}

export interface SelectorPostRecord {
    postId?: string
    postCode?: string
    postName?: string
    deptId?: string
    deptName?: string
    postStatus?: string
}

export interface SelectorPositionRecord {
    id?: string
    positionId?: string
    positionCode?: string
    positionName?: string
    positionCategory?: string
    positionStatus?: string
    dutyCode?: string
    dutyName?: string
    dutyCategory?: string
    dutyStatus?: string
    postNames?: string[]
    dutyDesc?: string
}

export interface SelectorJobLevelRecord {
    jobLevelId?: string
    jobLevelCode?: string
    jobLevelName?: string
    jobLevelCategory?: string
    jobLevelStatus?: string
    rankLevelId?: string
    rankLevelCode?: string
    rankLevelName?: string
    rankLevelCategory?: string
    rankStatus?: string
}

export interface AreaRecord {
    areaCode?: string
    areaName?: string
    parentCode?: string
    levelNo?: number
    areaStatus?: string
    children?: AreaRecord[]
}

export interface AreaCascaderValue {
    areaCode?: string
    provinceCode?: string
    provinceName?: string
    cityCode?: string
    cityName?: string
    districtCode?: string
    districtName?: string
    names?: string[]
}

export type PeopleSelectorValue<Multiple extends boolean = boolean> =
    Multiple extends true ? SelectorPersonRecord[] : SelectorPersonRecord | null

export type DeptSelectorValue<Multiple extends boolean = boolean> =
    Multiple extends true ? SelectorDeptRecord[] : SelectorDeptRecord | null

export type PostSelectorValue<Multiple extends boolean = boolean> =
    Multiple extends true ? SelectorPostRecord[] : SelectorPostRecord | null

export type PositionSelectorValue<Multiple extends boolean = boolean> =
    Multiple extends true
        ? SelectorPositionRecord[]
        : SelectorPositionRecord | null

export type JobLevelSelectorValue<Multiple extends boolean = boolean> =
    Multiple extends true
        ? SelectorJobLevelRecord[]
        : SelectorJobLevelRecord | null

export interface PeopleSelectorProps<Multiple extends boolean = boolean> {
    value?: PeopleSelectorValue<Multiple>
    onChange?: (value: PeopleSelectorValue<Multiple>) => void
    multiple?: Multiple
    disabled?: boolean
    allowClear?: boolean
    placeholder?: string
    pageSize?: number
    selectProps?: Omit<
        SelectProps,
        'value' | 'onChange' | 'mode' | 'open' | 'options'
    >
}

export interface DeptSelectorProps<Multiple extends boolean = boolean> {
    value?: DeptSelectorValue<Multiple>
    onChange?: (value: DeptSelectorValue<Multiple>) => void
    multiple?: Multiple
    disabled?: boolean
    allowClear?: boolean
    placeholder?: string
    parentId?: string
    allowSelectParent?: boolean
    usePermission?: boolean
    selectProps?: Omit<
        SelectProps,
        'value' | 'onChange' | 'mode' | 'open' | 'options'
    >
}

export interface PostSelectorProps<Multiple extends boolean = boolean> {
    value?: PostSelectorValue<Multiple>
    onChange?: (value: PostSelectorValue<Multiple>) => void
    multiple?: Multiple
    disabled?: boolean
    allowClear?: boolean
    placeholder?: string
    pageSize?: number
    selectProps?: Omit<
        SelectProps,
        'value' | 'onChange' | 'mode' | 'open' | 'options'
    >
}

export interface PositionSelectorProps<Multiple extends boolean = boolean> {
    value?: PositionSelectorValue<Multiple>
    onChange?: (value: PositionSelectorValue<Multiple>) => void
    multiple?: Multiple
    disabled?: boolean
    allowClear?: boolean
    placeholder?: string
    pageSize?: number
    selectProps?: Omit<
        SelectProps,
        'value' | 'onChange' | 'mode' | 'open' | 'options'
    >
}

export interface JobLevelSelectorProps<Multiple extends boolean = boolean> {
    value?: JobLevelSelectorValue<Multiple>
    onChange?: (value: JobLevelSelectorValue<Multiple>) => void
    multiple?: Multiple
    disabled?: boolean
    allowClear?: boolean
    placeholder?: string
    pageSize?: number
    selectProps?: Omit<
        SelectProps,
        'value' | 'onChange' | 'mode' | 'open' | 'options'
    >
}

export interface AreaCascaderProps {
    value?: AreaCascaderValue | null
    onChange?: (value?: AreaCascaderValue) => void
    disabled?: boolean
    allowClear?: boolean
    placeholder?: string
    changeOnSelect?: boolean
    cascaderProps?: Pick<
        CascaderProps,
        | 'className'
        | 'size'
        | 'placement'
        | 'popupClassName'
        | 'disabled'
        | 'style'
    >
}
