// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/pro-components', () => ({
    usePaginationConfig: () => false,
}))

vi.mock('@ant-design/pro-components', () => ({
    ProTable: ({
        dataSource,
    }: {
        dataSource: Array<{ employeeName?: string }>
    }) => <div>{dataSource.map((item) => item.employeeName).join('、')}</div>,
}))

import { DepartmentDetailTabs } from './department-detail-tabs'

const baseProps = {
    activeKey: 'basic',
    department: {
        id: 'department-1',
        orgName: '研发部',
        orgStatus: 'NORMAL' as const,
    },
    extensionFields: [],
    extensionNameMaps: {},
    members: [
        {
            memberId: 'member-1',
            employeeName: '张三',
        },
    ],
    membersLoading: false,
    getDictLabel: (_code: string, _value?: string, fallback?: string) =>
        fallback || '',
    onChange: vi.fn(),
    onExportMembers: vi.fn(),
}

describe('部门详情页签功能开关', () => {
    beforeEach(() => vi.clearAllMocks())

    it('关闭成员功能时不显示部门人员页签', () => {
        render(
            <DepartmentDetailTabs
                {...baseProps}
                features={{
                    members: false,
                    memberExport: true,
                    import: true,
                    export: true,
                }}
            />,
        )

        expect(screen.queryByText('部门人员')).toBeNull()
    })

    it('关闭人员导出时仍显示人员列表但不显示导出按钮', () => {
        render(
            <DepartmentDetailTabs
                {...baseProps}
                activeKey='members'
                features={{
                    members: true,
                    memberExport: false,
                    import: true,
                    export: true,
                }}
            />,
        )

        expect(screen.getByText('部门人员')).toBeTruthy()
        expect(screen.getByText('张三')).toBeTruthy()
        expect(
            screen.queryByRole('button', { name: /导出人员信息/ }),
        ).toBeNull()
    })

    it('开启人员导出时触发统一导出回调', () => {
        render(
            <DepartmentDetailTabs
                {...baseProps}
                activeKey='members'
                features={{
                    members: true,
                    memberExport: true,
                    import: true,
                    export: true,
                }}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: /导出人员信息/ }))
        expect(baseProps.onExportMembers).toHaveBeenCalledTimes(1)
    })
})
