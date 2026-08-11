import { useState } from 'react'

import { Button, Flex, Input, Modal } from 'antd'

const Index = () => {
    const [open, setOpen] = useState(false)

    const showModal = () => {
        setOpen(true)
    }

    const hideModal = () => {
        setOpen(false)
    }

    return (
        <>
            <Button type='primary' onClick={showModal}>
                选择坐标
            </Button>

            <Modal
                title='坐标选择'
                open={open}
                onOk={hideModal}
                onCancel={hideModal}
                okText='确认'
                cancelText='取消'
                width='60%'
            >
                <Flex gap={6}>
                    <Input />
                    <Button type='primary'>搜索</Button>
                    <Button type='primary'>定位当前位置</Button>
                </Flex>
            </Modal>
        </>
    )
}

export default Index
