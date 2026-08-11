import { useCallback, useMemo, useState } from 'react'
import {
    Button,
    message,
    Popconfirm,
    Space,
    Table,
    Typography,
    Upload,
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'

import type {
    AppFormRuntimeAttachment,
    AppFormRuntimeControlProps,
    AppFormRuntimeFileAccessAction,
    AppFormRuntimeUploadedFile,
} from '../types'
import { stringList } from './shared'

import type { TableColumnsType } from 'antd'

export interface AttachmentInfoControlProps {
    field: AppFormRuntimeControlProps['field']
    value?: unknown
    disabled: boolean
    readonly: boolean
    onChange?: AppFormRuntimeControlProps['onChange']
    onFileSelect?: AppFormRuntimeControlProps['onFileSelect']
    onFileAccess?: AppFormRuntimeControlProps['onFileAccess']
}

const extensionOf = (fileName: string) => {
    const index = fileName.lastIndexOf('.')
    return index >= 0 ? fileName.slice(index).toLowerCase() : undefined
}

const positiveNumber = (value: unknown) => {
    const result = Number(value)
    return Number.isFinite(result) && result > 0 ? result : undefined
}

const attachmentSnapshot = (
    value: Record<string, unknown>,
): AppFormRuntimeAttachment | undefined => {
    if (!value.fileId) return undefined
    const optionalText = (item: unknown) =>
        typeof item === 'string' && item ? item : undefined
    const fileSize = Number(value.fileSize)
    return {
        fileId: String(value.fileId),
        fileName: optionalText(value.fileName),
        fileSize: Number.isFinite(fileSize) ? fileSize : undefined,
        contentType: optionalText(value.contentType),
        extension: optionalText(value.extension),
        uploaderName: optionalText(value.uploaderName),
        uploadTime: optionalText(value.uploadTime),
    }
}

const attachmentsOf = (value: unknown) => {
    if (!Array.isArray(value)) return []
    const fileIds = new Set<string>()
    return value.reduce<AppFormRuntimeAttachment[]>((result, item) => {
        if (!item || typeof item !== 'object') return result
        const snapshot = attachmentSnapshot(item as Record<string, unknown>)
        if (!snapshot || fileIds.has(snapshot.fileId)) return result
        fileIds.add(snapshot.fileId)
        result.push(snapshot)
        return result
    }, [])
}

const uploadSnapshot = (
    result: AppFormRuntimeUploadedFile | string | undefined,
    file: File,
) => {
    if (!result) return undefined
    if (typeof result === 'string') {
        return {
            fileId: result,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type || undefined,
            extension: extensionOf(file.name),
        } satisfies AppFormRuntimeAttachment
    }

    // 上传响应可能带临时 URL；这里只对白名单快照字段做投影，避免把地址持久化。
    return attachmentSnapshot({
        fileId: result.fileId || result.id,
        fileName: result.fileName || result.originalFilename || file.name,
        fileSize: result.fileSize ?? file.size,
        contentType: result.contentType || file.type,
        extension: result.extension || extensionOf(file.name),
        uploaderName: result.uploaderName,
        uploadTime: result.uploadTime || result.createTime,
    })
}

export const formatAttachmentFileSize = (value?: number) => {
    if (value === undefined || !Number.isFinite(value) || value < 0) return '-'
    if (value === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const unitIndex = Math.min(
        Math.floor(Math.log(value) / Math.log(1024)),
        units.length - 1,
    )
    const amount = value / 1024 ** unitIndex
    return `${Number(amount.toFixed(2))} ${units[unitIndex]}`
}

const AttachmentInfoControl = ({
    field,
    value,
    disabled,
    readonly,
    onChange,
    onFileSelect,
    onFileAccess,
}: AttachmentInfoControlProps) => {
    const [uploading, setUploading] = useState(false)
    const [accessingKey, setAccessingKey] = useState<string>()
    const attachments = useMemo(() => attachmentsOf(value), [value])
    const accept =
        typeof field.controlProps?.accept === 'string'
            ? field.controlProps.accept
            : typeof field.controlProps?.fileTypes === 'string'
              ? field.controlProps.fileTypes
              : undefined
    const allowedExtensions = useMemo(
        () =>
            stringList(accept)
                .map((item) => item.toLowerCase())
                .filter((item) => item.startsWith('.')),
        [accept],
    )
    const maxSizeMb = positiveNumber(
        field.controlProps?.fileMaxSize || field.controlProps?.maxSizeMb,
    )
    const maxCount = positiveNumber(field.controlProps?.fileMaxCount)
    const maxReached = Boolean(maxCount && attachments.length >= maxCount)

    const validateFile = useCallback(
        (file: File) => {
            const extension = extensionOf(file.name) || ''
            if (
                allowedExtensions.length &&
                !allowedExtensions.includes(extension)
            ) {
                message.error(
                    `文件格式不支持，请上传：${allowedExtensions.join('、')}`,
                )
                return false
            }
            if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
                message.error(`文件大小不能超过 ${maxSizeMb}MB`)
                return false
            }
            return true
        },
        [allowedExtensions, maxSizeMb],
    )

    const handleUpload = useCallback(
        async (file: File) => {
            if (!onFileSelect || !validateFile(file) || maxReached) {
                return Upload.LIST_IGNORE
            }
            setUploading(true)
            try {
                const result = await onFileSelect(file, field)
                const snapshot = uploadSnapshot(result, file)
                if (!snapshot) {
                    message.error('附件上传结果缺少文件ID')
                    return Upload.LIST_IGNORE
                }
                if (
                    attachments.some((item) => item.fileId === snapshot.fileId)
                ) {
                    message.warning('该附件已在列表中')
                    return Upload.LIST_IGNORE
                }
                onChange?.([...attachments, snapshot])
            } catch {
                message.error('附件上传失败，请稍后重试')
            } finally {
                setUploading(false)
            }
            return Upload.LIST_IGNORE
        },
        [attachments, field, maxReached, onChange, onFileSelect, validateFile],
    )

    const handleAccess = useCallback(
        async (
            attachment: AppFormRuntimeAttachment,
            action: AppFormRuntimeFileAccessAction,
        ) => {
            if (!onFileAccess) return
            const key = `${attachment.fileId}:${action}`
            setAccessingKey(key)
            try {
                // 访问地址仅在用户操作时按 fileId 获取，不回写到表单字段值。
                const access = await onFileAccess(
                    attachment.fileId,
                    field,
                    action,
                )
                if (!access?.url) throw new Error('missing file url')
                if (action === 'preview') {
                    window.open(access.url, '_blank', 'noopener,noreferrer')
                } else {
                    const anchor = document.createElement('a')
                    anchor.href = access.url
                    anchor.download =
                        access.fileName || attachment.fileName || ''
                    anchor.target = '_blank'
                    anchor.rel = 'noopener noreferrer'
                    document.body.append(anchor)
                    anchor.click()
                    anchor.remove()
                }
            } catch {
                message.error('文件访问失败，请稍后重试')
            } finally {
                setAccessingKey(undefined)
            }
        },
        [field, onFileAccess],
    )

    const columns = useMemo<TableColumnsType<AppFormRuntimeAttachment>>(() => {
        const result: TableColumnsType<AppFormRuntimeAttachment> = [
            {
                title: '序号',
                width: 64,
                align: 'center',
                render: (_value, _record, index) => index + 1,
            },
            {
                title: '文件名称',
                dataIndex: 'fileName',
                ellipsis: true,
                render: (fileName?: string) => fileName || '-',
            },
            {
                title: '文件类型',
                width: 110,
                render: (_value, record) =>
                    record.extension?.replace(/^\./, '') ||
                    record.contentType ||
                    '-',
            },
            {
                title: '文件大小',
                dataIndex: 'fileSize',
                width: 110,
                render: formatAttachmentFileSize,
            },
            {
                title: '上传人',
                dataIndex: 'uploaderName',
                width: 110,
                ellipsis: true,
                render: (uploaderName?: string) => uploaderName || '-',
            },
            {
                title: '上传时间',
                dataIndex: 'uploadTime',
                width: 170,
                render: (uploadTime?: string) => uploadTime || '-',
            },
        ]
        if (onFileAccess || !readonly) {
            result.push({
                title: '操作',
                key: 'action',
                width: 176,
                render: (_value, record) => (
                    <Space size={8}>
                        {onFileAccess ? (
                            <>
                                <Button
                                    type='link'
                                    size='small'
                                    loading={
                                        accessingKey ===
                                        `${record.fileId}:preview`
                                    }
                                    onClick={() =>
                                        handleAccess(record, 'preview')
                                    }
                                >
                                    查看
                                </Button>
                                <Button
                                    type='link'
                                    size='small'
                                    loading={
                                        accessingKey ===
                                        `${record.fileId}:download`
                                    }
                                    onClick={() =>
                                        handleAccess(record, 'download')
                                    }
                                >
                                    下载
                                </Button>
                            </>
                        ) : null}
                        {!readonly ? (
                            <Popconfirm
                                title='确认删除该附件吗？'
                                okText='确定'
                                cancelText='取消'
                                disabled={disabled}
                                onConfirm={() =>
                                    onChange?.(
                                        attachments.filter(
                                            (item) =>
                                                item.fileId !== record.fileId,
                                        ),
                                    )
                                }
                            >
                                <Button
                                    type='link'
                                    size='small'
                                    danger
                                    disabled={disabled}
                                >
                                    删除
                                </Button>
                            </Popconfirm>
                        ) : null}
                    </Space>
                ),
            })
        }
        return result
    }, [
        accessingKey,
        attachments,
        disabled,
        handleAccess,
        onChange,
        onFileAccess,
        readonly,
    ])

    return (
        <Space orientation='vertical' size={8} style={{ width: '100%' }}>
            {!readonly ? (
                <Space orientation='vertical' size={4}>
                    <Upload
                        accept={accept}
                        showUploadList={false}
                        disabled={
                            disabled || uploading || maxReached || !onFileSelect
                        }
                        beforeUpload={handleUpload}
                    >
                        <Button
                            aria-label='上传附件'
                            icon={<UploadOutlined />}
                            loading={uploading}
                            disabled={disabled || maxReached || !onFileSelect}
                        >
                            上传附件
                        </Button>
                    </Upload>
                    {!onFileSelect ? (
                        <Typography.Text type='secondary'>
                            当前页面暂不支持上传附件
                        </Typography.Text>
                    ) : maxReached ? (
                        <Typography.Text type='secondary'>
                            最多上传 {maxCount} 个附件
                        </Typography.Text>
                    ) : null}
                </Space>
            ) : null}
            <Table<AppFormRuntimeAttachment>
                size='small'
                rowKey='fileId'
                columns={columns}
                dataSource={attachments}
                pagination={false}
                scroll={{ x: 820 }}
                locale={{ emptyText: '暂无附件' }}
            />
        </Space>
    )
}

export default AttachmentInfoControl
