import '@wangeditor/editor/dist/css/style.css'
import { useState, useEffect } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

interface Props {
    html?: string
}

const Index = (props: Props) => {
    const [editor, setEditor] = useState<IDomEditor | null>(null) // TS 语法

    const [html, setHtml] = useState(props.html || '')

    const toolbarConfig: Partial<IToolbarConfig> = {}
    const editorConfig: Partial<IEditorConfig> = {
        placeholder: '请输入内容...',
    }

    useEffect(() => {
        setHtml(props.html!)
    }, [props.html])

    useEffect(() => {
        return () => {
            if (editor == null) return

            editor.destroy()
            setEditor(null)
        }
    }, [editor])

    return (
        <>
            <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
                <Toolbar
                    editor={editor}
                    defaultConfig={toolbarConfig}
                    mode='default'
                    style={{ borderBottom: '1px solid #ccc' }}
                />
                <Editor
                    defaultConfig={editorConfig}
                    value={html}
                    onCreated={setEditor}
                    onChange={(editor) => setHtml(editor.getHtml())}
                    mode='default'
                    style={{ height: '500px', overflowY: 'hidden' }}
                />
            </div>
        </>
    )
}

export default Index
