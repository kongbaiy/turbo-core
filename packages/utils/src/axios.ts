import axios from 'axios'
import type { AxiosError, RequestConfig } from 'axios'
import { getAccessToken, removeAccessToken } from './storage'
import { getModal, getMessage } from '@repo/utils'

let alertInit = false
const api = axios.create()

api.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken()

        config.headers.Authorization = accessToken.Authorization
        config.headers.sessionId = accessToken.sessionId

        return config
    },
    (error) => Promise.reject(error),
)

api.interceptors.response.use(
    async (response) => {
        const res = response.data
        const config = response.config as RequestConfig
        const { defaultResponse } = config.meta ?? {}
        const modal = getModal()
        const message = getMessage()

        if (res.code === 200) {
            // 判断是否返回默认的响应数据
            return defaultResponse ? response : { ...res, status: true }
        }

        // 处理token失效或者异地登录
        if ([40101].includes(res.code)) {
            if (!alertInit) {
                alertInit = true

                modal.confirm({
                    title: '提示',
                    content: res.message,
                    cancelText: '取消',
                    okText: '重新登录',
                    onOk: () => {
                        location.replace('/login')
                        removeAccessToken()
                    },
                })
            }
            return Promise.reject({ ...res, status: false })
        }

        message.error(`【${res.code}】${res.message} ` || '网络未知错误')
        return Promise.reject({ ...res, status: false })
    },
    async (error: AxiosError) => {
        const message = getMessage()

        if (error.response) {
            const { data = {} } = error.response as any

            message.error(`【${data.code}】${data.message}`)
        } else if (error.code === 'ERR_NETWORK') {
            message.error('网络不可用')
        } else {
            message.error('网络未知错误')
        }

        return Promise.reject(error)
    },
)

export { api }
