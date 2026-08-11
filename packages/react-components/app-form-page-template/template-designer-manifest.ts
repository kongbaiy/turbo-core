import type { AppFormScene } from '../app-form-runtime/types'

export type TemplateDesignerNodeKind =
    | 'FIELD'
    | 'NORMAL'
    | 'TABS'
    | 'TAB_ITEM'
    | 'REGION'

export type TemplatePropertyValueType =
    | 'ENUM'
    | 'BOOLEAN'
    | 'NUMBER'
    | 'STRING'

export interface TemplatePropertyOption {
    label: string
    value: string | number | boolean
}

export interface TemplatePropertyDefinition {
    key: string
    label: string
    valueType: TemplatePropertyValueType
    defaultValue?: string | number | boolean
    options?: TemplatePropertyOption[]
    min?: number
    max?: number
    step?: number
    maxLength?: number
    pattern?: string
}

export interface TemplateDesignerPlacement {
    nodeCode: string
    layoutRole: string
    label: string
    fixed: boolean
    deletable: boolean
    accepts: TemplateDesignerNodeKind[]
}

export interface TemplateSceneManifest {
    root: TemplateDesignerPlacement
    slots: TemplateDesignerPlacement[]
}

export interface TemplateDesignerManifest {
    templateCode: string
    templateName: string
    templateDescription?: string
    version: string
    scenes: Record<AppFormScene, TemplateSceneManifest>
    properties: Record<string, TemplatePropertyDefinition[]>
}

const fixedPlacement = (
    nodeCode: string,
    layoutRole: string,
    label: string,
    accepts: TemplateDesignerNodeKind[],
): TemplateDesignerPlacement => ({
    nodeCode,
    layoutRole,
    label,
    accepts,
    fixed: true,
    deletable: false,
})

const formRoot = fixedPlacement(
    'FORM_ROOT',
    'FORM_ROOT',
    '表单画布',
    ['FIELD'],
)

export const GENERAL_TEMPLATE_1_DESIGNER_MANIFEST: TemplateDesignerManifest = {
    templateCode: 'GENERAL_TEMPLATE_1',
    templateName: '通用业务表单',
    templateDescription: '包含列表查询区、表格区和标准表单区域',
    version: '1.0',
    scenes: {
        LIST: {
            root: fixedPlacement(
                'LIST_ROOT',
                'LIST_ROOT',
                '列表画布',
                [],
            ),
            slots: [
                fixedPlacement(
                    'LIST_SEARCH_REGION',
                    'LIST_SEARCH',
                    '查询区',
                    ['FIELD'],
                ),
                fixedPlacement(
                    'LIST_TABLE_REGION',
                    'LIST_TABLE',
                    '表格区',
                    ['FIELD'],
                ),
            ],
        },
        FORM: { root: formRoot, slots: [] },
        DETAIL: { root: formRoot, slots: [] },
    },
    properties: {
        PAGE: [
            {
                key: 'canvasWidth',
                label: '画布宽度',
                valueType: 'ENUM',
                defaultValue: 'DESKTOP',
                options: [
                    { label: '桌面', value: 'DESKTOP' },
                    { label: '窄屏', value: 'COMPACT' },
                ],
            },
        ],
        LIST_SEARCH: [
            {
                key: 'columns',
                label: '每行查询项',
                valueType: 'NUMBER',
                defaultValue: 3,
                min: 1,
                max: 4,
            },
            {
                key: 'defaultExpanded',
                label: '默认展开',
                valueType: 'BOOLEAN',
                defaultValue: false,
            },
        ],
        LIST_TABLE: [
            {
                key: 'density',
                label: '表格密度',
                valueType: 'ENUM',
                defaultValue: 'MIDDLE',
                options: [
                    { label: '紧凑', value: 'SMALL' },
                    { label: '标准', value: 'MIDDLE' },
                    { label: '宽松', value: 'LARGE' },
                ],
            },
            {
                key: 'pageSize',
                label: '每页条数',
                valueType: 'NUMBER',
                defaultValue: 10,
                min: 5,
                max: 100,
                step: 5,
            },
        ],
        CONTAINER: [
            {
                key: 'titleVisible',
                label: '显示标题',
                valueType: 'BOOLEAN',
                defaultValue: true,
            },
        ],
        REGION: [
            {
                key: 'columns',
                label: '每行字段数',
                valueType: 'NUMBER',
                defaultValue: 2,
                min: 1,
                max: 4,
            },
        ],
        FIELD: [
            {
                key: 'gridSpan',
                label: '字段宽度',
                valueType: 'NUMBER',
                defaultValue: 12,
                min: 1,
                max: 24,
            },
            {
                key: 'labelVisible',
                label: '显示标签',
                valueType: 'BOOLEAN',
                defaultValue: true,
            },
        ],
    },
}

export const getTemplateDesignerManifest = (templateCode?: string) =>
    templateCode === GENERAL_TEMPLATE_1_DESIGNER_MANIFEST.templateCode
        ? GENERAL_TEMPLATE_1_DESIGNER_MANIFEST
        : undefined

export const listTemplateDesignerManifests = (): TemplateDesignerManifest[] => [
    GENERAL_TEMPLATE_1_DESIGNER_MANIFEST,
]

export const canTemplateSlotAccept = (
    manifest: TemplateDesignerManifest,
    scene: AppFormScene,
    layoutRole: string,
    nodeKind: TemplateDesignerNodeKind,
) => {
    const sceneManifest = manifest.scenes[scene]
    const placement = sceneManifest.root.layoutRole === layoutRole
        ? sceneManifest.root
        : sceneManifest.slots.find((slot) => slot.layoutRole === layoutRole)
    return Boolean(placement?.accepts.includes(nodeKind))
}
