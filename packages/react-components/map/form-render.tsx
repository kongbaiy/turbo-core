import React from 'react'
import { Col, Form, Row } from 'antd'
import { ComponentKey, getMap } from './map'

const responses = {
    apiId: {
        data: {
            data: [
                { value: '1', label: 'Jack' },
                { value: '2', label: 'Lucy' },
                { value: '3', label: 'Tom' },
            ],
        },
    },
}
console.log('responses: ', responses)

const formData = {
    data2: 20,
}
console.log('formData: ', formData)

const items = [
    {
        title: '基础信息',
        children: [
            {
                label: '选项1',
                fieldName: 'CASCADER',
                formName: 'a1',
                span: 8,
                controlProps: {
                    disabled: true,
                },
            },
            {
                label: '选项2',
                fieldName: 'TEXT_SINGLE',
                formName: 'a2',
                span: 8,
                controlAttrs: {
                    required: true,
                    rules: [{ required: true }],
                },
                dataMap: [
                    {
                        dataSource: 'formData',
                        dataSourceField: 'data2',
                        setField: 'controlProps.value',
                    },
                ],
            },
            {
                label: '选项3',
                fieldName: 'SELECT',
                formName: 'a3',
                span: 8,
                controlAttrs: {
                    required: true,
                },
                controlProps: {
                    options: [],
                },
                dataMap: [
                    {
                        dataSource: 'responses',
                        dataSourceField: 'apiId.data.data',
                        setField: 'controlProps.options',
                    },
                    // {
                    //     dataSource: 'responses',
                    //     dataSourceField: 'apiId.data.data[0]',
                    //     setField: 'controlProps.defaultValue',
                    // },
                ],
            },
        ],
    },
    {
        title: '银行卡信息',
        children: [
            {
                fieldName: 'FORM_TABLE',
                span: 24,
                controlProps: {
                    columns: [
                        {
                            title: '姓名',
                            dataIndex: 'name',
                            key: 'name',
                        },
                        {
                            title: '年龄',
                            dataIndex: 'age',
                            key: 'age',
                        },
                        {
                            title: '住址',
                            dataIndex: 'address',
                            key: 'address',
                        },
                    ],
                },
            },
        ],
    },
    {
        title: '联系人信息',
        children: [
            {
                label: '选项1',
                fieldName: 'CASCADER',
                span: 8,
            },
        ],
    },
]

function getValueAdvanced(obj: Record<string, any>, path: string) {
    if (!obj) return undefined
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.')

    return keys.reduce((current, key) => {
        if (current === null || current === undefined) return undefined
        return current[key]
    }, obj)
}

export function setValueByPath(
    obj: Record<string, any>,
    path: string,
    value: any,
) {
    if (!obj || typeof obj !== 'object') return obj

    const keys = path.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((current, key) => {
        if (
            current[key] === undefined ||
            current[key] === null ||
            typeof current[key] !== 'object'
        ) {
            current[key] = {}
        }
        return current[key]
    }, obj)

    target[lastKey!] = value
    return obj
}

export const Index = () => {
    const [form] = Form.useForm()
    return (
        <Form form={form} initialValues={{ a3: '2' }}>
            {items.map((item, key) => (
                <React.Fragment key={key}>
                    <h3>{item.title}</h3>
                    <Row gutter={20}>
                        {item.children.map((cItem: any, cKey: number) => {
                            const { render } = getMap(
                                cItem.fieldName as ComponentKey,
                            )

                            const { dataMap } = cItem
                            dataMap?.forEach((m: any) => {
                                const res = getValueAdvanced(
                                    eval(m.dataSource),
                                    m.dataSourceField,
                                )
                                setValueByPath(cItem, m.setField, res)
                            })
                            return (
                                <Col span={cItem.span} key={cKey}>
                                    <Form.Item
                                        required={cItem.controlAttrs?.required}
                                        label={cItem.label || ''}
                                        name={cItem.formName}
                                    >
                                        {render(cItem.controlProps)}
                                    </Form.Item>
                                </Col>
                            )
                        })}
                    </Row>
                </React.Fragment>
            ))}
        </Form>
    )
}

export default Index
