import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import { message } from 'antd'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('antd', async (importOriginal) => {
    const actual = await importOriginal<typeof import('antd')>()
    return {
        ...actual,
        Popconfirm: ({
            children,
            onConfirm,
        }: {
            children: ReactNode
            onConfirm?: () => void
        }) => <span onClick={onConfirm}>{children}</span>,
    }
})

import AttachmentInfoControl from './attachment-info-control'

const field = {
    fieldCode: 'attachments',
    fieldLabel: '附件信息',
    controlType: 'ATTACHMENT_INFO',
    controlProps: {
        fileTypes: '.pdf,.docx',
        fileMaxSize: 10,
        fileMaxCount: 3,
    },
}

beforeEach(() => {
    const getComputedStyle = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
        getComputedStyle(element),
    )
})

afterEach(() => {
    vi.restoreAllMocks()
})

test('上传后只保存 fileId 和列表快照，不保存临时访问地址', async () => {
    const onChange = vi.fn()
    const onFileSelect = vi.fn().mockResolvedValue({
        fileId: 'FILE_1',
        fileName: '合同.pdf',
        fileSize: 2 * 1024 * 1024,
        contentType: 'application/pdf',
        extension: '.pdf',
        uploaderName: '张三',
        createTime: '2026-08-09 10:00:00',
        url: 'https://files.example.test/stable',
        downloadUrl: 'https://files.example.test/download',
        previewUrl: 'https://files.example.test/preview',
        preview: { fileUrl: 'https://files.example.test/temporary' },
    })
    const { container } = render(
        <AttachmentInfoControl
            field={field}
            disabled={false}
            readonly={false}
            onChange={onChange}
            onFileSelect={onFileSelect}
        />,
    )

    const input = container.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    fireEvent.change(input!, {
        target: {
            files: [
                new File(['contract'], '合同.pdf', {
                    type: 'application/pdf',
                }),
            ],
        },
    })

    await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([
            {
                fileId: 'FILE_1',
                fileName: '合同.pdf',
                fileSize: 2 * 1024 * 1024,
                contentType: 'application/pdf',
                extension: '.pdf',
                uploaderName: '张三',
                uploadTime: '2026-08-09 10:00:00',
            },
        ])
    })
    expect(JSON.stringify(onChange.mock.calls[0]?.[0])).not.toContain('http')
})

test('上传结果缺少 fileId 时不改变字段值', async () => {
    const onChange = vi.fn()
    const error = vi.spyOn(message, 'error')
    const { container } = render(
        <AttachmentInfoControl
            field={field}
            disabled={false}
            readonly={false}
            onChange={onChange}
            onFileSelect={vi.fn().mockResolvedValue({
                fileName: '无编号.pdf',
            })}
        />,
    )

    fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: {
            files: [
                new File(['missing-id'], '无编号.pdf', {
                    type: 'application/pdf',
                }),
            ],
        },
    })

    await waitFor(() => {
        expect(error).toHaveBeenCalledWith('附件上传结果缺少文件ID')
    })
    expect(onChange).not.toHaveBeenCalled()
})

test('列表格式化文件大小并可删除指定附件', () => {
    const onChange = vi.fn()
    render(
        <AttachmentInfoControl
            field={field}
            value={[
                { fileId: 'FILE_1', fileName: '合同.pdf', fileSize: 1024 },
                {
                    fileId: 'FILE_2',
                    fileName: '清单.docx',
                    fileSize: 1.5 * 1024 * 1024,
                },
            ]}
            disabled={false}
            readonly={false}
            onChange={onChange}
            onFileSelect={vi.fn()}
        />,
    )

    expect(screen.getByText('1 KB')).toBeTruthy()
    expect(screen.getByText('1.5 MB')).toBeTruthy()

    const row = screen.getByText('清单.docx').closest('tr')
    expect(row).not.toBeNull()
    fireEvent.click(within(row!).getByRole('button', { name: '删除' }))

    expect(onChange).toHaveBeenCalledWith([
        { fileId: 'FILE_1', fileName: '合同.pdf', fileSize: 1024 },
    ])
})

test('只读状态仅显示附件列表和访问操作', () => {
    render(
        <AttachmentInfoControl
            field={field}
            value={[{ fileId: 'FILE_1', fileName: '合同.pdf' }]}
            disabled={false}
            readonly
            onFileAccess={vi.fn()}
        />,
    )

    expect(screen.getByText('合同.pdf')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '上传附件' })).toBeNull()
    expect(screen.queryByRole('button', { name: '删除' })).toBeNull()
    expect(screen.getByRole('button', { name: '查看' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '下载' })).toBeTruthy()
})

test('查看和下载时才按 fileId 获取临时地址', async () => {
    const onFileAccess = vi.fn().mockResolvedValue({
        url: 'https://files.example.test/temporary',
        fileName: '合同.pdf',
    })
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const anchorClick = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => undefined)
    render(
        <AttachmentInfoControl
            field={field}
            value={[{ fileId: 'FILE_1', fileName: '合同.pdf' }]}
            disabled={false}
            readonly
            onFileAccess={onFileAccess}
        />,
    )

    expect(onFileAccess).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '查看' }))
    await waitFor(() => {
        expect(onFileAccess).toHaveBeenCalledWith('FILE_1', field, 'preview')
    })
    expect(open).toHaveBeenCalledWith(
        'https://files.example.test/temporary',
        '_blank',
        'noopener,noreferrer',
    )

    fireEvent.click(screen.getByRole('button', { name: '下载' }))
    await waitFor(() => {
        expect(onFileAccess).toHaveBeenLastCalledWith(
            'FILE_1',
            field,
            'download',
        )
    })
    expect(anchorClick).toHaveBeenCalled()
})

test('文件访问失败时显示中文提示且不修改字段值', async () => {
    const error = vi.spyOn(message, 'error')
    const onChange = vi.fn()
    render(
        <AttachmentInfoControl
            field={field}
            value={[{ fileId: 'FILE_1', fileName: '合同.pdf' }]}
            disabled={false}
            readonly={false}
            onChange={onChange}
            onFileSelect={vi.fn()}
            onFileAccess={vi.fn().mockRejectedValue(new Error('expired'))}
        />,
    )

    fireEvent.click(screen.getByRole('button', { name: '查看' }))
    await waitFor(() => {
        expect(error).toHaveBeenCalledWith('文件访问失败，请稍后重试')
    })
    expect(onChange).not.toHaveBeenCalled()
})

test('达到数量上限或重复上传时不改变字段值', async () => {
    const onChange = vi.fn()
    const existingValue = [
        { fileId: 'FILE_1', fileName: '一.pdf' },
        { fileId: 'FILE_2', fileName: '二.pdf' },
        { fileId: 'FILE_3', fileName: '三.pdf' },
    ]
    const { container, rerender } = render(
        <AttachmentInfoControl
            field={field}
            value={existingValue}
            disabled={false}
            readonly={false}
            onChange={onChange}
            onFileSelect={vi.fn()}
        />,
    )

    expect(
        screen
            .getByRole('button', { name: '上传附件' })
            .getAttribute('disabled'),
    ).not.toBeNull()
    expect(
        container.querySelector('input[type="file"]')?.getAttribute('disabled'),
    ).not.toBeNull()

    const onFileSelect = vi.fn().mockResolvedValue({
        fileId: 'FILE_1',
        fileName: '重复.pdf',
    })
    rerender(
        <AttachmentInfoControl
            field={{
                ...field,
                controlProps: { ...field.controlProps, fileMaxCount: 4 },
            }}
            value={existingValue}
            disabled={false}
            readonly={false}
            onChange={onChange}
            onFileSelect={onFileSelect}
        />,
    )
    fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: {
            files: [
                new File(['duplicate'], '重复.pdf', {
                    type: 'application/pdf',
                }),
            ],
        },
    })

    await waitFor(() => expect(onFileSelect).toHaveBeenCalled())
    expect(onChange).not.toHaveBeenCalled()
})

test('未提供上传能力时显示中文提示并禁用上传', () => {
    render(
        <AttachmentInfoControl
            field={field}
            disabled={false}
            readonly={false}
        />,
    )

    expect(
        screen
            .getByRole('button', { name: '上传附件' })
            .getAttribute('disabled'),
    ).not.toBeNull()
    expect(screen.getByText('当前页面暂不支持上传附件')).toBeTruthy()
})
