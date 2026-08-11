import { UploadOutlined } from '@ant-design/icons'
import {
    Input,
    InputNumber,
    Slider,
    Rate,
    Radio,
    Checkbox,
    Select,
    Cascader,
    DatePicker,
    TimePicker,
    Switch,
    ColorPicker,
    Upload,
    Button,
    message,
    Table,
} from 'antd'

import RichText from '../rich-text'
import MapPicker from '../map-picker'

export type ComponentKey =
    | 'TEXT_SINGLE'
    | 'TEXT_MULTI'
    | 'PASSWORD_INPUT'
    | 'NUMBER_INPUT'
    | 'NUMBER_WITH_UNIT'
    | 'CURRENCY_INPUT'
    | 'SLIDER'
    | 'RATE'
    | 'RADIO'
    | 'CHECKBOX'
    | 'SELECT'
    | 'CASCADER'
    | 'DATE_PICKER'
    | 'DATE_TIME_PICKER'
    | 'DATE_RANGE'
    | 'DATE_TIME_RANGE'
    | 'TIME_PICKER'
    | 'SWITCH'
    | 'COLOR_PICKER'
    | 'FILE_UPLOAD'
    | 'IMAGE_UPLOAD'
    | 'FORM_TABLE'
    | 'RICH_TEXT'
    | 'MAP_PICKER'

interface MapValue {
    name: string
    render: <T>(...args: Array<T>) => React.ReactNode
}

type MapRecord = Record<ComponentKey, MapValue>

export const map: MapRecord = {
    TEXT_SINGLE: {
        name: '单行文本框',
        render: (props: any) => <Input {...props} />,
    },

    TEXT_MULTI: {
        name: '多行文本框',
        render: (props: any) => <Input.TextArea {...props} />,
    },

    PASSWORD_INPUT: {
        name: '密码输入框',
        render: (props: any) => <Input.Password {...props} />,
    },

    NUMBER_INPUT: {
        name: '数字输入框',
        render: (props: any) => <InputNumber {...props} />,
    },

    NUMBER_WITH_UNIT: {
        name: '数字+单位',
        render: (props: any) => <InputNumber {...props} />,
    },

    CURRENCY_INPUT: {
        name: '金额输入框',
        render: (props: any) => <InputNumber prefix='￥' {...props} />,
    },

    SLIDER: {
        name: '滑块',
        render: (props: any) => <Slider {...props} />,
    },

    RATE: {
        name: '评分',
        render: (props: any) => <Rate {...props} />,
    },

    RADIO: {
        name: '单选框',
        render: (props: any) => <Radio.Group {...props}></Radio.Group>,
    },

    CHECKBOX: {
        name: '单选框',
        render: (props: any) => <Checkbox.Group {...props}></Checkbox.Group>,
    },

    SELECT: {
        name: '下拉选择',
        render: (props: any) => <Select {...props}></Select>,
    },

    CASCADER: {
        name: '级联选择',
        render: (props: any) => <Cascader {...props} />,
    },

    DATE_PICKER: {
        name: '日期选择',
        render: (props: any) => <DatePicker {...props} />,
    },

    DATE_TIME_PICKER: {
        name: '日期时间选择',
        render: (props: any) => <DatePicker {...props} showTime />,
    },

    DATE_RANGE: {
        name: '日期范围',
        render: (props: any) => <DatePicker.RangePicker {...props} />,
    },

    DATE_TIME_RANGE: {
        name: '日期时间范围',
        render: (props: any) => <DatePicker.RangePicker {...props} showTime />,
    },

    TIME_PICKER: {
        name: '时间选择',
        render: (props: any) => <TimePicker {...props} />,
    },

    SWITCH: {
        name: '开关',
        render: (props: any) => <Switch {...props} />,
    },

    COLOR_PICKER: {
        name: '颜色选择器',
        render: (props: any) => <ColorPicker {...props} />,
    },

    FILE_UPLOAD: {
        name: '文件上传',
        render: (props: any) => (
            <Upload {...props}>
                <Button icon={<UploadOutlined />}>文件上传</Button>
            </Upload>
        ),
    },

    IMAGE_UPLOAD: {
        name: '图片上传',
        render: (props: any) => {
            const [messageApi, contextHolder] = message.useMessage()

            const _props = {
                ...props,
                beforeUpload: (file: { type: string }) => {
                    const isImage = file.type.startsWith('image/')

                    if (!isImage)
                        messageApi.error('请上传图片，不支持非图片文件')
                    return isImage || Upload.LIST_IGNORE
                },
            }
            return (
                <>
                    {contextHolder}
                    <Upload {..._props}>
                        <Button icon={<UploadOutlined />}>图片上传</Button>
                    </Upload>
                </>
            )
        },
    },

    FORM_TABLE: {
        name: '表单表格',
        render: (props: any) => <Table {...props} />,
    },

    RICH_TEXT: {
        name: '富文本',
        render: (props: any) => <RichText {...props} />,
    },

    MAP_PICKER: {
        name: '地图坐标选择',
        render: (props: any) => <MapPicker {...props} />,
    },
}

export const getMap = (code: ComponentKey): MapValue => map[code]!
