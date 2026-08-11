import { describe, expect, it } from 'vitest'

import { findOptionByValue } from './shared'

describe('findOptionByValue', () => {
    it('matches numeric runtime values with string dictionary option values', () => {
        const option = findOptionByValue(
            [{ value: '1', label: '在职' }],
            1,
        )

        expect(option).toEqual({ value: '1', label: '在职' })
    })
})
