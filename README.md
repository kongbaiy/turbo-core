# Turborepo + vite + qiankun + react + antd + PropComponent 总结

## Q&A

### 在主、子应使用loadMicroApp + createBrowserRouter 创建路由时使用basename遇到 “<Router...> is not able to match the URL "/platforms" because it does not start with the basename, so the <Router> won't render anything。”

在使用 loadMicroApp 时，会根据当前子应用路由环境去匹配，如果其他子应用又没有在加载前，卸载上一个子应用及环境（上下文）就会出现这个问题，react-router-dom 是严格匹配，当不匹配时抛出警告，而registerMicroApps 则没有这个问题，因为 registerMicroApps 内部自动处理了。
如何处理，可以通过给路由表中每个path统一加前缀，从而实现 basename，把原有的 createBrowserRouter basename 去掉。

### 微前端实现多应用之间多标签的实现（Qiankun + react + react + activation + ProComponent），样式丢失及自定义主题断层失效问题

- 先说样式冲突覆盖丢失问题，作用域丢失，通过加样式前缀即可，像antd 自带有属性支持，可以创建一个唯一标识前缀方式处理
- 主题断层失效，主要是 `@ant-design/cssinjs` 默认会将标签注入到 `document.head`, 也是作用域丢失问题，通过给 StyleProvider 设置container 属性，挂在当前应用即可，StyleProvider 的 container 属性告诉 @ant-design/cssinjs：“不要往 document.head 里注入样式，而是注入到我指定的这个 DOM 节点里”。
