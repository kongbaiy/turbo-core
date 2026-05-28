// types/axios.d.ts
import type {
    AxiosRequestConfig as OriginalAxiosRequestConfig,
    AxiosResponse as OriginalAxiosResponse,
    AxiosInstance,
} from 'axios'

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

    // 扩展 RequestConfig，基于原始 AxiosRequestConfig
    export interface RequestConfig<
        T = any,
    > extends OriginalAxiosRequestConfig<T> {
        meta?: {
            retryRequest?: boolean
            retryCount?: number
            defaultResponse?: boolean
        }
    }

    // 扩展 AxiosResponse，同时保留原始 AxiosResponse 的字段（如 status, headers, config 等）
    interface AxiosResponse<T = any, D = any>
        extends AxiosResult<T>, OriginalAxiosResponse<T, D> {}

    type Response<T = any> = AxiosResponse<AxiosResult<T>>

    // 重写 AxiosInstance 的方法，替换 config 类型为 RequestConfig
    interface AxiosInstance {
        request<T = any, R = AxiosResponse<T>, D = any>(
            config: RequestConfig<D>,
        ): Promise<R>
        get<T = any, R = AxiosResponse<T>, D = any>(
            url: string,
            config?: RequestConfig<D>,
        ): Promise<R>
        delete<T = any, R = AxiosResponse<T>, D = any>(
            url: string,
            config?: RequestConfig<D>,
        ): Promise<R>
        post<T = any, R = AxiosResponse<T>, D = any>(
            url: string,
            data?: D,
            config?: RequestConfig<D>,
        ): Promise<R>
        put<T = any, R = AxiosResponse<T>, D = any>(
            url: string,
            data?: D,
            config?: RequestConfig<D>,
        ): Promise<R>
        patch<T = any, R = AxiosResponse<T>, D = any>(
            url: string,
            data?: D,
            config?: RequestConfig<D>,
        ): Promise<R>
    }
}
