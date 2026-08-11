import { expect, test } from '@playwright/test'

test('application entry is available', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.ok()).toBe(true)
    await expect(page.locator('body')).toBeVisible()
})
