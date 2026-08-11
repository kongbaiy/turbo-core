import { PlusOutlined, DownOutlined } from '@ant-design/icons'
import { Button, Spin, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useEffect, useRef, useState } from 'react'
import type { Key } from 'react'

import styles from '../department-management-page.module.scss'

interface DepartmentTreeProps {
    treeData: DataNode[]
    selectedKey?: string
    expandedKeys: Key[]
    loading: boolean
    onAdd: () => void
    onExpand: (keys: Key[]) => void
    onSelect: (key: string) => void
}

export const DepartmentTree = ({
    treeData,
    selectedKey,
    expandedKeys,
    loading,
    onAdd,
    onExpand,
    onSelect,
}: DepartmentTreeProps) => {
    const treeBodyRef = useRef<HTMLDivElement>(null)
    const [treeHeight, setTreeHeight] = useState(560)

    useEffect(() => {
        const treeBody = treeBodyRef.current
        if (!treeBody) return

        const updateHeight = () => {
            setTreeHeight(Math.max(240, treeBody.clientHeight))
        }

        updateHeight()
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateHeight)
            return () => window.removeEventListener('resize', updateHeight)
        }

        const observer = new ResizeObserver(updateHeight)
        observer.observe(treeBody)
        return () => observer.disconnect()
    }, [])

    return (
        <aside className={styles['tree-panel']}>
            <div className={styles['tree-title']}>
                <span>部门</span>
                <Button
                    type='text'
                    size='small'
                    icon={<PlusOutlined />}
                    title='新建部门'
                    onClick={onAdd}
                />
            </div>
            <div ref={treeBodyRef} className={styles['tree-body']}>
                <Spin
                    spinning={loading}
                    classNames={{ root: styles['tree-spin'] }}
                >
                    <Tree
                        className={styles['department-tree']}
                        height={treeHeight}
                        treeData={treeData}
                        selectedKeys={selectedKey ? [selectedKey] : []}
                        expandedKeys={expandedKeys}
                        switcherIcon={<DownOutlined />}
                        onExpand={(keys) => onExpand([...keys])}
                        onSelect={(keys) => {
                            const key = String(keys[0] || '')
                            if (key) onSelect(key)
                        }}
                        blockNode
                    />
                </Spin>
            </div>
        </aside>
    )
}
