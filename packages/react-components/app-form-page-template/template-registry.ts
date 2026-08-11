import type { ComponentType } from 'react'

import type { GeneralPageTemplate1Props } from './general-template-1'

export type PageTemplateComponent = ComponentType<GeneralPageTemplate1Props>
export type PageTemplateLoader = () => Promise<{
    default: PageTemplateComponent
}>

const pageTemplateLoaders: Record<string, PageTemplateLoader> = {
    GENERAL_TEMPLATE_1: () => import('./general-template-1'),
}

export const getPageTemplateComponent = (templateCode?: string) =>
    templateCode ? pageTemplateLoaders[templateCode] : undefined
