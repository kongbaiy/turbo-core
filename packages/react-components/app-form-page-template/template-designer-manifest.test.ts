import { describe, expect, test } from 'vitest'

import {
    GENERAL_TEMPLATE_1_DESIGNER_MANIFEST,
    canTemplateSlotAccept,
} from './template-designer-manifest'

describe('GENERAL_TEMPLATE_1 designer manifest', () => {
    test('LIST exposes immutable search and table slots', () => {
        const scene = GENERAL_TEMPLATE_1_DESIGNER_MANIFEST.scenes.LIST

        expect(scene.root.nodeCode).toBe('LIST_ROOT')
        expect(scene.slots.map((slot) => slot.layoutRole)).toEqual([
            'LIST_SEARCH',
            'LIST_TABLE',
        ])
        expect(scene.slots.every((slot) => slot.fixed && !slot.deletable))
            .toBe(true)
        expect(canTemplateSlotAccept(
            GENERAL_TEMPLATE_1_DESIGNER_MANIFEST,
            'LIST',
            'LIST_TABLE',
            'FIELD',
        )).toBe(true)
        expect(canTemplateSlotAccept(
            GENERAL_TEMPLATE_1_DESIGNER_MANIFEST,
            'LIST',
            'LIST_TABLE',
            'REGION',
        )).toBe(false)
    })

    test('FORM and DETAIL layout structure is owned by the template', () => {
        for (const sceneCode of ['FORM', 'DETAIL'] as const) {
            const root = GENERAL_TEMPLATE_1_DESIGNER_MANIFEST
                .scenes[sceneCode].root
            expect(root).toMatchObject({
                nodeCode: 'FORM_ROOT',
                layoutRole: 'FORM_ROOT',
                fixed: true,
                deletable: false,
            })
            expect(root.accepts).toEqual(['FIELD'])
            expect(canTemplateSlotAccept(
                GENERAL_TEMPLATE_1_DESIGNER_MANIFEST,
                sceneCode,
                'FORM_ROOT',
                'FIELD',
            )).toBe(true)
        }
    })

    test('property schema stays declarative and bounded', () => {
        const definitions = Object.values(
            GENERAL_TEMPLATE_1_DESIGNER_MANIFEST.properties,
        ).flat()

        expect(definitions.length).toBeGreaterThan(0)
        expect(definitions.every((item) =>
            ['ENUM', 'BOOLEAN', 'NUMBER', 'STRING'].includes(item.valueType),
        )).toBe(true)
        expect(JSON.stringify(definitions)).not.toMatch(/css|script|function/i)
    })
})
