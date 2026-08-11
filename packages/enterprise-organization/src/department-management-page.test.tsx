// @vitest-environment jsdom
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { App } from 'antd'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const apiMocks = vi.hoisted(() => ({
    deleteDepartment: vi.fn(),
    disableDepartment: vi.fn(),
    getDepartmentDetail: vi.fn(),
    getDepartmentExtensionFieldOptions: vi.fn(),
    getDepartmentExtensionFields: vi.fn(),
    getDepartmentManagementRoleDefinitions: vi.fn(),
    getDepartmentMembers: vi.fn(),
    getDepartmentTree: vi.fn(),
    saveDepartment: vi.fn(),
}))

vi.mock('./api', () => apiMocks)

vi.mock('@repo/react-hooks', () => ({
    useDictOptions: () => ({
        loading: false,
        getLabel: (_code: string, _value?: string, fallback?: string) =>
            fallback || '',
        toSelectOptions: () => [],
    }),
}))

vi.mock('./components/department-tree', () => ({
    DepartmentTree: () => <div>共享部门树</div>,
}))

vi.mock('./components/department-drawer', () => ({
    DepartmentDrawer: () => null,
}))

vi.mock('./components/department-detail-tabs', () => ({
    DepartmentDetailTabs: ({
        features,
        onChange,
    }: {
        features: { members: boolean }
        onChange: (key: string) => void
    }) =>
        features.members ? (
            <button onClick={() => onChange('members')}>部门人员</button>
        ) : null,
}))

import { DepartmentManagementPage } from './department-management-page'

describe('部门管理共享页面功能接线', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        apiMocks.getDepartmentTree.mockResolvedValue({
            data: [{ id: 'department-1', orgName: '研发部' }],
        })
        apiMocks.getDepartmentDetail.mockResolvedValue({
            data: { id: 'department-1', orgName: '研发部' },
        })
        apiMocks.getDepartmentExtensionFields.mockResolvedValue({ data: [] })
        apiMocks.getDepartmentManagementRoleDefinitions.mockResolvedValue({
            data: [],
        })
        apiMocks.getDepartmentMembers.mockResolvedValue({ data: [] })
    })

    afterEach(cleanup)

    it('默认显示导入导出并在进入人员页签后加载成员', async () => {
        render(
            <App>
                <DepartmentManagementPage />
            </App>,
        )

        await waitFor(() =>
            expect(apiMocks.getDepartmentDetail).toHaveBeenCalledWith(
                'department-1',
            ),
        )
        expect(screen.getByRole('button', { name: /导入/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /导出$/ })).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: '部门人员' }))
        await waitFor(() =>
            expect(apiMocks.getDepartmentMembers).toHaveBeenCalledWith(
                'department-1',
            ),
        )
    })

    it('关闭成员、导入和导出时不展示入口且不请求成员', async () => {
        render(
            <App>
                <DepartmentManagementPage
                    features={{ members: false, import: false, export: false }}
                />
            </App>,
        )

        await waitFor(() =>
            expect(apiMocks.getDepartmentDetail).toHaveBeenCalledWith(
                'department-1',
            ),
        )
        expect(screen.queryByRole('button', { name: '部门人员' })).toBeNull()
        expect(screen.queryByRole('button', { name: /导入/ })).toBeNull()
        expect(screen.queryByRole('button', { name: /导出$/ })).toBeNull()
        expect(apiMocks.getDepartmentMembers).not.toHaveBeenCalled()
    })
})
