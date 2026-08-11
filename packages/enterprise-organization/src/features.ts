export interface DepartmentManagementFeatures {
    members: boolean
    memberExport: boolean
    import: boolean
    export: boolean
}

export interface DepartmentManagementPageProps {
    features?: Partial<DepartmentManagementFeatures>
}

export const defaultDepartmentManagementFeatures: DepartmentManagementFeatures =
    {
        members: true,
        memberExport: true,
        import: true,
        export: true,
    }

export const resolveDepartmentManagementFeatures = (
    features?: Partial<DepartmentManagementFeatures>,
): DepartmentManagementFeatures => ({
    ...defaultDepartmentManagementFeatures,
    ...features,
})
