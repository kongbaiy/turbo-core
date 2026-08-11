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

import { getSelectorPost, getSelectorPosts } from './api'
import type {
    PostSelectorProps,
    PostSelectorValue,
    SelectorPostRecord,
} from './types'
import {
    getPageRecords,
    getPageTotal,
    postIdOf,
    postNameOf,
    uniqPosts,
} from './utils'

import styles from './selector.module.css'

const toPostList = (
    value?: SelectorPostRecord | SelectorPostRecord[] | string | string[] | null,
) => {
    if (!value) return []
    if (Array.isArray(value)) {
        return value
            .map((item) =>
                typeof item === 'string' ? { postId: item } : item,
            )
            .filter((item) => Boolean(postIdOf(item)))
    }
    return [
        typeof value === 'string'
            ? { postId: value }
            : value,
    ].filter((item) => Boolean(postIdOf(item)))
}

const toSelectOptions = (items: SelectorPostRecord[]) =>
    items.map((item) => ({
        label: postNameOf(item),
        value: postIdOf(item),
    }))

const shouldResolvePostLabel = (item: SelectorPostRecord) => {
    const id = postIdOf(item)
    const name = item.postName?.trim()
    return Boolean(id && (!name || name === id))
}

const normalizePostSelection = (
    items: SelectorPostRecord[],
    multiple: boolean,
) => {
    const normalized = items.filter((item) => Boolean(postIdOf(item)))
    return multiple
        ? uniqPosts(normalized)
        : normalized[0]
          ? [normalized[0]]
          : []
}

const PostSelector = <Multiple extends boolean = false>({
    value,
    onChange,
    multiple = false as Multiple,
    disabled = false,
    allowClear = true,
    placeholder = '请选择岗位',
    pageSize = 10,
    selectProps,
}: PostSelectorProps<Multiple>) => {
    const [open, setOpen] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [loading, setLoading] = useState(false)
    const [posts, setPosts] = useState<SelectorPostRecord[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [resolvedSelected, setResolvedSelected] = useState<
        SelectorPostRecord[]
    >([])
    const [draftSelected, setDraftSelected] = useState<SelectorPostRecord[]>([])

    const incomingSelectedList = useMemo(
        () => normalizePostSelection(toPostList(value), Boolean(multiple)),
        [multiple, value],
    )
    const selectedList = useMemo(
        () => {
            const resolvedById = new Map(
                resolvedSelected.map((item) => [postIdOf(item), item]),
            )
            return normalizePostSelection(
                incomingSelectedList.map((item) => {
                    const resolved = resolvedById.get(postIdOf(item))
                    return resolved
                        ? { ...item, ...resolved }
                        : item
                }),
                Boolean(multiple),
            )
        },
        [incomingSelectedList, multiple, resolvedSelected],
    )
    const selectOptions = useMemo(
        () => toSelectOptions(selectedList),
        [selectedList],
    )
    const selectValue = multiple
        ? selectedList.map((item) => postIdOf(item)).filter(Boolean)
        : postIdOf(selectedList[0])

    useEffect(() => {
        const itemsToResolve = incomingSelectedList.filter(shouldResolvePostLabel)
        if (!itemsToResolve.length) {
            setResolvedSelected([])
            return
        }

        let ignore = false
        Promise.all(
            itemsToResolve.map((item) =>
                getSelectorPost(postIdOf(item))
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
        getSelectorPosts({
            current: page,
            pageSize,
            keyword: keyword || undefined,
        })
            .then(({ data }) => {
                const records = getPageRecords(data)
                setPosts(records)
                setTotal(getPageTotal(data, records.length))
            })
            .catch(() => {
                setPosts([])
                setTotal(0)
            })
            .finally(() => setLoading(false))
    }, [keyword, open, page, pageSize])

    const emitChange = (next: SelectorPostRecord[]) => {
        const normalized = normalizePostSelection(next, Boolean(multiple))
        if (multiple) {
            onChange?.(normalized as PostSelectorValue<Multiple>)
            return
        }
        onChange?.((normalized[0] || null) as PostSelectorValue<Multiple>)
    }

    const pickPost = (post: SelectorPostRecord) => {
        if (!postIdOf(post)) return
        if (!multiple) {
            setDraftSelected([post])
            return
        }
        setDraftSelected((current) => uniqPosts([post, ...current]))
    }

    const removePost = (post: SelectorPostRecord) => {
        const id = postIdOf(post)
        setDraftSelected((current) =>
            current.filter((item) => postIdOf(item) !== id),
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

    const renderPostList = (items: SelectorPostRecord[]) => (
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
                            onClick={() => pickPost(item)}
                        />,
                    ]}
                >
                    <List.Item.Meta
                        avatar={<Avatar icon={<SolutionOutlined />} />}
                        title={postNameOf(item)}
                        description={
                            <div className={styles['result-desc']}>
                                <span>{item.postCode || '未维护岗位编码'}</span>
                                <span>{item.deptName || '未维护引用部门'}</span>
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
                        <span>选择岗位</span>
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
                            placeholder='搜索岗位'
                            value={keyword}
                            onChange={(event) => {
                                setKeyword(event.target.value)
                                setPage(1)
                            }}
                        />
                        <div className={styles['panel-body']}>
                            <Spin spinning={loading}>
                                {renderPostList(posts)}
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
                            <span>已选岗位</span>
                            <span>
                                {multiple ? '可选择多项' : '仅可选择一项'}
                            </span>
                        </div>
                        <div className={styles['selected-list-scroll']}>
                            <List
                                dataSource={normalizePostSelection(
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
                                                onClick={() => removePost(item)}
                                            />,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    icon={<SolutionOutlined />}
                                                />
                                            }
                                            title={postNameOf(item)}
                                            description={
                                                <div
                                                    className={
                                                        styles['result-desc']
                                                    }
                                                >
                                                    <span>
                                                        {item.postCode ||
                                                            '未维护岗位编码'}
                                                    </span>
                                                    <span>
                                                        {item.deptName ||
                                                            '未维护引用部门'}
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

PostSelector.displayName = 'PostSelector'

export default PostSelector
