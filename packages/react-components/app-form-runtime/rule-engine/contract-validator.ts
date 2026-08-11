import type {
    AppFormRenderSchema,
    LegacyAppFormRenderSchema,
    RuleContractV1Schema,
} from '../types'
import type {
    AppFormRuntimeRuleActionType,
    AppFormRuntimeRuleOperator,
    AppFormRuntimeRuleSourceType,
    AppFormRuntimeRuleTargetType,
    AppFormRuntimeRuleType,
    AppFormRuntimeValueType,
} from './types'

export type AppFormRuleContractValidationErrorCode =
    | 'INVALID_SCHEMA'
    | 'UNSUPPORTED_SCHEMA_VERSION'
    | 'UNSUPPORTED_RULE_CONTRACT_VERSION'
    | 'INVALID_RULE_CONTRACT'

export class AppFormRuleContractValidationError extends Error {
    readonly code: AppFormRuleContractValidationErrorCode
    readonly path: string

    constructor(
        code: AppFormRuleContractValidationErrorCode,
        path: string,
        message: string,
    ) {
        super(`${path}: ${message}`)
        this.name = 'AppFormRuleContractValidationError'
        this.code = code
        this.path = path
    }
}

export interface LegacyAppFormSchemaParseResult {
    kind: 'legacy'
    schema: LegacyAppFormRenderSchema
    requiresLegacyAdapter: boolean
}

export interface RuleContractV1SchemaParseResult {
    kind: 'rule-contract-v1'
    schema: RuleContractV1Schema
}

export type AppFormSchemaParseResult =
    | LegacyAppFormSchemaParseResult
    | RuleContractV1SchemaParseResult

const RULE_TYPES: readonly AppFormRuntimeRuleType[] = [
    'VALIDATION',
    'VISIBILITY',
    'REQUIRED',
    'EDITABLE',
    'LINKAGE',
]
const RULE_SOURCE_TYPES: readonly AppFormRuntimeRuleSourceType[] = [
    'MANUAL',
    'FIELD_VALIDATION',
    'SYSTEM',
]
const ACTION_TYPES: readonly AppFormRuntimeRuleActionType[] = [
    'VALIDATE',
    'SHOW',
    'HIDE',
    'SET_REQUIRED',
    'UNSET_REQUIRED',
    'SET_READONLY',
    'SET_EDITABLE',
    'SET_VALUE',
    'CLEAR_VALUE',
    'FILTER_OPTIONS',
    'SET_ENABLED',
    'SET_DISABLED',
]
const TARGET_TYPES: readonly AppFormRuntimeRuleTargetType[] = [
    'FIELD',
    'DESIGN_NODE',
    'DATA_DOMAIN',
]
const OPERATORS: readonly AppFormRuntimeRuleOperator[] = [
    'EQ',
    'NE',
    'GT',
    'GE',
    'LT',
    'LE',
    'IN',
    'NOT_IN',
    'BETWEEN',
    'CONTAINS',
    'NOT_CONTAINS',
    'STARTS_WITH',
    'ENDS_WITH',
    'EMPTY',
    'NOT_EMPTY',
]
const VALUE_TYPES: readonly AppFormRuntimeValueType[] = [
    'STRING',
    'INTEGER',
    'DECIMAL',
    'BOOLEAN',
    'DATE',
    'TIME',
    'DATETIME',
    'JSON',
    'STRING_LIST',
    'NUMBER_LIST',
]

const CONDITION_ROW_SCOPES = [
    'ROOT_OBJECT',
    'CURRENT_ROW',
    'ANY_ROW',
    'ALL_ROWS',
] as const
const COMPARE_ROW_SCOPES = ['ROOT_OBJECT', 'CURRENT_ROW'] as const
const TARGET_ROW_SCOPES = ['CURRENT_ROW', 'ALL_ROWS', 'MATCHED_ROWS'] as const
const CONDITION_MODES = ['ALWAYS', 'CONDITIONAL'] as const
const CONDITION_RELATIONS = ['AND', 'OR'] as const
const EXECUTION_TIMINGS = ['FORM_LOAD', 'VALUE_CHANGE', 'SUBMIT'] as const
const RULE_STATUSES = ['ENABLED', 'DISABLED'] as const
const FORBIDDEN_EXECUTABLE_KEYS = [
    'script',
    'expression',
    'functionName',
    'callback',
    'url',
    'eval',
] as const

const RULE_ACTIONS: Record<
    AppFormRuntimeRuleType,
    readonly AppFormRuntimeRuleActionType[]
> = {
    VALIDATION: ['VALIDATE'],
    VISIBILITY: ['SHOW', 'HIDE'],
    REQUIRED: ['SET_REQUIRED', 'UNSET_REQUIRED'],
    EDITABLE: ['SET_READONLY', 'SET_EDITABLE', 'SET_ENABLED', 'SET_DISABLED'],
    LINKAGE: ['SET_VALUE', 'CLEAR_VALUE', 'FILTER_OPTIONS'],
}

const ACTION_TARGETS: Record<
    AppFormRuntimeRuleActionType,
    readonly AppFormRuntimeRuleTargetType[]
> = {
    VALIDATE: ['FIELD'],
    SHOW: ['FIELD', 'DESIGN_NODE', 'DATA_DOMAIN'],
    HIDE: ['FIELD', 'DESIGN_NODE', 'DATA_DOMAIN'],
    SET_REQUIRED: ['FIELD'],
    UNSET_REQUIRED: ['FIELD'],
    SET_READONLY: ['FIELD', 'DESIGN_NODE', 'DATA_DOMAIN'],
    SET_EDITABLE: ['FIELD', 'DESIGN_NODE', 'DATA_DOMAIN'],
    SET_ENABLED: ['FIELD', 'DESIGN_NODE'],
    SET_DISABLED: ['FIELD', 'DESIGN_NODE'],
    SET_VALUE: ['FIELD'],
    CLEAR_VALUE: ['FIELD'],
    FILTER_OPTIONS: ['FIELD'],
}

const RULE_KEYS = new Set([
    'id',
    'formId',
    'formVersionId',
    'formVersionNo',
    'ruleCode',
    'ruleName',
    'ruleType',
    'ruleTypeDesc',
    'conditionMode',
    'conditionModeDesc',
    'conditionRelation',
    'conditionRelationDesc',
    'executionTimings',
    'sourceType',
    'sourceTypeDesc',
    'ruleDescription',
    'ruleStatus',
    'ruleStatusDesc',
    'priorityNo',
    'sortNo',
    'anchorDataDomainId',
    'anchorDataDomainCode',
    'conditions',
    'actions',
])

const CONDITION_KEYS = new Set([
    'id',
    'conditionGroupNo',
    'conditionRelation',
    'conditionRelationDesc',
    'sourceDataDomainId',
    'sourceDataDomainCode',
    'sourceFieldId',
    'sourceFieldCode',
    'sourceRowScope',
    'sourceRowScopeDesc',
    'operatorCode',
    'operatorCodeDesc',
    'operandType',
    'operandTypeDesc',
    'compareDataDomainId',
    'compareDataDomainCode',
    'compareFieldId',
    'compareFieldCode',
    'compareRowScope',
    'compareRowScopeDesc',
    'valueType',
    'valueTypeDesc',
    'compareValue',
    'sortNo',
])

const ACTION_KEYS = new Set([
    'id',
    'actionType',
    'actionTypeDesc',
    'targetType',
    'targetTypeDesc',
    'targetDataDomainId',
    'targetDataDomainCode',
    'targetFieldId',
    'targetFieldCode',
    'targetDesignNodeId',
    'targetDesignNodeCode',
    'targetRowScope',
    'targetRowScopeDesc',
    'validationType',
    'validationTypeDesc',
    'failureMessage',
    'actionValue',
    'sortNo',
])

const FILTER_OPTIONS_VALUE_KEYS = new Set([
    'clearWhenDependencyChanges',
    'bindings',
])
const CONSTANT_SET_VALUE_KEYS = new Set(['operandType', 'value'])
const FIELD_REFERENCE_KEYS = new Set([
    'operandType',
    'dataDomainId',
    'dataDomainCode',
    'fieldId',
    'fieldCode',
    'rowScope',
])
const FILTER_BINDING_KEYS = new Set([...FIELD_REFERENCE_KEYS, 'parameterName'])
const RULE_CONTRACT_SCHEMA_VERSIONS = new Set(['2.1', '2.2'])

type JsonObject = Record<string, unknown>

const hasOwn = (value: JsonObject, key: string) =>
    Object.prototype.hasOwnProperty.call(value, key)

const fail = (
    code: AppFormRuleContractValidationErrorCode,
    path: string,
    message: string,
): never => {
    throw new AppFormRuleContractValidationError(code, path, message)
}

const asObject = (
    value: unknown,
    path: string,
    code: AppFormRuleContractValidationErrorCode = 'INVALID_RULE_CONTRACT',
): JsonObject => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return fail(code, path, '必须是对象')
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
        return fail(code, path, '必须是普通 JSON 对象')
    }
    return value as JsonObject
}

const assertJsonValue = (value: unknown, path: string): void => {
    if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean'
    ) {
        return
    }
    if (typeof value === 'number') {
        if (Number.isFinite(value)) return
        fail('INVALID_RULE_CONTRACT', path, 'JSON 数字必须是有限值')
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) =>
            assertJsonValue(item, `${path}[${index}]`),
        )
        return
    }
    if (value && typeof value === 'object') {
        const object = asObject(value, path)
        Object.entries(object).forEach(([key, item]) =>
            assertJsonValue(item, `${path}.${key}`),
        )
        return
    }
    fail('INVALID_RULE_CONTRACT', path, '必须是 JSON 值')
}

function assertString(value: unknown, path: string): asserts value is string {
    if (typeof value !== 'string' || !value) {
        fail('INVALID_RULE_CONTRACT', path, '必须是非空字符串')
    }
}

const assertOptionalString = (value: unknown, path: string) => {
    if (value !== undefined && typeof value !== 'string') {
        fail('INVALID_RULE_CONTRACT', path, '必须是字符串')
    }
}

const assertOptionalNumber = (value: unknown, path: string) => {
    if (value !== undefined && typeof value !== 'number') {
        fail('INVALID_RULE_CONTRACT', path, '必须是数字')
    }
}

function assertKnownValue<T extends string>(
    value: unknown,
    allowed: readonly T[],
    path: string,
): asserts value is T {
    if (typeof value !== 'string' || !allowed.includes(value as T)) {
        fail('INVALID_RULE_CONTRACT', path, `不支持的值 ${String(value)}`)
    }
}

function assertArray(
    value: unknown,
    path: string,
    code: AppFormRuleContractValidationErrorCode = 'INVALID_RULE_CONTRACT',
): asserts value is unknown[] {
    if (!Array.isArray(value)) {
        fail(code, path, '必须是数组')
    }
}

const assertSchemaString = (value: unknown, path: string, required = false) => {
    if (typeof value !== 'string' || (required && !value)) {
        fail(
            'INVALID_SCHEMA',
            path,
            required ? '必须是非空字符串' : '必须是字符串',
        )
    }
}

const assertOptionalSchemaString = (value: unknown, path: string) => {
    if (value !== undefined && value !== null) assertSchemaString(value, path)
}

const assertOptionalSchemaNumber = (value: unknown, path: string) => {
    if (value !== undefined && value !== null && typeof value !== 'number') {
        fail('INVALID_SCHEMA', path, '必须是数字')
    }
}

const assertDesignNode = (input: unknown, path: string) => {
    const node = asObject(input, path, 'INVALID_SCHEMA')
    assertSchemaString(node.id, `${path}.id`, true)
    assertSchemaString(node.nodeType, `${path}.nodeType`, true)
    assertSchemaString(node.nodeCode, `${path}.nodeCode`, true)
    for (const key of [
        'parentId',
        'nodeName',
        'containerType',
        'regionType',
        'fieldId',
        'widthConfig',
        'heightConfig',
    ]) {
        assertOptionalSchemaString(node[key], `${path}.${key}`)
    }
    assertOptionalSchemaNumber(node.sortNo, `${path}.sortNo`)
    assertOptionalSchemaNumber(node.gridSpan, `${path}.gridSpan`)
    if (
        node.nodeConfigJson !== undefined &&
        node.nodeConfigJson !== null &&
        typeof node.nodeConfigJson !== 'string'
    ) {
        asObject(
            node.nodeConfigJson,
            `${path}.nodeConfigJson`,
            'INVALID_SCHEMA',
        )
    }
    if (node.children !== undefined) {
        assertArray(node.children, `${path}.children`, 'INVALID_SCHEMA')
        node.children.forEach((child, index) =>
            assertDesignNode(child, `${path}.children[${index}]`),
        )
    }
}

const assertFieldOption = (input: unknown, path: string) => {
    const option = asObject(input, path, 'INVALID_SCHEMA')
    if (!hasOwn(option, 'label')) {
        fail('INVALID_SCHEMA', `${path}.label`, '缺少选项标签')
    }
    if (
        typeof option.value !== 'string' &&
        typeof option.value !== 'number' &&
        typeof option.value !== 'boolean'
    ) {
        fail('INVALID_SCHEMA', `${path}.value`, '必须是字符串、数字或布尔值')
    }
    if (option.disabled !== undefined && typeof option.disabled !== 'boolean') {
        fail('INVALID_SCHEMA', `${path}.disabled`, '必须是布尔值')
    }
}

const assertRuntimeField = (input: unknown, path: string) => {
    const field = asObject(input, path, 'INVALID_SCHEMA')
    assertSchemaString(field.fieldCode, `${path}.fieldCode`, true)
    for (const key of [
        'fieldId',
        'id',
        'dataDomainId',
        'dataDomainCode',
        'dataDomainType',
        'fieldName',
        'fieldLabel',
        'uiLabel',
        'valueType',
        'controlType',
        'dataSourceType',
        'dataSourceId',
        'dataSourceCode',
        'dataSourceName',
    ]) {
        assertOptionalSchemaString(field[key], `${path}.${key}`)
    }
    for (const key of ['controlProps', 'formItemProps', 'optionSource']) {
        if (field[key] !== undefined && field[key] !== null) {
            asObject(field[key], `${path}.${key}`, 'INVALID_SCHEMA')
        }
    }
    if (field.validation !== undefined && field.validation !== null) {
        const validation = asObject(
            field.validation,
            `${path}.validation`,
            'INVALID_SCHEMA',
        )
        if (validation.rules !== undefined) {
            assertArray(
                validation.rules,
                `${path}.validation.rules`,
                'INVALID_SCHEMA',
            )
            validation.rules.forEach((rule, index) =>
                asObject(
                    rule,
                    `${path}.validation.rules[${index}]`,
                    'INVALID_SCHEMA',
                ),
            )
        }
    }
    for (const key of ['capabilities', 'security']) {
        if (field[key] !== undefined) {
            asObject(field[key], `${path}.${key}`, 'INVALID_SCHEMA')
        }
    }
    if (field.options !== undefined) {
        assertArray(field.options, `${path}.options`, 'INVALID_SCHEMA')
        field.options.forEach((option, index) =>
            assertFieldOption(option, `${path}.options[${index}]`),
        )
    }
}

const assertRuntimeDomain = (input: unknown, path: string) => {
    const domain = asObject(input, path, 'INVALID_SCHEMA')
    assertSchemaString(domain.domainCode, `${path}.domainCode`, true)
    assertSchemaString(domain.domainType, `${path}.domainType`, true)
    for (const key of [
        'dataDomainId',
        'domainName',
        'storageMode',
        'physicalTableName',
        'parentDomainId',
        'parentFieldCode',
    ]) {
        assertOptionalSchemaString(domain[key], `${path}.${key}`)
    }
    if (domain.editable !== undefined && typeof domain.editable !== 'boolean') {
        fail('INVALID_SCHEMA', `${path}.editable`, '必须是布尔值')
    }
    assertArray(domain.fields, `${path}.fields`, 'INVALID_SCHEMA')
    domain.fields.forEach((field, index) =>
        assertRuntimeField(field, `${path}.fields[${index}]`),
    )
}

// 基础 Schema 允许额外展示属性，但进入渲染器前必须验证其结构骨架。
const assertSchemaBase = (schema: JsonObject) => {
    if (schema.scene !== undefined) {
        assertSchemaString(schema.scene, '$.scene')
    }
    if (schema.form !== undefined) {
        const form = asObject(schema.form, '$.form', 'INVALID_SCHEMA')
        for (const key of [
            'formId',
            'formCode',
            'formName',
            'appCode',
            'versionId',
            'versionNo',
        ]) {
            assertOptionalSchemaString(form[key], `$.form.${key}`)
        }
    }
    if (schema.pageLayout !== undefined) {
        const layout = asObject(
            schema.pageLayout,
            '$.pageLayout',
            'INVALID_SCHEMA',
        )
        assertOptionalSchemaString(layout.layoutType, '$.pageLayout.layoutType')
        if (layout.designTree !== undefined) {
            assertArray(
                layout.designTree,
                '$.pageLayout.designTree',
                'INVALID_SCHEMA',
            )
            layout.designTree.forEach((node, index) =>
                assertDesignNode(node, `$.pageLayout.designTree[${index}]`),
            )
        }
    }
    if (schema.dataDomains !== undefined) {
        assertArray(schema.dataDomains, '$.dataDomains', 'INVALID_SCHEMA')
        schema.dataDomains.forEach((domain, index) =>
            assertRuntimeDomain(domain, `$.dataDomains[${index}]`),
        )
    }
}

const assertAllowedKeys = (
    value: JsonObject,
    allowed: ReadonlySet<string>,
    path: string,
) => {
    for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
            fail('INVALID_RULE_CONTRACT', `${path}.${key}`, '不允许的配置键')
        }
    }
}

const assertNoExecutableKeys = (value: JsonObject, path: string) => {
    for (const key of FORBIDDEN_EXECUTABLE_KEYS) {
        if (hasOwn(value, key)) {
            fail('INVALID_RULE_CONTRACT', `${path}.${key}`, '禁止可执行入口')
        }
    }
}

const assertNoExecutableKeysDeep = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
        value.forEach((item, index) =>
            assertNoExecutableKeysDeep(item, `${path}[${index}]`),
        )
        return
    }
    if (!value || typeof value !== 'object') return
    const object = asObject(value, path)
    assertNoExecutableKeys(object, path)
    Object.entries(object).forEach(([key, item]) =>
        assertNoExecutableKeysDeep(item, `${path}.${key}`),
    )
}

const assertAbsentKeys = (
    value: JsonObject,
    keys: readonly string[],
    path: string,
    message: string,
) => {
    for (const key of keys) {
        if (hasOwn(value, key)) {
            fail('INVALID_RULE_CONTRACT', `${path}.${key}`, message)
        }
    }
}

const assertFieldReference = (
    value: JsonObject,
    path: string,
    allowedKeys: ReadonlySet<string>,
) => {
    assertNoExecutableKeys(value, path)
    assertAllowedKeys(value, allowedKeys, path)
    assertKnownValue(value.operandType, ['FIELD'], `${path}.operandType`)
    assertString(value.dataDomainCode, `${path}.dataDomainCode`)
    assertString(value.fieldCode, `${path}.fieldCode`)
    assertOptionalString(value.dataDomainId, `${path}.dataDomainId`)
    assertOptionalString(value.fieldId, `${path}.fieldId`)
    if (value.rowScope !== undefined) {
        assertKnownValue(value.rowScope, COMPARE_ROW_SCOPES, `${path}.rowScope`)
    }
    if (hasOwn(value, 'parameterName')) {
        assertOptionalString(value.parameterName, `${path}.parameterName`)
    }
}

const assertCondition = (input: unknown, path: string) => {
    const condition = asObject(input, path)
    assertAllowedKeys(condition, CONDITION_KEYS, path)
    assertString(condition.sourceDataDomainCode, `${path}.sourceDataDomainCode`)
    assertString(condition.sourceFieldCode, `${path}.sourceFieldCode`)
    assertKnownValue(condition.operatorCode, OPERATORS, `${path}.operatorCode`)
    for (const key of [
        'id',
        'conditionRelationDesc',
        'sourceDataDomainId',
        'sourceFieldId',
        'sourceRowScopeDesc',
        'operatorCodeDesc',
        'operandTypeDesc',
        'compareDataDomainId',
        'compareDataDomainCode',
        'compareFieldId',
        'compareFieldCode',
        'compareRowScopeDesc',
        'valueTypeDesc',
    ]) {
        assertOptionalString(condition[key], `${path}.${key}`)
    }
    assertOptionalNumber(condition.conditionGroupNo, `${path}.conditionGroupNo`)
    assertOptionalNumber(condition.sortNo, `${path}.sortNo`)
    if (condition.conditionRelation !== undefined) {
        assertKnownValue(
            condition.conditionRelation,
            CONDITION_RELATIONS,
            `${path}.conditionRelation`,
        )
    }

    if (condition.sourceRowScope !== undefined) {
        assertKnownValue(
            condition.sourceRowScope,
            CONDITION_ROW_SCOPES,
            `${path}.sourceRowScope`,
        )
    }
    if (condition.valueType !== undefined) {
        assertKnownValue(condition.valueType, VALUE_TYPES, `${path}.valueType`)
    }

    const operandType = condition.operandType ?? 'CONSTANT'
    assertKnownValue(operandType, ['CONSTANT', 'FIELD'], `${path}.operandType`)
    if (operandType === 'FIELD') {
        assertString(
            condition.compareDataDomainCode,
            `${path}.compareDataDomainCode`,
        )
        assertString(condition.compareFieldCode, `${path}.compareFieldCode`)
        if (condition.compareRowScope !== undefined) {
            assertKnownValue(
                condition.compareRowScope,
                COMPARE_ROW_SCOPES,
                `${path}.compareRowScope`,
            )
        }
        if (hasOwn(condition, 'compareValue')) {
            fail(
                'INVALID_RULE_CONTRACT',
                `${path}.compareValue`,
                '字段比较不能携带常量',
            )
        }
        assertAbsentKeys(
            condition,
            ['valueType', 'valueTypeDesc'],
            path,
            '字段比较不能携带常量值类型',
        )
        return
    }

    assertAbsentKeys(
        condition,
        [
            'compareDataDomainId',
            'compareDataDomainCode',
            'compareFieldId',
            'compareFieldCode',
            'compareRowScope',
            'compareRowScopeDesc',
        ],
        path,
        '常量比较不能携带字段引用',
    )
    if (hasOwn(condition, 'compareValue')) {
        assertJsonValue(condition.compareValue, `${path}.compareValue`)
    }
}

const assertActionValue = (
    action: JsonObject,
    actionType: AppFormRuntimeRuleActionType,
    path: string,
) => {
    const valuePath = `${path}.actionValue`
    if (actionType === 'FILTER_OPTIONS') {
        const value = asObject(action.actionValue, valuePath)
        assertNoExecutableKeys(value, valuePath)
        assertAllowedKeys(value, FILTER_OPTIONS_VALUE_KEYS, valuePath)
        if (
            value.clearWhenDependencyChanges !== undefined &&
            typeof value.clearWhenDependencyChanges !== 'boolean'
        ) {
            fail(
                'INVALID_RULE_CONTRACT',
                `${valuePath}.clearWhenDependencyChanges`,
                '必须是布尔值',
            )
        }
        const bindings = value.bindings
        assertArray(bindings, `${valuePath}.bindings`)
        bindings.forEach((binding, index) => {
            const bindingPath = `${valuePath}.bindings[${index}]`
            assertFieldReference(
                asObject(binding, bindingPath),
                bindingPath,
                FILTER_BINDING_KEYS,
            )
        })
        return
    }

    if (actionType === 'SET_VALUE') {
        const value = asObject(action.actionValue, valuePath)
        assertNoExecutableKeys(value, valuePath)
        assertKnownValue(
            value.operandType,
            ['CONSTANT', 'FIELD'],
            `${valuePath}.operandType`,
        )
        if (value.operandType === 'CONSTANT') {
            assertAllowedKeys(value, CONSTANT_SET_VALUE_KEYS, valuePath)
            if (!hasOwn(value, 'value')) {
                fail(
                    'INVALID_RULE_CONTRACT',
                    `${valuePath}.value`,
                    '缺少业务值',
                )
            }
            // value 是普通业务 JSON；这里刻意不递归扫描其字段名。
            assertJsonValue(value.value, `${valuePath}.value`)
            return
        }
        assertFieldReference(value, valuePath, FIELD_REFERENCE_KEYS)
        return
    }

    if (actionType === 'VALIDATE') {
        if (hasOwn(action, 'actionValue')) {
            assertJsonValue(action.actionValue, valuePath)
            assertNoExecutableKeysDeep(action.actionValue, valuePath)
        }
        return
    }

    if (hasOwn(action, 'actionValue')) {
        fail(
            'INVALID_RULE_CONTRACT',
            valuePath,
            `${actionType} 不接受 actionValue`,
        )
    }
}

const assertActionTarget = (
    action: JsonObject,
    actionType: AppFormRuntimeRuleActionType,
    path: string,
) => {
    const targetType = action.targetType ?? 'FIELD'
    assertKnownValue(targetType, TARGET_TYPES, `${path}.targetType`)
    if (!ACTION_TARGETS[actionType].includes(targetType)) {
        fail(
            'INVALID_RULE_CONTRACT',
            `${path}.targetType`,
            `${actionType} 不支持目标 ${targetType}`,
        )
    }
    if (targetType === 'FIELD') {
        assertString(
            action.targetDataDomainCode,
            `${path}.targetDataDomainCode`,
        )
        assertString(action.targetFieldCode, `${path}.targetFieldCode`)
        assertAbsentKeys(
            action,
            ['targetDesignNodeId', 'targetDesignNodeCode'],
            path,
            '字段目标不能携带节点',
        )
    } else if (targetType === 'DESIGN_NODE') {
        assertString(
            action.targetDesignNodeCode,
            `${path}.targetDesignNodeCode`,
        )
        assertAbsentKeys(
            action,
            [
                'targetDataDomainId',
                'targetDataDomainCode',
                'targetFieldId',
                'targetFieldCode',
                'targetRowScope',
                'targetRowScopeDesc',
            ],
            path,
            '节点目标不能携带字段、数据域或行作用域',
        )
    } else {
        assertString(
            action.targetDataDomainCode,
            `${path}.targetDataDomainCode`,
        )
        assertAbsentKeys(
            action,
            [
                'targetFieldId',
                'targetFieldCode',
                'targetDesignNodeId',
                'targetDesignNodeCode',
            ],
            path,
            '数据域目标不能携带字段或节点',
        )
    }
    if (action.targetRowScope !== undefined) {
        assertKnownValue(
            action.targetRowScope,
            TARGET_ROW_SCOPES,
            `${path}.targetRowScope`,
        )
    }
}

const assertAction = (
    input: unknown,
    ruleType: AppFormRuntimeRuleType,
    path: string,
) => {
    const action = asObject(input, path)
    assertNoExecutableKeys(action, path)
    assertAllowedKeys(action, ACTION_KEYS, path)
    assertKnownValue(action.actionType, ACTION_TYPES, `${path}.actionType`)
    for (const key of [
        'id',
        'actionTypeDesc',
        'targetTypeDesc',
        'targetDataDomainId',
        'targetDataDomainCode',
        'targetFieldId',
        'targetFieldCode',
        'targetDesignNodeId',
        'targetDesignNodeCode',
        'targetRowScopeDesc',
    ]) {
        assertOptionalString(action[key], `${path}.${key}`)
    }
    assertOptionalNumber(action.sortNo, `${path}.sortNo`)
    const actionType = action.actionType
    if (!RULE_ACTIONS[ruleType].includes(actionType)) {
        fail(
            'INVALID_RULE_CONTRACT',
            `${path}.actionType`,
            `${ruleType} 规则不支持动作 ${actionType}`,
        )
    }
    assertActionTarget(action, actionType, path)

    if (actionType === 'VALIDATE') {
        assertOptionalString(action.validationType, `${path}.validationType`)
        assertOptionalString(
            action.validationTypeDesc,
            `${path}.validationTypeDesc`,
        )
        assertOptionalString(action.failureMessage, `${path}.failureMessage`)
    } else {
        for (const key of [
            'validationType',
            'validationTypeDesc',
            'failureMessage',
        ]) {
            if (hasOwn(action, key)) {
                fail(
                    'INVALID_RULE_CONTRACT',
                    `${path}.${key}`,
                    '仅 VALIDATE 动作允许该字段',
                )
            }
        }
    }
    assertActionValue(action, actionType, path)
}

const assertRule = (input: unknown, path: string) => {
    const rule = asObject(input, path)
    assertAllowedKeys(rule, RULE_KEYS, path)
    assertString(rule.id, `${path}.id`)
    assertString(rule.ruleCode, `${path}.ruleCode`)
    assertString(rule.ruleName, `${path}.ruleName`)
    assertKnownValue(rule.ruleType, RULE_TYPES, `${path}.ruleType`)
    const ruleType = rule.ruleType
    assertKnownValue(
        rule.conditionMode,
        CONDITION_MODES,
        `${path}.conditionMode`,
    )
    assertKnownValue(
        rule.conditionRelation,
        CONDITION_RELATIONS,
        `${path}.conditionRelation`,
    )
    assertKnownValue(rule.sourceType, RULE_SOURCE_TYPES, `${path}.sourceType`)
    assertKnownValue(rule.ruleStatus, RULE_STATUSES, `${path}.ruleStatus`)
    for (const key of [
        'formId',
        'formVersionId',
        'formVersionNo',
        'ruleTypeDesc',
        'conditionModeDesc',
        'conditionRelationDesc',
        'sourceTypeDesc',
        'ruleDescription',
        'ruleStatusDesc',
        'anchorDataDomainId',
        'anchorDataDomainCode',
    ]) {
        assertOptionalString(rule[key], `${path}.${key}`)
    }
    assertOptionalNumber(rule.priorityNo, `${path}.priorityNo`)
    assertOptionalNumber(rule.sortNo, `${path}.sortNo`)

    const executionTimings = rule.executionTimings
    assertArray(executionTimings, `${path}.executionTimings`)
    executionTimings.forEach((timing, index) =>
        assertKnownValue(
            timing,
            EXECUTION_TIMINGS,
            `${path}.executionTimings[${index}]`,
        ),
    )
    const conditions = rule.conditions
    assertArray(conditions, `${path}.conditions`)
    conditions.forEach((condition, index) =>
        assertCondition(condition, `${path}.conditions[${index}]`),
    )
    const actions = rule.actions
    assertArray(actions, `${path}.actions`)
    actions.forEach((action, index) =>
        assertAction(action, ruleType, `${path}.actions[${index}]`),
    )
}

export const parseAppFormRenderSchema = (
    input: unknown,
): AppFormSchemaParseResult => {
    const schema = asObject(input, '$')
    assertSchemaBase(schema)
    const schemaVersion = schema.schemaVersion
    const ruleContractVersion = schema.ruleContractVersion

    if (
        schemaVersion === undefined ||
        schemaVersion === '2.0' ||
        (schemaVersion === '2.2' && ruleContractVersion === undefined)
    ) {
        if (ruleContractVersion !== undefined) {
            const path =
                schemaVersion === undefined
                    ? '$.schemaVersion'
                    : '$.ruleContractVersion'
            fail(
                'UNSUPPORTED_RULE_CONTRACT_VERSION',
                path,
                'Legacy Schema 不能声明规则契约版本',
            )
        }
        if (schema.rules !== undefined && !Array.isArray(schema.rules)) {
            fail('INVALID_SCHEMA', '$.rules', '必须是数组')
        }
        return {
            kind: 'legacy',
            schema: schema as unknown as LegacyAppFormRenderSchema,
            requiresLegacyAdapter:
                Array.isArray(schema.rules) && schema.rules.length > 0,
        }
    }

    if (
        typeof schemaVersion !== 'string' ||
        !RULE_CONTRACT_SCHEMA_VERSIONS.has(schemaVersion)
    ) {
        fail(
            'UNSUPPORTED_SCHEMA_VERSION',
            '$.schemaVersion',
            `不支持版本 ${String(schemaVersion)}`,
        )
    }
    if (ruleContractVersion !== '1.0') {
        fail(
            'UNSUPPORTED_RULE_CONTRACT_VERSION',
            '$.ruleContractVersion',
            `${schemaVersion} Schema 必须使用规则契约 1.0`,
        )
    }
    const rules = schema.rules
    assertArray(rules, '$.rules', 'INVALID_SCHEMA')
    rules.forEach((rule, index) => assertRule(rule, `$.rules[${index}]`))

    return {
        kind: 'rule-contract-v1',
        schema: schema as unknown as RuleContractV1Schema,
    }
}

export function assertAppFormRenderSchema(
    input: unknown,
): asserts input is AppFormRenderSchema {
    parseAppFormRenderSchema(input)
}
