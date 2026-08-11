import { useEffect } from 'react'
import { Button, Drawer, Space } from 'antd'
import {
    ProForm,
    ProFormDatePicker,
    ProFormDigit,
    ProFormSelect,
    ProFormText,
    ProFormTextArea,
    ProFormTreeSelect,
} from '@ant-design/pro-components'
import { PeopleSelector } from '@repo/react-components'

import { toSavePayload } from '../data-transform'
import type {
    DepartmentDrawerState,
    DepartmentFormValues,
    SelectOption,
} from '../model'
import type {
    OrgNature,
    OrgStatus,
    OrgUnitExtensionFieldRVO,
    OrgUnitExtensionOptionRVO,
    OrgUnitManagementRoleRVO,
    OrgUnitSaveQVO,
} from '../types'
import styles from '../department-management-page.module.scss'

interface DepartmentDrawerProps {
    state: DepartmentDrawerState
    submitting: boolean
    departmentLevelOptions: SelectOption[]
    extensionFields: OrgUnitExtensionFieldRVO[]
    extensionOptions: Record<string, OrgUnitExtensionOptionRVO[]>
    dictLoading: boolean
    extensionLoading: boolean
    managementRoles?: OrgUnitManagementRoleRVO[]
    onCancel: () => void
    onSubmit: (data: OrgUnitSaveQVO) => Promise<void>
}

const orgNatureOptions: { label: string; value: OrgNature }[] = [
    { label: '部门', value: 'DEPARTMENT' },
    { label: '项目', value: 'PROJECT' },
    { label: '虚拟组织', value: 'VIRTUAL' },
]

const orgStatusOptions: { label: string; value: OrgStatus }[] = [
    { label: '正常', value: 'NORMAL' },
    { label: '停用', value: 'DISABLED' },
]

export const DepartmentDrawer = ({
    state,
    submitting,
    departmentLevelOptions,
    extensionFields,
    extensionOptions,
    dictLoading,
    extensionLoading,
    managementRoles,
    onCancel,
    onSubmit,
}: DepartmentDrawerProps) => {
    const [form] = ProForm.useForm<DepartmentFormValues>()
    const readonly = state.mode === 'view'

    useEffect(() => {
        if (!state.open) return
        form.resetFields()
        form.setFieldsValue({
            orgNature: 'DEPARTMENT',
            orgStatus: 'NORMAL',
            createSpaceFlag: 0,
            duplicateSortPolicy: 'INSERT',
            ...state.initialValues,
        })
    }, [form, state.initialValues, state.open])

    const handleSave = async () => {
        const values = await form.validateFields()
        await onSubmit(toSavePayload(values, state, managementRoles))
    }

    const title = {
        add: '新建部门',
        edit: '编辑部门信息',
        view: '部门信息',
    }[state.mode]

    return (
        <Drawer
            title={title}
            size={760}
            open={state.open}
            onClose={onCancel}
            loading={submitting}
            extra={
                readonly ? (
                    <Button onClick={onCancel}>关闭</Button>
                ) : (
                    <Space>
                        <Button onClick={onCancel}>取消</Button>
                        <Button
                            type='primary'
                            loading={submitting}
                            onClick={handleSave}
                        >
                            保存
                        </Button>
                    </Space>
                )
            }
        >
            <ProForm<DepartmentFormValues>
                form={form}
                layout='vertical'
                readonly={readonly}
                submitter={false}
            >
                <div className={styles['form-section-title']}>部门基本信息</div>
                <ProFormText
                    name='orgName'
                    label='部门名称'
                    rules={[
                        { required: true, message: '请输入部门名称' },
                        { max: 128, message: '部门名称不超过128个字符' },
                    ]}
                    placeholder='请输入部门名称'
                />
                <ProFormText
                    name='orgCode'
                    label='部门代码'
                    placeholder='请输入部门代码'
                />
                <ProFormSelect
                    name='orgNature'
                    label='组织性质'
                    options={orgNatureOptions}
                    rules={[{ required: true, message: '请选择组织性质' }]}
                />
                <ProFormSelect
                    name='departmentLevel'
                    label='部门级次'
                    placeholder='请选择部门级次'
                    options={departmentLevelOptions}
                    fieldProps={{ showSearch: true, loading: dictLoading }}
                />
                <ProFormText
                    name='relatedProjectName'
                    label='关联项目'
                    placeholder='请输入关联项目'
                />
                <ProFormDigit
                    name='sortNo'
                    label='排序号'
                    min={0}
                    fieldProps={{ precision: 0 }}
                    placeholder='请输入排序号'
                />
                <ProFormSelect
                    name='orgStatus'
                    label='状态'
                    options={orgStatusOptions}
                />
                <ProFormTextArea
                    name='remark'
                    label='部门描述'
                    fieldProps={{ rows: 3, maxLength: 300 }}
                    placeholder='请输入部门描述'
                />

                {extensionFields.length > 0 && (
                    <div className={styles['form-section-title']}>
                        部门扩展信息
                    </div>
                )}
                {extensionFields.map((field) => {
                    const name = ['extensionValues', field.fieldCode]
                    const rules =
                        field.requiredFlag === 1
                            ? [
                                  {
                                      required: true,
                                      message: `${field.fieldLabel}不能为空`,
                                  },
                              ]
                            : undefined
                    const commonProps = {
                        name,
                        label: field.fieldLabel,
                        rules,
                        disabled: readonly || field.readonlyFlag === 1,
                    }
                    const options = extensionOptions[field.fieldCode] || []

                    if (field.controlType === 'Input') {
                        return (
                            <ProFormText
                                key={field.fieldCode}
                                {...commonProps}
                                placeholder={`请输入${field.fieldLabel}`}
                            />
                        )
                    }
                    if (field.controlType === 'TextArea') {
                        return (
                            <ProFormTextArea
                                key={field.fieldCode}
                                {...commonProps}
                                placeholder={`请输入${field.fieldLabel}`}
                            />
                        )
                    }
                    if (field.controlType === 'InputNumber') {
                        return (
                            <ProFormDigit
                                key={field.fieldCode}
                                {...commonProps}
                                placeholder={`请输入${field.fieldLabel}`}
                            />
                        )
                    }
                    if (field.controlType === 'DatePicker') {
                        return (
                            <ProFormDatePicker
                                key={field.fieldCode}
                                {...commonProps}
                                placeholder={`请选择${field.fieldLabel}`}
                            />
                        )
                    }
                    if (field.controlType === 'TreeSelect') {
                        return (
                            <ProFormTreeSelect
                                key={field.fieldCode}
                                {...commonProps}
                                placeholder={`请选择${field.fieldLabel}`}
                                fieldProps={{
                                    treeData: options,
                                    fieldNames: {
                                        label: 'label',
                                        value: 'value',
                                        children: 'children',
                                    },
                                    showSearch: true,
                                    loading: extensionLoading,
                                    treeDefaultExpandAll: true,
                                }}
                            />
                        )
                    }
                    return (
                        <ProFormSelect
                            key={field.fieldCode}
                            {...commonProps}
                            placeholder={`请选择${field.fieldLabel}`}
                            options={options}
                            fieldProps={{
                                showSearch: true,
                                loading: extensionLoading,
                            }}
                        />
                    )
                })}

                <div className={styles['form-section-title']}>部门管理信息</div>
                <ProForm.Item name='departmentResponsibleId' label='部门负责人'>
                    <PeopleSelector
                        multiple={false}
                        disabled={readonly}
                        placeholder='请选择部门负责人'
                    />
                </ProForm.Item>
                <ProForm.Item name='departmentLeaderId' label='部门领导'>
                    <PeopleSelector
                        multiple={false}
                        disabled={readonly}
                        placeholder='请选择部门领导'
                    />
                </ProForm.Item>
                {(managementRoles || []).map((role) => (
                    <ProForm.Item
                        key={role.roleId}
                        name={['managementRoleUsers', role.roleId]}
                        label={role.roleName}
                    >
                        <PeopleSelector
                            multiple={false}
                            disabled={readonly}
                            placeholder={`请选择${role.roleName}`}
                        />
                    </ProForm.Item>
                ))}
            </ProForm>
        </Drawer>
    )
}
