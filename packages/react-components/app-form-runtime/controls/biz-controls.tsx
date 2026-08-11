import { Input, Space } from 'antd'

import AreaCascader from '../../biz-selectors/area-cascader'
import DeptSelector from '../../biz-selectors/dept-selector'
import JobLevelSelector from '../../biz-selectors/job-level-selector'
import PeopleSelector from '../../biz-selectors/people-selector'
import PositionSelector from '../../biz-selectors/position-selector'
import PostSelector from '../../biz-selectors/post-selector'
import type {
    AreaCascaderValue,
    SelectorDeptRecord,
    SelectorJobLevelRecord,
    SelectorPersonRecord,
    SelectorPositionRecord,
    SelectorPostRecord,
} from '../../biz-selectors/types'
import type { AppFormRuntimeControlProps } from '../types'
import { asText } from './shared'

export const isBizControl = (controlType: string) =>
    [
        'ORG_USER_SELECT',
        'EMPLOYEE_NO_SELECT',
        'ORG_DEPT_SELECT',
        'ORG_POST_SELECT',
        'ORG_POSITION_SELECT',
        'ORG_JOB_LEVEL_SELECT',
        'AREA_CASCADER',
    ].includes(controlType)

export interface BizControlProps {
    field: AppFormRuntimeControlProps['field']
    value?: unknown
    disabled: boolean
    controlType: string
    referenceLabel?: string
    onChange?: AppFormRuntimeControlProps['onChange']
}

const personValue = (
    value: unknown,
    label?: string,
): SelectorPersonRecord | null =>
    value ? { userId: asText(value), userName: label || asText(value) } : null

const deptValue = (
    value: unknown,
    label?: string,
): SelectorDeptRecord | null =>
    value ? { deptId: asText(value), deptName: label || '' } : null

const postValue = (
    value: unknown,
    label?: string,
): SelectorPostRecord | null =>
    value ? { postId: asText(value), postName: label || '' } : null

const positionValue = (
    value: unknown,
    label?: string,
): SelectorPositionRecord | null =>
    value ? { positionId: asText(value), positionName: label || '' } : null

const jobLevelValue = (
    value: unknown,
    label?: string,
): SelectorJobLevelRecord | null =>
    value ? { jobLevelId: asText(value), jobLevelName: label || '' } : null

const personNameOf = (person?: SelectorPersonRecord | null) =>
    person?.employeeName || person?.userName || ''

const personDeptNameOf = (person?: SelectorPersonRecord | null) =>
    person?.deptName || person?.mainDuty?.deptName || ''

const personPostNameOf = (person?: SelectorPersonRecord | null) =>
    person?.postName ||
    person?.mainPostName ||
    person?.mainDuty?.postName ||
    person?.basePostName ||
    person?.mainDuty?.basePostName ||
    ''

const employeeNoOf = (person?: SelectorPersonRecord | null) =>
    person?.employeeNo || person?.userId || person?.employeeId || ''

const employeeMetadataOf = (person: SelectorPersonRecord) => ({
    employeeId: person.employeeId || person.userId || person.memberId,
    employeeNo: employeeNoOf(person),
    employeeName: personNameOf(person),
    departmentId: person.deptId || person.mainDuty?.deptId,
    departmentName: personDeptNameOf(person),
    postId: person.postId || person.mainDuty?.postId,
    postName: personPostNameOf(person),
})

const propText = (
    props: Record<string, unknown> | undefined,
    key: string,
    fallback: string,
) => (typeof props?.[key] === 'string' ? props[key] : fallback) as string

const valueFrom = (
    record: object | null | undefined,
    valueField: string,
    fallback?: unknown,
) => {
    const value = (record as Record<string, unknown> | null | undefined)?.[
        valueField
    ]
    return value === undefined ? fallback : value
}

const BizControl = ({
    field,
    value,
    disabled,
    controlType,
    referenceLabel,
    onChange,
}: BizControlProps) => {
    const valueField = propText(field.controlProps, 'valueField', '')
    const labelField = propText(field.controlProps, 'labelField', '')

    if (controlType === 'ORG_USER_SELECT') {
        return (
            <PeopleSelector
                multiple={false}
                disabled={disabled}
                value={personValue(value, referenceLabel)}
                onChange={(person) => {
                    const label = person?.userName || person?.employeeName
                    onChange?.(
                        valueFrom(
                            person,
                            valueField || 'userId',
                            valueField ? label : person?.userId,
                        ),
                        labelField
                            ? String(valueFrom(person, labelField, label) || '')
                            : label,
                        person
                            ? {
                                  ...(person as Record<string, unknown>),
                                  label,
                              }
                            : undefined,
                    )
                }}
            />
        )
    }

    if (controlType === 'EMPLOYEE_NO_SELECT') {
        return (
            <Space.Compact style={{ width: '100%' }}>
                <Input
                    disabled={disabled}
                    value={asText(value)}
                    onChange={(event) => onChange?.(event.target.value)}
                    placeholder='请输入工号'
                />
                <PeopleSelector
                    multiple={false}
                    disabled={disabled}
                    allowClear={false}
                    placeholder='选择员工'
                    value={null}
                    onChange={(person) => {
                        const employeeNo = employeeNoOf(person)
                        if (!person || !employeeNo) {
                            onChange?.(undefined)
                            return
                        }
                        onChange?.(
                            employeeNo,
                            personNameOf(person),
                            employeeMetadataOf(person),
                        )
                    }}
                    selectProps={{
                        style: { width: 112 },
                    }}
                />
            </Space.Compact>
        )
    }

    if (controlType === 'ORG_DEPT_SELECT') {
        return (
            <DeptSelector
                multiple={false}
                disabled={disabled}
                value={deptValue(value, referenceLabel)}
                onChange={(dept) =>
                    onChange?.(
                        valueFrom(
                            dept,
                            valueField || 'deptId',
                            valueField ? dept?.deptName : dept?.deptId,
                        ),
                        labelField
                            ? String(
                                  valueFrom(dept, labelField, dept?.deptName) ||
                                      '',
                              )
                            : dept?.deptName,
                        dept
                            ? {
                                  ...(dept as Record<string, unknown>),
                                  label: dept.deptName,
                              }
                            : undefined,
                    )
                }
            />
        )
    }

    if (controlType === 'ORG_POST_SELECT') {
        return (
            <PostSelector
                multiple={false}
                disabled={disabled}
                value={postValue(value, referenceLabel)}
                onChange={(post) =>
                    onChange?.(
                        valueFrom(
                            post,
                            valueField || 'postId',
                            valueField ? post?.postName : post?.postId,
                        ),
                        labelField
                            ? String(
                                  valueFrom(post, labelField, post?.postName) ||
                                      '',
                              )
                            : post?.postName,
                        post
                            ? {
                                  ...(post as Record<string, unknown>),
                                  label: post.postName,
                              }
                            : undefined,
                    )
                }
            />
        )
    }

    if (controlType === 'ORG_POSITION_SELECT') {
        return (
            <PositionSelector
                multiple={false}
                disabled={disabled}
                value={positionValue(value, referenceLabel)}
                onChange={(position) => {
                    const label = position?.positionName || position?.dutyName
                    onChange?.(
                        valueFrom(
                            position,
                            valueField || 'positionId',
                            valueField
                                ? label
                                : position?.positionId || position?.id,
                        ),
                        labelField
                            ? String(
                                  valueFrom(position, labelField, label) || '',
                              )
                            : label,
                    )
                }}
            />
        )
    }

    if (controlType === 'ORG_JOB_LEVEL_SELECT') {
        return (
            <JobLevelSelector
                multiple={false}
                disabled={disabled}
                value={jobLevelValue(value, referenceLabel)}
                onChange={(jobLevel) => {
                    const label =
                        jobLevel?.jobLevelName || jobLevel?.rankLevelName
                    onChange?.(
                        valueFrom(
                            jobLevel,
                            valueField || 'jobLevelId',
                            valueField
                                ? label
                                : jobLevel?.jobLevelId || jobLevel?.rankLevelId,
                        ),
                        labelField
                            ? String(
                                  valueFrom(jobLevel, labelField, label) || '',
                              )
                            : label,
                    )
                }}
            />
        )
    }

    if (controlType === 'AREA_CASCADER') {
        return (
            <AreaCascader
                disabled={disabled}
                value={(value as AreaCascaderValue | null) || null}
                onChange={(area) => onChange?.(area, area?.names?.join('/'))}
            />
        )
    }

    return null
}

export default BizControl
