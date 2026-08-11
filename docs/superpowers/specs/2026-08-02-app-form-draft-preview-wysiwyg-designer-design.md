# 应用表单草稿预览与所见即所得设计器设计

## 1. 背景与目标

应用表单目前通过页面布局、字段配置、数据域和规则配置生成运行时 Schema，发布后由通用页面模板渲染。现有设计器以树和属性表为主，设计结果必须发布后才能完整验证，配置态与最终页面之间存在认知差距。

本次建设两个相互配合的能力：

1. 为当前选中的应用表单版本提供独立全页预览。草稿保存后即可查看列表、新增、编辑和详情，不需要发布。
2. 将布局设计器升级为受通用模板约束的所见即所得设计器。设计画布直接复用正式渲染组件，不维护另一套仿真页面。

预览和设计均不得读写正式业务记录。字典、维度、组织、人员、远程下拉和树选择等选项类控件仍读取真实只读数据源。

## 2. 范围

### 2.1 本次包含

- 页面设计、数据域配置和规则配置头部的版本级“预览”入口。
- 草稿和已发布版本的管理端 Schema 预览接口。
- LIST、FORM、DETAIL 三类草稿 Schema 编译。
- 独立全页预览，覆盖列表、查询、分页、新增、编辑、详情和删除。
- 当前浏览器预览会话内的模拟业务记录和 CRUD 沙箱。
- 按字段类型和 Schema 结构生成模拟记录。
- 选项类控件调用真实只读数据源接口。
- 草稿显示、隐藏、必填、只读、校验和字段联动规则。
- 所见即所得布局设计画布、场景切换、设计/试运行切换、字段与容器拖放、属性面板。
- 通用模板能力清单，用于约束设计器允许的槽位、节点和属性。
- 草稿问题分级、定位和受影响场景隔离。

### 2.2 本次不包含

- 在预览中读取或修改正式业务记录。
- 在预览中发布版本、提交流程或执行外部业务关联写入。
- 任意 HTML/CSS 自由编辑、脚本注入或无约束绝对定位。
- 新增第二套布局持久化模型。
- 修改正式运行时只接受已发布版本的规则。
- 让设计模式中的点击直接触发保存、删除、上传、流程或其他副作用。

## 3. 已有基础

- `AppFormDesignerApplicationService.getDesigner(formId, versionId)` 能读取指定草稿的完整设计定义和 `revision`。
- `AppFormRenderSchemaAssembler.build(definition, scene)` 能按场景编译 Schema。
- `AppFormRuntimeApplicationService` 明确只解析已发布版本，正式运行时边界清晰。
- `GeneralPageTemplate1` 已编排列表、查询、新增、编辑、详情和删除。
- `GeneralTemplateRuntimeClient` 已抽象 Schema、分页、详情、保存、删除和选项加载。
- `AppFormListRenderer`、`AppFormEditorRenderer` 和规则引擎已经消费统一的 `AppFormRenderSchema`。
- 当前 `designTree` 已包含 `LIST_ROOT`、`LIST_SEARCH_REGION`、`LIST_TABLE_REGION` 和 `FORM_ROOT` 固定角色。
- 列表渲染器已按 `LIST_SEARCH`、`LIST_TABLE` 角色提取查询字段和表格列。

这些能力继续作为事实来源，本次不建立平行渲染协议。

## 4. 用户入口与版本交互

### 4.1 入口位置

“预览”是版本级操作，不直接放在应用表单管理列表行操作中。以下配置页的头部均在当前版本选择器旁增加统一预览入口：

- 表单设计：页面布局、字段配置、规则配置。
- 数据域配置：数据域与字段配置、规则配置。

按钮顺序统一为：

```text
版本选择 -> 刷新 -> 预览 -> 保存 -> 发布
```

没有保存和发布动作的页签仍保留 `版本选择 -> 刷新 -> 预览`。

### 4.2 当前版本

预览始终绑定当前选择器中的 `formId + versionId`。独立预览页显示：

- 表单名称。
- 版本号和版本状态。
- 设计修订号 `revision`。
- 来源配置页和来源步骤。

预览页新开浏览器页签。原配置页不卸载，返回时保留当前版本、步骤、选中节点和未保存本地状态。

### 4.3 未保存修改

预览只读取服务器上已保存的草稿，不直接消费配置页内存状态。

当页面没有未保存修改时，点击“预览”直接打开独立预览页。

当页面存在未保存修改时，弹窗说明未保存范围，并提供：

- `保存并预览`：先执行当前页面已有保存动作，使用返回的新 revision 打开预览。
- `预览已保存草稿`：不保存本地修改，预览服务器上的最近草稿。
- `取消`：停留在配置页。

保存失败时不打开预览，并保留本地修改。

## 5. 独立预览页

建议路由：

```text
/business-standard/form/preview
    ?appId=...
    &formId=...
    &versionId=...
    &menuId=...
    &menuName=...
    &source=designer|data-domain|rule
    &sourceStep=...
```

路由不把 `revision` 当作可信数据。预览页从后端响应获得当前 revision。

### 5.1 顶部区域

- 返回原配置页。
- 表单名称、版本号、`DRAFT/PUBLISHED` 状态和 revision。
- 场景切换：列表、新增/编辑、详情。
- `刷新草稿`：重新请求 LIST、FORM、DETAIL Schema，并重建模拟数据。
- `重置模拟数据`：保留当前 Schema，只重建会话数据。
- 草稿问题数量和问题清单入口。

### 5.2 场景与数据生命周期

- 第一次进入时加载三类 Schema，建立一个 `PreviewSession`。
- 普通场景切换、从列表进入新增/编辑/详情均复用当前 Session。
- 查询、分页、新增、编辑、删除只修改 Session 中的数据。
- `刷新草稿` 使用最新 revision 重建 Schema 和 Session 数据。
- `重置模拟数据` 使用当前 Schema 重建 Session 数据。
- 关闭或刷新浏览器页签后 Session 消失，不做 localStorage、IndexedDB 或后端持久化。

### 5.3 交互能力

- 查询条件使用 Schema 中的查询字段和操作符过滤内存记录。
- 分页在过滤后的内存记录上执行。
- 新增按 FORM Schema 创建记录并执行草稿规则和校验。
- 编辑读取当前 Session 记录，保存回 Session。
- 详情读取当前 Session 记录，使用 DETAIL Schema 只读展示。
- 删除只移除 Session 记录，并保留正式模板已有的二次确认交互。

## 6. 所见即所得布局设计器

### 6.1 核心原则

设计画布直接使用正式通用模板的渲染组件。设计器不复制查询区、表格、表单、页签和控件的 HTML，只在真实渲染结果外叠加设计 Overlay。

设计模式需要即时反馈未保存修改。前端使用当前 `AppFormDesigner` 快照中的 `designTree + dataDomains + fields` 生成仅供画布使用的 `AppFormRenderSchema` 结构投影，并立即传给正式渲染组件。该投影只组合已经存在的 Schema 字段，不执行后端规则、数据源和 API binding 编译，也不成为持久化格式。保存后由后端 `AppFormRenderSchemaAssembler` 返回的 Schema 仍是试运行、独立预览和正式运行的唯一权威结果。

同一份已保存 `designTree` 经 Schema 编译后用于：

- 设计画布。
- 设计器试运行。
- 独立草稿预览。
- 正式发布运行时。

四个场景仅数据来源和运行模式不同，布局与控件渲染保持同源。

### 6.2 页面结构

所见即所得设计器由四个区域组成：

1. 顶部工具栏
   - 当前版本和状态。
   - 设计/试运行切换。
   - 撤销、重做。
   - 全页预览。
   - 保存草稿。
2. 场景栏
   - 列表。
   - 新增/编辑。
   - 详情。
   - 桌面和窄屏画布宽度切换；它只改变设计观察宽度，不生成设备专用 Schema。
3. 左侧资源区
   - 字段：按数据域分组，支持搜索、已使用和未放置状态。
   - 页面结构：展示当前场景 designTree，作为大结构导航和无障碍排序入口。
   - 容器：分组、页签、对象区域和列表区域；只显示当前模板和槽位允许的类型。
4. 右侧属性区
   - 页面、槽位、容器、区域或字段的上下文属性。
   - 不展示当前模板不支持的属性。
   - 系统固定槽位可配置但不可删除、改角色或移出模板骨架。

### 6.3 设计模式与试运行模式

设计模式：

- 点击渲染结果用于选择节点，不触发业务动作。
- 拖放仅允许进入模板能力清单声明的槽位。
- 选中节点显示边框、名称、类型和槽位角色。
- 属性修改写入前端草稿状态，并立即更新画布结构投影；通过现有保存接口持久化。
- 键盘和页面结构树均可完成选择、排序和移动，不把拖拽作为唯一操作方式。

试运行模式：

- 关闭设计 Overlay。
- 使用当前已保存草稿 Schema；未保存修改不参与试运行。
- 使用与独立预览相同的 `PreviewRuntimeClient` 和会话数据。
- 查询、分页、表单控件、规则和真实选项接口可交互。
- 正式业务写入和外部副作用仍然禁用。

### 6.4 通用模板固定骨架

`GENERAL_TEMPLATE_1` 的 LIST 场景固定包含：

- `LIST_ROOT`。
- `LIST_SEARCH` 查询槽位。
- 工具栏和新增动作区。
- `LIST_TABLE` 表格槽位。
- 分页区。

用户可调整查询字段、表格列、字段顺序、列宽、搜索列数、默认展开数量、表格密度和分页规格等能力清单允许的属性，但不能删除固定骨架。

FORM 和 DETAIL 共用 `FORM_ROOT` 布局。FORM 可编辑，DETAIL 自动只读。两者允许放置：

- 普通分组。
- 页签与页签项。
- 对象数据域区域。
- 列表数据域区域。
- 字段节点。

### 6.5 模板能力清单

共享包新增 `TemplateDesignerManifest`，按模板编码和版本声明：

- 支持的场景。
- 每个场景的固定槽位和布局角色。
- 槽位允许的节点类型。
- 节点允许的子节点类型。
- 页面、槽位、区域和字段的属性 Schema。
- 属性默认值、取值范围和设计时控件。
- 固定节点、最少子节点和非法移动约束。

能力清单只描述设计能力，不包含 React 组件实例、可执行脚本或任意 CSS。设计器根据清单生成属性面板和拖放约束。

持久化继续使用现有字段：

- `pageLayout.layoutType` 选择模板。
- `designTree` 保存结构和顺序。
- `gridSpan` 保存 24 栅格宽度。
- `widthConfig`、`heightConfig` 只用于模板明确支持的尺寸属性。
- `nodeConfigJson` 保存经过能力清单校验的模板属性和布局角色。

## 7. 前端组件边界

### 7.1 通用模板拆分

将 `GeneralPageTemplate1` 的运行时编排与展示表面拆开：

- `GeneralTemplate1Surface`：接收 Schema、数据、状态和事件回调，负责通用模板真实布局。
- `GeneralPageTemplate1`：正式运行时控制器，继续按页面权限加载已发布 Schema 和正式业务数据。
- `GeneralTemplate1DesignCanvas`：设计态适配器，给 Surface 注入草稿 Schema、模拟数据和设计 Overlay。
- `AppFormDraftPreviewPage`：独立预览控制器，给 Surface 注入草稿 Schema 和 PreviewRuntimeClient。

共享渲染器不依赖平台设计器页面。平台页面依赖共享 Surface 和 Manifest，避免反向依赖。

### 7.2 PreviewRuntimeClient

`PreviewRuntimeClient` 实现现有 `GeneralTemplateRuntimeClient`：

- `getSchemaByPermission/getSchema`：调用管理端草稿 Schema 接口。
- `page/detail/save/delete`：委托 `PreviewSessionStore`，不解析 Schema 中正式 CRUD bindings。
- `loadOptions`：调用真实只读选项接口。

该客户端是正式业务数据与预览数据之间的强制隔离边界。

### 7.3 PreviewSessionStore

`PreviewSessionStore` 是纯前端、可测试的内存存储，职责包括：

- 按 Schema 生成初始记录。
- 稳定生成会话内 recordId。
- 条件过滤和分页。
- 详情读取。
- 新增和编辑写入。
- 删除。
- 重置。

它不直接调用 HTTP，不读取 localStorage，不处理选项接口。

## 8. 后端管理端 Schema 接口

新增管理端只读接口：

```http
GET /admin/basic/app-forms/{formId}/versions/{versionId}/preview-schema?scene=LIST
```

`scene` 只允许 `LIST`、`FORM`、`DETAIL`。

响应使用明确的 `AppFormPreviewSchemaRVO`：

```text
formId
versionId
versionNo
versionStatus
revision
scene
renderable
issues[]
schema
```

`schema` 复用 `AppFormRenderSchemaRVO`，不新增预览专用字段协议。`issues` 在预览响应中增加 `severity` 和 `scene`，用于分级显示与场景隔离。

应用服务执行：

1. 校验 formId 对应表单存在且当前用户具有管理权限。
2. 校验 versionId 属于该 formId。
3. 允许 `DRAFT` 和 `PUBLISHED`，拒绝无效或已删除版本。
4. 读取指定版本完整定义，不回退到当前已发布版本。
5. 运行预览结构校验并区分 warning/fatal。
6. 调用 `AppFormRenderSchemaAssembler.build(definition, scene)`。
7. 返回真实 revision、问题和 Schema。

正式运行时 Controller 和 `AppFormRuntimeApplicationService` 不调用此接口，继续只接受已发布版本。

## 9. 真实选项接口与安全

选项类控件不生成模拟选项，统一调用现有只读选项能力：

- 字典。
- 维度。
- 组织、部门、人员和岗位。
- 远程下拉、关系选择和树选择。
- 配置表或允许的自定义只读数据源。

请求携带草稿 Schema 中的 `formVersionId`、数据域编码、字段编码、keyword、pageNo 和 pageSize。后端根据字段定义解析数据源，不接受前端传入任意 URL。

草稿选项通过管理端专用只读接口加载：

```http
POST /admin/basic/app-forms/{formId}/versions/{versionId}
     /data-domains/{dataDomainCode}/fields/{fieldCode}/preview-options
```

请求体复用 `AppFormOptionPageQVO` 的 keyword、selectedValues、cascadeValues、pageNo 和 pageSize。路径中的 formId 和 versionId 是字段定义的权威来源；后端校验版本归属后，从指定草稿读取数据源配置，再委托现有字典、维度、组织或注册远程数据源适配器执行只读查询。该接口不回退到当前已发布定义，也不调用 `AppFormRuntimeApplicationService.publishedVersion()`。

只允许能力清单和后端注册表认定为只读的来源和方法。拒绝：

- 非 GET/查询语义的数据源。
- 未登记为选项查询的 POST 接口；管理端 `preview-options` 自身使用 POST 仅用于承载分页、已选值和级联条件。
- 任意外部 URL。
- 保存、删除、发布、流程和业务动作接口。
- 需要执行脚本或产生副作用的适配器。

预览业务 CRUD 永远不通过 `apiBindings` 发起 HTTP。即使 Schema 包含正式 bindings，PreviewRuntimeClient 也忽略这些 bindings。

## 10. 模拟数据生成

模拟数据按 Schema 的数据域和字段结构生成，不读取正式业务记录。

### 10.1 数量和结构

- 初始生成 18 条根 OBJECT 记录，足以验证默认分页。
- 每条记录包含所有 OBJECT 数据域。
- LIST 数据域生成 0 至 3 条明细，至少部分记录包含多条明细。
- 同一 Session 内使用稳定 seed，切换场景时值保持一致。
- 重置或刷新草稿时创建新 seed 和新记录集合。

### 10.2 字段生成规则

- 文本：根据字段标签生成可辨认文本，并附加序号。
- 长文本：生成一至两句短说明。
- 数字、金额、比例：生成符合精度和范围的值。
- 日期、日期时间、日期范围：生成接近当前日期且顺序合法的值。
- 布尔：按序号交替。
- 引用或选项字段：首次需要显示或编辑时调用真实选项接口，从返回项中选择值并保存 label 快照；无可用项时保持空值并显示 warning。
- 文件、图片和签名：使用仅预览占位元数据，不上传文件。
- 计算字段：先生成依赖字段，再由草稿规则或计算逻辑得到结果；无法计算时保持空值并记录 warning。

生成器遵守字段 nullable、required、readonly 和 defaultValue。required 字段优先产生非空值，允许通过新增表单手动验证必填错误。

## 11. 草稿规则与副作用隔离

执行：

- 显示和隐藏。
- 必填和非必填。
- 只读和可编辑。
- 启用和禁用。
- 字段校验。
- 默认值和字段联动。
- 纯前端或无副作用的计算规则。

禁用：

- 发布版本。
- 流程提交、撤回和审批。
- 业务关联写入。
- 消息、通知、回调和第三方写操作。
- 文件真实上传。
- 后端字段适配器写执行和其他外部副作用。

禁用动作在 UI 中显示“预览中不可执行”，不静默调用也不伪造成功结果。

## 12. 问题分级与错误处理

草稿不要求达到完整发布校验标准后才可预览。

- `WARNING`：字段缺少默认值、选项为空、非关键展示属性不完整等。继续渲染有效内容。
- `FATAL`：节点循环、根节点缺失、父子结构非法、场景固定槽位损坏等。只阻止受影响场景。

预览页显示问题总数、级别、场景、步骤和 nodeId。能定位的问题提供返回设计器并选中节点的入口。

错误行为：

- Schema 请求失败：当前场景显示错误和重试，不清除仍有效的其他场景。
- revision 在加载期间变化：顶部提示“草稿已有新版本”，用户点击刷新草稿后重建 Session。
- 真实选项请求失败：控件显示加载失败并允许重试，不回退为模拟选项。
- 模拟 CRUD 校验失败：使用正式表单校验信息，不修改 Session。
- Session 异常：允许重置模拟数据，不影响服务器草稿。

## 13. 并发与 revision

配置保存继续使用现有 `expectedRevision` 乐观锁。

- `保存并预览` 使用保存响应中的新 revision。
- 预览接口始终返回服务器当前 revision。
- 预览页记录加载时 revision。
- 刷新草稿后 revision 变化则重建所有场景 Schema 和 Session。
- 普通场景切换不请求新 revision。
- 设计器检测到保存冲突时沿用现有冲突处理，不打开基于失败保存的预览。

## 14. 测试策略

### 14.1 前端单元与组件测试

- TemplateDesignerManifest 的固定槽位、允许节点和属性过滤。
- designTree 到场景 Schema 的映射保持稳定。
- PreviewSessionStore 的生成、查询、分页、详情、保存、删除和重置。
- 模拟数据各字段类型、OBJECT/LIST 数据域和稳定 seed。
- PreviewRuntimeClient 不调用正式 CRUD bindings。
- PreviewRuntimeClient 只通过真实选项加载接口读取选项。
- 版本预览按钮的当前 versionId、无脏数据直开、保存并预览和预览已保存草稿。
- 设计/试运行切换、固定槽位不可删除、非法拖放拒绝、属性面板按 Manifest 过滤。
- LIST/FORM/DETAIL 场景切换和问题分级显示。

### 14.2 后端测试

- 草稿和已发布版本可以编译预览 Schema。
- versionId 不属于 formId 时拒绝。
- 无管理权限时拒绝。
- 正式运行时仍拒绝草稿版本。
- LIST、FORM、DETAIL 调用现有 assembler 并返回相应场景。
- 响应 revision 与版本表一致。
- warning 继续返回可渲染 Schema，fatal 仅阻止受影响场景。
- 选项加载按草稿字段的数据源定义执行，并拒绝非只读和未注册来源。

### 14.3 集成验收

手动从以下页面验证当前 v5 草稿：

- 表单设计中的页面布局、字段配置、规则配置。
- 数据域配置中的数据域与字段配置、规则配置。

验收项：

1. 保存草稿后无需发布即可进入预览。
2. 未保存修改时选择明确，不会把本地状态误当作已预览。
3. 列表查询、分页、新增、编辑、详情和删除均可交互。
4. 关闭预览后正式业务记录没有变化。
5. 选项控件展示真实数据源返回值，不出现模拟选项。
6. 草稿规则在新增、编辑和详情中生效。
7. 刷新草稿后使用新 revision 和新模拟数据。
8. 所见即所得设计画布与独立预览、正式模板的布局和控件一致。
9. 固定模板骨架不能被删除或拖出合法位置。
10. warning 不阻止有效区域，fatal 只阻止受影响场景。

## 15. 交付顺序

1. 后端草稿 Schema 预览接口和权限/版本测试。
2. 前端 PreviewSessionStore、模拟数据生成器和 PreviewRuntimeClient。
3. 独立预览路由与完整 CRUD 沙箱。
4. 页面设计、数据域和规则配置中的版本级预览入口。
5. 通用模板 Surface 拆分和 TemplateDesignerManifest。
6. 所见即所得画布、设计/试运行、属性面板和拖放约束。
7. 聚焦测试、类型检查和人工验收交接。

每一步保持正式运行时可用；所见即所得设计器未完成时，独立草稿预览仍可单独工作。
