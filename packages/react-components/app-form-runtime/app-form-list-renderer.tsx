import { useLayoutEffect, useMemo, useRef } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import { Button, ConfigProvider, Tag, Tooltip } from 'antd'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import type {
    ActionType,
    ProColumns,
    ProTableProps,
} from '@ant-design/pro-components'
import { ProTable } from '@ant-design/pro-components'

import AppFormControl from './control-registry'
import { parseAppFormRenderSchema } from './rule-engine/contract-validator'
import { getListFields, getSearchFields, readNodeConfig } from './schema'
import type {
    AppFormDesignNode,
    AppFormRenderSchema,
    AppFormRuntimeControlProps,
    AppFormRuntimeDesignerProps,
    AppFormRuntimeField,
} from './types'
import styles from './app-form-runtime.module.css'

type LooseRecord = Record<string, unknown>

export interface AppFormListRendererProps<T extends LooseRecord = LooseRecord> {
    schema?: AppFormRenderSchema
    loading?: boolean
    actionRef?: MutableRefObject<ActionType | undefined>
    rowKey: string | ((record: T) => string)
    request: ProTableProps<T, LooseRecord>['request']
    toolBarRender?: ProTableProps<T, LooseRecord>['toolBarRender']
    onView?: (record: T) => void
    onEdit?: (record: T) => void
    onDelete?: (record: T) => void
    actionDisplay?: 'icon' | 'text'
    extraRowActions?: Array<{
        key: string
        label: string
        onClick: (record: T) => void
    }>
    pagination?: ProTableProps<T, LooseRecord>['pagination']
    scroll?: ProTableProps<T, LooseRecord>['scroll']
    onLoadOptions?: AppFormRuntimeControlProps['onLoadOptions']
    designer?: AppFormRuntimeDesignerProps
}

const fieldLabel = (field: AppFormRuntimeField) =>
    field.uiLabel || field.fieldLabel || field.fieldName || field.fieldCode

export const displayValue = (
    field: AppFormRuntimeField,
    record: LooseRecord,
) => {
    const value = record[field.fieldCode]
    const relationNameField = field.fieldCode.endsWith('Id')
        ? `${field.fieldCode.slice(0, -2)}Name`
        : undefined
    const snapshot =
        record[`${field.fieldCode}Name`] ??
        record[`${field.fieldCode}Desc`] ??
        (relationNameField ? record[relationNameField] : undefined)
    if (snapshot !== undefined && snapshot !== null && snapshot !== '') {
        return String(snapshot)
    }
    if (value === undefined || value === null || value === '') return '-'
    const optionLabelMap = new Map(
        (field.options || []).map((item) => [
            String(item.value),
            String(item.label),
        ]),
    )
    const option = optionLabelMap.get(String(value))
    if (option) return option
    if (Array.isArray(value)) {
        return value
            .map((item) => optionLabelMap.get(String(item)) || item)
            .join('、')
    }
    if (typeof value === 'object') return JSON.stringify(value)
    const text = String(value)
    if (optionLabelMap.size && text.includes(',')) {
        return text
            .split(',')
            .map((item) => optionLabelMap.get(item.trim()) || item.trim())
            .join('、')
    }
    const dateTimeText = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)
        ? text.replace('T', ' ')
        : text
    return dateTimeText.includes(':') ? dateTimeText.slice(0, 16) : dateTimeText
}

const isEnumField = (field: AppFormRuntimeField) =>
    ['SELECT', 'RADIO', 'CHECKBOX'].includes(
        (field.controlType || '').toUpperCase(),
    )

export const searchValueType = (field: AppFormRuntimeField) => {
    const control = (field.controlType || '').toUpperCase()
    if (control === 'DATE_PICKER') return 'date' as const
    if (control === 'MONTH_PICKER') return 'dateMonth' as const
    if (control === 'DATE_RANGE') return 'dateRange' as const
    if (
        control === 'NUMBER_INPUT' ||
        control === 'NUMBER_WITH_UNIT' ||
        control === 'CURRENCY_INPUT'
    ) {
        return 'digit' as const
    }
    if (isEnumField(field)) return 'select' as const
    return 'text' as const
}

const valueEnum = (field: AppFormRuntimeField) =>
    Object.fromEntries(
        (field.options || []).map((option) => [
            String(option.value),
            { text: String(option.label) },
        ]),
    )

const actionColumnWidth = (
    actionCount: number,
    actionDisplay: AppFormListRendererProps['actionDisplay'] = 'icon',
) =>
    actionDisplay === 'text'
        ? Math.max(100, actionCount * 52)
        : actionCount * 32 + 32

const findLayoutNode = (
    nodes: AppFormDesignNode[] = [],
    layoutRole: string,
): AppFormDesignNode | undefined => {
    for (const node of nodes) {
        if (readNodeConfig(node).layoutRole === layoutRole) return node
        const nested = findLayoutNode(node.children, layoutRole)
        if (nested) return nested
    }
    return undefined
}

const AppFormListRenderer = <T extends LooseRecord = LooseRecord>({
    schema,
    loading,
    actionRef,
    rowKey,
    request,
    toolBarRender,
    onView,
    onEdit,
    onDelete,
    actionDisplay = 'icon',
    extraRowActions = [],
    pagination,
    scroll,
    onLoadOptions,
    designer,
}: AppFormListRendererProps<T>) => {
    const designRootRef = useRef<HTMLDivElement>(null)
    const parsedSchema = useMemo(
        () => (schema ? parseAppFormRenderSchema(schema).schema : undefined),
        [schema],
    )
    const searchDesignNode = useMemo(
        () =>
            parsedSchema
                ? findLayoutNode(
                      parsedSchema.pageLayout?.designTree,
                      'LIST_SEARCH',
                  )
                : undefined,
        [parsedSchema],
    )
    const tableDesignNode = useMemo(
        () =>
            parsedSchema
                ? findLayoutNode(
                      parsedSchema.pageLayout?.designTree,
                      'LIST_TABLE',
                  )
                : undefined,
        [parsedSchema],
    )
    const hasSearchFields = Boolean(
        parsedSchema && getSearchFields(parsedSchema).length,
    )
    const columns = useMemo<ProColumns<T>[]>(() => {
        if (!parsedSchema) return []
        const searchFields = getSearchFields(parsedSchema)
        const listFields = getListFields(parsedSchema)
        const queryColumns = searchFields.map((field): ProColumns<T> => {
            const control = (field.controlType || '').toUpperCase()
            if (
                [
                    'ORG_DEPT_SELECT',
                    'ORG_USER_SELECT',
                    'RELATION_SELECT',
                ].includes(control)
            ) {
                return {
                    title: fieldLabel(field),
                    dataIndex: field.fieldCode,
                    hideInTable: true,
                    renderFormItem: () => (
                        <AppFormControl
                            field={field}
                            onLoadOptions={onLoadOptions}
                        />
                    ),
                } as ProColumns<T>
            }
            return {
                title: fieldLabel(field),
                dataIndex: field.fieldCode,
                hideInTable: true,
                valueType: searchValueType(field),
                valueEnum: isEnumField(field) ? valueEnum(field) : undefined,
                fieldProps: {
                    allowClear: true,
                    placeholder: `请选择或输入${fieldLabel(field)}`,
                },
            }
        })
        const dataColumns = listFields.map(
            (field): ProColumns<T> => ({
                title: fieldLabel(field),
                dataIndex: field.fieldCode,
                width: 140,
                ellipsis: true,
                search: false,
                sorter: field.capabilities?.sortable === true,
                render: (_: ReactNode, record: T) => {
                    const content = displayValue(field, record)
                    return isEnumField(field) && content !== '-' ? (
                        <Tag>{content}</Tag>
                    ) : (
                        content
                    )
                },
            }),
        )
        const hasActions =
            onView || onEdit || onDelete || extraRowActions.length
        const actionCount =
            [onView, onEdit, onDelete].filter(Boolean).length +
            extraRowActions.length
        const renderActionButton = (
            key: string,
            label: string,
            click: () => void,
            danger = false,
            icon?: ReactNode,
        ) =>
            actionDisplay === 'text' ? (
                <Button
                    key={key}
                    danger={danger}
                    type='link'
                    size='small'
                    onClick={click}
                >
                    {label}
                </Button>
            ) : (
                <Tooltip key={key} title={label}>
                    <Button
                        danger={danger}
                        type='text'
                        size='small'
                        title={label}
                        aria-label={label}
                        icon={icon}
                        onClick={click}
                    />
                </Tooltip>
            )
        return [
            ...queryColumns,
            ...dataColumns,
            ...(hasActions
                ? [
                      {
                          title: '操作',
                          valueType: 'option' as const,
                          width: actionColumnWidth(actionCount, actionDisplay),
                          fixed: 'right' as const,
                          render: (_: ReactNode, record: T) => (
                              <div className={styles['action-buttons']}>
                                  {onView
                                      ? renderActionButton(
                                            'view',
                                            '查看',
                                            () => onView(record),
                                            false,
                                            <EyeOutlined />,
                                        )
                                      : null}
                                  {onEdit
                                      ? renderActionButton(
                                            'edit',
                                            '编辑',
                                            () => onEdit(record),
                                            false,
                                            <EditOutlined />,
                                        )
                                      : null}
                                  {onDelete
                                      ? renderActionButton(
                                            'delete',
                                            '删除',
                                            () => onDelete(record),
                                            true,
                                            <DeleteOutlined />,
                                        )
                                      : null}
                                  {extraRowActions.map((action) =>
                                      renderActionButton(
                                          action.key,
                                          action.label,
                                          () => action.onClick(record),
                                      ),
                                  )}
                              </div>
                          ),
                      },
                  ]
                : []),
        ]
    }, [
        actionDisplay,
        extraRowActions,
        onDelete,
        onEdit,
        onLoadOptions,
        onView,
        parsedSchema,
    ])

    useLayoutEffect(() => {
        const root = designRootRef.current
        if (!root || !designer?.enabled || !parsedSchema) return
        const searchElement = root.querySelector<HTMLElement>(
            '.ant-pro-query-filter',
        )
        const decorated: HTMLElement[] = []

        const decorate = (
            element: HTMLElement | null | undefined,
            node: AppFormDesignNode | undefined,
        ) => {
            if (!element || !node) return
            element.classList.add(styles['design-list-region']!)
            if (designer.selectedNodeId === node.id) {
                element.classList.add(styles['design-list-region-selected']!)
            }
            element.dataset.appFormDesignRegionId = node.id
            element.dataset.testid = `template-region-${node.id}`
            decorated.push(element)
        }

        if (hasSearchFields) decorate(searchElement, searchDesignNode)
        return () => {
            decorated.forEach((element) => {
                element.classList.remove(
                    styles['design-list-region']!,
                    styles['design-list-region-selected']!,
                )
                delete element.dataset.appFormDesignRegionId
                delete element.dataset.testid
            })
        }
    }, [designer, hasSearchFields, parsedSchema, searchDesignNode])

    const designRegionId = (target: EventTarget | null) =>
        target instanceof Element
            ? target.closest<HTMLElement>('[data-app-form-design-region-id]')
                  ?.dataset.appFormDesignRegionId
            : undefined

    return (
        <ConfigProvider getPopupContainer={() => document.body}>
            <div
                ref={designRootRef}
                className={styles['list-design-root']}
                onClickCapture={
                    designer?.enabled
                        ? (event) => {
                              const nodeId = designRegionId(event.target)
                              if (nodeId) designer.onSelectNode?.(nodeId)
                          }
                        : undefined
                }
                onDragOverCapture={
                    designer?.enabled && designer.editable
                        ? (event) => {
                              if (designRegionId(event.target)) {
                                  event.preventDefault()
                              }
                          }
                        : undefined
                }
                onDropCapture={
                    designer?.enabled && designer.editable
                        ? (event) => {
                              const nodeId = designRegionId(event.target)
                              if (!nodeId) return
                              event.preventDefault()
                              event.stopPropagation()
                              const fieldId =
                                  event.dataTransfer.getData(
                                      'app-form/field-id',
                                  )
                              if (fieldId) {
                                  designer.onDropField?.(fieldId, nodeId)
                              }
                          }
                        : undefined
                }
            >
                {designer?.enabled && searchDesignNode && !hasSearchFields ? (
                    <div
                        className={[
                            styles['design-list-region'],
                            styles['design-empty-search-region'],
                            designer.selectedNodeId === searchDesignNode.id
                                ? styles['design-list-region-selected']
                                : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        data-testid={`template-region-${searchDesignNode.id}`}
                        data-app-form-design-region-id={searchDesignNode.id}
                    >
                        拖入字段
                    </div>
                ) : null}
                <ProTable<T, LooseRecord>
                    className={styles['list-runtime']}
                    actionRef={actionRef}
                    columns={columns}
                    loading={loading}
                    rowKey={rowKey}
                    request={request}
                    pagination={pagination}
                    search={{
                        labelWidth: 'auto',
                        span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
                    }}
                    scroll={
                        scroll || { x: Math.max(980, columns.length * 150) }
                    }
                    toolBarRender={toolBarRender}
                    tableRender={
                        designer?.enabled && tableDesignNode
                            ? (_props, defaultDom) => (
                                  <div
                                      className={[
                                          styles['design-list-region'],
                                          styles['design-table-region'],
                                          designer.selectedNodeId ===
                                          tableDesignNode.id
                                              ? styles[
                                                    'design-list-region-selected'
                                                ]
                                              : '',
                                      ]
                                          .filter(Boolean)
                                          .join(' ')}
                                      data-testid={`template-region-${tableDesignNode.id}`}
                                      data-app-form-design-region-id={
                                          tableDesignNode.id
                                      }
                                  >
                                      {defaultDom}
                                  </div>
                              )
                            : undefined
                    }
                />
            </div>
        </ConfigProvider>
    )
}

export default AppFormListRenderer
