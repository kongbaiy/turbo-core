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
    Tabs,
    Tree,
} from 'antd'
import {
    DeleteOutlined,
    PlusOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons'

import { getSelectorDepartmentTree, getSelectorPersons } from './api'
import {
    readRecentPeople,
    updateRecentPeople,
} from './recent-people'
import type {
    PeopleSelectorProps,
    PeopleSelectorValue,
    SelectorPersonRecord,
} from './types'
import {
    getPageRecords,
    getPageTotal,
    firstSelectableDeptKey,
    flattenDeptTree,
    normalizeSelectorDeptId,
    personDeptNameOf,
    personIdOf,
    personNameOf,
    personPostNameOf,
    toDeptTreeData,
    uniqPeople,
} from './utils'

import styles from './selector.module.css'

type PeopleTabKey = 'recent' | 'department'

const toPersonList = (value?: SelectorPersonRecord | SelectorPersonRecord[] | null) => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
}

const toSelectOptions = (items: SelectorPersonRecord[]) =>
    items.map((item) => ({
        label: personNameOf(item),
        value: personIdOf(item),
    }))

const filterRecentPeople = (items: SelectorPersonRecord[], keyword: string) => {
    const text = keyword.trim().toLowerCase()
    if (!text) return items
    return items.filter((item) =>
        [
            personNameOf(item),
            item.employeeNo,
            personPostNameOf(item),
            personDeptNameOf(item),
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(text)),
    )
}

const PeopleSelector = <Multiple extends boolean = true>({
    value,
    onChange,
    multiple = true as Multiple,
    disabled = false,
    allowClear = true,
    placeholder = '请选择人员',
    pageSize = 10,
    selectProps,
}: PeopleSelectorProps<Multiple>) => {
    const [open, setOpen] = useState(false)
    const [tabKey, setTabKey] = useState<PeopleTabKey>('recent')
    const [keyword, setKeyword] = useState('')
    const [selectedDeptId, setSelectedDeptId] = useState<string>()
    const [deptTreeLoading, setDeptTreeLoading] = useState(false)
    const [personLoading, setPersonLoading] = useState(false)
    const [deptTree, setDeptTree] = useState<ReturnType<typeof toDeptTreeData>>([])
    const [recentPeople, setRecentPeople] = useState<SelectorPersonRecord[]>([])
    const [departmentPeople, setDepartmentPeople] = useState<SelectorPersonRecord[]>([])
    const [departmentTotal, setDepartmentTotal] = useState(0)
    const [departmentPage, setDepartmentPage] = useState(1)
    const [draftSelected, setDraftSelected] = useState<SelectorPersonRecord[]>([])

    const selectedList = useMemo(() => toPersonList(value), [value])
    const selectOptions = useMemo(() => toSelectOptions(selectedList), [selectedList])
    const selectValue = multiple
        ? selectedList.map((item) => personIdOf(item)).filter(Boolean)
        : personIdOf(selectedList[0])

    const recentFiltered = useMemo(
        () => filterRecentPeople(recentPeople, keyword),
        [keyword, recentPeople],
    )

    useEffect(() => {
        if (!open) return
        setDraftSelected(selectedList)
        setRecentPeople(readRecentPeople())
        setKeyword('')
        setDepartmentPage(1)
    }, [open, selectedList])

    useEffect(() => {
        if (!open || tabKey !== 'department') return
        setDeptTreeLoading(true)
        getSelectorDepartmentTree()
            .then(({ data }) => {
                const nextTree = toDeptTreeData(data || [])
                const selectableKeys = new Set(
                    flattenDeptTree(nextTree)
                        .filter((item) => item.key && item.selectable !== false)
                        .map((item) => item.key),
                )
                setDeptTree(nextTree)
                setSelectedDeptId((current) => {
                    const normalizedCurrent = normalizeSelectorDeptId(current)
                    if (
                        normalizedCurrent &&
                        selectableKeys.has(normalizedCurrent)
                    ) {
                        return normalizedCurrent
                    }
                    return firstSelectableDeptKey(nextTree)
                })
            })
            .catch(() => {
                setDeptTree([])
                setSelectedDeptId(undefined)
            })
            .finally(() => setDeptTreeLoading(false))
    }, [open, tabKey])

    useEffect(() => {
        if (!open || tabKey !== 'department') return
        const deptId = normalizeSelectorDeptId(selectedDeptId)
        if (!deptId) {
            setDepartmentPeople([])
            setDepartmentTotal(0)
            return
        }
        setPersonLoading(true)
        getSelectorPersons({
            current: departmentPage,
            pageSize,
            keyword: keyword || undefined,
            deptId,
        })
            .then(({ data }) => {
                const records = getPageRecords(data)
                setDepartmentPeople(records)
                setDepartmentTotal(getPageTotal(data, records.length))
            })
            .catch(() => {
                setDepartmentPeople([])
                setDepartmentTotal(0)
            })
            .finally(() => setPersonLoading(false))
    }, [departmentPage, keyword, open, pageSize, selectedDeptId, tabKey])

    const emitChange = (next: SelectorPersonRecord[]) => {
        if (multiple) {
            onChange?.(next as PeopleSelectorValue<Multiple>)
            return
        }
        onChange?.((next[0] || null) as PeopleSelectorValue<Multiple>)
    }

    const pickPerson = (person: SelectorPersonRecord) => {
        if (!personIdOf(person)) return
        if (!multiple) {
            setDraftSelected([person])
            return
        }
        setDraftSelected((current) => uniqPeople([person, ...current]))
    }

    const removePerson = (person: SelectorPersonRecord) => {
        const id = personIdOf(person)
        setDraftSelected((current) =>
            current.filter((item) => personIdOf(item) !== id),
        )
    }

    const confirm = () => {
        emitChange(draftSelected)
        updateRecentPeople(draftSelected)
        setOpen(false)
    }

    const clear = () => {
        setDraftSelected([])
        emitChange([])
        setOpen(false)
    }

    const renderPersonList = (items: SelectorPersonRecord[]) => (
        <List
            dataSource={items}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            renderItem={(item) => {
                const name = personNameOf(item)
                const postName = personPostNameOf(item)
                const deptName = personDeptNameOf(item)

                return (
                    <List.Item
                        className={styles['result-item']}
                        actions={[
                            <Button
                                key='add'
                                size='small'
                                type='text'
                                icon={<PlusOutlined />}
                                onClick={() => pickPerson(item)}
                            />,
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar>{name.slice(0, 1)}</Avatar>}
                            title={name}
                            description={
                                <div className={styles['result-desc']}>
                                    <span>{postName || '未维护岗位'}</span>
                                    <span>{deptName || '未维护部门'}</span>
                                </div>
                            }
                        />
                    </List.Item>
                )
            }}
        />
    )

    return (
        <>
            <Select
                {...selectProps}
                className={selectProps?.className}
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
                        <UserOutlined />
                        <span>选择人员</span>
                    </Space>
                }
                open={open}
                width={1040}
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
                <div
                    className={[
                        styles['selector-transfer'],
                        styles['people-selector-transfer'],
                    ].join(' ')}
                >
                    <section className={styles['selector-panel']}>
                        <Tabs
                            activeKey={tabKey}
                            onChange={(key) => {
                                setTabKey(key as PeopleTabKey)
                                setKeyword('')
                                setDepartmentPage(1)
                            }}
                            items={[
                                { key: 'recent', label: '最近' },
                                { key: 'department', label: '按部门' },
                            ]}
                        />
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder={
                                tabKey === 'recent' ? '搜索最近人员' : '搜索人员'
                            }
                            value={keyword}
                            onChange={(event) => {
                                setKeyword(event.target.value)
                                setDepartmentPage(1)
                            }}
                        />
                        <div className={styles['panel-body']}>
                            {tabKey === 'recent' ? (
                                <div className={styles['person-list-scroll']}>
                                    {renderPersonList(recentFiltered)}
                                </div>
                            ) : (
                                <div className={styles['department-layout']}>
                                    <div className={styles['department-tree']}>
                                        <Spin spinning={deptTreeLoading}>
                                            <Tree
                                                blockNode
                                                treeData={deptTree}
                                                selectedKeys={
                                                    selectedDeptId
                                                        ? [selectedDeptId]
                                                        : []
                                                }
                                                onSelect={(keys) => {
                                                    const deptId =
                                                        normalizeSelectorDeptId(
                                                            String(
                                                                keys[0] || '',
                                                            ),
                                                        )
                                                    if (!deptId) return
                                                    setSelectedDeptId(deptId)
                                                    setDepartmentPage(1)
                                                }}
                                                defaultExpandAll
                                            />
                                        </Spin>
                                    </div>
                                    <div className={styles['department-persons']}>
                                        <div
                                            className={
                                                styles['person-list-scroll']
                                            }
                                        >
                                            <Spin spinning={personLoading}>
                                                {renderPersonList(departmentPeople)}
                                            </Spin>
                                        </div>
                                        <Pagination
                                            size='small'
                                            current={departmentPage}
                                            pageSize={pageSize}
                                            total={departmentTotal}
                                            onChange={setDepartmentPage}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                    <section className={styles['selector-panel']}>
                        <div className={styles['selected-header']}>
                            <span>已选人员</span>
                            <span>{multiple ? '可选择多项' : '仅可选择一项'}</span>
                        </div>
                        <div className={styles['selected-list-scroll']}>
                            <List
                                dataSource={draftSelected}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    ),
                                }}
                                renderItem={(item) => {
                                    const name = personNameOf(item)
                                    return (
                                        <List.Item
                                            actions={[
                                                <Button
                                                    key='remove'
                                                    size='small'
                                                    type='text'
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() =>
                                                        removePerson(item)
                                                    }
                                                />,
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar>
                                                        {name.slice(0, 1)}
                                                    </Avatar>
                                                }
                                                title={name}
                                                description={
                                                    <div
                                                        className={
                                                            styles[
                                                                'result-desc'
                                                            ]
                                                        }
                                                    >
                                                        <span>
                                                            {personPostNameOf(
                                                                item,
                                                            ) ||
                                                                '未维护岗位'}
                                                        </span>
                                                        <span>
                                                            {personDeptNameOf(
                                                                item,
                                                            ) ||
                                                                '未维护部门'}
                                                        </span>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )
                                }}
                            />
                        </div>
                    </section>
                </div>
            </Modal>
        </>
    )
}

PeopleSelector.displayName = 'PeopleSelector'

export default PeopleSelector
