import { describe, expect, it } from 'vitest'

import { formatApiError } from './api-error'

describe('接口错误信息格式化', () => {
    it('展示平台标准错误码和错误信息', () => {
        expect(
            formatApiError({ code: 40001, message: '参数错误' }, 400),
        ).toBe('【40001】参数错误')
    })

    it('网关返回非标准响应时展示服务不可用信息', () => {
        expect(formatApiError('<html>Bad Gateway</html>', 502)).toBe(
            '服务暂不可用（HTTP 502）',
        )
    })

    it('错误字段缺失时不展示未定义内容', () => {
        expect(formatApiError({}, 500)).toBe('请求失败（HTTP 500）')
        expect(formatApiError(undefined)).toBe('网络未知错误')
    })
})
