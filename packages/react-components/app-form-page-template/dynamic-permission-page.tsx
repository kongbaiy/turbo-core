import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Alert, Empty, Spin } from 'antd'
import { useLocation } from 'react-router-dom'
import {
    findApplicationByRoute,
    findPermissionPageByRoute,
    getCurrentPermissionNavigation,
} from '@repo/permission-navigation'
import type {
    CurrentPermissionNavigation,
} from '@repo/permission-navigation'

import { getPageTemplateComponent } from './template-registry'

export interface DynamicPermissionPageProps {
    appKey: string
    rootPath: string
}

let navigationTask: Promise<CurrentPermissionNavigation> | undefined

const loadPermissionNavigation = () => {
    if (!navigationTask) {
        navigationTask = getCurrentPermissionNavigation()
            .then(({ data }) => data || {})
            .catch((error) => {
                navigationTask = undefined
                throw error
            })
    }
    return navigationTask
}

const centeredStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 240,
} as const

const DynamicPermissionPage = ({
    appKey,
    rootPath,
}: DynamicPermissionPageProps) => {
    const location = useLocation()
    const [navigation, setNavigation] =
        useState<CurrentPermissionNavigation>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()

    useEffect(() => {
        let active = true
        loadPermissionNavigation()
            .then((result) => {
                if (active) setNavigation(result)
            })
            .catch((reason: unknown) => {
                if (active) {
                    setError(
                        reason instanceof Error
                            ? reason.message
                            : '当前用户页面权限加载失败',
                    )
                }
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => {
            active = false
        }
    }, [])

    const pagePermission = useMemo(() => {
        const fullPath = `${rootPath}/${location.pathname}`.replace(/\/+/g, '/')
        const app = findApplicationByRoute(navigation, fullPath, appKey)
        return findPermissionPageByRoute(
            app?.permissions,
            location.pathname,
            { rootPath },
        )
    }, [appKey, location.pathname, navigation, rootPath])
    const templateLoader = getPageTemplateComponent(
        pagePermission?.pageTemplateCode,
    )
    const Template = useMemo(
        () => (templateLoader ? lazy(templateLoader) : undefined),
        [templateLoader],
    )

    if (loading) {
        return (
            <div style={centeredStyle}>
                <Spin />
            </div>
        )
    }
    if (error) {
        return (
            <Alert
                showIcon
                type='error'
                message='页面权限加载失败'
                description={error}
            />
        )
    }
    if (!pagePermission || !Template) {
        return (
            <div style={centeredStyle}>
                <Empty description='页面不存在或尚未配置页面模板' />
            </div>
        )
    }

    return (
        <Suspense
            fallback={
                <div style={centeredStyle}>
                    <Spin />
                </div>
            }
        >
            <Template
                permissionId={pagePermission.permissionId || ''}
                permissionName={pagePermission.permissionName}
            />
        </Suspense>
    )
}

export default DynamicPermissionPage
