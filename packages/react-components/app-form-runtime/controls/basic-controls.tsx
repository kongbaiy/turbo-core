import type { Dispatch, SetStateAction } from 'react'
import {
    Checkbox,
    DatePicker,
    Input,
    InputNumber,
    Radio,
    Select,
    Switch,
    TimePicker,
} from 'antd'

import type { AppFormFieldOption, AppFormRuntimeControlProps } from '../types'
import {
    asDate,
    asDateRange,
    asText,
    asTime,
    findOptionByValue,
} from './shared'

export const isBasicControl = (controlType: string, optionsLength = 0) =>
    [
        'TEXT_MULTI',
        'NUMBER_INPUT',
        'NUMBER_WITH_UNIT',
        'CURRENCY_INPUT',
        'DATE_PICKER',
        'DATE_RANGE',
        'MONTH_PICKER',
        'TIME_PICKER',
        'RADIO',
        'CHECKBOX',
        'SWITCH',
        'SELECT',
        'RELATION_SELECT',
    ].includes(controlType) || optionsLength > 0

export interface BasicControlProps {
    field: AppFormRuntimeControlProps['field']
    value?: unknown
    disabled: boolean
    controlType: string
    options: AppFormFieldOption[]
    optionLoading: boolean
    setLoadedOptions: Dispatch<SetStateAction<AppFormFieldOption[]>>
    setOptionLoading: Dispatch<SetStateAction<boolean>>
    onChange?: AppFormRuntimeControlProps['onChange']
    onLoadOptions?: AppFormRuntimeControlProps['onLoadOptions']
}

const commonProps = (disabled: boolean) => ({
    disabled,
    style: { width: '100%' },
})

const isSelectLikeControl = (controlType: string, optionsLength: number) =>
    controlType === 'SELECT' ||
    controlType === 'RELATION_SELECT' ||
    optionsLength > 0

const optionLabelOf = (option: unknown) => {
    if (!option || typeof option !== 'object' || !('label' in option)) {
        return undefined
    }
    const label = (option as { label?: unknown }).label
    return label === undefined ? undefined : String(label)
}

const BasicControl = ({
    field,
    value,
    disabled,
    controlType,
    options,
    optionLoading,
    setLoadedOptions,
    setOptionLoading,
    onChange,
    onLoadOptions,
}: BasicControlProps) => {
    const common = commonProps(disabled)

    if (controlType === 'TEXT_MULTI') {
        return (
            <Input.TextArea
                {...common}
                autoSize={{ minRows: 3, maxRows: 8 }}
                value={asText(value)}
                onChange={(event) => onChange?.(event.target.value)}
                placeholder='请输入'
            />
        )
    }

    if (
        controlType === 'NUMBER_INPUT' ||
        controlType === 'NUMBER_WITH_UNIT' ||
        controlType === 'CURRENCY_INPUT'
    ) {
        const configuredPrecision = field.controlProps?.precision
        return (
            <InputNumber
                {...common}
                value={
                    typeof value === 'number'
                        ? value
                        : value === undefined || value === null || value === ''
                          ? null
                          : Number(value)
                }
                precision={
                    typeof configuredPrecision === 'number'
                        ? configuredPrecision
                        : controlType === 'CURRENCY_INPUT'
                          ? 2
                          : undefined
                }
                min={field.controlProps?.min as number | undefined}
                max={field.controlProps?.max as number | undefined}
                addonAfter={
                    field.controlProps?.addonAfter as string | undefined
                }
                onChange={(next) => onChange?.(next)}
                placeholder={
                    (field.controlProps?.placeholder as string | undefined) ||
                    '请输入'
                }
            />
        )
    }

    if (controlType === 'DATE_PICKER') {
        return (
            <DatePicker
                {...common}
                value={asDate(value)}
                onChange={(_, date) => onChange?.(date || undefined)}
                placeholder='请选择日期'
            />
        )
    }

    if (controlType === 'DATE_RANGE') {
        return (
            <DatePicker.RangePicker
                {...common}
                value={asDateRange(value)}
                onChange={(_, dates) =>
                    onChange?.(dates?.length ? dates : undefined)
                }
            />
        )
    }

    if (controlType === 'MONTH_PICKER') {
        return (
            <DatePicker
                {...common}
                picker='month'
                format='YYYY-MM'
                value={asDate(value)}
                onChange={(_, date) => onChange?.(date || undefined)}
                placeholder='请选择年月'
            />
        )
    }

    if (controlType === 'TIME_PICKER') {
        return (
            <TimePicker
                {...common}
                format='HH:mm'
                value={asTime(value)}
                onChange={(_, time) => onChange?.(time || undefined)}
                placeholder='请选择时间'
            />
        )
    }

    if (controlType === 'RADIO') {
        return (
            <Radio.Group
                disabled={disabled}
                value={value}
                options={options}
                onChange={(event) => onChange?.(event.target.value)}
            />
        )
    }

    if (controlType === 'CHECKBOX') {
        return (
            <Checkbox.Group
                disabled={disabled}
                value={Array.isArray(value) ? value : []}
                options={options}
                onChange={(next) => onChange?.(next)}
            />
        )
    }

    if (controlType === 'SWITCH') {
        return (
            <Switch
                disabled={disabled}
                checked={value === true || value === 1 || value === '1'}
                onChange={(checked) => onChange?.(checked ? 1 : 0)}
            />
        )
    }

    if (isSelectLikeControl(controlType, options.length)) {
        const matchedOption = findOptionByValue(options, value)
        return (
            <Select
                {...common}
                allowClear
                showSearch
                optionFilterProp='label'
                value={value === '' ? undefined : matchedOption?.value ?? value}
                options={options}
                loading={optionLoading}
                filterOption={
                    controlType === 'RELATION_SELECT' ? false : undefined
                }
                onSearch={
                    controlType === 'RELATION_SELECT' && onLoadOptions
                        ? async (keyword) => {
                              setOptionLoading(true)
                              try {
                                  setLoadedOptions(
                                      await onLoadOptions(field, keyword),
                                  )
                              } finally {
                                  setOptionLoading(false)
                              }
                          }
                        : undefined
                }
                onChange={(next, option) => {
                    const selected = Array.isArray(option) ? option[0] : option
                    onChange?.(next, optionLabelOf(selected))
                }}
                placeholder='请选择'
            />
        )
    }

    return null
}

export default BasicControl
