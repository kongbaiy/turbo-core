import assert from 'node:assert/strict'
import { test } from 'vitest'

const validatorModulePath = './contract-validator.ts'
const {
    AppFormRuleContractValidationError,
    assertAppFormRenderSchema,
    parseAppFormRenderSchema,
} = await import(validatorModulePath)

const constantCondition = () => ({
    sourceDataDomainCode: 'employee',
    sourceFieldCode: 'status',
    sourceRowScope: 'ROOT_OBJECT',
    operatorCode: 'EQ',
    operandType: 'CONSTANT',
    valueType: 'STRING',
    compareValue: 'ACTIVE',
})

const fieldTarget = {
    targetType: 'FIELD',
    targetDataDomainCode: 'employee',
    targetFieldCode: 'statusReason',
}

const filterAction = () => ({
    actionType: 'FILTER_OPTIONS',
    ...fieldTarget,
    actionValue: {
        clearWhenDependencyChanges: true,
        bindings: [
            {
                parameterName: 'employeeStatus',
                operandType: 'FIELD',
                dataDomainCode: 'employee',
                fieldCode: 'status',
                rowScope: 'ROOT_OBJECT',
            },
        ],
    },
})

const v1Schema = (
    action: Record<string, unknown> = filterAction(),
    ruleType = 'LINKAGE',
    condition: unknown = constantCondition(),
) => ({
    schemaVersion: '2.1',
    ruleContractVersion: '1.0',
    rules: [
        {
            id: 'rule-1',
            ruleCode: 'RULE_1',
            ruleName: '规则一',
            ruleType,
            conditionMode: 'CONDITIONAL',
            conditionRelation: 'AND',
            executionTimings: ['FORM_LOAD', 'VALUE_CHANGE'],
            sourceType: 'MANUAL',
            ruleStatus: 'ENABLED',
            conditions: [condition],
            actions: [action],
        },
    ],
})

const rejects = (value: unknown, message: RegExp) => {
    assert.throws(
        () => parseAppFormRenderSchema(value),
        (error: unknown) => {
            assert.ok(error instanceof AppFormRuleContractValidationError)
            assert.match((error as Error).message, message)
            return true
        },
    )
}

test('routes empty and rule-bearing legacy schemas to the legacy adapter branch', () => {
    const empty = parseAppFormRenderSchema({ schemaVersion: '2.0' })
    assert.equal(empty.kind, 'legacy')
    assert.equal(empty.requiresLegacyAdapter, false)

    const versionless = parseAppFormRenderSchema({})
    assert.equal(versionless.kind, 'legacy')

    const withRules = parseAppFormRenderSchema({
        rules: [{ ruleCode: 'LEGACY_RULE', actions: [], conditions: [] }],
    })
    assert.equal(withRules.kind, 'legacy')
    assert.equal(withRules.requiresLegacyAdapter, true)
})

test('parses and asserts a valid v1 contract', () => {
    const schema = v1Schema()
    const parsed = parseAppFormRenderSchema(schema)

    assert.equal(parsed.kind, 'rule-contract-v1')
    assert.doesNotThrow(() => assertAppFormRenderSchema(schema))
})

test('accepts backend schema version 2.2 for runtime rendering', () => {
    const renderOnly = parseAppFormRenderSchema({
        schemaVersion: '2.2',
        pageLayout: { designTree: [] },
        dataDomains: [],
        rules: [],
    })
    assert.equal(renderOnly.kind, 'legacy')
    assert.equal(renderOnly.requiresLegacyAdapter, false)

    const withRuleContract = parseAppFormRenderSchema({
        ...v1Schema(),
        schemaVersion: '2.2',
    })
    assert.equal(withRuleContract.kind, 'rule-contract-v1')
})

test('accepts current backend RVO context and target descriptions', () => {
    const schema = v1Schema()
    const rule = schema.rules[0] as Record<string, unknown>
    rule.formId = 'form-1'
    rule.formVersionId = 'version-1'
    rule.formVersionNo = 'V1'
    const action = (rule.actions as Array<Record<string, unknown>>)[0]!
    action.targetTypeDesc = '字段'

    assert.doesNotThrow(() => parseAppFormRenderSchema(schema))
})

test('accepts null optional fields from backend render schema', () => {
    const schema = {
        ...v1Schema(),
        form: {
            formId: 'form-1',
            formCode: 'PERSONNEL_EMPLOYEE_ROSTER',
            formName: '员工花名册',
            appCode: 'APP_HR',
            versionId: 'version-1',
            versionNo: 'v1',
        },
        pageLayout: {
            layoutType: null,
            designTree: [
                {
                    id: 'root',
                    parentId: null,
                    nodeType: 'CONTAINER',
                    nodeCode: 'ROOT',
                    nodeName: '根节点',
                    containerType: 'TABS',
                    regionType: null,
                    fieldId: null,
                    gridSpan: null,
                    widthConfig: null,
                    heightConfig: null,
                    nodeConfigJson: null,
                    children: [],
                },
            ],
        },
        dataDomains: [
            {
                dataDomainId: 'domain-employee',
                domainCode: 'employee',
                domainName: '员工',
                domainType: 'OBJECT',
                physicalTableName: 'hr_employee',
                parentDomainId: null,
                parentFieldCode: null,
                fields: [
                    {
                        fieldId: 'field-employee-no',
                        fieldCode: 'employeeNo',
                        fieldName: '工号',
                        fieldLabel: '工号',
                        dataSourceId: null,
                        dataSourceCode: null,
                        dataSourceName: null,
                        controlProps: null,
                        formItemProps: null,
                        optionSource: null,
                        validation: null,
                        sortNo: null,
                    },
                ],
            },
        ],
    }

    assert.doesNotThrow(() => parseAppFormRenderSchema(schema))
})

test('fails fast for missing or unsupported contract versions', () => {
    rejects({ schemaVersion: '2.1', rules: [] }, /ruleContractVersion/)
    rejects(
        { schemaVersion: '2.1', ruleContractVersion: '2.0', rules: [] },
        /ruleContractVersion/,
    )
    rejects({ ruleContractVersion: '1.0', rules: [] }, /schemaVersion/)
    rejects({ schemaVersion: '3.0' }, /schemaVersion/)
})

test('requires v1 rules, conditions, and actions to be objects', () => {
    rejects(
        { schemaVersion: '2.1', ruleContractVersion: '1.0', rules: [null] },
        /rules\[0\]/,
    )
    rejects(v1Schema(filterAction(), 'LINKAGE', null), /conditions\[0\]/)

    const schema = v1Schema()
    schema.rules[0]!.actions = [null as unknown as Record<string, unknown>]
    rejects(schema, /actions\[0\]/)
})

test('validates the base schema shape before returning typed data', () => {
    rejects({ ...v1Schema(), scene: 1 }, /scene/)
    rejects({ ...v1Schema(), form: [] }, /form/)
    rejects({ ...v1Schema(), pageLayout: { designTree: {} } }, /designTree/)
    rejects(
        {
            ...v1Schema(),
            pageLayout: {
                designTree: [
                    {
                        id: 'root',
                        nodeType: 'CONTAINER',
                        nodeCode: 'ROOT',
                        children: [
                            { id: 'child', nodeType: 1, nodeCode: 'CHILD' },
                        ],
                    },
                ],
            },
        },
        /children\[0\]\.nodeType/,
    )
    rejects({ ...v1Schema(), dataDomains: {} }, /dataDomains/)
    rejects(
        {
            ...v1Schema(),
            dataDomains: [
                {
                    domainCode: 'employee',
                    domainType: 'OBJECT',
                    fields: [
                        {
                            fieldCode: 'status',
                            controlProps: [],
                        },
                    ],
                },
            ],
        },
        /controlProps/,
    )
    rejects(
        {
            ...v1Schema(),
            dataDomains: [
                {
                    domainCode: 'employee',
                    domainType: 'OBJECT',
                    fields: [{ fieldCode: 'status', options: {} }],
                },
            ],
        },
        /options/,
    )
})

test('rejects unknown rule, action, condition, and scope types', () => {
    rejects(v1Schema(filterAction(), 'SCRIPT'), /ruleType/)
    rejects(v1Schema({ actionType: 'EXECUTE', ...fieldTarget }), /actionType/)
    rejects(
        v1Schema(filterAction(), 'LINKAGE', {
            ...constantCondition(),
            operatorCode: 'RUN',
        }),
        /operatorCode/,
    )
    rejects(
        v1Schema(filterAction(), 'LINKAGE', {
            ...constantCondition(),
            sourceRowScope: 'MATCHED_ROWS',
        }),
        /sourceRowScope/,
    )
})

test('strictly validates FILTER_OPTIONS config and binding keys', () => {
    rejects(
        v1Schema({
            ...filterAction(),
            actionValue: {
                clearWhenDependencyChanges: true,
                bindings: [],
                script: 'return true',
            },
        }),
        /script/,
    )
    rejects(
        v1Schema({
            ...filterAction(),
            actionValue: {
                bindings: [
                    {
                        operandType: 'FIELD',
                        dataDomainCode: 'employee',
                        fieldCode: 'status',
                        callback: 'loadOptions',
                    },
                ],
            },
        }),
        /callback/,
    )
    rejects(
        v1Schema({
            ...filterAction(),
            actionValue: { bindings: [], cacheKey: 'status' },
        }),
        /cacheKey/,
    )
})

test('validates SET_VALUE shell without inspecting business value keys', () => {
    assert.doesNotThrow(() =>
        parseAppFormRenderSchema(
            v1Schema({
                actionType: 'SET_VALUE',
                ...fieldTarget,
                actionValue: {
                    operandType: 'CONSTANT',
                    value: {
                        url: 'https://example.test/callback',
                        callback: 'business-data',
                        expression: 'display text',
                        functionName: 'also-business-data',
                    },
                },
            }),
        ),
    )

    rejects(
        v1Schema({
            actionType: 'SET_VALUE',
            ...fieldTarget,
            actionValue: {
                operandType: 'CONSTANT',
                value: 'ACTIVE',
                expression: 'execute me',
            },
        }),
        /expression/,
    )

    assert.doesNotThrow(() =>
        parseAppFormRenderSchema(
            v1Schema({
                actionType: 'SET_VALUE',
                ...fieldTarget,
                actionValue: {
                    operandType: 'FIELD',
                    dataDomainCode: 'employee',
                    fieldCode: 'status',
                    rowScope: 'ROOT_OBJECT',
                },
            }),
        ),
    )
})

test('recursively rejects executable keys inside VALIDATE actionValue', () => {
    rejects(
        v1Schema(
            {
                actionType: 'VALIDATE',
                ...fieldTarget,
                validationType: 'CUSTOM',
                actionValue: {
                    rules: [{ config: { script: 'return true' } }],
                },
            },
            'VALIDATION',
        ),
        /script/,
    )
    rejects(
        v1Schema(
            {
                actionType: 'VALIDATE',
                ...fieldTarget,
                actionValue: [{ callback: 'executeValidation' }],
            },
            'VALIDATION',
        ),
        /callback/,
    )
})

test('rejects actionValue for value-less actions and incompatible rule actions', () => {
    rejects(
        v1Schema(
            { actionType: 'SHOW', ...fieldTarget, actionValue: true },
            'VISIBILITY',
        ),
        /actionValue/,
    )
    rejects(
        v1Schema({ actionType: 'SHOW', ...fieldTarget }, 'VALIDATION'),
        /VALIDATION/,
    )
})
