import { forwardRef } from 'react'

import AppFormEditorRenderer from './app-form-editor-renderer'
import type {
    AppFormRendererRef,
    AppFormRuntimeRendererProps,
} from './types'

const AppFormDetailRenderer = forwardRef<
    AppFormRendererRef,
    Omit<AppFormRuntimeRendererProps, 'readonly'>
>((props, ref) => <AppFormEditorRenderer {...props} ref={ref} readonly />)

AppFormDetailRenderer.displayName = 'AppFormDetailRenderer'

export default AppFormDetailRenderer
