import axios from 'axios'
import type { AxiosError, RequestConfig } from 'axios'
import { getAccessToken, removeAccessToken } from './storage'
import { Modal, message } from 'antd'


let alertInit = false
const api = axios.create()

api.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken()

        config.headers.authorization = accessToken.authorization
        config.headers.sessionId = accessToken.sessionId

        return config
    },
    error => Promise.reject(error),
)

api.interceptors.response.use(
    async (response) => {
        const res = response.data
        const config = response.config as RequestConfig
        const { defaultResponse } = config.meta ?? {}

        if (res.code === 200) {
            // 判断是否返回默认的响应数据
            return defaultResponse ? response : res
        }

        // 处理token失效或者异地登录
        if ([11020, 11021].includes(res.code)) {
            if (!alertInit) {
                alertInit = true

                Modal.confirm({
                    title: '提示',
                    content: res.msg,
                    okText: '重新登录',
                    onOk: () => {
                        const accessToken = getAccessToken()
                        location.href = accessToken.logoutUrl
                        removeAccessToken()
                    }
                })


            }
            return Promise.reject(res)
        }

        message.error(`${res.code}】${res.msg} ` || '网络未知错误')
        return Promise.reject(res)
    },
    async (error: AxiosError) => {
        if (error.response) {
            const { data = {} } = error.response as any

            message.error(`【${data.code}】${data.msg}`)
        } else if (error.code === 'ERR_NETWORK') {
            message.error('网络不可用')
        } else {
            message.error('网络未知错误')
        }

        return Promise.reject(error)
    },
)

export { api }