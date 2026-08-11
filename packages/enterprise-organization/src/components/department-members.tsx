import { ExportOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { Button, Tag } from 'antd'
import { usePaginationConfig } from '@repo/pro-components'

import type { OrgUnitMemberRVO } from '../types'
import styles from '../department-management-page.module.scss'

interface DepartmentMembersProps {
    members: OrgUnitMemberRVO[]
    loading: boolean
    exportEnabled: boolean
    onExport: () => void
}

const memberColumns: ProColumns<OrgUnitMemberRVO>[] = [
    { title: '员工姓名', dataIndex: 'employeeName', width: 120 },
    { title: '员工编号', dataIndex: 'employeeNo', width: 120 },
    { title: '岗位', dataIndex: 'postName', width: 150, ellipsis: true },
    { title: '手机号后缀', dataIndex: 'mobileSuffix', width: 120 },
    {
        title: '是否主任职',
        dataIndex: 'primaryFlag',
        width: 100,
        render: (_, record) =>
            record.primaryFlag === 1 ? (
                <Tag color='blue'>是</Tag>
            ) : (
                <Tag>否</Tag>
            ),
    },
    { title: '状态', dataIndex: 'memberStatus', width: 100 },
]

export const DepartmentMembers = ({
    members,
    loading,
    exportEnabled,
    onExport,
}: DepartmentMembersProps) => {
    const paginationConfig = usePaginationConfig()

    return (
        <div>
            {exportEnabled && (
                <div className={styles['members-toolbar']}>
                    <Button
                        icon={<ExportOutlined />}
                        onClick={onExport}
                        disabled={!members.length}
                    >
                        导出人员信息
                    </Button>
                </div>
            )}
            <ProTable<OrgUnitMemberRVO>
                rowKey='memberId'
                search={false}
                columns={memberColumns}
                dataSource={members}
                loading={loading}
                options={false}
                scroll={{ x: 700 }}
                pagination={paginationConfig}
                size='small'
            />
        </div>
    )
}
