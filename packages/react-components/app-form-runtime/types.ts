import type { ReactNode } from 'react'
import type { AppFormRuntimeRule } from './rule-engine/types'

export type AppFormScene = 'LIST' | 'FORM' | 'DETAIL'
export type AppFormDomainType = 'OBJECT' | 'LIST'
export type AppFormNodeType = 'CONTAINER' | 'TAB_ITEM' | 'REGION' | 'FIELD'

export interface AppFormFieldCapabilities {
    listVisible?: boolean
    searchable?: boolean
    sortable?: boolean
    indexEnabled?: boolean
}

export interface AppFormFieldSecurity {
    sensitive?: boolean
    masked?: boolean
    revealable?: boolean
    auditRequired?: boolean
    maskRule?: string
}

export interface AppFormFieldOption {
    label: ReactNode
    value: string | number | boolean
    disabled?: boolean
}

export type AppFormControlValueKind =
    | 'SCALAR'
    | 'SINGLE_OPTION'
    | 'MULTIPLE_OPTIONS'
    | 'DATE'
    | 'DATE_RANGE'
    | 'OBJECT'

export type AppFormControlEmptyValueStrategy =
    | 'UNDEFINED'
    | 'NULL'
    | 'EMPTY_STRING'
    | 'EMPTY_ARRAY'
    | 'PRESERVE'

// 控件能力只表达规则运行时语义，不引用 Antd Props 或组件实例。
export interface AppFormControlCapabilities {
    supportsReadonly: boolean
    supportsDisabled: boolean
    supportsOptions: boolean
    supportsOptionFilter: boolean
    valueKind: AppFormControlValueKind
    emptyValueStrategy: AppFormControlEmptyValueStrategy
}

export interface AppFormRuntimeField {
    fieldId?: string
    id?: string
    dataDomainId?: string
    dataDomainCode?: string
    dataDomainType?: AppFormDomainType | string
    fieldCode: string
    fieldName?: string
    fieldLabel?: string
    uiLabel?: string
    valueType?: string
    controlType?: string
    referenceFlag?: boolean
    dataSourceType?: string
    dataSourceId?: string
    dataSourceCode?: string
    dataSourceName?: string
    controlProps?: Record<string, unknown>
    formItemProps?: Record<string, unknown>
    validation?: {
        required?: boolean
        nullable?: boolean
        rules?: Array<Record<string, unknown>>
    }
    capabilities?: AppFormFieldCapabilities
    security?: AppFormFieldSecurity
    required?: boolean
    defaultValue?: unknown
    sortNo?: number
    span?: number
    options?: AppFormFieldOption[]
    optionSource?: Record<string, unknown>
    visibleFlag?: boolean | number | string
    readonlyFlag?: boolean | number | string
    requiredFlag?: boolean | number | string
}

export interface AppFormRuntimeDomain {
    dataDomainId?: string
    domainCode: string
    domainName?: string
    domainType: AppFormDomainType | string
    storageMode?: 'UNIFIED_DATA' | 'PHYSICAL_TABLE' | string
    physicalTableName?: string
    parentDomainId?: string
    parentFieldCode?: string
    editable?: boolean
    fields?: AppFormRuntimeField[]
}

export interface AppFormDesignNode {
    id: string
    parentId?: string
    nodeType: AppFormNodeType | string
    nodeCode: string
    nodeName?: string
    containerType?: 'NORMAL' | 'TABS' | 'LIST' | string
    regionType?: AppFormDomainType | string
    fieldId?: string
    sortNo?: number
    gridSpan?: number
    widthConfig?: string
    heightConfig?: string
    nodeConfigJson?: string | Record<string, unknown>
    children?: AppFormDesignNode[]
}

export interface AppFormRenderSchemaBase {
    scene?: AppFormScene | string
    form?: {
        formId?: string
        formCode?: string
        formName?: string
        appCode?: string
        versionId?: string
        versionNo?: string
    }
    pageLayout?: {
        layoutType?: string
        designTree?: AppFormDesignNode[]
    }
    dataDomains?: AppFormRuntimeDomain[]
    apiBindings?: Record<string, AppFormApiBinding>
}

export interface AppFormApiBinding {
    method: string
    url: string
}

export interface LegacyAppFormRenderSchema extends AppFormRenderSchemaBase {
    schemaVersion?: '2.0' | '2.2'
    ruleContractVersion?: never
    // 旧规则只保留传输形态，必须先经过 legacy adapter 才能进入 v1 执行器。
    rules?: unknown[]
}

export interface RuleContractV1Schema extends AppFormRenderSchemaBase {
    schemaVersion: '2.1' | '2.2'
    ruleContractVersion: '1.0'
    rules: AppFormRuntimeRule[]
}

export type AppFormRenderSchema =
    | LegacyAppFormRenderSchema
    | RuleContractV1Schema

export interface AppFormRuntimeValue {
    recordId?: string
    dataDomains: Record<
        string,
        Record<string, unknown> | Array<Record<string, unknown>>
    >
    referenceLabels?: Record<string, unknown>
}

export interface AppFormRuntimeFieldChange {
    domainCode: string
    fieldCode: string
    value: unknown
    dataDomains: AppFormRuntimeValue['dataDomains']
    runtimeValue: AppFormRuntimeValue
}

export interface AppFormRuntimeUploadedFile {
    fileId?: string
    id?: string
    fileName?: string
    originalFilename?: string
    contentType?: string
    extension?: string
    fileSize?: number
    url?: string
    urlPath?: string
    downloadUrl?: string
    previewUrl?: string
    preview?: {
        fileUrl?: string
        thumbnailUrl?: string
        expireSeconds?: number
    }
    uploaderName?: string
    uploadTime?: string
    createTime?: string
}

/** 附件业务控件持久化的列表快照，不包含任何临时访问地址。 */
export interface AppFormRuntimeAttachment {
    fileId: string
    fileName?: string
    fileSize?: number
    contentType?: string
    extension?: string
    uploaderName?: string
    uploadTime?: string
}

export type AppFormRuntimeFileAccessAction = 'preview' | 'download'

/** 用户触发查看或下载时，由宿主按需返回的临时访问结果。 */
export interface AppFormRuntimeFileAccess {
    url: string
    fileName?: string
}

export interface AppFormRuntimeDesignerProps {
    enabled: boolean
    editable?: boolean
    selectedNodeId?: string
    onSelectNode?: (nodeId: string) => void
    onDropField?: (fieldId: string, targetNodeId: string) => void
}

export type AppFormListActionType = 'add' | 'edit' | 'delete'

export interface AppFormListAction {
    type: AppFormListActionType
    domainCode: string
    row?: Record<string, unknown>
    rowIndex?: number
}

export interface AppFormRendererRef {
    validateFields(domainCodes?: string[]): Promise<void>
    getValues(domainCodes?: string[]): AppFormRuntimeValue
    validateAndGetValues(domainCodes?: string[]): Promise<AppFormRuntimeValue>
    setValues(value: AppFormRuntimeValue): void
    resetFields(domainCodes?: string[]): void
}

export interface AppFormRuntimeControlProps {
    field: AppFormRuntimeField
    value?: unknown
    disabled?: boolean
    readonly?: boolean
    referenceLabel?: string
    referenceMetadata?: Record<string, unknown>
    onChange?: (
        value: unknown,
        label?: string,
        metadata?: Record<string, unknown>,
    ) => void
    onFileSelect?: (
        file: File,
        field: AppFormRuntimeField,
    ) => Promise<AppFormRuntimeUploadedFile | string | undefined>
    onFileAccess?: (
        fileId: string,
        field: AppFormRuntimeField,
        action: AppFormRuntimeFileAccessAction,
    ) => Promise<AppFormRuntimeFileAccess | undefined>
    onLoadOptions?: (
        field: AppFormRuntimeField,
        keyword?: string,
    ) => Promise<AppFormFieldOption[]>
}

export interface AppFormRuntimeRendererProps {
    schema: AppFormRenderSchema
    value: AppFormRuntimeValue
    readonly?: boolean
    loading?: boolean
    activeTab?: string
    onActiveTabChange?: (key: string) => void
    onChange?: (value: AppFormRuntimeValue) => void
    onFieldValueChange?: (change: AppFormRuntimeFieldChange) => void
    onReferenceLabelChange?: (
        domainCode: string,
        fieldCode: string,
        label?: string,
        metadata?: Record<string, unknown>,
    ) => void
    onLoadDomain?: (domainCode: string) => void | Promise<void>
    onListAction?: (action: AppFormListAction) => void
    onFileSelect?: AppFormRuntimeControlProps['onFileSelect']
    onFileAccess?: AppFormRuntimeControlProps['onFileAccess']
    onLoadOptions?: AppFormRuntimeControlProps['onLoadOptions']
    designer?: AppFormRuntimeDesignerProps
}
