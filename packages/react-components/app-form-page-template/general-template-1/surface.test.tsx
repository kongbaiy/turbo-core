import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

const captured = vi.hoisted(() => ({
    listProps: undefined as Record<string, unknown> | undefined,
    editorProps: undefined as Record<string, unknown> | undefined,
    detailProps: undefined as Record<string, unknown> | undefined,
}))

vi.mock('../../app-form-runtime/app-form-list-renderer', () => ({
    default: (props: Record<string, unknown>) => {
        captured.listProps = props
        const toolBarRender = props.toolBarRender as (() => ReactNode[]) | undefined
        return <div data-testid='list-surface'>{toolBarRender?.()}</div>
    },
}))

vi.mock('./record-drawer', () => ({
    default: ({ schema }: { schema: { scene?: string } }) => (
        <div data-testid='record-drawer'>{schema.scene}</div>
    ),
    createEmptyRuntimeValue: () => ({ dataDomains: {} }),
    recordDisplayName: () => '模拟记录',
}))

vi.mock('../../app-form-runtime/app-form-editor-renderer', () => ({
    default: (props: Record<string, unknown>) => {
        captured.editorProps = props
        return <div data-testid='inline-form-surface'>FORM</div>
    },
}))

vi.mock('../../app-form-runtime/app-form-detail-renderer', () => ({
    default: (props: Record<string, unknown>) => {
        captured.detailProps = props
        return <div data-testid='inline-detail-surface'>DETAIL</div>
    },
}))

import type { AppFormRenderSchema } from '../../app-form-runtime/types'
import GeneralTemplate1Surface from './surface'

const listSchema: AppFormRenderSchema = {
    schemaVersion: '2.2',
    scene: 'LIST',
    form: { formCode: 'FORM_1' },
    dataDomains: [],
}

const formSchema: AppFormRenderSchema = {
    schemaVersion: '2.2',
    scene: 'FORM',
    form: { formCode: 'FORM_1' },
    dataDomains: [],
}

const runtimeClient = {
    getSchemaByPermission: vi.fn(),
    getSchema: vi.fn(),
    page: vi.fn(),
    detail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    loadOptions: vi.fn(),
}

beforeEach(() => {
    vi.clearAllMocks()
    captured.listProps = undefined
    captured.editorProps = undefined
    captured.detailProps = undefined
    runtimeClient.getSchema.mockResolvedValue(formSchema)
})

test('Surface 使用传入 LIST Schema 并复用 FORM Drawer，不自行解析页面权限', async () => {
    render(
        <GeneralTemplate1Surface
            schema={listSchema}
            runtimeClient={runtimeClient}
        />,
    )

    expect(screen.queryByTestId('list-surface')).not.toBeNull()
    expect(runtimeClient.getSchemaByPermission).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /新增/ }))

    await waitFor(() => {
        expect(runtimeClient.getSchema).toHaveBeenCalledWith('FORM_1', 'FORM')
        expect(screen.getByTestId('record-drawer').textContent).toBe('FORM')
    })
})

test.each([
    ['FORM', 'inline-form-surface'],
    ['DETAIL', 'inline-detail-surface'],
] as const)('Surface 可在设计画布内直接呈现 %s 场景', (scene, testId) => {
    render(
        <GeneralTemplate1Surface
            schema={{ ...formSchema, scene }}
            runtimeClient={runtimeClient}
            scene={scene}
        />,
    )

    expect(screen.queryByTestId(testId)).not.toBeNull()
    expect(screen.queryByTestId('list-surface')).toBeNull()
})

test('Surface 将设计标注传给实际的列表、表单和详情组件', () => {
    const designer = {
        enabled: true,
        editable: true,
        selectedNodeId: 'REGION_1',
    }
    const { rerender } = render(
        <GeneralTemplate1Surface
            schema={listSchema}
            runtimeClient={runtimeClient}
            designer={designer}
        />,
    )
    expect(captured.listProps?.designer).toBe(designer)

    rerender(
        <GeneralTemplate1Surface
            schema={formSchema}
            runtimeClient={runtimeClient}
            scene='FORM'
            designer={designer}
        />,
    )
    expect(captured.editorProps?.designer).toBe(designer)

    rerender(
        <GeneralTemplate1Surface
            schema={{ ...formSchema, scene: 'DETAIL' }}
            runtimeClient={runtimeClient}
            scene='DETAIL'
            designer={designer}
        />,
    )
    expect(captured.detailProps?.designer).toBe(designer)
})
