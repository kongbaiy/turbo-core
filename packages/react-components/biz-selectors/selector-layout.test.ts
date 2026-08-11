import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'vitest'
import { fileURLToPath } from 'node:url'

const cssPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    'selector.module.css',
)
const css = readFileSync(cssPath, 'utf8')

const blockOf = (selector: string) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
    assert.ok(match, `${selector} should exist`)
    return match[1]!
}

const assertDeclaration = (
    selector: string,
    property: string,
    valuePattern: RegExp,
) => {
    const block = blockOf(selector)
    assert.match(
        block,
        new RegExp(`${property}\\s*:\\s*${valuePattern.source}`, 'i'),
        `${selector} should set ${property}`,
    )
}

test('people selector modal keeps large lists inside internal scroll regions', () => {
    assertDeclaration(
        '.people-selector-transfer',
        'height',
        /min\(520px,\s*calc\(100vh - 180px\)\)/,
    )
    assertDeclaration('.people-selector-transfer', 'overflow', /hidden/)
    assertDeclaration('.selector-panel', 'min-height', /0/)
    assertDeclaration('.panel-body', 'min-height', /0/)
    assertDeclaration('.department-layout', 'height', /100%/)
    assertDeclaration('.department-layout', 'min-height', /0/)
    assertDeclaration('.department-persons', 'min-height', /0/)
    assertDeclaration('.person-list-scroll', 'overflow', /auto/)
    assertDeclaration('.person-list-scroll', 'min-height', /0/)
    assertDeclaration('.selected-list-scroll', 'overflow', /auto/)
    assertDeclaration('.selected-list-scroll', 'min-height', /0/)
})

test('department selector modal has a fixed content height and internal scroll regions', () => {
    assertDeclaration(
        '.selector-transfer',
        'height',
        /min\(520px,\s*calc\(100vh - 180px\)\)/,
    )
    assertDeclaration('.selector-transfer', 'overflow', /hidden/)
    assertDeclaration('.selector-transfer', 'min-height', /0/)
    assertDeclaration('.panel-body', 'overflow', /auto/)
    assertDeclaration('.selected-table-scroll', 'overflow', /auto/)
    assertDeclaration('.selected-table-scroll', 'min-height', /0/)
})
