import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'


export function useScrollTop() {
    let location = useLocation();
    useEffect(() => {
        if ('scrollRestoration' in window.history && window.history.scrollRestoration !== 'manual') {
            window.history.scrollRestoration = 'manual';
        } else {
            window.onbeforeunload = function () {
                window.scrollTo(0, 0);
            }
        }
    }, [location]);
}

interface IUseScrollToTopOptions {
    isScroll: (location: unknown) => boolean;
}

const defaultScrollToTopOptions = {
    isScroll: () => true,
}

export function useScrollToTop(options?: IUseScrollToTopOptions) {
    let location = useLocation();
    let optionsRef = useOptions<IUseScrollToTopOptions>({
        ...defaultScrollToTopOptions,
        ...options,
    });

    useEffect(() => {
        if (optionsRef.current.isScroll(location)) {
            window.scrollTo(0, 0);
        }
    }, [location, optionsRef]);
}

interface IUseRequestOptions<T> {
    initData?: T; //初始化数据
    transData?: (data: T) => any; //转换数据
    onBefore?: () => any; // 返回false，阻止获取数据
    onSuccess?: (datas: T, originData: any) => void; // 成功后的回调
    onError?: (error: any) => void; // 异常抛出
}
const defaultRequestOptions = {
    transData: (data: any) => data,
    onBefore: () => true,
    onSuccess: () => { },
    onError: () => { },
}

// 示例化options，使得组件内部hook对options不产生依赖，但是options中又能拿到函数作用域中最新值
export function useOptions<T>(options: T) {
    const ref = useRef<T>(options);
    ref.current = options;
    return ref;
}

// api初始化调用
export function useRequest<T>(apiFn: () => Promise<any>, options: IUseRequestOptions<T> = {}) {
    const optionsRef = useOptions({ ...defaultRequestOptions, ...options });
    const [data, setData] = useState(options.initData);
    const [error, setError] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);
    const [reload, setReload] = useState<number>(+new Date());

    const handleReload = useCallback(() => {
        setReload((value) => value + 1);
    }, []);

    useEffect(() => {
        const getData = async () => {
            try {
                setLoading(true);
                const { status, data } = await apiFn();
                setLoading(false);
                if (status) {
                    const resultData = optionsRef.current.transData(data);
                    setData(resultData);
                    optionsRef.current.onSuccess(resultData, data);
                } else {
                    setError(data);
                    optionsRef.current.onError(data);
                }
            } catch (error) {
                setLoading(false);
                setError(error);
                optionsRef.current.onError(error);
            }
        };
        if (optionsRef.current.onBefore() === false) return;
        getData();
    }, [apiFn, optionsRef, reload]);

    return { data, error, loading, reload: handleReload, mutate: setData };
}

interface BooleanActions {
    setTrue: () => void;
    setFalse: () => void;
    toggle: () => void;
}

export function useBoolean(initValue: boolean = false): [boolean, BooleanActions] {
    const [state, setState] = useState(initValue);
    const toggle = useCallback(() => {
        setState((value) => !value);
    }, []);
    const setTrue = useCallback(() => {
        setState(true);
    }, []);
    const setFalse = useCallback(() => {
        setState(false);
    }, []);
    return [state, { toggle, setTrue, setFalse }];
}

export function useQuery() {
    return new URLSearchParams(useLocation().search);
}

// 获取元素大小和位置信息
export function useClientRect() {
    const [rect, setRect] = useState<any>();
    const measuredRef: (instance: HTMLDivElement | null) => void = useCallback((node) => {
        if (node) {
            setRect(node.getBoundingClientRect());
        }
    }, [])

    return [rect, measuredRef];
}
