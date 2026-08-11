import { Descriptions, Tabs, Tag } from 'antd'

import {
    orgNatureTextMap,
    orgStatusTextMap,
    splitTagValues,
} from '../data-transform'
import type { DepartmentManagementFeatures } from '../features'
import type {
    OrgUnitExtensionFieldRVO,
    OrgUnitMemberRVO,
    OrgUnitRVO,
} from '../types'
import styles from '../department-management-page.module.scss'
import { DepartmentMembers } from './department-members'

interface DepartmentDetailTabsProps {
    activeKey: string
    department?: OrgUnitRVO | null
    extensionFields: OrgUnitExtensionFieldRVO[]
    extensionNameMaps: Record<string, Record<string, string>>
    features: DepartmentManagementFeatures
    members: OrgUnitMemberRVO[]
    membersLoading: boolean
    getDictLabel: (
        dictCode: string,
        value?: string,
        fallback?: string,
    ) => string
    onChange: (key: string) => void
    onExportMembers: () => void
}

const EmptyDepartment = () => (
    <div className={styles['empty-tip']}>请选择左侧部门</div>
)

export const DepartmentDetailTabs = ({
    activeKey,
    department,
    extensionFields,
    extensionNameMaps,
    features,
    members,
    membersLoading,
    getDictLabel,
    onChange,
    onExportMembers,
}: DepartmentDetailTabsProps) => {
    const basicInfo = department ? (
        <>
            <Descriptions column={2} bordered size='small'>
                <Descriptions.Item label='部门名称'>
                    {department.orgName || '—'}
                </Descriptions.Item>
                <Descriptions.Item label='部门代码'>
                    {department.orgCode || '—'}
                </Descriptions.Item>
                <Descriptions.Item label='组织性质'>
                    {orgNatureTextMap[department.orgNature || ''] ||
                        department.orgNature ||
                        '—'}
                </Descriptions.Item>
                <Descriptions.Item label='部门级次'>
                    {getDictLabel(
                        'OrganizationLevel',
                        department.departmentLevel,
                        department.departmentLevel || '—',
                    )}
                </Descriptions.Item>
                <Descriptions.Item label='关联项目'>
                    {department.relatedProjectName || '—'}
                </Descriptions.Item>
                <Descriptions.Item label='单位标签'>
                    {splitTagValues(department.unitTag)
                        .map((value) =>
                            getDictLabel('ORG_UNIT_TAG', value, value),
                        )
                        .join('、') || '—'}
                </Descriptions.Item>
                <Descriptions.Item label='排序号'>
                    {department.sortNo ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label='状态'>
                    <Tag
                        color={
                            department.orgStatus === 'NORMAL'
                                ? 'success'
                                : 'default'
                        }
                    >
                        {orgStatusTextMap[department.orgStatus || ''] ||
                            department.orgStatus ||
                            '—'}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label='部门描述' span={2}>
                    {department.remark || '—'}
                </Descriptions.Item>
            </Descriptions>
            {extensionFields.length > 0 && (
                <div className={styles['extension-info']}>
                    <div className={styles['form-section-title']}>
                        部门扩展信息
                    </div>
                    <Descriptions column={2} bordered size='small'>
                        {extensionFields.map((field) => {
                            const value =
                                department.extensionValues?.[field.fieldCode]
                            const displayValue =
                                value == null || value === ''
                                    ? '—'
                                    : extensionNameMaps[field.fieldCode]?.[
                                          String(value)
                                      ] || String(value)
                            return (
                                <Descriptions.Item
                                    label={field.fieldLabel}
                                    key={field.fieldCode}
                                >
                                    {displayValue}
                                </Descriptions.Item>
                            )
                        })}
                    </Descriptions>
                </div>
            )}
        </>
    ) : (
        <EmptyDepartment />
    )

    const manageInfo = department ? (
        <Descriptions column={2} bordered size='small'>
            <Descriptions.Item label='部门负责人'>
                {department.departmentResponsibleName || '—'}
            </Descriptions.Item>
            <Descriptions.Item label='部门领导'>
                {department.departmentLeaderName || '—'}
            </Descriptions.Item>
            {(department.managementRoles || []).map((role) => (
                <Descriptions.Item label={role.roleName} key={role.roleId}>
                    {role.userName || '—'}
                </Descriptions.Item>
            ))}
        </Descriptions>
    ) : (
        <EmptyDepartment />
    )

    const items = [
        { key: 'basic', label: '基本信息', children: basicInfo },
        { key: 'manage', label: '管理信息', children: manageInfo },
        ...(features.members
            ? [
                  {
                      key: 'members',
                      label: '部门人员',
                      children: department ? (
                          <DepartmentMembers
                              members={members}
                              loading={membersLoading}
                              exportEnabled={features.memberExport}
                              onExport={onExportMembers}
                          />
                      ) : (
                          <EmptyDepartment />
                      ),
                  },
              ]
            : []),
    ]

    return <Tabs activeKey={activeKey} onChange={onChange} items={items} />
}
