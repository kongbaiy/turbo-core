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
    TrophyOutlined,
} from '@ant-design/icons'

import { getSelectorJobLevel, getSelectorJobLevels } from './api'
import type {
    JobLevelSelectorProps,
    JobLevelSelectorValue,
    SelectorJobLevelRecord,
} from './types'
import {
    getPageRecords,
    getPageTotal,
    jobLevelCodeOf,
    jobLevelIdOf,
    jobLevelNameOf,
    uniqJobLevels,
} from './utils'

import styles from './selector.module.css'

const toJobLevelList = (
    value?:
        | SelectorJobLevelRecord
        | SelectorJobLevelRecord[]
        | string
        | string[]
        | null,
) => {
    if (!value) return []
    if (Array.isArray(value)) {
        return value
            .map((item) =>
                typeof item === 'string' ? { jobLevelId: item } : item,
            )
            .filter((item) => Boolean(jobLevelIdOf(item)))
    }
    return [
        typeof value === 'string'
            ? { jobLevelId: value }
            : value,
    ].filter((item) => Boolean(jobLevelIdOf(item)))
}

const toSelectOptions = (items: SelectorJobLevelRecord[]) =>
    items.map((item) => ({
        label: jobLevelNameOf(item),
        value: jobLevelIdOf(item),
    }))

const shouldResolveJobLevelLabel = (item: SelectorJobLevelRecord) => {
    const id = jobLevelIdOf(item)
    const name = (item.jobLevelName || item.rankLevelName)?.trim()
    return Boolean(id && (!name || name === id))
}

const normalizeJobLevelSelection = (
    items: SelectorJobLevelRecord[],
    multiple: boolean,
) => {
    const normalized = items.filter((item) => Boolean(jobLevelIdOf(item)))
    return multiple
        ? uniqJobLevels(normalized)
        : normalized[0]
          ? [normalized[0]]
          : []
}

const JobLevelSelector = <Multiple extends boolean = false>({
    value,
    onChange,
    multiple = false as Multiple,
    disabled = false,
    allowClear = true,
    placeholder = '请选择职级',
    pageSize = 10,
    selectProps,
}: JobLevelSelectorProps<Multiple>) => {
    const [open, setOpen] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [loading, setLoading] = useState(false)
    const [jobLevels, setJobLevels] = useState<SelectorJobLevelRecord[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [resolvedSelected, setResolvedSelected] = useState<
        SelectorJobLevelRecord[]
    >([])
    const [draftSelected, setDraftSelected] = useState<
        SelectorJobLevelRecord[]
    >([])

    const incomingSelectedList = useMemo(
        () => normalizeJobLevelSelection(toJobLevelList(value), Boolean(multiple)),
        [multiple, value],
    )
    const selectedList = useMemo(() => {
        const resolvedById = new Map(
            resolvedSelected.map((item) => [jobLevelIdOf(item), item]),
        )
        return normalizeJobLevelSelection(
            incomingSelectedList.map((item) => {
                const resolved = resolvedById.get(jobLevelIdOf(item))
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
        ? selectedList.map((item) => jobLevelIdOf(item)).filter(Boolean)
        : jobLevelIdOf(selectedList[0])

    useEffect(() => {
        const itemsToResolve = incomingSelectedList.filter(
            shouldResolveJobLevelLabel,
        )
        if (!itemsToResolve.length) {
            setResolvedSelected([])
            return
        }

        let ignore = false
        Promise.all(
            itemsToResolve.map((item) =>
                getSelectorJobLevel(jobLevelIdOf(item))
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
        getSelectorJobLevels({
            current: page,
            pageSize,
            keyword: keyword || undefined,
        })
            .then(({ data }) => {
                const records = getPageRecords(data)
                setJobLevels(records)
                setTotal(getPageTotal(data, records.length))
            })
            .catch(() => {
                setJobLevels([])
                setTotal(0)
            })
            .finally(() => setLoading(false))
    }, [keyword, open, page, pageSize])

    const emitChange = (next: SelectorJobLevelRecord[]) => {
        const normalized = normalizeJobLevelSelection(next, Boolean(multiple))
        if (multiple) {
            onChange?.(normalized as JobLevelSelectorValue<Multiple>)
            return
        }
        onChange?.((normalized[0] || null) as JobLevelSelectorValue<Multiple>)
    }

    const pickJobLevel = (jobLevel: SelectorJobLevelRecord) => {
        if (!jobLevelIdOf(jobLevel)) return
        if (!multiple) {
            setDraftSelected([jobLevel])
            return
        }
        setDraftSelected((current) => uniqJobLevels([jobLevel, ...current]))
    }

    const removeJobLevel = (jobLevel: SelectorJobLevelRecord) => {
        const id = jobLevelIdOf(jobLevel)
        setDraftSelected((current) =>
            current.filter((item) => jobLevelIdOf(item) !== id),
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

    const renderJobLevelList = (items: SelectorJobLevelRecord[]) => (
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
                            onClick={() => pickJobLevel(item)}
                        />,
                    ]}
                >
                    <List.Item.Meta
                        avatar={<Avatar icon={<TrophyOutlined />} />}
                        title={jobLevelNameOf(item)}
                        description={
                            <div className={styles['result-desc']}>
                                <span>
                                    {jobLevelCodeOf(item) || '未维护职级代码'}
                                </span>
                                <span>
                                    {item.jobLevelCategory ||
                                        item.rankLevelCategory ||
                                        '未维护职级类别'}
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
                        <TrophyOutlined />
                        <span>选择职级</span>
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
                            placeholder='搜索职级'
                            value={keyword}
                            onChange={(event) => {
                                setKeyword(event.target.value)
                                setPage(1)
                            }}
                        />
                        <div className={styles['panel-body']}>
                            <Spin spinning={loading}>
                                {renderJobLevelList(jobLevels)}
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
                            <span>已选职级</span>
                            <span>
                                {multiple ? '可选择多项' : '仅可选择一项'}
                            </span>
                        </div>
                        <div className={styles['selected-list-scroll']}>
                            <List
                                dataSource={normalizeJobLevelSelection(
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
                                                    removeJobLevel(item)
                                                }
                                            />,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    icon={<TrophyOutlined />}
                                                />
                                            }
                                            title={jobLevelNameOf(item)}
                                            description={
                                                <div
                                                    className={
                                                        styles['result-desc']
                                                    }
                                                >
                                                    <span>
                                                        {jobLevelCodeOf(item) ||
                                                            '未维护职级代码'}
                                                    </span>
                                                    <span>
                                                        {item.jobLevelCategory ||
                                                            item.rankLevelCategory ||
                                                            '未维护职级类别'}
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

JobLevelSelector.displayName = 'JobLevelSelector'

export default JobLevelSelector
