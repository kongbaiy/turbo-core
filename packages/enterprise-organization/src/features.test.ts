import { describe, expect, it } from 'vitest'

import { resolveDepartmentManagementFeatures } from './features'

describe('部门管理功能配置', () => {
    it('未传配置时默认开启全部功能', () => {
        expect(resolveDepartmentManagementFeatures()).toEqual({
            members: true,
            memberExport: true,
            import: true,
            export: true,
        })
    })

    it('部分配置只覆盖指定功能', () => {
        expect(
            resolveDepartmentManagementFeatures({
                memberExport: false,
                import: false,
            }),
        ).toEqual({
            members: true,
            memberExport: false,
            import: false,
            export: true,
        })
    })
})
