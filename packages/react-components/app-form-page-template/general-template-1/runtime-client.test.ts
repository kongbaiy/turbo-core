import assert from 'node:assert/strict'
import { beforeEach, expect, test, vi } from 'vitest'

const { apiPost } = vi.hoisted(() => ({
    apiPost: vi.fn(),
}))

vi.mock('@repo/utils', () => ({
    api: {
        post: apiPost,
    },
}))

import type {
    AppFormRenderSchema,
    AppFormRuntimeField,
} from '../../app-form-runtime/types'
import {
    defaultGeneralTemplateRuntimeClient,
    runtimeSchemaByPermissionUrl,
    resolveRuntimeBindingUrl,
} from './runtime-client'

const schema: AppFormRenderSchema = {
    schemaVersion: '2.2',
    form: { formCode: 'EXPENSE_APPLICATION_MINE' },
    apiBindings: {
        detail: {
            method: 'GET',
            url: '/admin/enterprise/basic/app-forms/EXPENSE_APPLICATION_MINE/records/{recordId}',
        },
    },
}

beforeEach(() => {
    apiPost.mockReset()
})

test('页面权限解析地址使用权限ID并限制为同源API路径', () => {
    assert.equal(
        runtimeSchemaByPermissionUrl('EXPENSE PAGE/MINE'),
        '/api/admin/enterprise/basic/app-forms/menu-permissions/EXPENSE%20PAGE%2FMINE/render-schema',
    )
})

test('运行时绑定自动补充API前缀并安全替换记录ID', () => {
    assert.equal(
        resolveRuntimeBindingUrl(schema, 'detail', 'DATA 1/2'),
        '/api/admin/enterprise/basic/app-forms/EXPENSE_APPLICATION_MINE/records/DATA%201%2F2',
    )
})

test('缺少API绑定时根据表单编码生成统一运行时地址', () => {
    assert.equal(
        resolveRuntimeBindingUrl(schema, 'page'),
        '/api/admin/enterprise/basic/app-forms/EXPENSE_APPLICATION_MINE/records/page',
    )
    assert.throws(
        () => resolveRuntimeBindingUrl({ schemaVersion: '2.2' }, 'save'),
        /表单编码不能为空/,
    )
})

test('非引用数据源字段不请求远程选项接口', async () => {
    const field: AppFormRuntimeField = {
        fieldCode: 'DEPOSIT_LEDGER_CONTRACT_ID',
        dataDomainCode: 'BASIC_INFO',
        controlType: 'RELATION_SELECT',
        referenceFlag: false,
    }

    await expect(
        defaultGeneralTemplateRuntimeClient.loadOptions(schema, field),
    ).resolves.toEqual([])
    expect(apiPost).not.toHaveBeenCalled()
})
