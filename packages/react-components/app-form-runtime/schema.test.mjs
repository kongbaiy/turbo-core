import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
    createSchemaIndex,
    getListFields,
    getRegionFields,
    getSceneRoots,
    getSearchFields,
} from './schema.ts'

const schema = {
    scene: 'FORM',
    pageLayout: {
        designTree: [
            {
                id: 'root',
                nodeType: 'CONTAINER',
                nodeCode: 'FORM_ROOT',
                containerType: 'TABS',
                nodeConfigJson: '{"scenes":["FORM","DETAIL"]}',
                children: [
                    {
                        id: 'tab-basic',
                        nodeType: 'TAB_ITEM',
                        nodeCode: 'TAB_BASIC',
                        children: [
                            {
                                id: 'region-basic',
                                nodeType: 'REGION',
                                nodeCode: 'BASIC',
                                regionType: 'OBJECT',
                                nodeConfigJson:
                                    '{"dataDomainCode":"employee","fieldCodes":["name","employeeNo"]}',
                            },
                        ],
                    },
                ],
            },
            {
                id: 'detail-only',
                nodeType: 'CONTAINER',
                nodeCode: 'DETAIL_ONLY',
                nodeConfigJson: '{"scene":"DETAIL"}',
            },
        ],
    },
    dataDomains: [
        {
            dataDomainId: 'employee-domain',
            domainCode: 'employee',
            domainType: 'OBJECT',
            fields: [
                {
                    fieldId: 'field-no',
                    fieldCode: 'employeeNo',
                    fieldLabel: '工号',
                    sortNo: 10,
                    capabilities: { listVisible: true, searchable: true },
                },
                {
                    fieldId: 'field-name',
                    fieldCode: 'name',
                    fieldLabel: '姓名',
                    sortNo: 20,
                    capabilities: { listVisible: true, searchable: false },
                },
                {
                    fieldId: 'field-hidden',
                    fieldCode: 'idCard',
                    fieldLabel: '身份证号',
                    sortNo: 30,
                    capabilities: { listVisible: false, searchable: false },
                },
            ],
        },
    ],
}

test('getSceneRoots keeps shared roots and removes detail-only roots for FORM', () => {
    assert.deepEqual(
        getSceneRoots(schema, 'FORM').map((node) => node.nodeCode),
        ['FORM_ROOT'],
    )
    assert.deepEqual(
        getSceneRoots(schema, 'DETAIL').map((node) => node.nodeCode),
        ['FORM_ROOT', 'DETAIL_ONLY'],
    )
})

test('getRegionFields follows configured fieldCodes order without persisted FIELD nodes', () => {
    const index = createSchemaIndex(schema)
    const region = index.nodeById.get('region-basic')

    assert.deepEqual(
        getRegionFields(index, region).map((field) => field.fieldCode),
        ['name', 'employeeNo'],
    )
})

test('getListFields only exposes listVisible fields in stable field order', () => {
    assert.deepEqual(
        getListFields(schema).map((field) => field.fieldCode),
        ['employeeNo', 'name'],
    )
})

test('list fields follow LIST_ROOT search and table layout placements first', () => {
    const listLayoutSchema = {
        pageLayout: {
            designTree: [
                {
                    id: 'list-root',
                    nodeType: 'CONTAINER',
                    nodeCode: 'LIST_ROOT',
                    nodeConfigJson: '{"scene":"LIST","layoutRole":"LIST_ROOT"}',
                    children: [
                        {
                            id: 'list-search',
                            nodeType: 'REGION',
                            nodeCode: 'LIST_SEARCH_REGION',
                            children: [
                                {
                                    id: 'search-name',
                                    nodeType: 'FIELD',
                                    nodeCode: 'LIST_SEARCH_name',
                                    fieldId: 'field-name',
                                    sortNo: 20,
                                },
                                {
                                    id: 'search-no',
                                    nodeType: 'FIELD',
                                    nodeCode: 'LIST_SEARCH_employeeNo',
                                    fieldId: 'field-no',
                                    sortNo: 10,
                                },
                            ],
                        },
                        {
                            id: 'list-table',
                            nodeType: 'REGION',
                            nodeCode: 'LIST_TABLE_REGION',
                            children: [
                                {
                                    id: 'table-status',
                                    nodeType: 'FIELD',
                                    nodeCode: 'LIST_TABLE_status',
                                    fieldId: 'field-status',
                                    sortNo: 10,
                                },
                                {
                                    id: 'table-name',
                                    nodeType: 'FIELD',
                                    nodeCode: 'LIST_TABLE_name',
                                    fieldId: 'field-name',
                                    sortNo: 20,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        dataDomains: [
            {
                dataDomainId: 'employee-domain',
                domainCode: 'employee',
                domainType: 'OBJECT',
                fields: [
                    {
                        fieldId: 'field-name',
                        fieldCode: 'name',
                        fieldLabel: '姓名',
                        sortNo: 10,
                        capabilities: { listVisible: false, searchable: false },
                    },
                    {
                        fieldId: 'field-no',
                        fieldCode: 'employeeNo',
                        fieldLabel: '工号',
                        sortNo: 20,
                        capabilities: { listVisible: false, searchable: false },
                    },
                    {
                        fieldId: 'field-status',
                        fieldCode: 'status',
                        fieldLabel: '状态',
                        sortNo: 30,
                        capabilities: { listVisible: false, searchable: false },
                    },
                ],
            },
        ],
    }

    assert.deepEqual(
        getSearchFields(listLayoutSchema).map((field) => field.fieldCode),
        ['employeeNo', 'name'],
    )
    assert.deepEqual(
        getListFields(listLayoutSchema).map((field) => field.fieldCode),
        ['status', 'name'],
    )
})
