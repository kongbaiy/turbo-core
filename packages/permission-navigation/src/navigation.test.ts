import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
    buildServiceGroups,
    filterAuthorizedOpenedApps,
    findApplicationByRoute,
    findPermissionPageByRoute,
    resolveFirstAuthorizedPagePath,
    toAuthorizedMenuRoutes,
} from './navigation'

const navigation = {
    platformCode: 'ENTERPRISE_PC',
    platforms: [
        {
            platformId: 'PLATFORM_HIDDEN',
            platformCode: 'HIDDEN',
            platformName: '隐藏平台',
            allAppVisibleFlag: 0,
            apps: [
                {
                    appId: 'APP_HIDDEN_PLATFORM',
                    appCode: 'HIDDEN_APP',
                    appName: '隐藏应用',
                    entryUrl: '/hidden',
                    allAppVisibleFlag: 1,
                    topNavVisibleFlag: 1,
                    permissions: [],
                },
            ],
        },
        {
            platformId: 'PLATFORM_ENTERPRISE',
            platformCode: 'ENTERPRISE_PC',
            platformName: '企业平台',
            allAppVisibleFlag: 1,
            sortNo: 10,
            apps: [
                {
                    appId: 'APP_BASIC',
                    appCode: 'ENTERPRISE_BASIC',
                    appName: '企业基础主系统',
                    entryUrl: '/org',
                    allAppVisibleFlag: 1,
                    topNavVisibleFlag: 1,
                    permissions: [
                        {
                            permissionId: 'PERM_CONFIG',
                            permissionType: 'PAGE',
                            permissionCode: 'BASIC_CONFIG',
                            permissionName: '配置管理',
                            routePath:
                                '/config-manage/config/application-manage',
                            visibleFlag: 1,
                            children: [],
                        },
                    ],
                },
                {
                    appId: 'APP_EXPENSE',
                    appCode: 'EXPENSE',
                    appName: '费用报销',
                    entryUrl: '/expense',
                    allAppVisibleFlag: 1,
                    topNavVisibleFlag: 1,
                    permissions: [
                        {
                            permissionId: 'PERM_ROOT',
                            permissionType: 'MENU',
                            permissionCode: 'EXP_ROOT',
                            permissionName: '费用管理',
                            iconValue: 'WalletOutlined',
                            visibleFlag: 1,
                            children: [
                                {
                                    permissionId: 'PERM_RECORD',
                                    permissionType: 'PAGE',
                                    permissionCode: 'EXP_RECORD',
                                    permissionKey: 'expense.record',
                                    permissionName: '费用记录',
                                    routePath: '/expense/expense-record',
                                    iconValue: 'ProfileOutlined',
                                    visibleFlag: 1,
                                    children: [
                                        {
                                            permissionId: 'PERM_RECORD_ADD',
                                            permissionType: 'BUTTON',
                                            permissionCode: 'EXP_RECORD_ADD',
                                            permissionName: '新增',
                                            visibleFlag: 1,
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    permissionId: 'PERM_INVOICE',
                                    permissionType: 'PAGE',
                                    permissionCode: 'EXP_INVOICE',
                                    permissionName: '发票夹',
                                    routePath: 'invoice-folder',
                                    visibleFlag: 1,
                                    children: [],
                                },
                                {
                                    permissionId: 'PERM_HIDDEN',
                                    permissionType: 'PAGE',
                                    permissionCode: 'EXP_HIDDEN',
                                    permissionName: '隐藏页面',
                                    routePath: '/expense/hidden',
                                    visibleFlag: 0,
                                    children: [],
                                },
                            ],
                        },
                        {
                            permissionId: 'PERM_QUERY_API',
                            permissionType: 'API',
                            permissionCode: 'EXP_QUERY_API',
                            permissionName: '查询接口',
                            apiPath: '/api/expense/records',
                            visibleFlag: 1,
                            children: [],
                        },
                    ],
                },
                {
                    appId: 'APP_HIDDEN',
                    appCode: 'HIDDEN_APP',
                    appName: '隐藏应用',
                    entryUrl: '/hidden-app',
                    allAppVisibleFlag: 0,
                    topNavVisibleFlag: 1,
                    permissions: [],
                },
            ],
        },
    ],
}

test('builds service groups from visible platforms and visible applications', () => {
    const groups = buildServiceGroups(navigation)

    assert.deepEqual(groups, [
        {
            key: 'PLATFORM_ENTERPRISE',
            name: '企业平台',
            platformCode: 'ENTERPRISE_PC',
            apps: [
                {
                    key: 'APP_BASIC',
                    name: '企业基础主系统',
                    pathname: '/org',
                    appCode: 'ENTERPRISE_BASIC',
                    iconValue: undefined,
                    newWindow: false,
                },
                {
                    key: 'APP_EXPENSE',
                    name: '费用报销',
                    pathname: '/expense',
                    appCode: 'EXPENSE',
                    iconValue: undefined,
                    newWindow: false,
                },
            ],
        },
    ])
})

test('filters opened application tabs to authorized dynamic apps only', () => {
    const openedApps = [
        {
            id: '/org',
            pathname: '/org',
            handle: {
                name: '组织资源管理',
            },
        },
        {
            id: 'APP_EXPENSE',
            appId: 'APP_EXPENSE',
            appCode: 'EXPENSE',
            pathname: '/expense',
            handle: {
                name: '费用报销',
            },
        },
        {
            id: 'APP_HR',
            appId: 'APP_HR',
            appCode: 'HR',
            pathname: '/hr',
            handle: {
                name: '人事管理',
            },
        },
    ]

    assert.deepEqual(filterAuthorizedOpenedApps(openedApps, navigation), [
        openedApps[1],
    ])
})

test('已打开应用使用最新目录入口替换缓存的旧路由', () => {
    const openedApps = [
        {
            appId: 'APP_BASIC',
            appCode: 'ENTERPRISE_BASIC',
            pathname: '/org',
        },
    ]
    const navigationWithUpdatedEntry = {
        platforms: [
            {
                apps: [
                    {
                        appId: 'APP_BASIC',
                        appCode: 'ENTERPRISE_BASIC',
                        entryUrl: '/org/org-structure-manage/unit',
                        topNavVisibleFlag: 1,
                    },
                ],
            },
        ],
    }

    assert.deepEqual(
        filterAuthorizedOpenedApps(openedApps, navigationWithUpdatedEntry),
        [
            {
                appId: 'APP_BASIC',
                appCode: 'ENTERPRISE_BASIC',
                pathname: '/org/org-structure-manage/unit',
            },
        ],
    )
})

test('matches the current route to an authorized application by entry url or app key', () => {
    assert.equal(
        findApplicationByRoute(navigation, '/expense/expense-record')?.appCode,
        'EXPENSE',
    )
    assert.equal(
        findApplicationByRoute(navigation, '/unknown', 'enterprise-basic')
            ?.appCode,
        'ENTERPRISE_BASIC',
    )
    assert.equal(
        findApplicationByRoute(
            navigation,
            '/config-manage/config/application-manage',
        )?.appCode,
        'ENTERPRISE_BASIC',
    )
    assert.equal(
        findApplicationByRoute(navigation, '/config-manage')?.appCode,
        'ENTERPRISE_BASIC',
    )
    assert.equal(findApplicationByRoute(navigation, '/unknown'), undefined)
})

test('按完整业务路由或子应用相对路由找到页面模板权限', () => {
    const permissions = [
        {
            permissionId: 'EXPENSE_MENU_APPLICATION',
            permissionType: 'MENU',
            permissionCode: 'EXPENSE_MENU_APPLICATION',
            permissionName: '申请管理',
            routePath: '/expense/application',
            visibleFlag: 1,
            children: [
                {
                    permissionId: 'EXPENSE_PAGE_APPLICATION_MINE',
                    permissionType: 'PAGE',
                    permissionCode: 'EXPENSE_PAGE_APPLICATION_MINE',
                    permissionName: '我的申请',
                    routePath: '/expense/application/mine',
                    pageTemplateCode: 'GENERAL_TEMPLATE_1',
                    visibleFlag: 1,
                    permissionStatus: 'ENABLED',
                    children: [],
                },
            ],
        },
    ]

    assert.equal(
        findPermissionPageByRoute(
            permissions,
            '/expense/application/mine?source=menu',
            { rootPath: '/expense' },
        )?.permissionId,
        'EXPENSE_PAGE_APPLICATION_MINE',
    )
    assert.equal(
        findPermissionPageByRoute(permissions, '/application/mine/', {
            rootPath: '/expense',
        })?.pageTemplateCode,
        'GENERAL_TEMPLATE_1',
    )
    assert.equal(
        findPermissionPageByRoute(permissions, '/expense/application', {
            rootPath: '/expense',
        }),
        undefined,
    )
    assert.equal(
        findPermissionPageByRoute(permissions, '/application/unknown', {
            rootPath: '/expense',
        }),
        undefined,
    )
})

test('matches a canonical frontend app key to the backend app code', () => {
    const masterDataNavigation = {
        platforms: [
            {
                apps: [
                    {
                        appId: 'MASTER_DATA',
                        appCode: 'MASTER_DATA',
                        appName: '主数据系统',
                        entryUrl: '/master-data',
                        permissions: [],
                    },
                ],
            },
        ],
    }

    assert.equal(
        findApplicationByRoute(
            masterDataNavigation,
            '/master-data',
            'master-data',
        )?.appCode,
        'MASTER_DATA',
    )
})

test('将首个可见、启用且可渲染的授权页面作为应用落地页', () => {
    const app = {
        appCode: 'MASTER_DATA',
        permissions: [
            {
                permissionType: 'PAGE',
                routePath: '/home',
                visibleFlag: 1,
                children: [],
            },
            {
                permissionType: 'MENU',
                routePath: '/customer-data',
                visibleFlag: 1,
                children: [
                    {
                        permissionType: 'PAGE',
                        routePath: '/customer-data/hidden',
                        componentPath: '@/pages/hidden',
                        visibleFlag: 0,
                        children: [],
                    },
                    {
                        permissionType: 'PAGE',
                        routePath: '/customer-data/customer-manage',
                        componentPath: '@/pages/customer/manage',
                        visibleFlag: 1,
                        permissionStatus: 'ENABLED',
                        children: [],
                    },
                ],
            },
        ],
    }

    assert.equal(
        resolveFirstAuthorizedPagePath(app, '/master-data'),
        '/master-data/customer-data/customer-manage',
    )
})

test('converts authorized MENU and PAGE permissions to menu routes only', () => {
    const app = findApplicationByRoute(navigation, '/expense')!
    const routes = toAuthorizedMenuRoutes(app.permissions, {
        rootPath: '/expense',
    })

    assert.deepEqual(routes, [
        {
            path: '__permission/PERM_ROOT',
            handle: {
                name: '费用管理',
                icon: 'WalletOutlined',
                access: 'EXP_ROOT',
            },
            children: [
                {
                    path: '/expense/expense-record',
                    handle: {
                        name: '费用记录',
                        icon: 'ProfileOutlined',
                        access: 'expense.record',
                    },
                    children: [],
                },
                {
                    path: '/expense/invoice-folder',
                    handle: {
                        name: '发票夹',
                        icon: undefined,
                        access: 'EXP_INVOICE',
                    },
                    children: [],
                },
            ],
        },
    ])
})

test('keeps an authorized leaf menu without a configured route visible', () => {
    const routes = toAuthorizedMenuRoutes(
        [
            {
                permissionId: '2083089316963188737',
                permissionType: 'MENU',
                permissionCode: 'MM_01',
                permissionName: '测试001',
                visibleFlag: 1,
                permissionStatus: 'ENABLED',
                children: [],
            },
        ],
        { rootPath: '/fm_accounting' },
    )

    assert.deepEqual(routes, [
        {
            path: '__permission/2083089316963188737',
            handle: {
                name: '测试001',
                icon: undefined,
                access: 'MM_01',
            },
            children: [],
        },
    ])
})

test('prefixes enterprise application base path for permission child routes', () => {
    const routes = toAuthorizedMenuRoutes(
        [
            {
                permissionId: 'PERM_JOB_ROLE',
                permissionType: 'MENU',
                permissionCode: 'JOB_ROLE',
                permissionName: '岗位角色体系',
                routePath: '/job-role-manage',
                visibleFlag: 1,
                children: [
                    {
                        permissionId: 'PERM_ROLE_PERMISSION',
                        permissionType: 'PAGE',
                        permissionCode: 'ROLE_PERMISSION',
                        permissionName: '角色权限管理',
                        routePath: '/role-permissions',
                        visibleFlag: 1,
                        children: [],
                    },
                    {
                        permissionId: 'PERM_JOB',
                        permissionType: 'PAGE',
                        permissionCode: 'JOB',
                        permissionName: '岗位管理',
                        routePath: '/job-role-manage/job',
                        visibleFlag: 1,
                        children: [],
                    },
                    {
                        permissionId: 'PERM_POSITION',
                        permissionType: 'PAGE',
                        permissionCode: 'POSITION',
                        permissionName: '职位管理',
                        routePath: '/job-role-manage/position',
                        visibleFlag: 1,
                        children: [],
                    },
                    {
                        permissionId: 'PERM_JOB_LEVEL',
                        permissionType: 'PAGE',
                        permissionCode: 'JOB_LEVEL',
                        permissionName: '职级管理',
                        routePath: 'job-level',
                        visibleFlag: 1,
                        children: [],
                    },
                ],
            },
        ],
        {
            rootPath: '/org',
        },
    )

    assert.equal(routes[0]?.path, '/org/job-role-manage')
    assert.deepEqual(
        routes[0].children.map((route) => route.path),
        [
            '/org/job-role-manage/role-permissions',
            '/org/job-role-manage/job',
            '/org/job-role-manage/position',
            '/org/job-role-manage/job-level',
        ],
    )
})

test('does not duplicate parent segment for relative child routes that already include it', () => {
    const routes = toAuthorizedMenuRoutes(
        [
            {
                permissionId: 'MASTER_DATA_MENU_DATA_GOVERNANCE',
                permissionType: 'MENU',
                permissionCode: 'MASTER_DATA_MENU_DATA_GOVERNANCE',
                permissionName: '数据治理',
                routePath: '/data-governance',
                visibleFlag: 1,
                children: [
                    {
                        permissionId: 'MASTER_DATA_PAGE_FIELD_MANAGE',
                        permissionType: 'PAGE',
                        permissionCode: 'MASTER_DATA_PAGE_FIELD_MANAGE',
                        permissionName: '字段管理',
                        routePath: 'data-governance/field-manage',
                        visibleFlag: 1,
                        children: [],
                    },
                ],
            },
        ],
        {
            rootPath: '/master-data',
        },
    )

    assert.equal(routes[0]?.path, '/master-data/data-governance')
    assert.equal(
        routes[0].children[0]?.path,
        '/master-data/data-governance/field-manage',
    )
})
