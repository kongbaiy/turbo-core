import { useEffect, useMemo, useState } from 'react'
import {
    Avatar,
    Button,
    Empty,
    Input,
    List,
    Modal,
    Pagination,
    Select,
    Space,
    Spin,
} from 'antd'
import {
    DeleteOutlined,
    PlusOutlined,
    SearchOutlined,
    SolutionOutlined,
} from '@ant-design/icons'

import { getSelectorPosition, getSelectorPositions } from './api'
import type {
    PositionSelectorProps,
    PositionSelectorValue,
    SelectorPositionRecord,
} from './types'
import {
    getPageRecords,
    getPageTotal,
    positionCodeOf,
    positionIdOf,
    positionNameOf,
    uniqPositions,
} from './utils'

import styles from './selector.module.css'

const toPositionList = (
    value?:
        | SelectorPositionRecord
        | SelectorPositionRecord[]
        | string
        | string[]
        | null,
) => {
    if (!value) return []
    if (Array.isArray(value)) {
        return value
            .map((item) =>
                typeof item === 'string' ? { positionId: item } : item,
            )
            .filter((item) => Boolean(positionIdOf(item)))
    }
    return [
        typeof value === 'string'
            ? { positionId: value }
            : value,
    ].filter((item) => Boolean(positionIdOf(item)))
}

const toSelectOptions = (items: SelectorPositionRecord[]) =>
    items.map((item) => ({
        label: positionNameOf(item),
        value: positionIdOf(item),
    }))

const shouldResolvePositionLabel = (item: SelectorPositionRecord) => {
    const id = positionIdOf(item)
    const name = (item.positionName || item.dutyName)?.trim()
    return Boolean(id && (!name || name === id))
}

const normalizePositionSelection = (
    items: SelectorPositionRecord[],
    multiple: boolean,
) => {
    const normalized = items.filter((item) => Boolean(positionIdOf(item)))
    return multiple
        ? uniqPositions(normalized)
        : normalized[0]
          ? [normalized[0]]
          : []
}

const PositionSelector = <Multiple extends boolean = false>({
    value,
    onChange,
    multiple = false as Multiple,
    disabled = false,
    allowClear = true,
    placeholder = '请选择职位',
    pageSize = 10,
    selectProps,
}: PositionSelectorProps<Multiple>) => {
    const [open, setOpen] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [loading, setLoading] = useState(false)
    const [positions, setPositions] = useState<SelectorPositionRecord[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [resolvedSelected, setResolvedSelected] = useState<
        SelectorPositionRecord[]
    >([])
    const [draftSelected, setDraftSelected] = useState<
        SelectorPositionRecord[]
    >([])

    const incomingSelectedList = useMemo(
        () => normalizePositionSelection(toPositionList(value), Boolean(multiple)),
        [multiple, value],
    )
    const selectedList = useMemo(() => {
        const resolvedById = new Map(
            resolvedSelected.map((item) => [positionIdOf(item), item]),
        )
        return normalizePositionSelection(
            incomingSelectedList.map((item) => {
                const resolved = resolvedById.get(positionIdOf(item))
                return resolved ? { ...item, ...resolved } : item
            }),
            Boolean(multiple),
        )
    }, [incomingSelectedList, multiple, resolvedSelected])
    const selectOptions = useMemo(
        () => toSelectOptions(selectedList),
        [selectedList],
    )
    const selectValue = multiple
        ? selectedList.map((item) => positionIdOf(item)).filter(Boolean)
        : positionIdOf(selectedList[0])

    useEffect(() => {
        const itemsToResolve = incomingSelectedList.filter(
            shouldResolvePositionLabel,
        )
        if (!itemsToResolve.length) {
            setResolvedSelected([])
            return
        }

        let ignore = false
        Promise.all(
            itemsToResolve.map((item) =>
                getSelectorPosition(positionIdOf(item))
                    .then(({ data }) => data || item)
                    .catch(() => item),
            ),
        ).then((items) => {
            if (!ignore) setResolvedSelected(items)
        })
        return () => {
            ignore = true
        }
    }, [incomingSelectedList])

    useEffect(() => {
        if (!open) return
        setDraftSelected(selectedList)
        setKeyword('')
        setPage(1)
    }, [open, selectedList])

    useEffect(() => {
        if (!open) return
        setLoading(true)
        getSelectorPositions({
            current: page,
            pageSize,
            keyword: keyword || undefined,
        })
            .then(({ data }) => {
                const records = getPageRecords(data)
                setPositions(records)
                setTotal(getPageTotal(data, records.length))
            })
            .catch(() => {
                setPositions([])
                setTotal(0)
            })
            .finally(() => setLoading(false))
    }, [keyword, open, page, pageSize])

    const emitChange = (next: SelectorPositionRecord[]) => {
        const normalized = normalizePositionSelection(next, Boolean(multiple))
        if (multiple) {
            onChange?.(normalized as PositionSelectorValue<Multiple>)
            return
        }
        onChange?.((normalized[0] || null) as PositionSelectorValue<Multiple>)
    }

    const pickPosition = (position: SelectorPositionRecord) => {
        if (!positionIdOf(position)) return
        if (!multiple) {
            setDraftSelected([position])
            return
        }
        setDraftSelected((current) => uniqPositions([position, ...current]))
    }

    const removePosition = (position: SelectorPositionRecord) => {
        const id = positionIdOf(position)
        setDraftSelected((current) =>
            current.filter((item) => positionIdOf(item) !== id),
        )
    }

    const confirm = () => {
        emitChange(draftSelected)
        setOpen(false)
    }

    const clear = () => {
        setDraftSelected([])
        emitChange([])
        setOpen(false)
    }

    const renderPositionList = (items: SelectorPositionRecord[]) => (
        <List
            dataSource={items}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            renderItem={(item) => (
                <List.Item
                    className={styles['result-item']}
                    actions={[
                        <Button
                            key='add'
                            size='small'
                            type='text'
                            icon={<PlusOutlined />}
                            onClick={() => pickPosition(item)}
                        />,
                    ]}
                >
                    <List.Item.Meta
                        avatar={<Avatar icon={<SolutionOutlined />} />}
                        title={positionNameOf(item)}
                        description={
                            <div className={styles['result-desc']}>
                                <span>
                                    {positionCodeOf(item) || '未维护职位代码'}
                                </span>
                                <span>
                                    {item.postNames?.length
                                        ? item.postNames.join('、')
                                        : '未维护关联岗位'}
                                </span>
                            </div>
                        }
                    />
                </List.Item>
            )}
        />
    )

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
                        <SolutionOutlined />
                        <span>选择职位</span>
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
                            placeholder='搜索职位'
                            value={keyword}
                            onChange={(event) => {
                                setKeyword(event.target.value)
                                setPage(1)
                            }}
                        />
                        <div className={styles['panel-body']}>
                            <Spin spinning={loading}>
                                {renderPositionList(positions)}
                            </Spin>
                        </div>
                        <Pagination
                            size='small'
                            current={page}
                            pageSize={pageSize}
                            total={total}
                            onChange={setPage}
                        />
                    </section>
                    <section className={styles['selector-panel']}>
                        <div className={styles['selected-header']}>
                            <span>已选职位</span>
                            <span>
                                {multiple ? '可选择多项' : '仅可选择一项'}
                            </span>
                        </div>
                        <div className={styles['selected-list-scroll']}>
                            <List
                                dataSource={normalizePositionSelection(
                                    draftSelected,
                                    Boolean(multiple),
                                )}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    ),
                                }}
                                renderItem={(item) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key='remove'
                                                size='small'
                                                type='text'
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() =>
                                                    removePosition(item)
                                                }
                                            />,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    icon={<SolutionOutlined />}
                                                />
                                            }
                                            title={positionNameOf(item)}
                                            description={
                                                <div
                                                    className={
                                                        styles['result-desc']
                                                    }
                                                >
                                                    <span>
                                                        {positionCodeOf(item) ||
                                                            '未维护职位代码'}
                                                    </span>
                                                    <span>
                                                        {item.postNames?.length
                                                            ? item.postNames.join(
                                                                  '、',
                                                              )
                                                            : '未维护关联岗位'}
                                                    </span>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    </section>
                </div>
            </Modal>
        </>
    )
}

PositionSelector.displayName = 'PositionSelector'

export default PositionSelector
