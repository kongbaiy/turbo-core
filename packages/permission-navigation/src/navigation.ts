import type {
    AuthorizedMenuRoute,
    AuthorizedServiceGroup,
    CurrentAppNavigation,
    CurrentAppPermissionNode,
    CurrentPermissionNavigation,
} from './types'

const MENU_PERMISSION_TYPES = new Set(['MENU', 'PAGE'])
const ENABLED = 'ENABLED'

export function isVisibleFlag(flag?: number | null) {
    return flag !== 0
}

export function buildServiceGroups(
    navigation?: CurrentPermissionNavigation,
): AuthorizedServiceGroup[] {
    return (navigation?.platforms || [])
        .filter((platform) => isVisibleFlag(platform.allAppVisibleFlag))
        .map((platform) => ({
            key: platform.platformId || platform.platformCode || '',
            name: platform.platformName || platform.platformCode || '',
            platformCode: platform.platformCode,
            apps: (platform.apps || [])
                .filter((app) => isVisibleFlag(app.allAppVisibleFlag))
                .map((app) => ({
                    key: app.appId || app.appCode || '',
                    name: app.appName || app.appCode || '',
                    pathname: resolveApplicationEntryPath(app),
                    appCode: app.appCode,
                    iconValue: app.iconValue,
                    newWindow: app.newWindowFlag === 1,
                }))
                .filter((app) => Boolean(app.key && app.name && app.pathname)),
        }))
        .filter((platform) => Boolean(platform.key && platform.apps.length))
}

export function findApplicationByRoute(
    navigation: CurrentPermissionNavigation | undefined,
    pathname: string,
    appKey?: string,
) {
    const normalizedPathname = normalizePath(pathname)
    const normalizedAppKey = normalizeLookupKey(appKey)

    for (const platform of navigation?.platforms || []) {
        for (const app of platform.apps || []) {
            const entryPath = normalizePath(app.entryUrl)
            if (
                entryPath &&
                (normalizedPathname === entryPath ||
                    normalizedPathname.startsWith(`${entryPath}/`))
            ) {
                return app
            }

            if (
                normalizedAppKey &&
                [app.appCode, app.appId, app.appName].some(
                    (value) => normalizeLookupKey(value) === normalizedAppKey,
                )
            ) {
                return app
            }

            if (matchesPermissionRoute(app.permissions, normalizedPathname)) {
                return app
            }
        }
    }

    return undefined
}

export function filterAuthorizedOpenedApps<
    T extends { appId?: string; appCode?: string; pathname?: string },
>(openedApps: T[], navigation?: CurrentPermissionNavigation): T[] {
    const authorizedIds = new Set<string>()
    const authorizedApps = new Map<string, CurrentAppNavigation>()
    for (const platform of navigation?.platforms || []) {
        for (const app of platform.apps || []) {
            if (!isVisibleFlag(app.topNavVisibleFlag)) continue
            for (const id of appIdentityKeys(app)) {
                authorizedIds.add(id)
                authorizedApps.set(id, app)
            }
        }
    }

    return openedApps
        .filter((app) => {
            const ids = appIdentityKeys(app)
            return ids.length > 0 && ids.some((id) => authorizedIds.has(id))
        })
        .map((openedApp) => {
            const authorizedApp = appIdentityKeys(openedApp)
                .map((id) => authorizedApps.get(id))
                .find((app): app is CurrentAppNavigation => Boolean(app))
            if (!authorizedApp) return openedApp

            const pathname = resolveApplicationEntryPath(authorizedApp)
            return openedApp.pathname === pathname
                ? openedApp
                : { ...openedApp, pathname }
        })
}

export function toAuthorizedMenuRoutes(
    permissions: CurrentAppPermissionNode[] | undefined,
    options: { rootPath?: string } = {},
): AuthorizedMenuRoute[] {
    return (permissions || [])
        .map((permission) =>
            toAuthorizedMenuRoute(permission, options.rootPath),
        )
        .filter((route): route is AuthorizedMenuRoute => Boolean(route))
}

export function findPermissionPageByRoute(
    permissions: CurrentAppPermissionNode[] | undefined,
    pathname: string,
    options: { rootPath?: string } = {},
): CurrentAppPermissionNode | undefined {
    return findPermissionPage(
        permissions,
        normalizePath(pathname),
        normalizePath(options.rootPath),
    )
}

export function resolveApplicationEntryPath(app: CurrentAppNavigation): string {
    const entryPath = normalizeEntryPath(app.entryUrl)
    if (entryPath) return entryPath

    const firstPermissionPath = firstPermissionRoutePath(app.permissions)
    if (firstPermissionPath) return normalizeEntryPath(firstPermissionPath) || '/'

    const appCode = normalizeSegment(app.appCode)
    return appCode ? `/${appCode}` : '/'
}

export function resolveFirstAuthorizedPagePath(
    app: CurrentAppNavigation,
    rootPath?: string,
): string | undefined {
    const pagePath = firstPermissionPagePath(app.permissions, true)
        || firstPermissionPagePath(app.permissions, false)

    return pagePath
        ? normalizePermissionPath(pagePath, rootPath)
        : undefined
}

function appIdentityKeys(app: { appId?: string; appCode?: string }) {
    return [app.appId, app.appCode].filter((value): value is string =>
        Boolean(value),
    )
}

function toAuthorizedMenuRoute(
    permission: CurrentAppPermissionNode,
    rootPath?: string,
    parentPath?: string,
): AuthorizedMenuRoute | undefined {
    if (!isNavigationPermission(permission)) return undefined

    const path = menuPermissionPath(permission, rootPath, parentPath)
    const children = (permission.children || [])
        .map((child) => toAuthorizedMenuRoute(child, rootPath, path))
        .filter((route): route is AuthorizedMenuRoute => Boolean(route))

    return {
        path:
            path ||
            `__permission/${permission.permissionId || permission.permissionCode}`,
        handle: {
            name: permission.permissionName || permission.permissionCode,
            icon: permission.iconValue,
            access: permission.permissionKey || permission.permissionCode,
        },
        children,
    }
}

function findPermissionPage(
    permissions: CurrentAppPermissionNode[] | undefined,
    pathname: string,
    rootPath: string,
    parentPath?: string,
): CurrentAppPermissionNode | undefined {
    for (const permission of permissions || []) {
        if (!isNavigationPermission(permission)) continue

        const permissionPath = permission.routePath || permission.redirectPath
        const normalizedPermissionPath = permissionPath
            ? normalizePermissionPath(permissionPath, rootPath, parentPath)
            : ''
        if (
            permission.permissionType === 'PAGE' &&
            isSameRoute(pathname, normalizedPermissionPath, rootPath)
        ) {
            return permission
        }

        const child = findPermissionPage(
            permission.children,
            pathname,
            rootPath,
            normalizedPermissionPath || parentPath,
        )
        if (child) return child
    }

    return undefined
}

function isSameRoute(pathname: string, permissionPath: string, rootPath: string) {
    if (!pathname || !permissionPath) return false
    if (pathname === permissionPath) return true

    const pathnameWithoutRoot = stripRootPath(pathname, rootPath)
    const permissionWithoutRoot = stripRootPath(permissionPath, rootPath)
    return Boolean(
        pathnameWithoutRoot &&
        permissionWithoutRoot &&
        pathnameWithoutRoot === permissionWithoutRoot,
    )
}

function isNavigationPermission(permission: CurrentAppPermissionNode) {
    return (
        MENU_PERMISSION_TYPES.has(permission.permissionType || '') &&
        isVisibleFlag(permission.visibleFlag) &&
        (!permission.permissionStatus ||
            permission.permissionStatus === ENABLED)
    )
}

function menuPermissionPath(
    permission: CurrentAppPermissionNode,
    rootPath?: string,
    parentPath?: string,
) {
    const routePath = permission.routePath || permission.redirectPath
    if (!routePath) return ''
    return normalizePermissionPath(routePath, rootPath, parentPath)
}

function normalizePermissionPath(
    pathname: string,
    rootPath?: string,
    parentPath?: string,
): string {
    const trimmed = pathname.trim()
    if (!trimmed) return ''
    if (isExternalPath(trimmed)) return trimmed

    const root = normalizePath(rootPath)
    const parent = normalizePath(parentPath) || root
    const route = normalizePath(trimmed)
    if (route === '/') return parent || root || '/'
    if (root && (route === root || route.startsWith(`${root}/`))) {
        return route
    }

    const parentWithoutRoot = stripRootPath(parent, root)
    if (!trimmed.startsWith('/')) {
        if (
            root &&
            parentWithoutRoot &&
            (route === parentWithoutRoot ||
                route.startsWith(`${parentWithoutRoot}/`))
        ) {
            return normalizePath(`${root}/${route}`)
        }

        return parent
            ? normalizePath(`${parent}/${trimmed.replace(/^\/+/, '')}`)
            : route
    }
    if (!parentPath) {
        return root ? normalizePath(`${root}/${trimmed}`) : route
    }

    if (
        root &&
        parentWithoutRoot &&
        (route === parentWithoutRoot ||
            route.startsWith(`${parentWithoutRoot}/`))
    ) {
        return normalizePath(`${root}/${route}`)
    }
    return parent ? normalizePath(`${parent}/${route}`) : route
}

function firstPermissionRoutePath(
    permissions?: CurrentAppPermissionNode[],
): string | undefined {
    for (const permission of permissions || []) {
        if (
            isNavigationPermission(permission) &&
            (permission.routePath || permission.redirectPath)
        ) {
            return permission.routePath || permission.redirectPath
        }

        const childPath = firstPermissionRoutePath(permission.children)
        if (childPath) return childPath
    }

    return undefined
}

function firstPermissionPagePath(
    permissions: CurrentAppPermissionNode[] | undefined,
    requireComponent: boolean,
): string | undefined {
    for (const permission of permissions || []) {
        if (!isNavigationPermission(permission)) continue

        const routePath = permission.routePath || permission.redirectPath
        if (
            permission.permissionType === 'PAGE'
            && routePath
            && (!requireComponent || permission.componentPath)
        ) {
            return routePath
        }

        const childPath = firstPermissionPagePath(
            permission.children,
            requireComponent,
        )
        if (childPath) return childPath
    }

    return undefined
}

function matchesPermissionRoute(
    permissions: CurrentAppPermissionNode[] | undefined,
    pathname: string,
): boolean {
    for (const permission of permissions || []) {
        const routePath = normalizePath(
            permission.routePath || permission.redirectPath,
        )
        if (
            routePath &&
            (pathname === routePath ||
                pathname.startsWith(`${routePath}/`) ||
                (pathname !== '/' && routePath.startsWith(`${pathname}/`)))
        ) {
            return true
        }

        if (matchesPermissionRoute(permission.children, pathname)) {
            return true
        }
    }

    return false
}

function normalizeEntryPath(pathname?: string): string | undefined {
    const normalized = normalizePath(pathname)
    return normalized || undefined
}

function normalizePath(pathname?: string): string {
    const trimmed = pathname?.trim()
    if (!trimmed) return ''
    if (isExternalPath(trimmed)) return trimmed

    const pathOnly = trimmed.split(/[?#]/)[0] || ''
    const withLeadingSlash = pathOnly.startsWith('/')
        ? pathOnly
        : `/${pathOnly}`
    const normalized = withLeadingSlash.replace(/\/+/g, '/')
    return normalized.length > 1
        ? normalized.replace(/\/+$/, '')
        : normalized
}

function normalizeLookupKey(value?: string) {
    return value?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
}

function stripRootPath(pathname: string, rootPath: string) {
    if (!rootPath) return pathname
    if (pathname === rootPath) return ''
    if (pathname.startsWith(`${rootPath}/`)) {
        return pathname.slice(rootPath.length)
    }
    return pathname
}

function normalizeSegment(value?: string) {
    return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || ''
}

function isExternalPath(pathname: string) {
    return /^https?:\/\//i.test(pathname)
}
