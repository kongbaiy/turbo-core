import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const readWorkspaceFile = (relativeUrl: string) =>
    readFileSync(fileURLToPath(new URL(relativeUrl, import.meta.url)), 'utf8')

describe('部门管理应用入口契约', () => {
    it('人事端和组织资源端直接导出同一个共享页面', () => {
        const expected =
            "export { DepartmentManagementPage as default } from '@repo/enterprise-organization'\n"
        const hrEntry = readWorkspaceFile(
            '../../../apps/sc-cloud-hr/src/pages/organization/department/index.tsx',
        )
        const platformEntry = readWorkspaceFile(
            '../../../apps/sc-cloud-basic-platform/src/pages/org-resource-manage/org-structure-manage/department-manage/index.tsx',
        )

        expect(hrEntry).toBe(expected)
        expect(platformEntry).toBe(expected)
    })
})
