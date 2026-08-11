import { makeAutoObservable, runInAction } from 'mobx'

import { getDictOptionsBatch } from '@repo/utils'
import { AnyObject } from 'antd/lib/_util/type'

class DictCollection {
    data: AnyObject = {}

    constructor() {
        makeAutoObservable(this)
        this.sendGetDictOptionsBatch()
    }

    sendGetDictOptionsBatch = async () => {
        const { data } = await getDictOptionsBatch({
            dictCodes: [
                'PROJECT_TYPE',
                'PROJECT_STAGE',
                'COMMON_STATUS',
                'PROJECT_BUILDING_TYPE',
                'BUILD_TYPE',
                'BUSINESS_CATEGORY',
                'PROJECT_STATUS',
                'MANAGE_TYPE',
                'PROC_SUPPLIER_TYPE',
                'PROC_SUPPLIER_STATUS',
                'PROC_SUPPLIER_LEVEL',
                'PROC_INVOICE_TYPE',
                'PROC_QUALIFICATION_TYPE',
                'PROC_QUALIFICATION_WARNING_STATUS',
                'PROC_CONTRACT_TYPE',
                'PROC_CONTRACT_STATUS',
                'PROC_ATTACHMENT_TYPE',
                'PROC_EVALUATION_LEVEL',
                'PROC_LOG_OPERATION_TYPE',
                'PROJECT_UNIT_FLOOR_TYPE',
                'MDM_PARTNER_TYPE',
                'MDM_CERTIFICATE_TYPE',
                'MDM_GUEST_STATUS',
                'MDM_BUSINESS_TYPE',
                'MDM_DATA_SOURCE',
            ],
        })
        runInAction(() => {
            this.data = data
        })
    }

    getOption(code: string) {
        return this.data[code]?.map(({ children = [], ...other }) => ({
            ...other,
        }))
    }

    getLabel(key: string, value: any) {
        const currentData = this.data[key] || []
        const result =
            currentData.find((item: any) => item.itemValue === value) || {}

        return result.itemName
    }
}

const dictStore = new DictCollection()

export { dictStore }
