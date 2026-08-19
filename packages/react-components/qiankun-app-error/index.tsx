import React from 'react'

import { Button } from 'antd'

import styles from './index.module.scss'
export interface Props {
    appName?: string
    title?: string
    description?: string
    error?: Error | string | null
    onRetry?: () => void
    showDetails?: boolean
}

const getErrorMessage = (error?: Error | string | null) => {
    if (error instanceof Error) {
        return error.message || '子应用实例启动失败。'
    }

    if (typeof error === 'string' && error.trim()) {
        return error
    }

    return '请检查应用入口地址、依赖加载状态或网络连接后重试。'
}

const RepoQiankunAppError: React.FC<Props> = ({
    appName = '子应用',
    title,
    description,
    error,
    onRetry,
    showDetails = false,
}) => {
    const fallbackTitle = title || `${appName}加载失败`
    const fallbackDescription =
        description || '当前子应用暂时不可用，请稍后重试。'
    const errorMessage = getErrorMessage(error)

    return (
        <section className={styles.container} role='alert'>
            <div className={styles.icon} aria-hidden='true'>
                ⚠️
            </div>
            <h3 className={styles.title}>{fallbackTitle}</h3>
            <p className={styles.description}>{fallbackDescription}</p>
            <p className={styles.message}>{errorMessage}</p>

            {onRetry ? (
                <Button
                    type='primary'
                    className={styles.button}
                    onClick={onRetry}
                >
                    重新加载
                </Button>
            ) : null}

            {showDetails && error instanceof Error && error.stack ? (
                <pre className={styles.details}>{error.stack}</pre>
            ) : null}
        </section>
    )
}

export default RepoQiankunAppError
