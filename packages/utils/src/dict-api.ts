import { api } from './axios'

import type {
    DictOption,
    DictOptionsBatch,
    DictOptionsMap,
} from './dict-options'

export const getDictOptions = (dictCode: string) =>
    api.get<DictOption[]>(
        `/api/admin/basic/options/${encodeURIComponent(dictCode)}`,
        { meta: { silentError: true } },
    )

export const getDictOptionsBatch = (params: DictOptionsBatch) =>
    api.post<DictOptionsMap>('/api/admin/basic/options/batch', params, {
        meta: { silentError: true },
    })
