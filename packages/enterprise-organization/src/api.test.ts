import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
}))

vi.mock('@repo/utils', () => ({ api: apiMock }))

import {
    deleteDepartment,
    disableDepartment,
    getDepartmentDetail,
    getDepartmentMembers,
    getDepartmentTree,
    moveDepartment,
    saveDepartment,
} from './api'

describe('部门管理共享接口', () => {
    beforeEach(() => vi.clearAllMocks())

    it('所有入口复用企业基础组织域接口路径', () => {
        getDepartmentTree()
        getDepartmentDetail('department-1')
        getDepartmentMembers('department-1')
        saveDepartment({ id: 'department-1', orgName: '研发部' })
        moveDepartment('department-1', { parentId: 'root', sortNo: 10 })
        disableDepartment('department-1')
        deleteDepartment('department-1')

        expect(apiMock.get).toHaveBeenCalledWith(
            '/api/admin/enterprise/basic/org/units/tree',
        )
        expect(apiMock.get).toHaveBeenCalledWith(
            '/api/admin/enterprise/basic/org/units/department-1',
        )
        expect(apiMock.get).toHaveBeenCalledWith(
            '/api/admin/enterprise/basic/org/units/department-1/members',
        )
        expect(apiMock.post).toHaveBeenCalledWith(
            '/api/admin/enterprise/basic/org/units',
            { id: 'department-1', orgName: '研发部' },
        )
        expect(apiMock.post).toHaveBeenCalledWith(
            '/api/admin/enterprise/basic/org/units/department-1/move',
            { parentId: 'root', sortNo: 10 },
        )
        expect(apiMock.post).toHaveBeenCalledWith(
            '/api/admin/enterprise/basic/org/units/department-1/disable',
        )
        expect(apiMock.delete).toHaveBeenCalledWith(
            '/api/admin/enterprise/basic/org/units/department-1',
        )
    })
})
