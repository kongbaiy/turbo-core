import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Col, Empty, Form, Row, Spin, Tabs, Typography } from 'antd'

import AppFormControl from './control-registry'
import {
    enabled,
    fieldLabel,
    nodeKey,
    nodeTitle,
    normalizeSpan,
    sortNodes,
} from './editor-utils'
import { extractRuntimeFieldChanges } from './field-change'
import LazyListRegion from './lazy-list-region'
import {
    getReferenceLabel,
    getReferenceMetadata,
    mergeReferenceLabel,
} from './reference-labels'
import { parseAppFormRenderSchema } from './rule-engine/contract-validator'
import {
    createSchemaIndex,
    getRegionDomain,
    getRegionFields,
    getSceneRoots,
    readNodeConfig,
} from './schema'
import type {
    AppFormDesignNode,
    AppFormRendererRef,
    AppFormRuntimeField,
    AppFormRuntimeRendererProps,
    AppFormRuntimeValue,
} from './types'
import styles from './app-form-runtime.module.css'

type LooseRecord = Record<string, unknown>

const AppFormEditorRenderer = forwardRef<
    AppFormRendererRef,
    AppFormRuntimeRendererProps
>(
    (
        {
            schema,
            value,
            readonly = false,
            loading = false,
            activeTab,
            onActiveTabChange,
            onChange,
            onFieldValueChange,
            onReferenceLabelChange,
            onLoadDomain,
            onListAction,
            onFileSelect,
            onFileAccess,
            onLoadOptions,
            designer,
        },
        ref,
    ) => {
        const [form] = Form.useForm()
        const [tabKeys, setTabKeys] = useState<Record<string, string>>({})
        const referenceLabelsRef = useRef<Record<string, unknown>>(
            value.referenceLabels || {},
        )
        const parsedSchema = useMemo(
            () => parseAppFormRenderSchema(schema).schema,
            [schema],
        )
        const index = useMemo(
            () => createSchemaIndex(parsedSchema),
            [parsedSchema],
        )
        const scene = parsedSchema.scene === 'DETAIL' ? 'DETAIL' : 'FORM'
        const configuredRoots = useMemo(
            () => getSceneRoots(parsedSchema, scene),
            [parsedSchema, scene],
        )
        const roots = configuredRoots.length
            ? configuredRoots
            : sortNodes(parsedSchema.pageLayout?.designTree || [])

        useEffect(() => {
            form.setFieldsValue(value.dataDomains || {})
        }, [form, value])

        useEffect(() => {
            referenceLabelsRef.current = value.referenceLabels || {}
        }, [value.referenceLabels])

        const currentValue = useCallback((): AppFormRuntimeValue => {
            const formDomains = form.getFieldsValue(true) as Record<
                string,
                LooseRecord
            >
            return {
                ...value,
                dataDomains: {
                    ...value.dataDomains,
                    ...formDomains,
                },
                referenceLabels: referenceLabelsRef.current,
            }
        }, [form, value])

        useImperativeHandle(
            ref,
            () => ({
                async validateFields(domainCodes) {
                    if (!domainCodes?.length) {
                        await form.validateFields()
                        return
                    }
                    const names = domainCodes.flatMap((domainCode) => {
                        const domain = index.domainByCode.get(domainCode)
                        return (domain?.fields || []).map((field) => [
                            domainCode,
                            field.fieldCode,
                        ])
                    })
                    await form.validateFields(names)
                },
                getValues() {
                    return currentValue()
                },
                async validateAndGetValues(domainCodes) {
                    if (domainCodes?.length) {
                        const names = domainCodes.flatMap((domainCode) => {
                            const domain = index.domainByCode.get(domainCode)
                            return (domain?.fields || []).map((field) => [
                                domainCode,
                                field.fieldCode,
                            ])
                        })
                        await form.validateFields(names)
                    } else {
                        await form.validateFields()
                    }
                    return currentValue()
                },
                setValues(next) {
                    form.setFieldsValue(next.dataDomains || {})
                },
                resetFields(domainCodes) {
                    if (!domainCodes?.length) {
                        form.resetFields()
                        return
                    }
                    form.resetFields(domainCodes.map((code) => [code]))
                },
            }),
            [currentValue, form, index.domainByCode],
        )

        const emitValues = (changedValues?: LooseRecord) => {
            const nextValue = currentValue()
            onChange?.(nextValue)
            if (!onFieldValueChange) return
            extractRuntimeFieldChanges(changedValues, nextValue).forEach(
                onFieldValueChange,
            )
        }

        const regionDesignProps = (node: AppFormDesignNode) =>
            designer?.enabled
                ? {
                      'data-testid': `template-region-${node.id}`,
                      tabIndex: 0,
                      onClick: (event: MouseEvent<HTMLElement>) => {
                          event.stopPropagation()
                          designer.onSelectNode?.(node.id)
                      },
                      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                          if (
                              event.currentTarget === event.target &&
                              (event.key === 'Enter' || event.key === ' ')
                          ) {
                              event.preventDefault()
                              designer.onSelectNode?.(node.id)
                          }
                      },
                      onDragOver: designer.editable
                          ? (event: DragEvent<HTMLElement>) =>
                                event.preventDefault()
                          : undefined,
                      onDrop: designer.editable
                          ? (event: DragEvent<HTMLElement>) => {
                                event.preventDefault()
                                event.stopPropagation()
                                const fieldId =
                                    event.dataTransfer.getData(
                                        'app-form/field-id',
                                    )
                                if (fieldId) {
                                    designer.onDropField?.(fieldId, node.id)
                                }
                            }
                          : undefined,
                  }
                : {}

        const regionClassName = (node: AppFormDesignNode) =>
            [
                styles.section,
                designer?.enabled ? styles['design-region'] : '',
                designer?.selectedNodeId === node.id
                    ? styles['design-region-selected']
                    : '',
            ]
                .filter(Boolean)
                .join(' ')

        const renderField = (
            field: AppFormRuntimeField,
            domainCode: string,
            node?: AppFormDesignNode,
        ) => {
            if (
                field.security?.masked &&
                !field.security.revealable &&
                readonly
            ) {
                // Masked values still pass through the same read-only control.
            }
            if (
                field.formItemProps?.visible === false ||
                field.visibleFlag === 0 ||
                field.visibleFlag === '0'
            ) {
                return null
            }
            const label = fieldLabel(field)
            const required =
                enabled(field.validation?.required) ||
                enabled(field.requiredFlag) ||
                enabled(field.required)
            const disabled =
                readonly ||
                enabled(field.readonlyFlag) ||
                field.formItemProps?.readOnly === true ||
                field.controlProps?.disabled === true ||
                field.controlProps?.readOnly === true
            const updateReferenceLabel = (
                label?: string,
                metadata?: Record<string, unknown>,
            ) => {
                const nextLabel =
                    label ||
                    (typeof metadata?.label === 'string'
                        ? metadata.label
                        : undefined)
                referenceLabelsRef.current = mergeReferenceLabel(
                    referenceLabelsRef.current,
                    domainCode,
                    field.fieldCode,
                    nextLabel,
                    metadata,
                )
                onReferenceLabelChange?.(
                    domainCode,
                    field.fieldCode,
                    label,
                    metadata,
                )
            }
            const applyAutoFillFields = (
                label?: string,
                metadata?: Record<string, unknown>,
            ) => {
                const autoFillFields = field.controlProps?.autoFillFields
                if (
                    !autoFillFields ||
                    typeof autoFillFields !== 'object' ||
                    Array.isArray(autoFillFields)
                ) {
                    return
                }
                const domainPatch = Object.fromEntries(
                    Object.entries(
                        autoFillFields as Record<string, unknown>,
                    ).map(([targetFieldCode, sourceKey]) => [
                        targetFieldCode,
                        typeof sourceKey === 'string'
                            ? sourceKey === 'label'
                                ? label
                                : metadata?.[sourceKey]
                            : undefined,
                    ]),
                )
                form.setFieldsValue({
                    [domainCode]: domainPatch,
                })
            }
            return (
                <Col
                    className={[
                        styles['field-col'],
                        designer?.enabled ? styles['design-field'] : '',
                        designer?.selectedNodeId === node?.id
                            ? styles['design-field-selected']
                            : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    key={`${domainCode}-${field.fieldCode}-${node?.id || 'field'}`}
                    data-testid={
                        designer?.enabled && node?.id
                            ? `overlay-node-${node.id}`
                            : undefined
                    }
                    xs={24}
                    sm={12}
                    lg={normalizeSpan(node?.gridSpan || field.span)}
                    onClick={
                        designer?.enabled && node?.id
                            ? (event) => {
                                  event.stopPropagation()
                                  designer.onSelectNode?.(node.id)
                              }
                            : undefined
                    }
                >
                    <Form.Item
                        className={
                            readonly ? styles['readonly-item'] : undefined
                        }
                        name={[domainCode, field.fieldCode]}
                        label={label}
                        rules={
                            !readonly && required
                                ? [
                                      {
                                          required: true,
                                          message: `请填写${label}`,
                                      },
                                  ]
                                : undefined
                        }
                        getValueFromEvent={(
                            nextValue,
                            label?: string,
                            metadata?: Record<string, unknown>,
                        ) => {
                            applyAutoFillFields(label, metadata)
                            updateReferenceLabel(label, metadata)
                            return nextValue
                        }}
                    >
                        <AppFormControl
                            field={field}
                            disabled={disabled}
                            readonly={readonly}
                            referenceLabel={getReferenceLabel(
                                value.referenceLabels,
                                domainCode,
                                field.fieldCode,
                            )}
                            referenceMetadata={getReferenceMetadata(
                                value.referenceLabels,
                                domainCode,
                                field.fieldCode,
                            )}
                            onFileSelect={onFileSelect}
                            onFileAccess={onFileAccess}
                            onLoadOptions={onLoadOptions}
                        />
                    </Form.Item>
                </Col>
            )
        }

        const renderObjectRegion = (node: AppFormDesignNode) => {
            const domain = getRegionDomain(index, node)
            if (!domain) return null
            const fieldNodes = sortNodes(node.children || []).filter(
                (child) => child.nodeType === 'FIELD',
            )
            const content = fieldNodes.length
                ? fieldNodes.map((fieldNode) => {
                      const config = readNodeConfig(fieldNode)
                      const fieldCode =
                          typeof config.fieldCode === 'string'
                              ? config.fieldCode
                              : undefined
                      const field = fieldNode.fieldId
                          ? index.fieldById.get(fieldNode.fieldId)
                          : domain.fields?.find(
                                (item) => item.fieldCode === fieldCode,
                            )
                      return field
                          ? renderField(field, domain.domainCode, fieldNode)
                          : null
                  })
                : getRegionFields(index, node).map((field) =>
                      renderField(field, domain.domainCode, node),
                  )

            return (
                <section
                    {...regionDesignProps(node)}
                    className={regionClassName(node)}
                    key={nodeKey(node)}
                >
                    <Row gutter={[20, 0]}>{content}</Row>
                </section>
            )
        }

        const renderListRegion = (node: AppFormDesignNode) => {
            const domain = getRegionDomain(index, node)
            if (!domain) return null
            const rows = value.dataDomains[domain.domainCode]
            const nodeEditable = readNodeConfig(node).editable !== false
            return (
                <LazyListRegion
                    key={nodeKey(node)}
                    node={node}
                    domainCode={domain.domainCode}
                    fields={getRegionFields(index, node)}
                    rows={Array.isArray(rows) ? rows : []}
                    readonly={
                        readonly || domain.editable === false || !nodeEditable
                    }
                    onLoadDomain={onLoadDomain}
                    onListAction={onListAction}
                    designer={designer}
                />
            )
        }

        const renderDirectField = (node: AppFormDesignNode) => {
            const config = readNodeConfig(node)
            const configuredFieldCode =
                typeof config.fieldCode === 'string'
                    ? config.fieldCode
                    : undefined
            const field = node.fieldId
                ? index.fieldById.get(node.fieldId)
                : parsedSchema.dataDomains
                      ?.flatMap((domain) => domain.fields || [])
                      .find((item) => item.fieldCode === configuredFieldCode)
            if (!field) return null
            const domain = field.dataDomainCode
                ? index.domainByCode.get(field.dataDomainCode)
                : field.dataDomainId
                  ? index.domainById.get(field.dataDomainId)
                  : parsedSchema.dataDomains?.find((item) =>
                        item.fields?.some(
                            (candidate) =>
                                candidate.fieldId === field.fieldId ||
                                candidate.id === field.id,
                        ),
                    )
            return domain ? renderField(field, domain.domainCode, node) : null
        }

        const renderChildren = (nodes: AppFormDesignNode[] = []): ReactNode => {
            const content: ReactNode[] = []
            let directFields: AppFormDesignNode[] = []
            const flushDirectFields = () => {
                const [firstNode] = directFields
                if (!firstNode) return
                content.push(
                    <Row
                        key={`direct-fields-${nodeKey(firstNode)}`}
                        gutter={[20, 0]}
                    >
                        {directFields.map(renderDirectField)}
                    </Row>,
                )
                directFields = []
            }

            sortNodes(nodes).forEach((node, nodeIndex) => {
                if (node.nodeType === 'FIELD') {
                    directFields.push(node)
                    return
                }
                flushDirectFields()
                content.push(renderNode(node, nodeIndex))
            })
            flushDirectFields()
            return content
        }

        const renderTabs = (node: AppFormDesignNode) => {
            const children = sortNodes(node.children || [])
            const key = nodeKey(node)
            const selected =
                activeTab || tabKeys[key] || nodeKey(children[0] || node)
            return (
                <Tabs
                    key={key}
                    activeKey={selected}
                    destroyOnHidden={false}
                    onChange={(next) => {
                        setTabKeys((current) => ({ ...current, [key]: next }))
                        onActiveTabChange?.(next)
                    }}
                    items={children.map((child, childIndex) => ({
                        key: nodeKey(child, childIndex),
                        label: nodeTitle(child, `页签${childIndex + 1}`),
                        children: designer?.enabled ? (
                            <section
                                {...regionDesignProps(child)}
                                className={regionClassName(child)}
                            >
                                {renderChildren(child.children)}
                            </section>
                        ) : (
                            renderChildren(child.children)
                        ),
                    }))}
                />
            )
        }

        const renderNode = (
            node: AppFormDesignNode,
            indexNo: number,
        ): ReactNode => {
            const config = readNodeConfig(node)
            const isFormRoot = config.layoutRole === 'FORM_ROOT'
            if (node.nodeType === 'REGION') {
                return node.regionType === 'LIST'
                    ? renderListRegion(node)
                    : renderObjectRegion(node)
            }
            if (
                node.nodeType === 'CONTAINER' &&
                node.containerType === 'TABS'
            ) {
                return renderTabs(node)
            }
            if (node.nodeType === 'FIELD') return renderDirectField(node)
            return (
                <section
                    {...regionDesignProps(node)}
                    key={nodeKey(node, indexNo)}
                    className={regionClassName(node)}
                >
                    {!isFormRoot &&
                    node.nodeType !== 'TAB_ITEM' &&
                    node.nodeName ? (
                        <Typography.Title
                            level={5}
                            className={styles['section-title']}
                        >
                            {node.nodeName}
                        </Typography.Title>
                    ) : null}
                    {renderChildren(node.children)}
                </section>
            )
        }

        return (
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout='vertical'
                    className={[
                        styles.runtime,
                        readonly ? styles['runtime-readonly'] : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    requiredMark={!readonly}
                    onValuesChange={emitValues}
                    preserve
                >
                    {roots.length ? (
                        renderChildren(roots)
                    ) : (
                        <Empty description='暂无表单布局' />
                    )}
                </Form>
            </Spin>
        )
    },
)

AppFormEditorRenderer.displayName = 'AppFormEditorRenderer'

export default AppFormEditorRenderer
