import { Alert, Empty, Spin } from 'antd'
import { useEffect, useState } from 'react'

import type { AppFormRenderSchema } from '../../app-form-runtime/types'
import { defaultGeneralTemplateRuntimeClient } from './runtime-client'
import type { GeneralTemplateRuntimeClient } from './runtime-client'
import GeneralTemplate1Surface from './surface'
import styles from './index.module.css'

export interface GeneralPageTemplate1Props {
    permissionId: string
    permissionName?: string
    runtimeClient?: GeneralTemplateRuntimeClient
}

const GeneralPageTemplate1 = ({
    permissionId,
    permissionName,
    runtimeClient = defaultGeneralTemplateRuntimeClient,
}: GeneralPageTemplate1Props) => {
    const [schema, setSchema] = useState<AppFormRenderSchema>()
    const [schemaLoading, setSchemaLoading] = useState(true)
    const [schemaError, setSchemaError] = useState<string>()

    useEffect(() => {
        let active = true
        setSchemaLoading(true)
        setSchemaError(undefined)
        runtimeClient
            .getSchemaByPermission(permissionId, 'LIST')
            .then((result) => {
                if (active) setSchema(result)
            })
            .catch((error: unknown) => {
                if (active) {
                    setSchemaError(
                        error instanceof Error
                            ? error.message
                            : '页面配置加载失败',
                    )
                }
            })
            .finally(() => {
                if (active) setSchemaLoading(false)
            })
        return () => {
            active = false
        }
    }, [permissionId, runtimeClient])

    if (schemaLoading) {
        return (
            <div className={styles['page-loading']}>
                <Spin />
            </div>
        )
    }

    if (schemaError) {
        return (
            <div className={styles['template-page']}>
                <Alert
                    showIcon
                    type='error'
                    message='页面配置加载失败'
                    description={schemaError}
                />
            </div>
        )
    }

    if (!schema) {
        return (
            <div className={styles['page-empty']}>
                <Empty description='当前页面尚未配置应用表单' />
            </div>
        )
    }

    return (
        <GeneralTemplate1Surface
            schema={schema}
            runtimeClient={runtimeClient}
            permissionName={permissionName}
        />
    )
}

export { default as GeneralTemplate1Surface } from './surface'
export type { GeneralTemplate1SurfaceProps } from './surface'
export default GeneralPageTemplate1
