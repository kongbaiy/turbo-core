import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import AppFormDetailRenderer from './app-form-detail-renderer'
import AppFormEditorRenderer from './app-form-editor-renderer'
import type { AppFormRenderSchema } from './types'

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
    }),
})

const getComputedStyle = window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
    writable: true,
    value: (element: Element) => getComputedStyle(element),
})

test('渲染表单根容器下直接配置的字段', () => {
    const schema: AppFormRenderSchema = {
        schemaVersion: '2.2',
        scene: 'FORM',
        pageLayout: {
            designTree: [
                {
                    id: 'FORM_ROOT',
                    nodeType: 'CONTAINER',
                    nodeCode: 'FORM_ROOT',
                    nodeName: '表单页面布局',
                    containerType: 'NORMAL',
                    nodeConfigJson: {
                        scenes: ['FORM', 'DETAIL'],
                        layoutRole: 'FORM_ROOT',
                    },
                    children: [
                        {
                            id: 'FIELD_NODE_CONTRACT_NO',
                            nodeType: 'FIELD',
                            nodeCode: 'FORM_ROOT_CONTRACT_NO',
                            nodeName: '合同编号',
                            fieldId: 'FIELD_CONTRACT_NO',
                            gridSpan: 12,
                        },
                    ],
                },
            ],
        },
        dataDomains: [
            {
                dataDomainId: 'DOMAIN_BASIC_INFO',
                domainCode: 'BASIC_INFO',
                domainName: '基本信息',
                domainType: 'OBJECT',
                fields: [
                    {
                        fieldId: 'FIELD_CONTRACT_NO',
                        dataDomainId: 'DOMAIN_BASIC_INFO',
                        dataDomainCode: 'BASIC_INFO',
                        fieldCode: 'CONTRACT_NO',
                        fieldName: 'contract_no',
                        fieldLabel: '合同编号',
                        controlType: 'TEXT_SINGLE',
                    },
                ],
            },
        ],
    }

    render(
        <AppFormEditorRenderer
            schema={schema}
            value={{ dataDomains: { BASIC_INFO: {} } }}
        />,
    )

    expect(screen.getByText('合同编号')).not.toBeNull()
    expect(screen.getByPlaceholderText('请输入')).not.toBeNull()
    expect(screen.queryByText('表单页面布局')).toBeNull()
})

test('设计态在线框内继续渲染实际表单控件', () => {
    const onSelectNode = vi.fn()
    const onDropField = vi.fn()
    const schema: AppFormRenderSchema = {
        schemaVersion: '2.2',
        scene: 'FORM',
        pageLayout: {
            designTree: [
                {
                    id: 'FORM_ROOT',
                    nodeType: 'CONTAINER',
                    nodeCode: 'FORM_ROOT',
                    nodeConfigJson: { layoutRole: 'FORM_ROOT' },
                    children: [
                        {
                            id: 'BASIC_REGION',
                            nodeType: 'CONTAINER',
                            nodeCode: 'BASIC_REGION',
                            nodeName: '基本信息',
                            containerType: 'NORMAL',
                            children: [
                                {
                                    id: 'NAME_PLACEMENT',
                                    nodeType: 'FIELD',
                                    nodeCode: 'BASIC_REGION_NAME',
                                    fieldId: 'FIELD_NAME',
                                    gridSpan: 12,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        dataDomains: [
            {
                dataDomainId: 'DOMAIN_BASIC',
                domainCode: 'BASIC',
                domainName: '基本信息',
                domainType: 'OBJECT',
                fields: [
                    {
                        fieldId: 'FIELD_NAME',
                        dataDomainId: 'DOMAIN_BASIC',
                        dataDomainCode: 'BASIC',
                        fieldCode: 'NAME',
                        fieldLabel: '名称',
                        controlType: 'TEXT_SINGLE',
                    },
                ],
            },
        ],
    }

    render(
        <AppFormEditorRenderer
            schema={schema}
            value={{ dataDomains: { BASIC: {} } }}
            designer={{
                enabled: true,
                editable: true,
                selectedNodeId: 'BASIC_REGION',
                onSelectNode,
                onDropField,
            }}
        />,
    )

    const region = screen.getByTestId('template-region-BASIC_REGION')
    expect(screen.getByTestId('template-region-FORM_ROOT')).not.toBeNull()
    expect(screen.getByPlaceholderText('请输入')).not.toBeNull()

    fireEvent.click(screen.getByTestId('overlay-node-NAME_PLACEMENT'))
    expect(onSelectNode).toHaveBeenCalledWith('NAME_PLACEMENT')

    fireEvent.drop(region, {
        dataTransfer: {
            getData: vi.fn(() => 'FIELD_AMOUNT'),
        },
    })
    expect(onDropField).toHaveBeenCalledWith('FIELD_AMOUNT', 'BASIC_REGION')
})

test('只读详情不展示必填星号并优先显示引用字段名称', () => {
    const schema: AppFormRenderSchema = {
        schemaVersion: '2.2',
        scene: 'DETAIL',
        pageLayout: {
            designTree: [
                {
                    id: 'FORM_ROOT',
                    nodeType: 'CONTAINER',
                    nodeCode: 'FORM_ROOT',
                    nodeConfigJson: { layoutRole: 'FORM_ROOT' },
                    children: [
                        {
                            id: 'DEPT_FIELD_NODE',
                            nodeType: 'FIELD',
                            nodeCode: 'FORM_ROOT_DEPT',
                            fieldId: 'FIELD_DEPT',
                            gridSpan: 12,
                        },
                    ],
                },
            ],
        },
        dataDomains: [
            {
                dataDomainId: 'DOMAIN_BASIC',
                domainCode: 'BASIC',
                domainName: '基本信息',
                domainType: 'OBJECT',
                fields: [
                    {
                        fieldId: 'FIELD_DEPT',
                        dataDomainId: 'DOMAIN_BASIC',
                        dataDomainCode: 'BASIC',
                        fieldCode: 'deptId',
                        fieldLabel: '部门',
                        controlType: 'ORG_DEPT_SELECT',
                        validation: { required: true },
                    },
                ],
            },
        ],
    }

    const { container } = render(
        <AppFormDetailRenderer
            schema={schema}
            value={{
                dataDomains: { BASIC: { deptId: '1851097631706603541' } },
                referenceLabels: { BASIC: { deptId: '综合管理部' } },
            }}
        />,
    )

    expect(container.querySelector('.ant-form-item-required')).toBeNull()
    expect(screen.getByText('综合管理部')).not.toBeNull()
    expect(screen.queryByText('1851097631706603541')).toBeNull()
})

test('附件业务控件在编辑态上传并在详情态按需访问文件', async () => {
    const schema: AppFormRenderSchema = {
        schemaVersion: '2.2',
        scene: 'FORM',
        pageLayout: {
            designTree: [
                {
                    id: 'FORM_ROOT',
                    nodeType: 'CONTAINER',
                    nodeCode: 'FORM_ROOT',
                    nodeConfigJson: { layoutRole: 'FORM_ROOT' },
                    children: [
                        {
                            id: 'ATTACHMENT_FIELD_NODE',
                            nodeType: 'FIELD',
                            nodeCode: 'FORM_ROOT_ATTACHMENTS',
                            fieldId: 'FIELD_ATTACHMENTS',
                            gridSpan: 24,
                        },
                    ],
                },
            ],
        },
        dataDomains: [
            {
                dataDomainId: 'DOMAIN_BASIC',
                domainCode: 'BASIC',
                domainName: '基本信息',
                domainType: 'OBJECT',
                fields: [
                    {
                        fieldId: 'FIELD_ATTACHMENTS',
                        dataDomainId: 'DOMAIN_BASIC',
                        dataDomainCode: 'BASIC',
                        fieldCode: 'attachments',
                        fieldLabel: '附件信息',
                        controlType: 'ATTACHMENT_INFO',
                    },
                ],
            },
        ],
    }
    const value = {
        dataDomains: {
            BASIC: {
                attachments: [{ fileId: 'FILE_1', fileName: '合同.pdf' }],
            },
        },
    }
    const onFileSelect = vi.fn()
    const { unmount } = render(
        <AppFormEditorRenderer
            schema={schema}
            value={value}
            onFileSelect={onFileSelect}
        />,
    )

    expect(
        screen
            .getByRole('button', { name: '上传附件' })
            .getAttribute('disabled'),
    ).toBeNull()
    expect(screen.getByText('合同.pdf')).not.toBeNull()
    unmount()

    const onFileAccess = vi.fn().mockResolvedValue({
        url: 'https://files.example.test/temporary',
    })
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(
        <AppFormDetailRenderer
            schema={{ ...schema, scene: 'DETAIL' }}
            value={value}
            onFileAccess={onFileAccess}
        />,
    )

    expect(screen.queryByRole('button', { name: '上传附件' })).toBeNull()
    expect(screen.queryByRole('button', { name: '删除' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '查看' }))
    await waitFor(() => {
        expect(onFileAccess).toHaveBeenCalledWith(
            'FILE_1',
            expect.objectContaining({ controlType: 'ATTACHMENT_INFO' }),
            'preview',
        )
    })
    expect(open).toHaveBeenCalledWith(
        'https://files.example.test/temporary',
        '_blank',
        'noopener,noreferrer',
    )
})
