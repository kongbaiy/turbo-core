import type {
    AppFormControlCapabilities,
    AppFormRenderSchema,
    LegacyAppFormRenderSchema,
    RuleContractV1Schema,
} from '../types'
import type {
    AppFormListFieldPath,
    AppFormObjectFieldPath,
    AppFormRuntimeRule,
    AppFormRuntimeRuleAction,
    AppFormRuntimeRuleCondition,
    AppFormRuntimeNormalizedValue,
    AppFormRuntimeRuleSourceType,
    AppFormRuntimeValueType,
} from './types'

const sourceTypeCoverage: Record<AppFormRuntimeRuleSourceType, true> = {
    MANUAL: true,
    FIELD_VALIDATION: true,
    SYSTEM: true,
}

const valueTypeCoverage: Record<AppFormRuntimeValueType, true> = {
    STRING: true,
    INTEGER: true,
    DECIMAL: true,
    BOOLEAN: true,
    DATE: true,
    TIME: true,
    DATETIME: true,
    JSON: true,
    STRING_LIST: true,
    NUMBER_LIST: true,
}

const objectPath: AppFormObjectFieldPath = ['employee', 'status']
const listPath: AppFormListFieldPath = ['changeLogs', 'row-1', 'changeType']
const normalizedBusinessValue: AppFormRuntimeNormalizedValue = {
    url: 'https://example.test/callback',
    callback: 'notifyOwner',
    expression: 'business-authored text',
    nested: { functionName: 'display-only' },
}

const objectCondition: AppFormRuntimeRuleCondition = {
    sourceDataDomainCode: 'employee',
    sourceFieldCode: 'status',
    sourceRowScope: 'ROOT_OBJECT',
    operatorCode: 'EQ',
    operandType: 'CONSTANT',
    compareValue: 'ACTIVE',
}

const listCurrentRowCondition: AppFormRuntimeRuleCondition = {
    sourceDataDomainCode: 'changeLogs',
    sourceFieldCode: 'changeType',
    sourceRowScope: 'CURRENT_ROW',
    operatorCode: 'EQ',
    operandType: 'FIELD',
    compareDataDomainCode: 'changeLogs',
    compareFieldCode: 'expectedType',
    compareRowScope: 'CURRENT_ROW',
}

const anyRowCondition: AppFormRuntimeRuleCondition = {
    sourceDataDomainCode: 'changeLogs',
    sourceFieldCode: 'approved',
    sourceRowScope: 'ANY_ROW',
    operatorCode: 'EQ',
    operandType: 'CONSTANT',
    compareValue: true,
}

const designNodeAction: AppFormRuntimeRuleAction = {
    actionType: 'SET_DISABLED',
    targetType: 'DESIGN_NODE',
    targetDesignNodeCode: 'change-log-region',
}

const linkageRule: AppFormRuntimeRule = {
    id: 'rule-1',
    ruleCode: 'FILTER_CHANGE_TYPE',
    ruleName: '按员工状态过滤异动类型',
    ruleType: 'LINKAGE',
    conditionMode: 'CONDITIONAL',
    conditionRelation: 'AND',
    executionTimings: ['FORM_LOAD', 'VALUE_CHANGE'],
    sourceType: 'MANUAL',
    ruleStatus: 'ENABLED',
    anchorDataDomainCode: 'changeLogs',
    conditions: [objectCondition, listCurrentRowCondition, anyRowCondition],
    actions: [
        {
            actionType: 'FILTER_OPTIONS',
            targetType: 'FIELD',
            targetDataDomainCode: 'changeLogs',
            targetFieldCode: 'changeType',
            targetRowScope: 'MATCHED_ROWS',
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
        },
    ],
}

const schema: RuleContractV1Schema = {
    schemaVersion: '2.1',
    ruleContractVersion: '1.0',
    rules: [linkageRule],
}

const capabilities: AppFormControlCapabilities = {
    supportsReadonly: true,
    supportsDisabled: true,
    supportsOptions: true,
    supportsOptionFilter: true,
    valueKind: 'SINGLE_OPTION',
    emptyValueStrategy: 'UNDEFINED',
}

const legacySchema: AppFormRenderSchema = {
    schemaVersion: '2.0',
    rules: [
        {
            ruleCode: 'LEGACY_SHOW_STATUS',
            ruleType: 'VISIBILITY',
            conditions: [
                {
                    sourceDataDomainCode: 'employee',
                    sourceFieldCode: 'status',
                    operatorCode: 'EQ',
                    compareValue: 'ACTIVE',
                },
            ],
            actions: [
                {
                    actionType: 'SHOW',
                    targetDataDomainCode: 'employee',
                    targetFieldCode: 'statusReason',
                },
            ],
        },
    ],
}

const versionlessLegacySchema: LegacyAppFormRenderSchema = {
    rules: legacySchema.rules,
}

// @ts-expect-error V1 Schema 不能作为 Legacy Schema 使用
const invalidLegacyFromV1: LegacyAppFormRenderSchema = schema

// MATCHED_ROWS 是规则匹配结果和动作作用域，不能作为条件取值作用域。
const invalidCondition: AppFormRuntimeRuleCondition = {
    sourceDataDomainCode: 'changeLogs',
    sourceFieldCode: 'changeType',
    // @ts-expect-error MATCHED_ROWS 不能用于条件行作用域
    sourceRowScope: 'MATCHED_ROWS',
    operatorCode: 'NOT_EMPTY',
    operandType: 'CONSTANT',
}

const invalidNodeAction: AppFormRuntimeRuleAction = {
    actionType: 'HIDE',
    targetType: 'DESIGN_NODE',
    targetDesignNodeCode: 'change-log-region',
    // @ts-expect-error 节点目标没有行作用域
    targetRowScope: 'ALL_ROWS',
}

// @ts-expect-error VALIDATE 只能作用于 FIELD
const invalidValidationNodeAction: AppFormRuntimeRuleAction = {
    actionType: 'VALIDATE',
    targetType: 'DESIGN_NODE',
    targetDesignNodeCode: 'change-log-region',
    validationType: 'REQUIRED',
}

// @ts-expect-error SET_REQUIRED 只能作用于 FIELD
const invalidRequiredNodeAction: AppFormRuntimeRuleAction = {
    actionType: 'SET_REQUIRED',
    targetType: 'DESIGN_NODE',
    targetDesignNodeCode: 'change-log-region',
}

// @ts-expect-error SET_ENABLED 不能作用于 DATA_DOMAIN
const invalidEnabledDomainAction: AppFormRuntimeRuleAction = {
    actionType: 'SET_ENABLED',
    targetType: 'DATA_DOMAIN',
    targetDataDomainCode: 'changeLogs',
}

// @ts-expect-error SET_VALUE 只能作用于 FIELD
const invalidLinkageNodeAction: AppFormRuntimeRuleAction = {
    actionType: 'SET_VALUE',
    targetType: 'DESIGN_NODE',
    targetDesignNodeCode: 'change-log-region',
    actionValue: { operandType: 'CONSTANT', value: 'LOCKED' },
}

const visibilityActionWithValidationMetadata = {
    actionType: 'SHOW' as const,
    targetType: 'FIELD' as const,
    targetDataDomainCode: 'changeLogs',
    targetFieldCode: 'changeType',
    validationType: 'REQUIRED',
    failureMessage: '不应存在',
}

// @ts-expect-error 非 VALIDATE 动作不能通过变量携带校验元数据
const invalidVisibilityMetadata: AppFormRuntimeRuleAction =
    visibilityActionWithValidationMetadata

// @ts-expect-error LIST 字段路径必须包含稳定 rowKey
const invalidListPath: AppFormListFieldPath = ['changeLogs', 'changeType']

// @ts-expect-error actionValue 不提供脚本执行入口
const invalidFilterAction: AppFormRuntimeRuleAction = {
    actionType: 'FILTER_OPTIONS',
    targetType: 'FIELD',
    targetDataDomainCode: 'changeLogs',
    targetFieldCode: 'changeType',
    targetRowScope: 'CURRENT_ROW',
    actionValue: {
        clearWhenDependencyChanges: true,
        bindings: [],
        script: 'return true',
    },
}

const scriptedFilterValue = {
    clearWhenDependencyChanges: true,
    bindings: [],
    script: 'return true',
}

// @ts-expect-error actionValue 先存变量也不能绕过执行入口禁令
const invalidVariableFilterAction: AppFormRuntimeRuleAction = {
    actionType: 'FILTER_OPTIONS',
    targetType: 'FIELD',
    targetDataDomainCode: 'changeLogs',
    targetFieldCode: 'changeType',
    targetRowScope: 'CURRENT_ROW',
    actionValue: scriptedFilterValue,
}

// @ts-expect-error VALIDATION 规则不能包含 LINKAGE 动作
const invalidValidationRule: AppFormRuntimeRule = {
    ...linkageRule,
    ruleType: 'VALIDATION',
}

void objectPath
void listPath
void normalizedBusinessValue
void designNodeAction
void schema
void capabilities
void legacySchema
void versionlessLegacySchema
void invalidLegacyFromV1
void invalidCondition
void invalidNodeAction
void invalidValidationNodeAction
void invalidRequiredNodeAction
void invalidEnabledDomainAction
void invalidLinkageNodeAction
void invalidVisibilityMetadata
void invalidListPath
void invalidFilterAction
void invalidVariableFilterAction
void invalidValidationRule
void sourceTypeCoverage
void valueTypeCoverage
