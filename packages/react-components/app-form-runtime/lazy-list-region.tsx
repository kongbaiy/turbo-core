import { useEffect } from 'react'
import type { DragEvent, KeyboardEvent, MouseEvent } from 'react'
import { Button, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'

import { fieldLabel, nodeTitle } from './editor-utils'
import { readNodeConfig } from './schema'
import type {
    AppFormDesignNode,
    AppFormListAction,
    AppFormRuntimeDesignerProps,
    AppFormRuntimeField,
    AppFormRuntimeRendererProps,
} from './types'
import styles from './app-form-runtime.module.css'

type LooseRecord = Record<string, unknown>

const readDisplayValue = (field: AppFormRuntimeField, record: LooseRecord) => {
    const value = record[field.fieldCode]
    const snapshot =
        record[`${field.fieldCode}Name`] ?? record[`${field.fieldCode}Desc`]
    if (snapshot !== undefined && snapshot !== null && snapshot !== '') {
        return String(snapshot)
    }
    const option = field.options?.find(
        (item) => String(item.value) === String(value),
    )
    if (option?.label !== undefined) return String(option.label)
    if (value === undefined || value === null || value === '') return '-'
    if (Array.isArray(value)) return value.join('、')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

export interface LazyListRegionProps {
    node: AppFormDesignNode
    domainCode: string
    fields: AppFormRuntimeField[]
    rows: LooseRecord[]
    readonly: boolean
    onLoadDomain?: AppFormRuntimeRendererProps['onLoadDomain']
    onListAction?: AppFormRuntimeRendererProps['onListAction']
    designer?: AppFormRuntimeDesignerProps
}

const LazyListRegion = ({
    node,
    domainCode,
    fields,
    rows,
    readonly,
    onLoadDomain,
    onListAction,
    designer,
}: LazyListRegionProps) => {
    useEffect(() => {
        void onLoadDomain?.(domainCode)
    }, [domainCode, onLoadDomain])

    const emit = (action: Omit<AppFormListAction, 'domainCode'>) =>
        onListAction?.({ ...action, domainCode })

    const columns: ColumnsType<LooseRecord> = [
        ...fields.map((field) => ({
            title: fieldLabel(field),
            dataIndex: field.fieldCode,
            ellipsis: true,
            width: 150,
            render: (_: unknown, record: LooseRecord) =>
                readDisplayValue(field, record),
        })),
        ...(!readonly
            ? [
                  {
                      title: '操作',
                      key: 'actions',
                      fixed: 'right' as const,
                      width: 136,
                      render: (
                          _: unknown,
                          row: LooseRecord,
                          rowIndex: number,
                      ) => (
                          <Space size={0}>
                              <Button
                                  type='link'
                                  size='small'
                                  icon={<EditOutlined />}
                                  onClick={() =>
                                      emit({ type: 'edit', row, rowIndex })
                                  }
                              >
                                  编辑
                              </Button>
                              <Button
                                  danger
                                  type='link'
                                  size='small'
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                      emit({ type: 'delete', row, rowIndex })
                                  }
                              >
                                  删除
                              </Button>
                          </Space>
                      ),
                  },
              ]
            : []),
    ]

    const designProps = designer?.enabled
        ? {
              'data-testid': `template-region-${node.id}`,
              tabIndex: 0,
              onClick: (event: MouseEvent<HTMLElement>) => {
                  event.stopPropagation()
                  designer.onSelectNode?.(node.id)
              },
              onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                  if (
                      event.currentTarget === event.target &&
                      (event.key === 'Enter' || event.key === ' ')
                  ) {
                      event.preventDefault()
                      designer.onSelectNode?.(node.id)
                  }
              },
              onDragOver: designer.editable
                  ? (event: DragEvent<HTMLElement>) => event.preventDefault()
                  : undefined,
              onDrop: designer.editable
                  ? (event: DragEvent<HTMLElement>) => {
                        event.preventDefault()
                        event.stopPropagation()
                        const fieldId =
                            event.dataTransfer.getData('app-form/field-id')
                        if (fieldId) designer.onDropField?.(fieldId, node.id)
                    }
                  : undefined,
          }
        : {}
    const config = readNodeConfig(node)
    const listTitle =
        typeof config.title === 'string'
            ? config.title
            : nodeTitle(node, '明细')

    return (
        <section
            {...designProps}
            className={[
                styles.section,
                designer?.enabled ? styles['design-region'] : '',
                designer?.selectedNodeId === node.id
                    ? styles['design-region-selected']
                    : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <div className={styles['list-header']}>
                <Typography.Title level={5} className={styles['section-title']}>
                    {listTitle}
                </Typography.Title>
                {!readonly ? (
                    <Button
                        size='small'
                        icon={<PlusOutlined />}
                        onClick={() => emit({ type: 'add' })}
                    >
                        添加一行
                    </Button>
                ) : null}
            </div>
            <Table<LooseRecord>
                size='small'
                rowKey={(row) =>
                    String(row.id || row.recordId || JSON.stringify(row))
                }
                columns={columns}
                dataSource={rows}
                pagination={false}
                scroll={{ x: Math.max(680, columns.length * 150) }}
                locale={{ emptyText: '暂无数据' }}
            />
        </section>
    )
}

export default LazyListRegion
