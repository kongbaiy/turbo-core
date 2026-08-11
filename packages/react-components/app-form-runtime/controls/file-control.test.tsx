import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import FileControl from './file-control'

const imageField = {
    fieldCode: 'HOUSE_MASTER_IMAGE_FILE_ID',
    fieldLabel: '房屋图片',
    controlType: 'IMAGE_UPLOAD',
}

test('图片上传成功后使用预览地址回显图片而不是文件ID', async () => {
    const onChange = vi.fn()
    const onFileSelect = vi.fn().mockResolvedValue({
        fileId: '2086264284064538626',
        fileName: 'house.png',
        contentType: 'image/png',
        preview: {
            fileUrl: 'https://files.example.test/house.png',
            thumbnailUrl: 'https://files.example.test/house-thumb.png',
        },
    })
    const { container, rerender } = render(
        <FileControl
            field={imageField}
            disabled={false}
            readonly={false}
            controlType='IMAGE_UPLOAD'
            onChange={onChange}
            onFileSelect={onFileSelect}
        />,
    )
    const input = container.querySelector('input[type="file"]')
    expect(input).not.toBeNull()

    fireEvent.change(input!, {
        target: {
            files: [new File(['image'], 'house.png', { type: 'image/png' })],
        },
    })

    await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
            '2086264284064538626',
            'house.png',
            expect.objectContaining({
                preview: expect.objectContaining({
                    fileUrl: 'https://files.example.test/house.png',
                }),
            }),
        )
    })

    rerender(
        <FileControl
            field={imageField}
            value='2086264284064538626'
            disabled={false}
            readonly={false}
            controlType='IMAGE_UPLOAD'
            onChange={onChange}
            onFileSelect={onFileSelect}
        />,
    )

    expect(
        screen.getByRole('img', { name: 'house.png' }).getAttribute('src'),
    ).toBe('https://files.example.test/house-thumb.png')
    expect(screen.queryByText('2086264284064538626')).toBeNull()
})

test('已有图片元数据使用缩略图回显', () => {
    render(
        <FileControl
            field={imageField}
            value='FILE_1'
            disabled={false}
            readonly={true}
            controlType='IMAGE_UPLOAD'
            referenceLabel='房屋图片.png'
            referenceMetadata={{
                contentType: 'image/png',
                preview: {
                    fileUrl: 'https://files.example.test/house.png',
                },
            }}
        />,
    )

    expect(
        screen
            .getByRole('img', { name: '房屋图片.png' })
            .getAttribute('src'),
    ).toBe('https://files.example.test/house.png')
    expect(screen.queryByText('FILE_1')).toBeNull()
})
