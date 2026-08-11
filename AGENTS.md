# AGENTS.md

本文件是 Codex 和其他代码代理在本仓库工作的全局规则。执行任何代码修改前，先阅读本文件以及相关目录下可能存在的更具体说明。

## 项目概况

- Monorepo + 微前端架构。
- 包管理使用 `pnpm@9.0.5`。
- 应用目录位于 `apps/*`，共享包位于 `packages/*`。
- 主应用为 `apps/sc-cloud-basic`，子应用包括 `apps/sc-cloud-platform`、`apps/sc-cloud-fm-budget` 等。
- 微前端使用 Qiankun，子应用通过 `vite-plugin-qiankun` 接入。

## 技术栈

- React 19
- TypeScript 5
- React Router DOM 7
- Vite 8
- Ant Design 6
- `@ant-design/pro-components`
- CSS Modules + SCSS
- UnoCSS
- Axios via `@repo/utils`
- 自定义 hooks via `@repo/react-hooks`

不要随意更换或新增基础技术栈。新增第三方依赖必须有明确必要性，并优先选择局部、低侵入方案。

## 目录规范

应用内推荐结构：

```text
src/
├── api/
│   └── module-name/
│       ├── index.ts
│       └── index.interface.ts
├── assets/
├── pages/
│   └── feature-name/
│       ├── index.tsx
│       ├── index.module.scss
│       └── components/
├── router/
│   ├── async-component.tsx
│   ├── auth.tsx
│   └── index.tsx
├── App.tsx
└── main.tsx
```

规则：

- 页面放在 `src/pages`。
- API 放在 `src/api`，并从 `src/api/index.ts` 统一导出。
- 页面样式使用 CSS Modules，文件名优先为 `index.module.scss` 或组件同名 `.module.scss`。
- 共享能力优先放在已有 `packages/*`；只有确实跨应用复用时才抽到 packages。

## 代码风格

- 使用 TypeScript，避免 `any`；必须使用时控制在边界层或旧系统迁移适配层。
- 使用单引号。
- 不使用分号。
- 缩进为 4 个空格。
- JSX 属性使用单引号。
- 删除未使用变量、函数、类型和 import。
- 页面文件不要过长，复杂页面按表单、表格、弹窗、工具函数拆分。
- 保持低耦合、高内聚、单一职责。
- 不做与任务无关的重构。

### 页面文件行数与组件化规范

- 单个页面文件（`index.tsx`）不超过 **600 行**。超过时必须拆分为子组件。
- 拆分粒度按职责划分，常见拆分方式：
  - `constants.ts` — 页面级常量、选项映射、工具函数、共享类型定义。
  - `components/xxx-drawer.tsx` — 新增/编辑抽屉组件。
  - `components/xxx-modal.tsx` — 弹窗组件（分配、查看等）。
  - `components/xxx-table.tsx` — 独立的表格区域（如成员列表、候选人列表）。
- 子组件放在页面目录下的 `components/` 文件夹，文件名使用 kebab-case。
- 子组件通过 Props 接收数据和回调，不直接访问页面级状态；需要跨组件共享的状态由父页面管理并下传。
- 常量和工具函数放在页面目录下的 `constants.ts`，子组件通过相对路径导入。
- 拆分后的主页面文件职责：状态管理、数据请求、Tab/筛选逻辑、ProTable 配置、子组件编排。

## React 规范

- 使用函数组件。
- Props 使用 interface 定义。
- 复杂事件处理使用 `useCallback`，复杂派生数据使用 `useMemo`。
- 弹窗、表格、表单优先使用 Ant Design 和 ProComponents。
- 不引入 Umi 写法；不要使用 `@umijs/max` 的 `request/useRequest/useModel`。
- 新项目请求 hooks 优先使用 `@repo/react-hooks`，ProTable 的 `request` 可直接调用 API 方法。

### Ant Tree 使用规范

- 树形选择、树形列表优先使用 Ant Design `Tree` 组件自身能力，例如 `height`、`treeData`、`checkedKeys`、`expandedKeys`、`loadData`、`fieldNames` 等。
- 需要固定高度和滚动区域时，优先给 `Tree` 设置 `height`，使用组件内置虚拟滚动；不要通过额外包裹元素、强行覆盖 `.ant-tree` / `.ant-spin-container` 等 Ant 内部 DOM 来控制滚动。
- 弹窗中的树选择区域应根据弹窗总高度、标题区、页签区、搜索区、操作区计算明确高度，避免树内容撑开弹窗。
- 树节点较多、存在懒加载或搜索过滤时，保持 `treeData`、`checkedKeys`、`expandedKeys` 等受控数据来源清晰；不要用 DOM 查询或手动修改节点样式来表达选中、展开、禁用状态。
- `checkable` 树的业务提交值使用节点原始 `key` / 业务 id；展示文本使用接口返回名称或字典展示字段，不从渲染后的节点文本反推数据。

### React Ant Design 和 ProComponents 组件规范

- 当 table column 需要使用到 React 内部状态时、hooks、变量时，使用 useMemo 缓存，避免重复创建。
- 当 table column 不需要使用到 React 内部状态时、hooks、变量时，可以放在最外层， 直接使用 常量。

- 表格使用 ProTable 组件。
- ProTable 分页配置使用 `usePaginationConfig` 钩子函数。
- 表格操作列使用 `toolBarRender` 配置。
- `ProForm` 开启 `grid` 布局时，禁止把 `hidden` 的 `ProForm.Item`、`ProFormText`、`ProFormSelect` 等字段组件直接放进表单网格中；这类隐藏项仍可能参与栅格占位，导致表单出现异常空白。隐藏提交字段应在保存方法中组装 payload 时补默认值，或使用不参与布局的状态/变量维护。


## API 规范

API 文件示例：

```typescript
import { api } from '@repo/utils'

import type { QueryParams, SaveData } from './index.interface'

export const getList = (params?: QueryParams) =>
    api.get('/admin/module/resources', { params })

export const saveItem = (data: SaveData) =>
    api.post('/admin/module/resources', data)

export const updateItem = (data: SaveData) =>
    api.put('/admin/module/resources', data)

export const deleteItem = (params: { id: string }) =>
    api.delete('/admin/module/resource', { params })
```

规则：

- 统一使用 `@repo/utils` 的 `api`。
- API 类型放在同目录 `index.interface.ts`。
- 后端统一响应由拦截器处理；页面不要重复实现全局错误提示。
- 请求路径遵守后端真实接口，不制造 mock 字段或假数据。
- 分页接口在页面层或 adapter 层规整为 ProTable 需要的 `{ data, total, success }`。

### 字典 / 枚举字段展示规范

接口文档中字段存在 `x-dict-code`，或 Knife4j 字段说明中存在 `OptionRef(dictCode="xxx")`，表示该字段是后端标注的字典 / 枚举 / 状态字段。前端必须按接口文档判断，不要仅凭字段名（如 `status`、`type`、`xxxCode`）推断。

规则：

- 响应对象类型（RVO、Record、Item 等）中，凡接口文档字段带 `x-dict-code`，必须增加对应可选展示字段：`原字段名 + Desc`。
- 示例：接口文档字段 `appStatus` 带 `x-dict-code`，前端响应类型应增加 `appStatusDesc?: string`。
- 页面中文展示优先使用 `xxxDesc || xxx`。
- 业务判断、提交、筛选、路由参数、接口参数仍使用原字段值 `xxx`。
- `xxxDesc` 只用于展示，不加入 Save、Update、Query、Delete 等请求参数类型，不提交给后端。
- 后端未返回 `xxxDesc`、字典未匹配或字段为空时，页面显示原字段值 `xxx`。
- 现有本地枚举 map 只能保留颜色、图标等 UI 映射，不作为中文文案来源；文案以后端返回的 `xxxDesc` 为准。
- 表单、筛选等输入控件中，字段存在 `x-dict-code` 或 `OptionRef(dictCode="xxx")` 时，选项必须通过字典 / 选项接口按对应 `dictCode` 查询，不写死本地中文选项。
- 字典 / 选项接口返回 `itemName`、`itemValue` 时，输入控件展示文本使用 `itemName`，控件选中值使用 `itemValue`。
- `YES_NO` 这类二元字典字段，选项来源仍查字典，但控件形态优先使用 Switch / Checkbox 等二元控件；不要因为数据来自字典就统一改成下拉框。
- 本地固定选项只允许用于接口文档未标注字典来源的普通字段。
- `xxxCode` 通常是业务编码或引用编码，例如 `tenantCode`、`appCode`、`resourceCode`、`dictCode`、`itemCode`、`fieldCode`；只有接口文档明确带 `x-dict-code` 时才增加 `xxxDesc`。

代码使用规则：

- 字典选项查询是全局通用能力，统一使用 `@repo/utils` 中的 `getDictOptions`、`getDictOptionsBatch`、`DictOption`、`DictOptionsBatch` 等公共导出。
- React 页面和组件中使用字典选项时，统一从 `@repo/react-hooks` 导入 `useDictOptions`，不要在各 app 内新增或复制 `use-dict-options`。
- 字典选项展示转换统一使用 `@repo/utils` 中的 `toSelectOptions`、`toValueEnum`、`getDictLabel`、`getDictColor`；页面不要重复实现本地转换工具。
- 各 app 的 `src/api` 不再封装字典选项查询接口；只保留本 app 自身业务接口。平台端可继续保留字典分类、字典、字典项、发布、导入导出等字典管理 CRUD。
- `useDictOptions(dictCodes)` 的调用参数为接口文档标注的 `dictCode` 数组；页面只关心展示和交互，不硬编码字典中文文案。
- 控件选中值使用 `itemCode`，展示文本使用 `itemName`；`itemValue` 仅用于兼容展示匹配，不作为表单默认提交值。

示例：

```typescript
interface AppRecord {
    appStatus: string
    appStatusDesc?: string
}

const displayStatus = record.appStatusDesc || record.appStatus
```

## 样式规范

- 使用 CSS Modules。
- 避免全局样式污染；确需覆盖 Ant Design 时使用局部 `:global`。
- 不嵌套 UI 卡片作为页面布局。
- 管理后台页面应保持信息密度、清晰表格、明确操作按钮。
- 页面文字、按钮、表格列要避免在常见桌面和移动宽度下重叠。
- 不引入单一浓重色系或装饰性背景，除非现有设计体系已有明确规则。

### 业务管理页面规范

列表型管理页面必须优先参考现有成熟页面，不重新设计一套交互和视觉。当前主要参考页面：

- 招采系统：供应商管理 / 供应商库。
- 财会系统：核算架构。
- 主数据系统：项目管理。

规则：

- 列表管理页默认使用 `ProTable`，对齐供应商库页面模式。
- 页面外层使用白底内容区，保持项目标准留白；不要做独立营销式、说明式、卡片式页面。
- 顶部查询区由 `ProTable` 的 search 承载，新增按钮放在 `toolBarRender` 右侧。
- 表格分页使用项目标准 `usePaginationConfig()`。
- 不要在列表页额外增加大标题、副标题、面包屑说明、页面功能说明等展示文案。
- 新增、编辑、查看弹窗统一使用 Ant Design `Modal` / `Form`，布局、宽度、按钮位置、间距与已有业务页面保持一致。
- 联系人、资质、银行账户、建筑面积等多条明细数据，默认用表格展示核心字段；新增/编辑在当前页面子弹窗中完成，不堆叠多个表单卡片。
- 当前 tab 内操作成功后，只刷新当前 tab 数据，不要自动切换 tab。
- 如果 `ProTable` 在 Qiankun dev 环境下出现 React context / hook 异常，优先检查和修复 React 依赖去重、Vite 预构建缓存、子应用重启问题，不要退回普通 `Table`。
- 新增、编辑统一使用 Drawer ，操作区放在下面并右对齐，标题区和操作区固定不受内容区域滚动影响，

### CSS 属性书写顺序

```css
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'z-index',
    'box-sizing',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border',
    'border-style',
    'border-width',
    'border-color',
    'border-radius',
    'background',
    'background-color',
    'background-image',
    'background-repeat',
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'text-align',
    'color',
    'content',
```

## React CSS 规范

- css、scss、less class 命名遵守  kebab-case、kebab__case 规则。
- React className kebab-case、kebab__case 规则，可以使用驼峰命名法，内部插件做了 kebab-case、kebab__case 转换。
- 组件样式使用 UnoCSS 插件，避免直接写内联样式, 在组件样式文件中（css\scss\less）可以使用 `@apply` 关键字。

```scss
.example {
    @apply text-red;
}

.example-name {
    @apply text-blue;
}

.example__active {
    @apply text-green;
}

```

```css
.example {
    @apply text-red;
}

.example-name {
    @apply text-blue;
}

.example__active {
    @apply text-green;
}

```

```less
.example {
    @apply text-red;
}

.example-name {
    @apply text-blue;
}

.example__active {
    @apply text-green;
}

```

## 路由与微前端

- 路由集中在 `src/router/index.tsx`。
- 子应用 basename 必须兼容 Qiankun：

```typescript
basename: qiankunWindow.__POWERED_BY_QIANKUN__ ? '/子应用前缀' : '/'
```

- 路由页面使用 `asyncComponent(() => import('@/pages/xxx'))`。
- 需要鉴权的路由包裹 `Auth`，保持现有路由守卫模式。
- 子应用不要硬编码主应用路径。
- 新增或接入微前端子应用时，必须检查端口是否已被配置或监听，不能占用已存在端口。
- 不要随意启动 dev server；只有用户明确要求或确需浏览器验证时再启动。
- 子应用如果配置了 `hmr: false`，修改后需要提醒重启对应端口服务，否则浏览器可能仍显示旧代码。
- Turbo persistent task 数量增加后，必须同步调整 `local` 脚本或 `turbo.json` 的 concurrency，避免本地启动失败。

### 静态路由保护规则

- 动态页面或通用页面模板接管已有路径时，AI 不得删除原有静态路由。
- AI 只能将原静态路由完整注释，并在相邻位置用中文注明：被接管的路由路径、当前由哪个动态入口接管，以及恢复静态路由的方法。
- 恢复静态页面时，先关闭对应动态接管，再取消原静态路由注释，避免同一路径同时注册静态和动态入口。
- 原静态路由只能由开发人员主动删除；AI 不得自行删除，也不得以清理废弃代码、消除注释代码或重构路由为由删除。
- 新增的动态兜底路由不得顺带删除或改写其他无关静态路由。

## 迁移旧系统规则

迁移旧系统页面时：

- 目标是迁移业务能力，不是重新设计一套页面。
- 保留旧页面的核心交互和字段含义，但必须适配新项目技术体系。
- 旧系统依赖如 `@umijs/max`、`@shengcheng/*` 不应直接迁入。
- 旧服务调用必须替换为新项目 `src/api` 下的接口封装。
- 旧字段名必须映射到新后端 QVO/RVO 字段；不可从新接口获取的旧字段不要造假。
- 可为强业务交互保留必要依赖，但必须写入应用 `package.json` 并验证构建。
- 占位页、演示页、无业务价值代码默认不迁移，除非用户明确要求。

## 验证命令

修改前端应用后至少运行：

```bash
pnpm --filter <app-name> check-types
```

涉及构建、路由、依赖、微前端配置时运行：

```bash
pnpm --filter <app-name> build
```

如改动共享包，运行相关应用和包的类型检查或构建。

不能在未完成新鲜验证前声称"已完成"、"已修复"、"可用"。如果验证失败，必须说明失败命令和原因。

## Git 与工作区安全

- 不要还原用户已有改动。
- 不要执行 `git reset --hard`、强制 checkout、删除文件等破坏性操作，除非用户明确要求。
- 提交前只暂存与本任务相关的文件。
- 不要改动锁文件，除非确实新增或调整依赖。
- 提交前必须检查工作区，多个 Git 仓库或子仓库要分别检查、分别提交、分别推送。
- 提交信息使用中文规范，例如 `feat(费用报销): 开发配置管理页面`、`refactor(财资管理): 统一配置页表格样式`、`fix(工程配置): 优化本地启动和 React 去重`。
- 用户要求提交并推送时，默认推送当前分支；推送前确认当前分支和远端。

## 注释规范

- 代码即文档。命名清晰、逻辑简单的代码不写注释。
- 只注释"为什么这样做"（非显而易见的业务规则、trade-off、workaround），不注释"做了什么"（代码本身已说明）。
- 一般业务代码不保留无效的注释代码；动态页面接管已有静态路由时，必须按照“静态路由保护规则”保留并备注，不适用直接删除规则。

### HTML

- 不做区块结束注释（如 `<!-- /header -->`）。
- 不做标签用途注释（如 `<!-- 搜索框 -->`），语义化标签和 class 命名已自解释。

### CSS / SCSS

- 不做属性用途注释（如 `/* 设置字体大小 */`）。
- 不写文件头注释、区块分隔注释、颜色值注释。
- 仅对非直观的 `z-index` 层级关系或 hack 技巧加简短说明。

### JavaScript / TypeScript

- 不写 JSDoc，函数名和参数名已说明一切。
- 不写行尾注释解释变量/语句。
- 不写变更日志、作者、日期注释。
- 复杂正则、非显而易见的算法仅用一行简注说明意图。
- 公共 API 函数可用一行简注描述用途（非参数/返回值细节）。

### React / Vue

- 组件不做用途注释（如 `{/* 用户列表 */}`）
- 不做 JSX 区块分隔注释。
- 不做 props 用途注释。
- 复杂 hooks 依赖或 effect 中的非直观操作可用一行简注。

### 通用注释用于规范说明

- 但行注释用`/ 注释内存 /`，多行用`/* 注释内存 */`。
- 仅对非直观的代码（如复杂算法、非显而易见的业务规则）加简短说明。
- 业务管理页面，特别是涉及复杂业务逻辑的页面，关联多个组件、服务、接口等，注释要详细，包括页面功能、交互逻辑、数据来源等。
- 业务管理页面的注释要符合中文语境，避免使用英文。
