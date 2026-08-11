export type PermissionType = 'MENU' | 'PAGE' | 'BUTTON' | 'API' | string

export interface CurrentPermissionNavigation {
    tenantId?: string
    userId?: string
    memberId?: string
    platformCode?: string
    platforms?: CurrentPlatformNavigation[]
}

export interface CurrentPlatformNavigation {
    platformId?: string
    platformCode?: string
    platformName?: string
    platformType?: string
    clientType?: string
    servicePort?: number
    entryUrl?: string
    iconType?: string
    iconValue?: string
    ssoRequiredFlag?: number
    topNavVisibleFlag?: number
    allAppVisibleFlag?: number
    sortNo?: number
    platformStatus?: string
    apps?: CurrentAppNavigation[]
}

export interface CurrentAppNavigation {
    appId?: string
    platformId?: string
    platformCode?: string
    appCode?: string
    appName?: string
    appType?: string
    servicePort?: number
    entryUrl?: string
    iconType?: string
    iconValue?: string
    ssoRequiredFlag?: number
    topNavVisibleFlag?: number
    allAppVisibleFlag?: number
    homeVisibleFlag?: number
    newWindowFlag?: number
    appDescription?: string
    versionNo?: string
    releaseChannel?: string
    updatePushFlag?: number
    appStatus?: string
    virtualFlag?: number
    sourceAppId?: string
    sourceAppCode?: string
    sourcePermissionId?: string
    sourcePermissionCode?: string
    permissions?: CurrentAppPermissionNode[]
}

export interface CurrentAppPermissionNode {
    permissionId?: string
    appId?: string
    parentId?: string
    permissionType?: PermissionType
    developmentCapability?: string
    terminalTypes?: string[]
    permissionCode?: string
    permissionName?: string
    permissionKey?: string
    permissionDescription?: string
    routePath?: string
    componentPath?: string
    pageTemplateCode?: string
    formCode?: string
    redirectPath?: string
    openMode?: string
    apiPath?: string
    httpMethod?: string
    iconType?: string
    iconValue?: string
    visibleFlag?: number
    cacheFlag?: number
    riskLevel?: string
    sortNo?: number
    permissionStatus?: string
    children?: CurrentAppPermissionNode[]
}

export interface AuthorizedMenuRoute {
    path: string
    handle: {
        name?: string
        icon?: string
        access?: string
    }
    children: AuthorizedMenuRoute[]
}

export interface AuthorizedServiceApp {
    key: string
    name: string
    pathname: string
    appCode?: string
    iconValue?: string
    newWindow: boolean
}

export interface AuthorizedServiceGroup {
    key: string
    name: string
    platformCode?: string
    apps: AuthorizedServiceApp[]
}
