interface Props {
    name?: string
}

const Index = (props: Props) => {
    const { name = '' } = props

    return (
        <div className='flex items-center justify-center h-[calc(100vh-80px)]'>
            <h1 className='text-#999'>欢迎使用 {name}</h1>
        </div>
    )
}

export default Index
