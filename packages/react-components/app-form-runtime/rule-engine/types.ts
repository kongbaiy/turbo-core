export type AppFormRuntimeRuleType =
    | 'VALIDATION'
    | 'VISIBILITY'
    | 'REQUIRED'
    | 'EDITABLE'
    | 'LINKAGE'

export type AppFormRuntimeConditionMode = 'ALWAYS' | 'CONDITIONAL'
export type AppFormRuntimeConditionRelation = 'AND' | 'OR'
export type AppFormRuntimeExecutionTiming =
    | 'FORM_LOAD'
    | 'VALUE_CHANGE'
    | 'SUBMIT'
export type AppFormRuntimeRuleStatus = 'ENABLED' | 'DISABLED'
export type AppFormRuntimeRuleSourceType =
    | 'MANUAL'
    | 'FIELD_VALIDATION'
    | 'SYSTEM'

export type AppFormRuntimeConditionRowScope =
    | 'ROOT_OBJECT'
    | 'CURRENT_ROW'
    | 'ANY_ROW'
    | 'ALL_ROWS'
export type AppFormRuntimeCompareRowScope = 'ROOT_OBJECT' | 'CURRENT_ROW'
export type AppFormRuntimeTargetRowScope =
    | 'CURRENT_ROW'
    | 'ALL_ROWS'
    | 'MATCHED_ROWS'

export type AppFormRuntimeRuleTargetType =
    | 'FIELD'
    | 'DESIGN_NODE'
    | 'DATA_DOMAIN'

export type AppFormRuntimeRuleOperator =
    | 'EQ'
    | 'NE'
    | 'GT'
    | 'GE'
    | 'LT'
    | 'LE'
    | 'IN'
    | 'NOT_IN'
    | 'BETWEEN'
    | 'CONTAINS'
    | 'NOT_CONTAINS'
    | 'STARTS_WITH'
    | 'ENDS_WITH'
    | 'EMPTY'
    | 'NOT_EMPTY'

export type AppFormRuntimeOperandType = 'CONSTANT' | 'FIELD'
export type AppFormRuntimeValueType =
    | 'STRING'
    | 'INTEGER'
    | 'DECIMAL'
    | 'BOOLEAN'
    | 'DATE'
    | 'TIME'
    | 'DATETIME'
    | 'JSON'
    | 'STRING_LIST'
    | 'NUMBER_LIST'

export type AppFormRuntimePrimitiveValue = string | number | boolean | null

export interface AppFormRuntimeForbiddenExecutableKeys {
    script?: never
    expression?: never
    functionName?: never
    url?: never
    eval?: never
    callback?: never
}

export interface AppFormRuntimeNormalizedObject {
    [key: string]: AppFormRuntimeNormalizedValue
}

export type AppFormRuntimeNormalizedValue =
    | AppFormRuntimePrimitiveValue
    | AppFormRuntimeNormalizedValue[]
    | AppFormRuntimeNormalizedObject

export type AppFormRowKey = string | number

export type AppFormObjectFieldPath = readonly [
    dataDomainCode: string,
    fieldCode: string,
]

// LIST 路径必须保留稳定 rowKey，不能用易受排序和增删影响的 rowIndex。
export type AppFormListFieldPath = readonly [
    dataDomainCode: string,
    rowKey: AppFormRowKey,
    fieldCode: string,
]

export type AppFormFieldPath = AppFormObjectFieldPath | AppFormListFieldPath
export type AppFormRuntimeFieldPath = AppFormFieldPath

interface AppFormRuntimeRuleConditionBase {
    id?: string
    conditionGroupNo?: number
    conditionRelation?: AppFormRuntimeConditionRelation
    conditionRelationDesc?: string
    sourceDataDomainId?: string
    sourceDataDomainCode: string
    sourceFieldId?: string
    sourceFieldCode: string
    sourceRowScope?: AppFormRuntimeConditionRowScope
    sourceRowScopeDesc?: string
    operatorCode: AppFormRuntimeRuleOperator
    operatorCodeDesc?: string
    sortNo?: number
}

export interface AppFormRuntimeConstantCondition extends AppFormRuntimeRuleConditionBase {
    operandType?: 'CONSTANT'
    operandTypeDesc?: string
    valueType?: AppFormRuntimeValueType
    valueTypeDesc?: string
    compareValue?: AppFormRuntimeNormalizedValue
    compareDataDomainId?: never
    compareDataDomainCode?: never
    compareFieldId?: never
    compareFieldCode?: never
    compareRowScope?: never
    compareRowScopeDesc?: never
}

export interface AppFormRuntimeFieldCondition extends AppFormRuntimeRuleConditionBase {
    operandType: 'FIELD'
    operandTypeDesc?: string
    compareDataDomainId?: string
    compareDataDomainCode: string
    compareFieldId?: string
    compareFieldCode: string
    compareRowScope?: AppFormRuntimeCompareRowScope
    compareRowScopeDesc?: string
    valueType?: never
    valueTypeDesc?: never
    compareValue?: never
}

// operandType 决定比较值来源，字段比较不允许再携带常量，避免双重解释。
export type AppFormRuntimeRuleCondition =
    | AppFormRuntimeConstantCondition
    | AppFormRuntimeFieldCondition

export interface AppFormRuntimeValueBinding extends AppFormRuntimeForbiddenExecutableKeys {
    parameterName?: string
    operandType: 'FIELD'
    dataDomainId?: string
    dataDomainCode: string
    fieldId?: string
    fieldCode: string
    rowScope?: AppFormRuntimeCompareRowScope
}

export interface AppFormRuntimeConstantValueOperand extends AppFormRuntimeForbiddenExecutableKeys {
    operandType: 'CONSTANT'
    value: AppFormRuntimeNormalizedValue
}

export type AppFormRuntimeFieldValueOperand = Omit<
    AppFormRuntimeValueBinding,
    'parameterName'
>

export type AppFormRuntimeSetValueActionValue =
    | AppFormRuntimeConstantValueOperand
    | AppFormRuntimeFieldValueOperand

export interface AppFormRuntimeFilterOptionsActionValue extends AppFormRuntimeForbiddenExecutableKeys {
    clearWhenDependencyChanges?: boolean
    bindings: AppFormRuntimeValueBinding[]
}

export type AppFormRuntimeValidationActionValue = AppFormRuntimeNormalizedValue

// never 键只负责阻断 TypeScript 调用方；真实 JSON 仍须由后续 strict validator 拒绝未知键。

export type AppFormRuntimeRuleActionType =
    | 'VALIDATE'
    | 'SHOW'
    | 'HIDE'
    | 'SET_REQUIRED'
    | 'UNSET_REQUIRED'
    | 'SET_READONLY'
    | 'SET_EDITABLE'
    | 'SET_VALUE'
    | 'CLEAR_VALUE'
    | 'FILTER_OPTIONS'
    | 'SET_ENABLED'
    | 'SET_DISABLED'

interface AppFormRuntimeRuleActionBase {
    id?: string
    actionTypeDesc?: string
    sortNo?: number
}

interface AppFormRuntimeNonValidationAction extends AppFormRuntimeRuleActionBase {
    validationType?: never
    validationTypeDesc?: never
    failureMessage?: never
}

export interface AppFormRuntimeFieldTarget {
    targetType?: 'FIELD'
    targetTypeDesc?: string
    targetDataDomainId?: string
    targetDataDomainCode: string
    targetFieldId?: string
    targetFieldCode: string
    targetRowScope?: AppFormRuntimeTargetRowScope
    targetRowScopeDesc?: string
    targetDesignNodeId?: never
    targetDesignNodeCode?: never
}

export interface AppFormRuntimeDesignNodeTarget {
    targetType: 'DESIGN_NODE'
    targetTypeDesc?: string
    targetDesignNodeId?: string
    targetDesignNodeCode: string
    targetDataDomainId?: never
    targetDataDomainCode?: never
    targetFieldId?: never
    targetFieldCode?: never
    targetRowScope?: never
    targetRowScopeDesc?: never
}

export interface AppFormRuntimeDataDomainTarget {
    targetType: 'DATA_DOMAIN'
    targetTypeDesc?: string
    targetDataDomainId?: string
    targetDataDomainCode: string
    targetFieldId?: never
    targetFieldCode?: never
    targetDesignNodeId?: never
    targetDesignNodeCode?: never
    targetRowScope?: AppFormRuntimeTargetRowScope
    targetRowScopeDesc?: string
}

export type AppFormRuntimeRuleActionTarget =
    | AppFormRuntimeFieldTarget
    | AppFormRuntimeDesignNodeTarget
    | AppFormRuntimeDataDomainTarget

export type AppFormRuntimeValidateAction = AppFormRuntimeRuleActionBase &
    AppFormRuntimeFieldTarget & {
        actionType: 'VALIDATE'
        validationType?: string
        validationTypeDesc?: string
        failureMessage?: string
        actionValue?: AppFormRuntimeValidationActionValue
    }

export type AppFormRuntimeVisibilityAction = AppFormRuntimeNonValidationAction &
    AppFormRuntimeRuleActionTarget & {
        actionType: 'SHOW' | 'HIDE'
        actionValue?: never
    }

export type AppFormRuntimeRequiredAction = AppFormRuntimeNonValidationAction &
    AppFormRuntimeFieldTarget & {
        actionType: 'SET_REQUIRED' | 'UNSET_REQUIRED'
        actionValue?: never
    }

export type AppFormRuntimeReadonlyAction = AppFormRuntimeNonValidationAction &
    AppFormRuntimeRuleActionTarget & {
        actionType: 'SET_READONLY' | 'SET_EDITABLE'
        actionValue?: never
    }

export type AppFormRuntimeEnabledAction = AppFormRuntimeNonValidationAction &
    (AppFormRuntimeFieldTarget | AppFormRuntimeDesignNodeTarget) & {
        actionType: 'SET_ENABLED' | 'SET_DISABLED'
        actionValue?: never
    }

export type AppFormRuntimeEditableAction =
    | AppFormRuntimeReadonlyAction
    | AppFormRuntimeEnabledAction

export type AppFormRuntimeSetValueAction = AppFormRuntimeNonValidationAction &
    AppFormRuntimeFieldTarget & {
        actionType: 'SET_VALUE'
        actionValue: AppFormRuntimeSetValueActionValue
    }

export type AppFormRuntimeClearValueAction = AppFormRuntimeNonValidationAction &
    AppFormRuntimeFieldTarget & {
        actionType: 'CLEAR_VALUE'
        actionValue?: never
    }

export type AppFormRuntimeFilterOptionsAction =
    AppFormRuntimeNonValidationAction &
        AppFormRuntimeFieldTarget & {
            actionType: 'FILTER_OPTIONS'
            actionValue: AppFormRuntimeFilterOptionsActionValue
        }

export type AppFormRuntimeLinkageAction =
    | AppFormRuntimeSetValueAction
    | AppFormRuntimeClearValueAction
    | AppFormRuntimeFilterOptionsAction

// actionType 先决定动作族，动作族再列出合法目标，避免 operation × target 笛卡尔积。
export type AppFormRuntimeRuleAction =
    | AppFormRuntimeValidateAction
    | AppFormRuntimeVisibilityAction
    | AppFormRuntimeRequiredAction
    | AppFormRuntimeEditableAction
    | AppFormRuntimeLinkageAction

interface AppFormRuntimeRuleBase {
    id: string
    formId?: string
    formVersionId?: string
    formVersionNo?: string
    ruleCode: string
    ruleName: string
    ruleTypeDesc?: string
    conditionMode: AppFormRuntimeConditionMode
    conditionModeDesc?: string
    conditionRelation: AppFormRuntimeConditionRelation
    conditionRelationDesc?: string
    executionTimings: AppFormRuntimeExecutionTiming[]
    sourceType: AppFormRuntimeRuleSourceType
    sourceTypeDesc?: string
    ruleDescription?: string
    ruleStatus: AppFormRuntimeRuleStatus
    ruleStatusDesc?: string
    priorityNo?: number
    sortNo?: number
    anchorDataDomainId?: string
    anchorDataDomainCode?: string
    conditions: AppFormRuntimeRuleCondition[]
}

export interface AppFormRuntimeValidationRule extends AppFormRuntimeRuleBase {
    ruleType: 'VALIDATION'
    actions: AppFormRuntimeValidateAction[]
}

export interface AppFormRuntimeVisibilityRule extends AppFormRuntimeRuleBase {
    ruleType: 'VISIBILITY'
    actions: AppFormRuntimeVisibilityAction[]
}

export interface AppFormRuntimeRequiredRule extends AppFormRuntimeRuleBase {
    ruleType: 'REQUIRED'
    actions: AppFormRuntimeRequiredAction[]
}

export interface AppFormRuntimeEditableRule extends AppFormRuntimeRuleBase {
    ruleType: 'EDITABLE'
    actions: AppFormRuntimeEditableAction[]
}

export interface AppFormRuntimeLinkageRule extends AppFormRuntimeRuleBase {
    ruleType: 'LINKAGE'
    actions: AppFormRuntimeLinkageAction[]
}

export type AppFormRuntimeRule =
    | AppFormRuntimeValidationRule
    | AppFormRuntimeVisibilityRule
    | AppFormRuntimeRequiredRule
    | AppFormRuntimeEditableRule
    | AppFormRuntimeLinkageRule

export interface AppFormRuntimeOption {
    label: string
    value: AppFormRuntimePrimitiveValue
    disabled?: boolean
}

export interface AppFormRuntimeOptionFilter {
    bindings: Record<string, AppFormRuntimeNormalizedValue>
}

export interface AppFormRuntimeFieldEffect {
    fieldPath: AppFormFieldPath
    visible?: boolean
    required?: boolean
    readonly?: boolean
    disabled?: boolean
    value?: AppFormRuntimeNormalizedValue
    options?: AppFormRuntimeOption[]
    optionFilter?: AppFormRuntimeOptionFilter
    sourceRuleId?: string
}

export interface AppFormRuntimeDesignNodeEffect {
    designNodeCode: string
    visible?: boolean
    readonly?: boolean
    disabled?: boolean
    sourceRuleId?: string
}

export interface AppFormRuntimeDataDomainEffect {
    dataDomainCode: string
    visible?: boolean
    readonly?: boolean
    sourceRuleId?: string
}

export interface AppFormRuntimeMatchedRows {
    dataDomainCode: string
    rowKeys: AppFormRowKey[]
}

export type AppFormRuntimeRuleErrorCode =
    | 'UNSUPPORTED_RULE_CONTRACT'
    | 'INVALID_RULE'
    | 'INVALID_FIELD_PATH'
    | 'CURRENT_ROW_REQUIRED'
    | 'ACTION_LIMIT_EXCEEDED'
    | 'CASCADE_LIMIT_EXCEEDED'
    | 'UNSUPPORTED_CONTROL_CAPABILITY'

export interface AppFormRuntimeRuleError {
    code: AppFormRuntimeRuleErrorCode
    message: string
    ruleId?: string
    ruleCode?: string
    actionIndex?: number
    fieldPath?: AppFormFieldPath
}

export interface AppFormRuntimeRuleDiagnostic {
    severity: 'INFO' | 'WARNING' | 'ERROR'
    code: string
    message: string
    ruleId?: string
    ruleCode?: string
    fieldPath?: AppFormFieldPath
    actionType?: AppFormRuntimeRuleActionType
}

export interface AppFormRuntimeNormalizedFormValue {
    recordId?: string
    dataDomains: Record<
        string,
        | Record<string, AppFormRuntimeNormalizedValue>
        | Array<Record<string, AppFormRuntimeNormalizedValue>>
    >
    referenceLabels?: Record<string, AppFormRuntimeNormalizedValue>
}

export interface AppFormRuntimeRuleExecutionResult {
    success: boolean
    normalizedValue: AppFormRuntimeNormalizedFormValue
    fieldEffects: AppFormRuntimeFieldEffect[]
    designNodeEffects: AppFormRuntimeDesignNodeEffect[]
    dataDomainEffects: AppFormRuntimeDataDomainEffect[]
    matchedRows: AppFormRuntimeMatchedRows[]
    errors: AppFormRuntimeRuleError[]
    diagnostics: AppFormRuntimeRuleDiagnostic[]
    executedActionCount: number
    cascadeRounds: number
}

export type AppFormRuleExecutionResult = AppFormRuntimeRuleExecutionResult
export type AppFormRuleDiagnostic = AppFormRuntimeRuleDiagnostic
export type AppFormRuleError = AppFormRuntimeRuleError
// ─── 字段状态与规则结果（供 UI 层消费） ─────────────────

/**
 * 生成字段在 fieldStates 映射中的稳定 key。
 * 格式：`${dataDomainCode}.${fieldCode}`
 */
export const getAppFormRuntimeFieldKey = (
    dataDomainCode: string,
    fieldCode: string,
): string => `${dataDomainCode}.${fieldCode}`

/** 单个字段在规则执行后的状态快照 */
export interface AppFormRuntimeFieldState {
    visible?: boolean
    required?: boolean
    readonly?: boolean
    disabled?: boolean
    value?: unknown
}

/** 验证问题描述 */
export interface AppFormRuntimeValidationIssue {
    ruleId: string
    fieldCode?: string
    message: string
}

/**
 * 规则引擎执行结果（UI 友好格式）。
 * - fieldStates：以 `domainCode.fieldCode` 为 key 的字段状态映射
 * - matchedRuleIds：已匹配并执行的规则 ID 列表
 * - validationIssues：验证不通过的问题列表
 */
export interface AppFormRuntimeRuleResult {
    fieldStates: Record<string, AppFormRuntimeFieldState>
    matchedRuleIds: string[]
    validationIssues: AppFormRuntimeValidationIssue[]
}
