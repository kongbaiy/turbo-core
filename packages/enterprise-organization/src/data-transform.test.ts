import { describe, expect, it } from 'vitest'

import {
    buildMemberCsv,
    findNode,
    splitTagValues,
    toSavePayload,
    toSaveValues,
    toTreeData,
} from './data-transform'
import type { DepartmentDrawerState, DepartmentFormValues } from './model'
import type { OrgUnitRVO } from './types'

const departmentTree: OrgUnitRVO[] = [
    {
        id: 'root',
        orgName: '总部',
        children: [{ id: 'child', parentId: 'root', orgName: '研发部' }],
    },
]

describe('部门管理数据转换', () => {
    it('生成部门树并能查找嵌套部门', () => {
        expect(toTreeData(departmentTree)).toEqual([
            {
                key: 'root',
                title: '总部',
                children: [{ key: 'child', title: '研发部', children: [] }],
            },
        ])
        expect(findNode(departmentTree, 'child')?.orgName).toBe('研发部')
        expect(findNode(departmentTree, 'missing')).toBeNull()
    })

    it('把详情转换为编辑值并生成统一保存载荷', () => {
        const values = toSaveValues({
            id: 'department-1',
            parentId: 'root',
            orgName: '研发部',
            unitTag: 'core,delivery',
            departmentResponsibleId: 'user-1',
            departmentResponsibleName: '张三',
            managementRoles: [
                {
                    roleId: 'role-1',
                    roleName: '人力接口人',
                    userId: 'user-2',
                    userName: '李四',
                },
            ],
        }) as DepartmentFormValues
        const state: DepartmentDrawerState = {
            open: true,
            mode: 'edit',
            initialValues: values,
        }

        expect(splitTagValues(' core, delivery ')).toEqual(['core', 'delivery'])
        expect(
            toSavePayload(values, state, [
                { roleId: 'role-1', roleName: '人力接口人' },
            ]),
        ).toMatchObject({
            id: 'department-1',
            parentId: 'root',
            orgName: '研发部',
            unitTag: 'core,delivery',
            departmentResponsibleId: 'user-1',
            managementRoles: [{ roleId: 'role-1', userId: 'user-2' }],
        })
    })

    it('生成带 BOM、固定表头和现有字段顺序的人员 CSV', () => {
        expect(
            buildMemberCsv([
                {
                    memberId: 'member-1',
                    employeeName: '王五',
                    employeeNo: 'E001',
                    postName: '开发工程师',
                    mobileSuffix: '1234',
                    primaryFlag: 1,
                    memberStatus: '在职',
                },
            ]),
        ).toBe(
            '\uFEFF员工姓名,员工编号,岗位,手机号后缀,是否主任职,状态\n' +
                '王五,E001,开发工程师,1234,是,在职',
        )
    })
})
