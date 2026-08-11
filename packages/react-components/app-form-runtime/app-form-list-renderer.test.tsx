import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, test, vi } from 'vitest'

vi.mock('@ant-design/pro-components', () => ({
    ProTable: (props: Record<string, unknown>) => (
        <div data-testid='actual-pro-table'>
            <div className='ant-pro-query-filter'>实际查询组件</div>
            {(
                props.tableRender as (
                    props: Record<string, unknown>,
                    defaultDom: ReactNode,
                ) => ReactNode | undefined
            )?.(
                props,
                <div className='ant-pro-card'>
                    <div className='ant-table-wrapper'>实际表格组件</div>
                </div>,
            ) || null}
        </div>
    ),
}))

import AppFormListRenderer, {
    displayValue,
    searchValueType,
} from './app-form-list-renderer'
import type { AppFormRenderSchema } from './types'

test('关联字段使用去掉Id后的Name字段显示中文名称', () => {
    expect(
        displayValue(
            { fieldCode: 'departmentId', fieldLabel: '部门' },
            { departmentId: 'dept-1', departmentName: '综合管理部' },
        ),
    ).toBe('综合管理部')
})

test('字典字段没有描述快照时使用字典选项显示中文名称', () => {
    expect(
        displayValue(
            {
                fieldCode: 'status',
                fieldLabel: '员工状态',
                controlType: 'SELECT',
                options: [{ value: '1', label: '在职' }],
            },
            { status: 1 },
        ),
    ).toBe('在职')
})

test('年月控件在查询区使用年月选择类型', () => {
    expect(
        searchValueType({
            fieldCode: 'grantMonth',
            fieldLabel: '发放月份',
            controlType: 'MONTH_PICKER',
        }),
    ).toBe('dateMonth')
})

test('设计态直接标注 ProTable 的实际查询区和表格区', () => {
    const onSelectNode = vi.fn()
    const onDropField = vi.fn()
    const schema: AppFormRenderSchema = {
        schemaVersion: '2.2',
        scene: 'LIST',
        pageLayout: {
            designTree: [
                {
                    id: 'LIST_ROOT',
                    nodeType: 'CONTAINER',
                    nodeCode: 'LIST_ROOT',
                    nodeConfigJson: { layoutRole: 'LIST_ROOT' },
                    children: [
                        {
                            id: 'SEARCH_REGION',
                            nodeType: 'REGION',
                            nodeCode: 'SEARCH_REGION',
                            nodeName: '查询区域',
                            nodeConfigJson: { layoutRole: 'LIST_SEARCH' },
                        },
                        {
                            id: 'TABLE_REGION',
                            nodeType: 'REGION',
                            nodeCode: 'TABLE_REGION',
                            nodeName: '表格区域',
                            nodeConfigJson: { layoutRole: 'LIST_TABLE' },
                        },
                    ],
                },
            ],
        },
        dataDomains: [
            {
                domainCode: 'BASIC',
                domainType: 'OBJECT',
                fields: [
                    {
                        dataDomainCode: 'BASIC',
                        fieldCode: 'KEYWORD',
                        fieldLabel: '关键字',
                        capabilities: { searchable: true },
                    },
                ],
            },
        ],
    }

    render(
        <AppFormListRenderer
            schema={schema}
            rowKey='id'
            request={vi.fn()}
            designer={{
                enabled: true,
                editable: true,
                selectedNodeId: 'SEARCH_REGION',
                onSelectNode,
                onDropField,
            }}
        />,
    )

    const searchRegion = screen.getByTestId('template-region-SEARCH_REGION')
    const tableRegion = screen.getByTestId('template-region-TABLE_REGION')
    expect(searchRegion.textContent).toContain('实际查询组件')
    expect(tableRegion.textContent).toContain('实际表格组件')

    fireEvent.click(searchRegion)
    expect(onSelectNode).toHaveBeenCalledWith('SEARCH_REGION')

    fireEvent.drop(tableRegion, {
        dataTransfer: { getData: vi.fn(() => 'FIELD_AMOUNT') },
    })
    expect(onDropField).toHaveBeenCalledWith('FIELD_AMOUNT', 'TABLE_REGION')
})
