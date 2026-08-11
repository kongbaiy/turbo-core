import { useState } from 'react'
import { Button, Image, Input, message, Space, Typography, Upload } from 'antd'
import { PaperClipOutlined, PictureOutlined } from '@ant-design/icons'

import type {
    AppFormRuntimeControlProps,
    AppFormRuntimeUploadedFile,
} from '../types'
import { asText, displayValue, stringList } from './shared'

const officeDocumentExtensions = [
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.csv',
    '.ppt',
    '.pptx',
    '.pdf',
    '.wps',
    '.et',
    '.dps',
]

export const isFileControl = (controlType: string) =>
    ['FILE_UPLOAD', 'FILE_MULTI', 'IMAGE_UPLOAD'].includes(controlType)

export interface FileControlProps {
    field: AppFormRuntimeControlProps['field']
    value?: unknown
    disabled: boolean
    readonly: boolean
    controlType: string
    referenceLabel?: string
    referenceMetadata?: Record<string, unknown>
    onChange?: AppFormRuntimeControlProps['onChange']
    onFileSelect?: AppFormRuntimeControlProps['onFileSelect']
}

const fileExtensionOf = (filename: string) => {
    const index = filename.lastIndexOf('.')
    return index >= 0 ? filename.slice(index).toLowerCase() : ''
}

const uploadAccept = (field: AppFormRuntimeControlProps['field']) => {
    const props = field.controlProps || {}
    if (props.acceptPreset === 'officeDocument') {
        return officeDocumentExtensions.join(',')
    }
    if (typeof props.accept === 'string') return props.accept
    if (typeof props.fileTypes === 'string') return props.fileTypes
    return undefined
}

const allowedExtensions = (field: AppFormRuntimeControlProps['field']) =>
    stringList(uploadAccept(field))
        .map((item) => item.toLowerCase())
        .filter((item) => item.startsWith('.'))

const maxUploadSizeMb = (field: AppFormRuntimeControlProps['field']) => {
    const value =
        field.controlProps?.maxSizeMb || field.controlProps?.fileMaxSize
    return typeof value === 'number' ? value : undefined
}

const uploadedFileInfo = (
    result: Awaited<
        ReturnType<NonNullable<AppFormRuntimeControlProps['onFileSelect']>>
    >,
    file: File,
) => {
    if (!result) return undefined
    if (typeof result === 'string') {
        return {
            fileId: result,
            fileName: file.name,
            contentType: file.type,
            extension: fileExtensionOf(file.name),
            fileSize: file.size,
        }
    }
    return {
        fileId: result.fileId || result.id,
        fileName: result.fileName || result.originalFilename || file.name,
        contentType: result.contentType || file.type,
        extension: result.extension || fileExtensionOf(file.name),
        fileSize: result.fileSize || file.size,
        url: result.url,
        urlPath: result.urlPath,
        downloadUrl: result.downloadUrl,
        previewUrl: result.previewUrl,
        preview: result.preview,
    }
}

const fileUrlOf = (metadata?: Record<string, unknown>) => {
    const preview = metadata?.preview
    if (preview && typeof preview === 'object') {
        const fileUrl = (preview as Record<string, unknown>).fileUrl
        if (typeof fileUrl === 'string' && fileUrl) return fileUrl
    }
    return [
        metadata?.downloadUrl,
        metadata?.previewUrl,
        metadata?.fileUrl,
        metadata?.url,
        metadata?.urlPath,
    ].find((item): item is string => typeof item === 'string' && Boolean(item))
}

const thumbnailUrlOf = (metadata?: Record<string, unknown>) => {
    const preview = metadata?.preview
    if (preview && typeof preview === 'object') {
        const thumbnailUrl = (preview as Record<string, unknown>).thumbnailUrl
        if (typeof thumbnailUrl === 'string' && thumbnailUrl) {
            return thumbnailUrl
        }
    }
    return typeof metadata?.thumbnailUrl === 'string'
        ? metadata.thumbnailUrl
        : undefined
}

const imageExtensions = new Set([
    '.avif',
    '.bmp',
    '.gif',
    '.heic',
    '.jpeg',
    '.jpg',
    '.png',
    '.svg',
    '.webp',
])

const isImageFile = (
    controlType: string,
    label?: string,
    metadata?: Record<string, unknown>,
) => {
    if (controlType === 'IMAGE_UPLOAD') return true
    if (
        typeof metadata?.contentType === 'string' &&
        metadata.contentType.toLowerCase().startsWith('image/')
    ) {
        return true
    }
    const extension =
        typeof metadata?.extension === 'string'
            ? metadata.extension.toLowerCase()
            : fileExtensionOf(label || '')
    return imageExtensions.has(
        extension.startsWith('.') ? extension : `.${extension}`,
    )
}

const validateUploadFile = (
    file: File,
    field: AppFormRuntimeControlProps['field'],
) => {
    const extensions = allowedExtensions(field)
    const extension = fileExtensionOf(file.name)
    if (extensions.length && !extensions.includes(extension)) {
        message.error(`文件格式不支持，请上传：${extensions.join('、')}`)
        return false
    }
    const maxSizeMb = maxUploadSizeMb(field)
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
        message.error(`文件大小不能超过 ${maxSizeMb}MB`)
        return false
    }
    return true
}

const FileDisplay = ({
    value,
    label,
    metadata,
    controlType,
}: {
    value?: unknown
    label?: string
    metadata?: Record<string, unknown>
    controlType: string
}) => {
    if (!value) return null
    const fileText = label || asText(value)
    const fileUrl = fileUrlOf(metadata)
    if (fileUrl && isImageFile(controlType, label, metadata)) {
        return (
            <Image
                src={thumbnailUrlOf(metadata) || fileUrl}
                preview={{ src: fileUrl }}
                width={96}
                height={72}
                alt={fileText || '上传图片'}
                style={{ objectFit: 'cover', borderRadius: 4 }}
            />
        )
    }
    return fileUrl ? (
        <Typography.Link href={fileUrl} target='_blank' ellipsis>
            {displayValue(value, fileText)}
        </Typography.Link>
    ) : (
        <Typography.Text ellipsis>
            {displayValue(value, fileText)}
        </Typography.Text>
    )
}

const FileControl = ({
    field,
    value,
    disabled,
    readonly,
    controlType,
    referenceLabel,
    referenceMetadata,
    onChange,
    onFileSelect,
}: FileControlProps) => {
    const [uploading, setUploading] = useState(false)
    const [recentUpload, setRecentUpload] =
        useState<AppFormRuntimeUploadedFile>()
    const recentFileId = recentUpload?.fileId || recentUpload?.id
    const useRecentUpload =
        recentFileId !== undefined && String(recentFileId) === String(value)
    const displayLabel = useRecentUpload
        ? recentUpload?.fileName || recentUpload?.originalFilename
        : referenceLabel
    const displayMetadata = useRecentUpload
        ? (recentUpload as Record<string, unknown>)
        : referenceMetadata

    if (readonly) {
        return value ? (
            <FileDisplay
                value={value}
                label={displayLabel}
                metadata={displayMetadata}
                controlType={controlType}
            />
        ) : (
            <Typography.Text>-</Typography.Text>
        )
    }

    if (!onFileSelect) {
        return (
            <Input
                disabled={disabled}
                style={{ width: '100%' }}
                value={asText(value)}
                onChange={(event) => onChange?.(event.target.value)}
                placeholder='请输入文件ID'
            />
        )
    }

    const icon =
        controlType === 'IMAGE_UPLOAD' ? (
            <PictureOutlined />
        ) : (
            <PaperClipOutlined />
        )
    const accept =
        controlType === 'IMAGE_UPLOAD'
            ? uploadAccept(field) || 'image/*'
            : uploadAccept(field)
    const uploadStyle = field.controlProps?.uploadStyle
    const multiple =
        controlType === 'FILE_MULTI' || field.controlProps?.multiple === true
    const uploadProps = {
        showUploadList: false,
        disabled: disabled || uploading,
        accept,
        multiple,
        beforeUpload: async (file: File) => {
            if (!validateUploadFile(file, field)) return Upload.LIST_IGNORE
            setUploading(true)
            try {
                const result = await onFileSelect(file, field)
                const info = uploadedFileInfo(result, file)
                if (!info?.fileId) return Upload.LIST_IGNORE
                setRecentUpload(info)
                if (multiple) {
                    const currentValues = Array.isArray(value)
                        ? value.map(String)
                        : []
                    const currentLabels = referenceLabel
                        ? referenceLabel.split('、').filter(Boolean)
                        : []
                    onChange?.(
                        [...currentValues, info.fileId],
                        [...currentLabels, info.fileName || info.fileId].join(
                            '、',
                        ),
                        info,
                    )
                } else {
                    onChange?.(info.fileId, info.fileName, info)
                }
            } finally {
                setUploading(false)
            }
            return Upload.LIST_IGNORE
        },
    }

    const display = (
        <FileDisplay
            value={value}
            label={displayLabel}
            metadata={displayMetadata}
            controlType={controlType}
        />
    )

    if (uploadStyle === 'dragger') {
        return (
            <Space orientation='vertical' size={4} style={{ width: '100%' }}>
                <Upload.Dragger {...uploadProps}>
                    <p className='ant-upload-drag-icon'>{icon}</p>
                    <p className='ant-upload-text'>点击上传或拖拽文件到此处</p>
                    <p className='ant-upload-hint'>
                        支持 Word、Excel、PPT、PDF 等常见办公文档
                    </p>
                </Upload.Dragger>
                {display}
            </Space>
        )
    }

    return (
        <Space orientation='vertical' size={4} style={{ width: '100%' }}>
            <Upload {...uploadProps}>
                <Button icon={icon} loading={uploading} disabled={disabled}>
                    选择文件
                </Button>
            </Upload>
            {display}
        </Space>
    )
}

export default FileControl
