import { TablePaginationConfig } from 'antd/es/table/interface'

export const usePaginationConfig = (
    customConfig?: TablePaginationConfig,
): TablePaginationConfig => {
    return {
        showQuickJumper: true,
        showSizeChanger: true,
        defaultPageSize: 10,
        size: 'medium',
        showTotal: (total) => `共 ${total} 条`,
        ...customConfig,
    }
}
