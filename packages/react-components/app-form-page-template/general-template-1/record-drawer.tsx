import { useMemo, useRef, useState } from 'react'
import { Button, Col, Drawer, Form, Modal, Row, Space, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

import AppFormControl from '../../app-form-runtime/control-registry'
import AppFormDetailRenderer from '../../app-form-runtime/app-form-detail-renderer'
import AppFormEditorRenderer from '../../app-form-runtime/app-form-editor-renderer'
import { getPrimaryObjectDomain } from '../../app-form-runtime/schema'
import type {
    AppFormListAction,
    AppFormRendererRef,
    AppFormRenderSchema,
    AppFormRuntimeField,
    AppFormRuntimeValue,
} from '../../app-form-runtime/types'
import type { RuntimeRecord } from './runtime-data-adapter'
import { toRuntimeSavePayload } from './runtime-data-adapter'
import type { GeneralTemplateRuntimeClient } from './runtime-client'
import { applyRuntimeListRow } from './runtime-list-value'
import styles from './index.module.css'

type EditorMode = 'create' | 'edit' | 'view'
type LooseRecord = Record<string, unknown>

export interface RuntimeRecordDrawerProps {
    open: boolean
    mode: EditorMode
    schema: AppFormRenderSchema
    value: AppFormRuntimeValue
    record?: RuntimeRecord
    client: GeneralTemplateRuntimeClient
    onClose: () => void
    onSaved: () => void
}

interface ListEditorState {
    action: 'add' | 'edit'
    domainCode: string
    rowIndex?: number
    row?: LooseRecord
}

const fieldLabel = (field: AppFormRuntimeField) =>
    field.fieldLabel || field.fieldName || field.fieldCode

const enabled = (value: unknown) =>
    value === true || value === 1 || value === '1'

const RuntimeRecordDrawer = ({
    open,
    mode,
    schema,
    value: initialValue,
    record,
    client,
    onClose,
    onSaved,
}: RuntimeRecordDrawerProps) => {
    const rendererRef = useRef<AppFormRendererRef>(null)
    const [value, setValue] = useState(initialValue)
    const [saving, setSaving] = useState(false)
    const [listEditor, setListEditor] = useState<ListEditorState>()
    const [listForm] = Form.useForm()
    const readonly = mode === 'view'
    const title =
        mode === 'create' ? '新增' : mode === 'edit' ? '编辑' : '查看详情'

    const listDomain = useMemo(
        () =>
            schema.dataDomains?.find(
                (domain) => domain.domainCode === listEditor?.domainCode,
            ),
        [listEditor?.domainCode, schema.dataDomains],
    )

    const loadOptions = (field: AppFormRuntimeField, keyword?: string) =>
        client.loadOptions(schema, field, keyword)

    const handleListAction = (action: AppFormListAction) => {
        if (action.type === 'delete') {
            Modal.confirm({
                title: '确认删除该明细？',
                okText: '删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: () =>
                    setValue((current) =>
                        applyRuntimeListRow(
                            current,
                            action.domainCode,
                            'delete',
                            undefined,
                            action.rowIndex,
                        ),
                    ),
            })
            return
        }

        setListEditor({
            action: action.type,
            domainCode: action.domainCode,
            rowIndex: action.rowIndex,
            row: action.row,
        })
        listForm.setFieldsValue(action.row || {})
    }

    const saveListRow = async () => {
        const row = await listForm.validateFields()
        if (!listEditor) return
        setValue((current) =>
            applyRuntimeListRow(
                current,
                listEditor.domainCode,
                listEditor.action,
                row,
                listEditor.rowIndex,
            ),
        )
        setListEditor(undefined)
        listForm.resetFields()
    }

    const save = async () => {
        if (!rendererRef.current || readonly) return
        setSaving(true)
        try {
            const runtimeValue = await rendererRef.current.validateAndGetValues()
            await client.save(
                schema,
                toRuntimeSavePayload(schema, runtimeValue, record),
            )
            message.success(mode === 'create' ? '新增成功' : '保存成功')
            onSaved()
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Drawer
                className={styles['record-drawer']}
                destroyOnHidden
                maskClosable={false}
                open={open}
                title={`${title}${schema.form?.formName ? ` - ${schema.form.formName}` : ''}`}
                width='min(960px, calc(100vw - 16px))'
                onClose={onClose}
                footer={
                    <div className={styles['drawer-footer']}>
                        <Space size={8}>
                            <Button onClick={onClose}>
                                {readonly ? '关闭' : '取消'}
                            </Button>
                            {!readonly ? (
                                <Button
                                    type='primary'
                                    icon={<SaveOutlined />}
                                    loading={saving}
                                    onClick={() => void save()}
                                >
                                    保存
                                </Button>
                            ) : null}
                        </Space>
                    </div>
                }
            >
                {readonly ? (
                    <AppFormDetailRenderer
                        ref={rendererRef}
                        schema={schema}
                        value={value}
                        onLoadOptions={loadOptions}
                    />
                ) : (
                    <AppFormEditorRenderer
                        ref={rendererRef}
                        schema={schema}
                        value={value}
                        onChange={setValue}
                        onListAction={handleListAction}
                        onLoadOptions={loadOptions}
                    />
                )}
            </Drawer>

            <Modal
                destroyOnHidden
                open={Boolean(listEditor)}
                title={listEditor?.action === 'edit' ? '编辑明细' : '新增明细'}
                okText='确定'
                cancelText='取消'
                width={720}
                onCancel={() => {
                    setListEditor(undefined)
                    listForm.resetFields()
                }}
                onOk={() => void saveListRow()}
            >
                <Form form={listForm} layout='vertical'>
                    <Row gutter={8}>
                        {(listDomain?.fields || []).map((field) => (
                            <Col key={field.fieldCode} xs={24} md={12}>
                                <Form.Item
                                    name={field.fieldCode}
                                    label={fieldLabel(field)}
                                    rules={
                                        enabled(field.requiredFlag) ||
                                        enabled(field.validation?.required)
                                            ? [
                                                  {
                                                      required: true,
                                                      message: `请填写${fieldLabel(field)}`,
                                                  },
                                              ]
                                            : undefined
                                    }
                                >
                                    <AppFormControl
                                        field={{
                                            ...field,
                                            dataDomainCode:
                                                listDomain?.domainCode,
                                        }}
                                        onLoadOptions={loadOptions}
                                    />
                                </Form.Item>
                            </Col>
                        ))}
                    </Row>
                </Form>
            </Modal>
        </>
    )
}

export const createEmptyRuntimeValue = (
    schema: AppFormRenderSchema,
): AppFormRuntimeValue => ({
    dataDomains: Object.fromEntries(
        (schema.dataDomains || []).map((domain) => [
            domain.domainCode,
            domain.domainType === 'LIST' ? [] : {},
        ]),
    ),
})

export const recordDisplayName = (
    schema: AppFormRenderSchema,
    record: RuntimeRecord,
) => {
    const domain = getPrimaryObjectDomain(schema)
    const value = domain ? record.dataDomains?.[domain.domainCode] : undefined
    if (value && !Array.isArray(value)) {
        const firstText = Object.values(value).find(
            (item) => typeof item === 'string' && item.trim(),
        )
        if (firstText) return String(firstText)
    }
    return record.recordCode ? String(record.recordCode) : record.id
}

export default RuntimeRecordDrawer
