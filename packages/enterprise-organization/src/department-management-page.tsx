import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    DeleteOutlined,
    EditOutlined,
    ExportOutlined,
    ImportOutlined,
    PlusOutlined,
    StopOutlined,
} from '@ant-design/icons'
import { App, Button, Popconfirm, Space, Upload } from 'antd'
import type { Key } from 'react'
import { useDictOptions } from '@repo/react-hooks'

import {
    deleteDepartment,
    disableDepartment,
    getDepartmentDetail,
    getDepartmentExtensionFieldOptions,
    getDepartmentExtensionFields,
    getDepartmentManagementRoleDefinitions,
    getDepartmentMembers,
    getDepartmentTree,
    saveDepartment,
} from './api'
import { DepartmentDetailTabs } from './components/department-detail-tabs'
import { DepartmentDrawer } from './components/department-drawer'
import { DepartmentTree } from './components/department-tree'
import {
    buildMemberCsv,
    findNode,
    toExtensionNameMap,
    toSaveValues,
    toTreeData,
} from './data-transform'
import {
    resolveDepartmentManagementFeatures,
    type DepartmentManagementPageProps,
} from './features'
import type { DepartmentDrawerState } from './model'
import type {
    OrgUnitExtensionFieldRVO,
    OrgUnitExtensionOptionRVO,
    OrgUnitManagementRoleRVO,
    OrgUnitMemberRVO,
    OrgUnitRVO,
    OrgUnitSaveQVO,
} from './types'
import styles from './department-management-page.module.scss'

export const DepartmentManagementPage = ({
    features: featureOverrides,
}: DepartmentManagementPageProps) => {
    const { message, modal } = App.useApp()
    const dict = useDictOptions(['OrganizationLevel', 'ORG_UNIT_TAG'])
    const features = useMemo(
        () => resolveDepartmentManagementFeatures(featureOverrides),
        [featureOverrides],
    )
    const [treeData, setTreeData] = useState<OrgUnitRVO[]>([])
    const [selectedKey, setSelectedKey] = useState<string>()
    const [selectedDetail, setSelectedDetail] = useState<OrgUnitRVO>()
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
    const [loading, setLoading] = useState(false)
    const [extensionLoading, setExtensionLoading] = useState(false)
    const [extensionFields, setExtensionFields] = useState<
        OrgUnitExtensionFieldRVO[]
    >([])
    const [extensionOptions, setExtensionOptions] = useState<
        Record<string, OrgUnitExtensionOptionRVO[]>
    >({})
    const [managementRoles, setManagementRoles] =
        useState<OrgUnitManagementRoleRVO[]>()
    const [drawer, setDrawer] = useState<DepartmentDrawerState>({
        open: false,
        mode: 'add',
    })
    const [submitting, setSubmitting] = useState(false)
    const [members, setMembers] = useState<OrgUnitMemberRVO[]>([])
    const [membersLoading, setMembersLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('basic')

    const enabledExtensionFields = useMemo(
        () =>
            extensionFields.filter(
                (field) => field.enabledFlag === 1 && field.visibleFlag !== 0,
            ),
        [extensionFields],
    )
    const extensionNameMaps = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(extensionOptions).map(([fieldCode, options]) => [
                    fieldCode,
                    toExtensionNameMap(options),
                ]),
            ),
        [extensionOptions],
    )
    const selectedDepartment = useMemo(
        () => selectedDetail || findNode(treeData, selectedKey),
        [selectedDetail, selectedKey, treeData],
    )

    const loadTree = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await getDepartmentTree()
            const items = data || []
            setTreeData(items)
            setExpandedKeys((current) => current)
            setSelectedKey((current) => current || items[0]?.id)
        } catch {
            // 全局请求拦截器负责展示错误。
        } finally {
            setLoading(false)
        }
    }, [])

    const loadExtensionFields = useCallback(async () => {
        setExtensionLoading(true)
        try {
            const { data } = await getDepartmentExtensionFields()
            const fields = data || []
            setExtensionFields(fields)
            const optionFields = fields.filter(
                (field) => field.enabledFlag === 1 && field.dataSourceType,
            )
            const results = await Promise.all(
                optionFields.map(async (field) => {
                    const response = await getDepartmentExtensionFieldOptions(
                        field.fieldCode,
                    )
                    return [field.fieldCode, response.data || []] as const
                }),
            )
            setExtensionOptions(Object.fromEntries(results))
        } catch {
            // 全局请求拦截器负责展示错误。
        } finally {
            setExtensionLoading(false)
        }
    }, [])

    const loadManagementRoles = useCallback(async () => {
        try {
            const { data } = await getDepartmentManagementRoleDefinitions()
            setManagementRoles(data || [])
        } catch {
            setManagementRoles(undefined)
        }
    }, [])

    const loadMembers = useCallback(async (orgId: string) => {
        setMembersLoading(true)
        try {
            const { data } = await getDepartmentMembers(orgId)
            setMembers(data || [])
        } catch {
            setMembers([])
        } finally {
            setMembersLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadTree()
        void loadExtensionFields()
        void loadManagementRoles()
    }, [loadExtensionFields, loadManagementRoles, loadTree])

    useEffect(() => {
        const treeNode = findNode(treeData, selectedKey)
        if (!selectedKey || treeNode?.virtualRootFlag === 1) {
            setSelectedDetail(treeNode || undefined)
            return
        }
        setSelectedDetail(undefined)
        getDepartmentDetail(selectedKey)
            .then(({ data }) => setSelectedDetail(data))
            .catch(() => setSelectedDetail(treeNode || undefined))
    }, [selectedKey, treeData])

    useEffect(() => {
        if (features.members && selectedKey && activeTab === 'members') {
            void loadMembers(selectedKey)
        }
    }, [activeTab, features.members, loadMembers, selectedKey])

    useEffect(() => {
        if (!features.members && activeTab === 'members') {
            setActiveTab('basic')
        }
    }, [activeTab, features.members])

    const openAddDrawer = (parentId?: string) => {
        setDrawer({
            open: true,
            mode: 'add',
            initialValues: {
                parentId,
                orgNature: 'DEPARTMENT',
                orgStatus: 'NORMAL',
                sortNo: 0,
            },
        })
    }

    const handleSave = async (data: OrgUnitSaveQVO) => {
        setSubmitting(true)
        try {
            await saveDepartment(data)
            message.success(drawer.mode === 'add' ? '新增成功' : '编辑成功')
            setDrawer({ open: false, mode: 'add' })
            await loadTree()
        } catch {
            // 全局请求拦截器负责展示错误。
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (record: OrgUnitRVO) => {
        try {
            await deleteDepartment(record.id)
            message.success('删除成功')
            if (selectedKey === record.id) setSelectedKey(record.parentId)
            await loadTree()
        } catch {
            // 全局请求拦截器负责展示错误。
        }
    }

    const handleDisable = async (record: OrgUnitRVO) => {
        try {
            await disableDepartment(record.id)
            message.success('停用成功')
            await loadTree()
        } catch {
            // 全局请求拦截器负责展示错误。
        }
    }

    const handleExportMembers = () => {
        if (!members.length) {
            message.warning('暂无人员数据可导出')
            return
        }
        const blob = new Blob([buildMemberCsv(members)], {
            type: 'text/csv;charset=utf-8',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${selectedDepartment?.orgName || '部门'}人员信息.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleImport = (file: File) => {
        modal.confirm({
            title: '导入部门',
            content: `确认导入文件 "${file.name}" 吗？`,
            onOk: async () => {
                message.info('导入功能接口待后端提供')
            },
        })
        return false
    }

    const isVirtualRoot = selectedDepartment?.virtualRootFlag === 1

    return (
        <div className={styles['department-manage']}>
            <DepartmentTree
                treeData={toTreeData(treeData)}
                selectedKey={selectedKey}
                expandedKeys={expandedKeys}
                loading={loading}
                onAdd={() => openAddDrawer(selectedDepartment?.id)}
                onExpand={setExpandedKeys}
                onSelect={setSelectedKey}
            />
            <main className={styles['content-panel']}>
                <div className={styles['content-header']}>
                    <Space>
                        {features.import && (
                            <Upload
                                beforeUpload={handleImport}
                                showUploadList={false}
                                accept='.xlsx,.xls,.csv'
                            >
                                <Button icon={<ImportOutlined />}>导入</Button>
                            </Upload>
                        )}
                        {features.export && (
                            <Button
                                icon={<ExportOutlined />}
                                onClick={() =>
                                    message.info('导出功能接口待后端提供')
                                }
                            >
                                导出
                            </Button>
                        )}
                        {selectedDepartment && !isVirtualRoot && (
                            <>
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() =>
                                        setDrawer({
                                            open: true,
                                            mode: 'edit',
                                            initialValues:
                                                toSaveValues(
                                                    selectedDepartment,
                                                ),
                                        })
                                    }
                                >
                                    编辑
                                </Button>
                                {selectedDepartment.orgStatus === 'NORMAL' && (
                                    <Popconfirm
                                        title='停用部门'
                                        description='确认要停用这个部门吗？存在启用子部门或有效成员任职时不允许停用。'
                                        okText='是'
                                        cancelText='否'
                                        onConfirm={() =>
                                            handleDisable(selectedDepartment)
                                        }
                                    >
                                        <Button icon={<StopOutlined />}>
                                            停用
                                        </Button>
                                    </Popconfirm>
                                )}
                                <Popconfirm
                                    title='删除部门'
                                    description='确认要删除这个部门吗？部门下有人员时不允许删除。'
                                    okText='是'
                                    cancelText='否'
                                    onConfirm={() =>
                                        handleDelete(selectedDepartment)
                                    }
                                >
                                    <Button danger icon={<DeleteOutlined />}>
                                        删除
                                    </Button>
                                </Popconfirm>
                            </>
                        )}
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={() =>
                                openAddDrawer(selectedDepartment?.id)
                            }
                        >
                            新建
                        </Button>
                    </Space>
                </div>
                <DepartmentDetailTabs
                    activeKey={activeTab}
                    department={selectedDepartment}
                    extensionFields={enabledExtensionFields}
                    extensionNameMaps={extensionNameMaps}
                    features={features}
                    members={members}
                    membersLoading={membersLoading}
                    getDictLabel={dict.getLabel}
                    onChange={setActiveTab}
                    onExportMembers={handleExportMembers}
                />
            </main>
            <DepartmentDrawer
                state={drawer}
                submitting={submitting}
                departmentLevelOptions={dict.toSelectOptions(
                    'OrganizationLevel',
                )}
                extensionFields={enabledExtensionFields}
                extensionOptions={extensionOptions}
                dictLoading={dict.loading}
                extensionLoading={extensionLoading}
                managementRoles={managementRoles}
                onCancel={() => setDrawer({ open: false, mode: 'add' })}
                onSubmit={handleSave}
            />
        </div>
    )
}
