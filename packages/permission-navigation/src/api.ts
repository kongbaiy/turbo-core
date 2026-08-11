import { api } from '@repo/utils'

import type { CurrentPermissionNavigation } from './types'

export const getCurrentPermissionNavigation = () =>
    api.get<CurrentPermissionNavigation>(
        '/api/admin/enterprise/permission/current/navigation',
    )
