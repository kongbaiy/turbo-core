import type { AxiosAdapter, AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'

import { api } from './axios'

const binaryAdapter = (
    data: Blob,
    contentType: string,
): AxiosAdapter => async (config) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': contentType },
    config,
    code: 0,
    msg: '',
    page: { current: 1, page: 1, size: 10, total: 0 },
} as AxiosResponse)

describe('二进制响应处理', () => {
    it('Excel 下载成功时返回原始响应', async () => {
        const excel = new Blob(['excel'], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        const response = await api.get<Blob>('/excel', {
            adapter: binaryAdapter(excel, excel.type),
            responseType: 'blob',
            meta: { defaultResponse: true },
        })

        expect(response.data).toBe(excel)
    })

    it('Blob 包装的 JSON 错误仍按统一错误响应处理', async () => {
        const error = new Blob([
            JSON.stringify({ code: 400, message: '模板不存在' }),
        ], { type: 'application/json' })

        await expect(api.get('/excel', {
            adapter: binaryAdapter(error, error.type),
            responseType: 'blob',
            meta: { defaultResponse: true, silentError: true },
        })).rejects.toMatchObject({
            code: 400,
            message: '模板不存在',
            status: false,
        })
    })
})
