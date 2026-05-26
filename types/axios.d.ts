export * as axios from 'axios'

declare module 'axios' {
    interface Page {
        current: number
        page: number
        size: number
        total: number
    }
    interface AxiosResult<T = any> {
        code: number
        data: T
        msg: string
        page: Page
    }

    export interface RequestConfig<T = any> extends AxiosRequestConfig<T> {
        /** 自定义元数据 */
        meta?: {
            /** 是否开启请求失败自动重连 */
            retryRequest?: boolean

            /** 重连次数。默认为 3 次 */
            retryCount?: number

            /** 是否返回默认响应数据，比如：需要获取 header 头数据时使用 */
            defaultResponse?: boolean
        }
    }

    interface AxiosResponse extends AxiosResult { }

    type Response<T = any> = AxiosResponse<AxiosResult<T>>

    export interface AxiosInstance {
        request: <T = any, R = AxiosResponse<T>, D = any>(config: RequestConfig<D>) => Promise<R>
        get: <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: RequestConfig<D>) => Promise<R>
        delete: <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: RequestConfig<D>) => Promise<R>
        post: <T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: RequestConfig<D>) => Promise<R>
        put: <T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: RequestConfig<D>) => Promise<R>
        patch: <T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: RequestConfig<D>) => Promise<R>
    }
}