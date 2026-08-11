import { useEffect, useMemo, useState } from 'react'
import {
    Button,
    Empty,
    Input,
    Modal,
    Select,
    Space,
    Spin,
    Table,
    Tree,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
    ApartmentOutlined,
    DeleteOutlined,
    SearchOutlined,
} from '@ant-design/icons'

import { getSelectorDepartmentChildren, getSelectorDepartmentTree } from './api'
import type {
    DeptSelectorProps,
    DeptSelectorValue,
    SelectorDeptRecord,
} from './types'
import {
    deptIdOf,
    deptNameOf,
    flattenDeptTree,
    toDeptTreeData,
    uniqDepts,
} from './utils'
import type { SelectorTreeNode } from './utils'

import styles from './selector.module.css'

const toDeptList = (
    value?: SelectorDeptRecord | SelectorDeptRecord[] | string | string[] | null,
) => {
    if (!value) return []
    if (Array.isArray(value)) {
        return value
            .map((item) =>
                typeof item === 'string' ? { deptId: item } : item,
            )
            .filter((item) => Boolean(deptIdOf(item)))
    }
    return [
        typeof value === 'string'
            ? { deptId: value }
            : value,
    ].filter((item) => Boolean(deptIdOf(item)))
}

const toSelectOptions = (items: SelectorDeptRecord[]) =>
    items.map((item) => ({
        label: deptNameOf(item),
        value: deptIdOf(item),
    }))

const getDefaultExpandedKeys = (items: SelectorTreeNode[]) =>
    items.length === 1 ? [items[0]!.key] : []

export const toStrictDeptCheckedKeys = (checkedKeys: string[]) => ({
    checked: checkedKeys,
    halfChecked: [],
})

export const omitDeptChildren = (
    item: SelectorDeptRecord,
): SelectorDeptRecord => {
    const { children: _children, ...rest } = item
    return rest
}

export const normalizeDeptSelection = (
    items: SelectorDeptRecord[],
    multiple: boolean,
) => {
    const currentNodes = items.map(omitDeptChildren)
    return multiple
        ? uniqDepts(currentNodes)
        : currentNodes[0]
          ? [currentNodes[0]]
          : []
}

export const shouldResolveDeptLabel = (item: SelectorDeptRecord) => {
    const id = deptIdOf(item)
    const name = item.deptName?.trim()
    return Boolean(id && (!name || name === id))
}

export const resolveDeptSelectionLabels = (
    items: SelectorDeptRecord[],
    nodes: SelectorTreeNode[],
) => {
    if (!items.length || !nodes.length) return items
    const deptById = new Map(
        flattenDeptTree(nodes)
            .filter((node) => node.raw && deptIdOf(node.raw))
            .map((node) => [deptIdOf(node.raw), node.raw as SelectorDeptRecord]),
    )
    return items.map((item) => {
        if (!shouldResolveDeptLabel(item)) return item
        const matched = deptById.get(deptIdOf(item))
        return matched ? { ...omitDeptChildren(matched), ...item, deptName: deptNameOf(matched) } : item
    })
}

const filterDeptTree = (
    items: SelectorTreeNode[],
    keyword: string,
): { treeData: SelectorTreeNode[]; expandedKeys: string[] } => {
    const text = keyword.trim().toLowerCase()
    if (!text) {
        return {
            treeData: items,
            expandedKeys: getDefaultExpandedKeys(items),
        }
    }

    const expandedKeys = new Set<string>()
    const walk = (nodes: SelectorTreeNode[]): SelectorTreeNode[] =>
        nodes
            .map((node) => {
                const children = node.children?.length
                    ? walk(node.children)
                    : []
                const matched = [
                    node.title,
                    node.raw?.deptCode,
                    node.raw?.companyName,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(text))

                if (!matched && !children.length) return null
                if (children.length) {
                    expandedKeys.add(node.key)
                }

                return {
                    ...node,
                    children,
                }
            })
            .filter(Boolean) as SelectorTreeNode[]

    return {
        treeData: walk(items),
        expandedKeys: Array.from(expandedKeys),
    }
}

const DeptSelector = <Multiple extends boolean = false>({
    value,
    onChange,
    multiple = false as Multiple,
    disabled = false,
    allowClear = true,
    placeholder = '请选择部门',
    parentId,
    allowSelectParent = true,
    usePermission = false,
    selectProps,
}: DeptSelectorProps<Multiple>) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [treeData, setTreeData] = useState<ReturnType<typeof toDeptTreeData>>(
        [],
    )
    const [expandedKeys, setExpandedKeys] = useState<string[]>([])
    const [draftSelected, setDraftSelected] = useState<SelectorDeptRecord[]>([])

    const incomingSelectedList = useMemo(
        () => normalizeDeptSelection(toDeptList(value), Boolean(multiple)),
        [multiple, value],
    )
    const flatNodes = useMemo(() => flattenDeptTree(treeData), [treeData])
    const selectedList = useMemo(
        () =>
            normalizeDeptSelection(
                resolveDeptSelectionLabels(incomingSelectedList, treeData),
                Boolean(multiple),
            ),
        [incomingSelectedList, multiple, treeData],
    )
    const selectOptions = useMemo(
        () => toSelectOptions(selectedList),
        [selectedList],
    )
    const selectValue = multiple
        ? selectedList.map((item) => deptIdOf(item)).filter(Boolean)
        : deptIdOf(selectedList[0])
    const checkedKeys = draftSelected
        .map((item) => deptIdOf(item))
        .filter(Boolean)
    const visibleTree = useMemo(
        () => filterDeptTree(treeData, keyword),
        [keyword, treeData],
    )

    useEffect(() => {
        if (!open) return
        setKeyword('')
        setLoading(true)
        const request = usePermission
            ? getSelectorDepartmentChildren({ parentId, usePermission })
            : getSelectorDepartmentTree({ parentId })
        request
            .then(({ data }) => {
                const nextTreeData = toDeptTreeData(data || [], {
                    allowSelectParent,
                })
                setTreeData(nextTreeData)
                setExpandedKeys(getDefaultExpandedKeys(nextTreeData))
            })
            .catch(() => {
                setTreeData([])
                setExpandedKeys([])
            })
            .finally(() => setLoading(false))
    }, [allowSelectParent, open, parentId, usePermission])

    useEffect(() => {
        if (!open) return
        setDraftSelected(
            normalizeDeptSelection(selectedList, Boolean(multiple)),
        )
    }, [multiple, open, selectedList])

    useEffect(() => {
        if (
            !incomingSelectedList.some(shouldResolveDeptLabel) ||
            treeData.length
        ) {
            return
        }
        let ignore = false
        const request = usePermission
            ? getSelectorDepartmentChildren({ parentId, usePermission })
            : getSelectorDepartmentTree({ parentId })
        request
            .then(({ data }) => {
                if (ignore) return
                const nextTreeData = toDeptTreeData(data || [], {
                    allowSelectParent,
                })
                setTreeData(nextTreeData)
                if (open) {
                    setExpandedKeys(getDefaultExpandedKeys(nextTreeData))
                }
            })
            .catch(() => {
                if (!ignore) setTreeData([])
            })
        return () => {
            ignore = true
        }
    }, [
        allowSelectParent,
        incomingSelectedList,
        open,
        parentId,
        treeData.length,
        usePermission,
    ])

    useEffect(() => {
        if (!keyword.trim()) return
        setExpandedKeys(visibleTree.expandedKeys)
    }, [keyword, visibleTree.expandedKeys])

    const emitChange = (next: SelectorDeptRecord[]) => {
        if (multiple) {
            onChange?.(next as DeptSelectorValue<Multiple>)
            return
        }
        onChange?.((next[0] || null) as DeptSelectorValue<Multiple>)
    }

    const confirm = () => {
        emitChange(normalizeDeptSelection(draftSelected, Boolean(multiple)))
        setOpen(false)
    }

    const clear = () => {
        setDraftSelected([])
        emitChange([])
        setOpen(false)
    }

    const removeDept = (record: SelectorDeptRecord) => {
        const id = deptIdOf(record)
        setDraftSelected((current) =>
            normalizeDeptSelection(
                current.filter((item) => deptIdOf(item) !== id),
                Boolean(multiple),
            ),
        )
    }

    const columns: ColumnsType<SelectorDeptRecord> = [
        {
            title: '部门名称',
            dataIndex: 'deptName',
            ellipsis: true,
            render: (_, record) => deptNameOf(record),
        },
        {
            title: '部门编码',
            dataIndex: 'deptCode',
            ellipsis: true,
            render: (_, record) => record.deptCode || '-',
        },
        {
            title: '操作',
            width: 80,
            render: (_, record) => (
                <Button
                    type='text'
                    danger
                    size='small'
                    icon={<DeleteOutlined />}
                    onClick={() => removeDept(record)}
                />
            ),
        },
    ]

    return (
        <>
            <Select
                {...selectProps}
                allowClear={allowClear}
                disabled={disabled}
                mode={multiple ? 'multiple' : undefined}
                open={false}
                options={selectOptions}
                placeholder={placeholder}
                value={selectValue || undefined}
                onClick={() => {
                    if (!disabled) setOpen(true)
                }}
                onClear={() => {
                    emitChange([])
                }}
            />
            <Modal
                title={
                    <Space>
                        <ApartmentOutlined />
                        <span>选择部门</span>
                    </Space>
                }
                open={open}
                width={920}
                onCancel={() => setOpen(false)}
                footer={
                    <Space>
                        <Button onClick={clear}>清除</Button>
                        <Button onClick={() => setOpen(false)}>取消</Button>
                        <Button type='primary' onClick={confirm}>
                            确定
                        </Button>
                    </Space>
                }
            >
                <div className={styles['selector-transfer']}>
                    <section className={styles['selector-panel']}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder='搜索部门'
                            value={keyword}
                            onChange={(event) => {
                                const nextKeyword = event.target.value
                                setKeyword(nextKeyword)
                                if (!nextKeyword.trim()) {
                                    setExpandedKeys(
                                        getDefaultExpandedKeys(treeData),
                                    )
                                }
                            }}
                        />
                        <div className={styles['panel-body']}>
                            <Spin spinning={loading}>
                                {visibleTree.treeData.length ? (
                                    <Tree
                                        blockNode
                                        checkable={multiple}
                                        checkStrictly
                                        selectable={!multiple}
                                        checkedKeys={
                                            multiple
                                                ? toStrictDeptCheckedKeys(
                                                      checkedKeys,
                                                  )
                                                : undefined
                                        }
                                        selectedKeys={
                                            !multiple ? checkedKeys : undefined
                                        }
                                        treeData={visibleTree.treeData}
                                        expandedKeys={expandedKeys}
                                        onExpand={(keys) =>
                                            setExpandedKeys(
                                                keys.map((key) => String(key)),
                                            )
                                        }
                                        onCheck={(keys) => {
                                            if (!multiple) return
                                            const nextKeys = Array.isArray(keys)
                                                ? keys.map((key) => String(key))
                                                : keys.checked.map((key) =>
                                                      String(key),
                                                  )
                                            const selected = flatNodes
                                                .filter((node) =>
                                                    nextKeys.includes(node.key),
                                                )
                                                .filter(
                                                    (node) =>
                                                        node.selectable !==
                                                        false,
                                                )
                                                .map((node) => node.raw)
                                                .filter(
                                                    Boolean,
                                                ) as SelectorDeptRecord[]
                                            setDraftSelected(
                                                normalizeDeptSelection(
                                                    selected,
                                                    Boolean(multiple),
                                                ),
                                            )
                                        }}
                                        onSelect={(_, info) => {
                                            if (multiple) return
                                            const node = info.node
                                            if (node.selectable === false)
                                                return
                                            const raw = (
                                                node as typeof node & {
                                                    raw?: SelectorDeptRecord
                                                }
                                            ).raw
                                            setDraftSelected(raw ? [raw] : [])
                                        }}
                                    />
                                ) : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </Spin>
                        </div>
                    </section>
                    <section className={styles['selector-panel']}>
                        <div className={styles['selected-header']}>
                            <span>已选部门</span>
                            <span>
                                {multiple ? '可选择多项' : '仅可选择一项'}
                            </span>
                        </div>
                        <div className={styles['selected-table-scroll']}>
                            <Table<SelectorDeptRecord>
                                size='small'
                                rowKey={(record) => deptIdOf(record)}
                                columns={columns}
                                dataSource={normalizeDeptSelection(
                                    draftSelected,
                                    Boolean(multiple),
                                )}
                                pagination={false}
                                locale={{ emptyText: '暂无数据' }}
                            />
                        </div>
                    </section>
                </div>
            </Modal>
        </>
    )
}

DeptSelector.displayName = 'DeptSelector'

export default DeptSelector
