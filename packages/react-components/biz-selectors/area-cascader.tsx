import { useEffect, useMemo, useState } from 'react'
import { Cascader } from 'antd'

import { getAreaNameChain, getAreaTree } from './api'
import type { AreaCascaderProps, AreaRecord } from './types'
import {
    areaPathToValue,
    areaValueToPath,
    toAreaCascaderOptions,
} from './utils'
import type { AreaCascaderOption } from './utils'

const AreaCascader = ({
    value,
    onChange,
    disabled = false,
    allowClear = true,
    placeholder = '请选择省/市/区',
    changeOnSelect = false,
    cascaderProps,
}: AreaCascaderProps) => {
    const [loading, setLoading] = useState(false)
    const [areaTree, setAreaTree] = useState<AreaRecord[]>([])

    const options = useMemo(() => toAreaCascaderOptions(areaTree), [areaTree])
    const cascaderValue = useMemo(() => areaValueToPath(value), [value])

    useEffect(() => {
        let ignore = false

        const fetchAreaTree = async () => {
            setLoading(true)
            try {
                const { data } = await getAreaTree()
                if (!ignore) {
                    setAreaTree(data || [])
                }
            } finally {
                if (!ignore) {
                    setLoading(false)
                }
            }
        }

        fetchAreaTree()

        return () => {
            ignore = true
        }
    }, [])

    useEffect(() => {
        if (
            !value?.districtCode ||
            (value.provinceCode && value.cityCode && value.districtName)
        ) {
            return
        }

        let ignore = false

        getAreaNameChain({ areaCode: value.districtCode })
            .then(({ data }) => {
                if (!ignore && data) {
                    onChange?.(data)
                }
            })
            .catch(() => undefined)

        return () => {
            ignore = true
        }
    }, [
        onChange,
        value?.cityCode,
        value?.districtCode,
        value?.districtName,
        value?.provinceCode,
    ])

    return (
        <Cascader<AreaCascaderOption, 'value'>
            {...cascaderProps}
            allowClear={allowClear}
            changeOnSelect={changeOnSelect}
            disabled={disabled}
            multiple={false}
            loading={loading}
            options={options}
            placeholder={placeholder}
            value={cascaderValue}
            onChange={(_, selectedOptions) => {
                const nextValue = areaPathToValue(
                    selectedOptions as AreaCascaderOption[],
                )
                onChange?.(nextValue)
            }}
        />
    )
}

export default AreaCascader
