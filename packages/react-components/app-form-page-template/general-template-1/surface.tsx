import { PlusOutlined } from '@ant-design/icons'
import type { ActionType } from '@ant-design/pro-components'
import { Button, Modal, message } from 'antd'
import { useEffect, useRef, useState } from 'react'

import AppFormDetailRenderer from '../../app-form-runtime/app-form-detail-renderer'
import AppFormEditorRenderer from '../../app-form-runtime/app-form-editor-renderer'
import AppFormListRenderer from '../../app-form-runtime/app-form-list-renderer'
import type {
    AppFormRenderSchema,
    AppFormRuntimeDesignerProps,
    AppFormRuntimeValue,
    AppFormScene,
} from '../../app-form-runtime/types'
import type { RuntimeRecord } from './runtime-data-adapter'
import {
    buildRuntimePageRequest,
    flattenRuntimeRecord,
    toRuntimeValue,
} from './runtime-data-adapter'
import type { GeneralTemplateRuntimeClient } from './runtime-client'
import RuntimeRecordDrawer, {
    createEmptyRuntimeValue,
    recordDisplayName,
} from './record-drawer'
import styles from './index.module.css'

interface EditorState {
    mode: 'create' | 'edit' | 'view'
    schema: AppFormRenderSchema
    value: AppFormRuntimeValue
    record?: RuntimeRecord
}

export interface GeneralTemplate1SurfaceProps {
    schema: AppFormRenderSchema
    runtimeClient: GeneralTemplateRuntimeClient
    permissionName?: string
    loading?: boolean
    scene?: AppFormScene
    designer?: AppFormRuntimeDesignerProps
}

const GeneralTemplate1Surface = ({
    schema,
    runtimeClient,
    permissionName,
    loading = false,
    scene = 'LIST',
    designer,
}: GeneralTemplate1SurfaceProps) => {
    const actionRef = useRef<ActionType | undefined>(undefined)
    const [editor, setEditor] = useState<EditorState>()
    const [editorLoading, setEditorLoading] = useState(false)
    const [inlineValue, setInlineValue] = useState<AppFormRuntimeValue>(() =>
        createEmptyRuntimeValue(schema),
    )

    useEffect(() => {
        setInlineValue(createEmptyRuntimeValue(schema))
    }, [schema])

    const openEditor = async (
        mode: EditorState['mode'],
        row?: Record<string, unknown>,
    ) => {
        const formCode = schema.form?.formCode
        if (!formCode) {
            message.error('页面没有关联应用表单')
            return
        }
        setEditorLoading(true)
        try {
            const scene = mode === 'view' ? 'DETAIL' : 'FORM'
            const recordId = row?.id ? String(row.id) : undefined
            const [editorSchema, record] = await Promise.all([
                runtimeClient.getSchema(formCode, scene),
                recordId
                    ? runtimeClient.detail(schema, recordId)
                    : Promise.resolve(undefined),
            ])
            setEditor({
                mode,
                schema: editorSchema,
                record,
                value: record
                    ? toRuntimeValue(record)
                    : createEmptyRuntimeValue(editorSchema),
            })
        } finally {
            setEditorLoading(false)
        }
    }

    const remove = (row: Record<string, unknown>) => {
        if (!row.id) return
        const record = row as RuntimeRecord
        Modal.confirm({
            title: '确认删除该记录？',
            content: recordDisplayName(schema, record),
            okText: '删除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                await runtimeClient.delete(schema, String(row.id))
                message.success('删除成功')
                actionRef.current?.reload()
            },
        })
    }

    if (scene !== 'LIST') {
        const loadOptions = (field: Parameters<
            GeneralTemplateRuntimeClient['loadOptions']
        >[1], keyword?: string) => runtimeClient.loadOptions(
            schema,
            field,
            keyword,
        )
        return (
            <div className={styles['template-page']}>
                {scene === 'DETAIL' ? (
                    <AppFormDetailRenderer
                        schema={schema}
                        value={inlineValue}
                        loading={loading}
                        onLoadOptions={loadOptions}
                        designer={designer}
                    />
                ) : (
                    <AppFormEditorRenderer
                        schema={schema}
                        value={inlineValue}
                        loading={loading}
                        onChange={setInlineValue}
                        onLoadOptions={loadOptions}
                        designer={designer}
                    />
                )}
            </div>
        )
    }

    return (
        <div className={styles['template-page']}>
            <AppFormListRenderer<Record<string, unknown>>
                actionRef={actionRef}
                schema={schema}
                loading={loading || editorLoading}
                rowKey={(record) => String(record.id)}
                scroll={{ x: 'max-content', y: 'calc(100vh - 390px)' }}
                toolBarRender={() => [
                    <Button
                        key='create'
                        type='primary'
                        icon={<PlusOutlined />}
                        onClick={() => void openEditor('create')}
                    >
                        新增
                    </Button>,
                ]}
                request={async (params) => {
                    try {
                        const result = await runtimeClient.page(
                            schema,
                            buildRuntimePageRequest(schema, params),
                        )
                        return {
                            success: true,
                            total: result.total || 0,
                            data: (result.records || []).map((record) =>
                                flattenRuntimeRecord(schema, record),
                            ),
                        }
                    } catch {
                        return { success: false, total: 0, data: [] }
                    }
                }}
                onView={(record) => void openEditor('view', record)}
                onEdit={(record) => void openEditor('edit', record)}
                onDelete={remove}
                onLoadOptions={(field, keyword) =>
                    runtimeClient.loadOptions(schema, field, keyword)
                }
                designer={designer}
            />

            {editor ? (
                <RuntimeRecordDrawer
                    key={`${editor.mode}-${editor.record?.id || 'new'}`}
                    open
                    mode={editor.mode}
                    schema={editor.schema}
                    value={editor.value}
                    record={editor.record}
                    client={runtimeClient}
                    onClose={() => setEditor(undefined)}
                    onSaved={() => {
                        setEditor(undefined)
                        actionRef.current?.reload()
                    }}
                />
            ) : null}

            {permissionName ? (
                <span className={styles['visually-hidden']}>
                    {permissionName}
                </span>
            ) : null}
        </div>
    )
}

export default GeneralTemplate1Surface
