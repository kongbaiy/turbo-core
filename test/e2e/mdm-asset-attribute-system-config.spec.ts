import { expect, test } from '@playwright/test'

test('单位可修改系统属性配置但不能修改编码', async ({ page }) => {
    let attributeName = '系统属性'

    await page.addInitScript(() => {
        localStorage.setItem(
            '__ACCESS_TOKEN_KEY__',
            JSON.stringify({ Authorization: 'e2e-access-token' }),
        )
    })
    await page.route('**/api/admin/basic/options/batch', (route) =>
        route.fulfill({
            json: {
                code: 200,
                data: {
                    COMMON_STATUS: [{ label: '启用', value: 'ENABLED' }],
                    FIELD_FINAL_TYPE: [{ label: '文本', value: 'TEXT' }],
                },
            },
        }),
    )
    await page.route(
        '**/api/admin/enterprise/master-data/asset-attribute-groups',
        (route) =>
            route.fulfill({
                json: {
                    code: 200,
                    data: [
                        {
                            id: 'SYSTEM_GROUP',
                            groupCode: 'BASE_GROUP',
                            groupName: '基础信息',
                            systemFlag: 1,
                        },
                    ],
                },
            }),
    )
    await page.route(
        '**/api/admin/enterprise/master-data/asset-categories/tree',
        (route) => route.fulfill({ json: { code: 200, data: [] } }),
    )
    await page.route(
        '**/api/admin/enterprise/master-data/asset-attributes**',
        async (route) => {
            if (route.request().method() === 'PUT') {
                const payload = route.request().postDataJSON() as {
                    dataName: string
                    dataCode: string
                }
                expect(payload.dataCode).toBe('SYSTEM_CODE')
                attributeName = payload.dataName
                await route.fulfill({ json: { code: 200, data: true } })
                return
            }

            await route.fulfill({
                json: {
                    code: 200,
                    data: [
                        {
                            id: 'SYSTEM_ATTRIBUTE',
                            groupId: 'SYSTEM_GROUP',
                            dataCode: 'SYSTEM_CODE',
                            dataName: attributeName,
                            fieldDataType: 'TEXT',
                            inputType: 'INPUT',
                            systemFlag: 1,
                            editableFlag: 1,
                            coreEditableFlag: 0,
                            configEditableFlag: 1,
                            status: 'ENABLED',
                            sortNo: 10,
                        },
                    ],
                },
            })
        },
    )

    await page.goto('/config-center/attribute-manage')

    const systemRow = page.getByRole('row').filter({ hasText: '系统属性' })
    await systemRow.getByRole('button', { name: '编辑' }).click()

    await expect(page.getByLabel('属性编码')).toBeDisabled()
    await expect(page.getByLabel('属性名称')).toBeEditable()
    await page.getByLabel('属性名称').fill('单位配置名称')
    await page.getByRole('button', { name: /确\s*认/ }).click()

    await expect(page.getByText('保存成功')).toBeVisible()
    await expect(page.getByRole('cell', { name: '单位配置名称' })).toBeVisible()
})
