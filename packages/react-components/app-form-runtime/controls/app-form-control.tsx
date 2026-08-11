import { useEffect, useMemo, useState } from 'react'
import { Input, Typography } from 'antd'

import type { AppFormRuntimeControlProps } from '../types'
import AttachmentInfoControl from './attachment-info-control'
import BasicControl, { isBasicControl } from './basic-controls'
import BizControl, { isBizControl } from './biz-controls'
import FileControl, { isFileControl } from './file-control'
import { asText, displayValue, findOptionByValue, getOptions } from './shared'

const AppFormControl = ({
    field,
    value,
    disabled = false,
    readonly = false,
    referenceLabel,
    referenceMetadata,
    onChange,
    onFileSelect,
    onFileAccess,
    onLoadOptions,
}: AppFormRuntimeControlProps) => {
    const [optionLoading, setOptionLoading] = useState(false)
    const [loadedOptions, setLoadedOptions] = useState(field.options || [])
    const controlType = (field.controlType || 'TEXT_SINGLE').toUpperCase()

    useEffect(() => {
        setLoadedOptions(field.options || [])
    }, [field.options])

    useEffect(() => {
        if (!onLoadOptions || controlType !== 'RELATION_SELECT') return
        let ignore = false
        setOptionLoading(true)
        onLoadOptions(field)
            .then((items) => {
                if (!ignore) setLoadedOptions(items)
            })
            .finally(() => {
                if (!ignore) setOptionLoading(false)
            })
        return () => {
            ignore = true
        }
    }, [controlType, field, onLoadOptions])

    const options = useMemo(
        () => getOptions({ ...field, options: loadedOptions }),
        [field, loadedOptions],
    )
    const optionLabel = findOptionByValue(options, value)?.label
    const resolvedLabel =
        referenceLabel ||
        (typeof optionLabel === 'string' ? optionLabel : undefined)

    if (controlType === 'ATTACHMENT_INFO') {
        return (
            <AttachmentInfoControl
                field={field}
                value={value}
                disabled={disabled}
                readonly={readonly}
                onChange={onChange}
                onFileSelect={onFileSelect}
                onFileAccess={onFileAccess}
            />
        )
    }

    if (readonly && !isFileControl(controlType)) {
        return (
            <Typography.Text>
                {displayValue(value, resolvedLabel)}
            </Typography.Text>
        )
    }

    if (isFileControl(controlType)) {
        return (
            <FileControl
                field={field}
                value={value}
                disabled={disabled}
                readonly={readonly}
                controlType={controlType}
                referenceLabel={resolvedLabel}
                referenceMetadata={referenceMetadata}
                onChange={onChange}
                onFileSelect={onFileSelect}
            />
        )
    }

    if (isBizControl(controlType)) {
        return (
            <BizControl
                field={field}
                value={value}
                disabled={disabled}
                controlType={controlType}
                referenceLabel={referenceLabel}
                onChange={onChange}
            />
        )
    }

    if (isBasicControl(controlType, options.length)) {
        return (
            <BasicControl
                field={field}
                value={value}
                disabled={disabled}
                controlType={controlType}
                options={options}
                optionLoading={optionLoading}
                setLoadedOptions={setLoadedOptions}
                setOptionLoading={setOptionLoading}
                onChange={onChange}
                onLoadOptions={onLoadOptions}
            />
        )
    }

    return (
        <Input
            disabled={disabled}
            style={{ width: '100%' }}
            value={asText(value)}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={
                (field.controlProps?.placeholder as string | undefined) ||
                '请输入'
            }
        />
    )
}

export default AppFormControl
