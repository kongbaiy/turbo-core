# 应用表单草稿预览与所见即所得设计器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为应用表单当前版本提供不发布即可使用的完整 CRUD 草稿预览，并把布局设计器改造成与 `GENERAL_TEMPLATE_1` 同源的所见即所得画布。

**Architecture:** 后端新增独立的管理端预览应用服务，复用 `AppFormRenderSchemaAssembler` 编译指定草稿版本；前端实现只存在于内存中的 `PreviewSessionStore` 和 `PreviewRuntimeClient`，把正式模板的 CRUD 绑定替换为会话沙箱，同时保留真实只读选项请求。所见即所得设计器继续保存现有 `designTree`，通过模板 Manifest 和设计快照投影驱动同一个运行时渲染组件。

**Tech Stack:** Java 17、Spring Boot、JUnit 5、React 19、TypeScript 5、Ant Design 6、ProComponents、Vitest、CSS Modules/SCSS、pnpm 9。

---

## 文件结构

后端仓库 `shengzhiyun-platform`：

- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-api/src/main/java/com/shengzhiyun/platform/basic/api/appform/rvo/AppFormPreviewSchemaRVO.java`：草稿预览响应契约。
- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewApplicationService.java`：指定版本 Schema 编译和预览问题分级。
- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewOptionApplicationService.java`：草稿字段真实选项只读查询。
- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewOptionSource.java`：只读选项提供器边界。
- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewOptionSourceRegistry.java`：按 sourceType/providerApiCode 选择已注册提供器。
- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/DictAppFormPreviewOptionSource.java`：基础字典真实选项实现。
- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/DimensionAppFormPreviewOptionSource.java`：系统维度真实选项实现。
- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/infrastructure/primary/admin/AppFormPreviewAdminController.java`：管理端预览 HTTP 接口。
- `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/test/java/com/shengzhiyun/platform/basicservice/appform/AppFormPreviewApplicationServiceTest.java`：服务测试。
- `sql/basic-domain/2026-08-02-01-basic-domain-app-form-preview-api-permission-data-dml.sql`：接口权限增量。
- `changelog/basic-domain.md`：基础域变更记录。

前端仓库 `sc-cloud-core`：

- `packages/react-components/app-form-page-template/general-template-1/surface.tsx`：通用模板纯展示表面。
- `packages/react-components/app-form-page-template/general-template-1/preview-session-store.ts`：会话 CRUD。
- `packages/react-components/app-form-page-template/general-template-1/preview-data-generator.ts`：Schema 模拟记录生成。
- `packages/react-components/app-form-page-template/general-template-1/preview-runtime-client.ts`：预览运行时客户端。
- `packages/react-components/app-form-page-template/template-designer-manifest.ts`：模板设计能力契约与注册表。
- `apps/sc-cloud-platform/src/pages/business-standard/form-manage/form-preview/*`：独立全页预览。
- `apps/sc-cloud-platform/src/pages/business-standard/form-manage/preview-entry.ts`：配置页统一预览 URL 和未保存分流。
- `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/*`：设计快照投影、画布和属性面板。

现有超长 `app-form-designer.tsx` 只负责状态编排；新画布、资源面板和属性面板必须拆成独立文件。

---

### Task 1: 管理端草稿 Schema 预览契约

**Files:**

- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-api/src/main/java/com/shengzhiyun/platform/basic/api/appform/rvo/AppFormPreviewSchemaRVO.java`
- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewApplicationService.java`
- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/infrastructure/primary/admin/AppFormPreviewAdminController.java`
- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/test/java/com/shengzhiyun/platform/basicservice/appform/AppFormPreviewApplicationServiceTest.java`

- [ ] **Step 1: 写失败测试，明确草稿版本和场景契约**

```java
@Test
void shouldCompileRequestedDraftSceneWithoutPublishing() {
    AppFormPreviewSchemaRVO result = service.getPreviewSchema("FORM_1", "VERSION_5", "LIST");

    assertThat(result.getVersionStatus()).isEqualTo("DRAFT");
    assertThat(result.getRevision()).isEqualTo(12);
    assertThat(result.getScene()).isEqualTo("LIST");
    assertThat(result.getSchema()).isSameAs(compiledSchema);
    verify(assembler).build(definition, "LIST");
}

@Test
void shouldRejectUnsupportedScene() {
    assertThatThrownBy(() -> service.getPreviewSchema("FORM_1", "VERSION_5", "ALL"))
        .isInstanceOf(BaseException.class)
        .hasMessageContaining("LIST、FORM或DETAIL");
}
```

- [ ] **Step 2: 运行测试，确认因类缺失失败**

Run from `shengzhiyun-platform`:

```bash
mvn -q -pl shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service -am -Dtest=AppFormPreviewApplicationServiceTest test
```

Expected: FAIL because `AppFormPreviewApplicationService` and `AppFormPreviewSchemaRVO` do not exist.

- [ ] **Step 3: 实现最小预览服务和响应对象**

```java
@Service
@RequiredArgsConstructor
public class AppFormPreviewApplicationService {
    private final AppFormDesignerApplicationService designerService;
    private final AppFormRenderSchemaAssembler renderSchemaAssembler;

    public AppFormPreviewSchemaRVO getPreviewSchema(String formId, String versionId, String scene) {
        String normalizedScene = normalizeScene(scene);
        AppFormDesignerRVO designer = designerService.getDesigner(formId, versionId);
        AppFormDefinitionDetailRVO definition = designerService.getDefinition(formId, versionId);
        AppFormPreviewSchemaRVO result = new AppFormPreviewSchemaRVO();
        result.setFormId(formId);
        result.setVersionId(versionId);
        result.setVersionNo(designer.getVersionNo());
        result.setVersionStatus(designer.getVersionStatus());
        result.setRevision(designer.getRevision());
        result.setScene(normalizedScene);
        result.setRenderable(Boolean.TRUE);
        result.setSchema(renderSchemaAssembler.build(definition, normalizedScene));
        return result;
    }
}
```

Controller endpoint:

```java
@GetMapping("/{formId}/versions/{versionId}/preview-schema")
public R<AppFormPreviewSchemaRVO> getPreviewSchema(
    @PathVariable(name = "formId") String formId,
    @PathVariable(name = "versionId") String versionId,
    @RequestParam(name = "scene", defaultValue = "LIST") String scene
) {
    return R.success(service.getPreviewSchema(formId, versionId, scene));
}
```

- [ ] **Step 4: 增加版本归属、DRAFT/PUBLISHED 和问题分级测试**

测试 `designerService.getDesigner()` 的归属校验被复用；`DISABLED` 被拒绝；结构问题映射为 `FATAL`，字段完整性问题映射为 `WARNING`，fatal 只让对应 scene 的 `renderable=false`。

- [ ] **Step 5: 运行后端聚焦测试并提交**

```bash
mvn -q -pl shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service -am -Dtest=AppFormPreviewApplicationServiceTest test
git add shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-api/src/main/java/com/shengzhiyun/platform/basic/api/appform/rvo/AppFormPreviewSchemaRVO.java shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewApplicationService.java shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/infrastructure/primary/admin/AppFormPreviewAdminController.java shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/test/java/com/shengzhiyun/platform/basicservice/appform/AppFormPreviewApplicationServiceTest.java
git commit -m "feat: add app form draft schema preview"
```

---

### Task 2: 草稿字段真实选项只读接口

**Files:**

- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewOptionApplicationService.java`
- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewOptionSource.java`
- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/AppFormPreviewOptionSourceRegistry.java`
- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/DictAppFormPreviewOptionSource.java`
- Create: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/application/DimensionAppFormPreviewOptionSource.java`
- Modify: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/main/java/com/shengzhiyun/platform/basic/appform/infrastructure/primary/admin/AppFormPreviewAdminController.java`
- Modify: `shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service/src/test/java/com/shengzhiyun/platform/basicservice/appform/AppFormPreviewApplicationServiceTest.java`
- Create: `sql/basic-domain/2026-08-02-01-basic-domain-app-form-preview-api-permission-data-dml.sql`
- Modify: `changelog/basic-domain.md`

- [ ] **Step 1: 写失败测试，草稿字段从指定版本解析数据源**

```java
@Test
void shouldUseDraftFieldSourceForPreviewOptions() {
    PageRVO<AppFormOptionRVO> result = optionService.pageOptions(
        "FORM_1", "VERSION_5", "baseInfo", "departmentId", query);

    assertThat(result.getRecords()).extracting(AppFormOptionRVO::getValue)
        .containsExactly("DEPT_1");
    verify(readOnlySourceRegistry).query(sourceDefinition, query);
    verifyNoInteractions(runtimeRecordMapper);
}
```

- [ ] **Step 2: 运行测试并确认缺少服务失败**

```bash
mvn -q -pl shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service -am -Dtest=AppFormPreviewApplicationServiceTest test
```

- [ ] **Step 3: 实现只读分派**

服务先通过 `designerService.getDefinition(formId, versionId)` 找到数据域和字段，再读取字段 `dataSourceType/dataSourceCode/dataSourceId`。DICT 委托 `ConfigAdminApplicationService.listOptions()`；DIMENSION 委托 `SystemDimensionRuntimeApplicationService`；DEPARTMENT、PERSON、JOB_GRADE、POSITION、APP_FORM、CONFIG_TABLE、CUSTOM_RPC 只允许已有 Spring Bean 实现 `AppFormPreviewOptionSource` 并声明精确的 `sourceType + providerApiCode`。未知类型、禁用数据源、空 providerApiCode 或非查询适配器直接返回业务错误，不接受前端 URL。没有注册真实提供器时返回“数据源未接入只读选项服务”，绝不生成模拟选项。

```java
public interface AppFormPreviewOptionSource {
    boolean supports(String sourceType, String providerApiCode);
    PageRVO<AppFormOptionRVO> query(PreviewOptionQuery query);
}
```

```java
public PageRVO<AppFormOptionRVO> pageOptions(
    String formId,
    String versionId,
    String dataDomainCode,
    String fieldCode,
    AppFormOptionPageQVO qvo
) {
    AppFormDefinitionDetailRVO definition = designerService.getDefinition(formId, versionId);
    AppFormDefinitionDetailRVO.FieldRVO field = requireReferenceField(definition, dataDomainCode, fieldCode);
    return sourceRegistry.query(PreviewOptionQuery.of(definition, field, qvo));
}
```

- [ ] **Step 4: 暴露 preview-options POST 接口并登记权限**

```java
@PostMapping("/{formId}/versions/{versionId}/data-domains/{dataDomainCode}/fields/{fieldCode}/preview-options")
public R<PageRVO<AppFormOptionRVO>> pagePreviewOptions(
    @PathVariable(name = "formId") String formId,
    @PathVariable(name = "versionId") String versionId,
    @PathVariable(name = "dataDomainCode") String dataDomainCode,
    @PathVariable(name = "fieldCode") String fieldCode,
    @RequestBody AppFormOptionPageQVO qvo
) {
    return R.success(optionService.pageOptions(formId, versionId, dataDomainCode, fieldCode, qvo));
}
```

SQL 使用 `ON DUPLICATE KEY UPDATE` 登记 preview-schema GET 和 preview-options POST 两条 API 权限，归属应用表单设计页面。

- [ ] **Step 5: 运行测试与 `git diff --check` 后提交**

---

### Task 3: 前端预览 API 契约

**Files:**

- Modify: `apps/sc-cloud-platform/src/api/business-standard/form-manage/index.interface.ts`
- Modify: `apps/sc-cloud-platform/src/api/business-standard/form-manage/index.ts`
- Create: `apps/sc-cloud-platform/src/api/business-standard/form-manage/preview-api.test.ts`

- [ ] **Step 1: 写失败测试，校验 URL 编码和场景参数**

```typescript
test('草稿 Schema 地址绑定 formId、versionId 和 scene', async () => {
    await getFormPreviewSchema('FORM /1', 'V 5', 'DETAIL')
    expect(apiGet).toHaveBeenCalledWith(
        '/api/admin/basic/app-forms/FORM%20%2F1/versions/V%205/preview-schema',
        { params: { scene: 'DETAIL' } },
    )
})
```

- [ ] **Step 2: 运行 Vitest 确认导出缺失失败**

```bash
pnpm exec vitest run apps/sc-cloud-platform/src/api/business-standard/form-manage/preview-api.test.ts
```

- [ ] **Step 3: 增加 `AppFormPreviewSchema`、`AppFormPreviewIssue` 和 API 函数**

```typescript
export const getFormPreviewSchema = (
    formId: string,
    versionId: string,
    scene: AppFormPreviewScene,
) => api.get<AppFormPreviewSchema>(
    `${baseUrl}/${encode(formId)}/versions/${encode(versionId)}/preview-schema`,
    { params: { scene } },
)
```

选项 API 使用 preview-options 路径并提交 keyword、selectedValues、cascadeValues、pageNo、pageSize。

- [ ] **Step 4: 运行聚焦测试和平台类型检查**

```bash
pnpm exec vitest run apps/sc-cloud-platform/src/api/business-standard/form-manage/preview-api.test.ts
pnpm --filter sc-cloud-platform check-types
```

---

### Task 4: 模拟数据生成器和会话存储

**Files:**

- Create: `packages/react-components/app-form-page-template/general-template-1/preview-data-generator.ts`
- Create: `packages/react-components/app-form-page-template/general-template-1/preview-data-generator.test.ts`
- Create: `packages/react-components/app-form-page-template/general-template-1/preview-session-store.ts`
- Create: `packages/react-components/app-form-page-template/general-template-1/preview-session-store.test.ts`

- [ ] **Step 1: 写失败测试，覆盖 OBJECT/LIST、类型值和稳定 seed**

```typescript
test('按 Schema 生成 18 条包含对象域和列表域的会话记录', () => {
    const records = generatePreviewRecords(schema, { seed: 7, count: 18 })
    expect(records).toHaveLength(18)
    expect(records[0].dataDomains.baseInfo).toMatchObject({ applicantName: expect.any(String) })
    expect(Array.isArray(records[0].dataDomains.details)).toBe(true)
})
```

- [ ] **Step 2: 运行测试并确认实现缺失失败**

```bash
pnpm exec vitest run packages/react-components/app-form-page-template/general-template-1/preview-data-generator.test.ts packages/react-components/app-form-page-template/general-template-1/preview-session-store.test.ts
```

- [ ] **Step 3: 实现无 HTTP 依赖的确定性生成器**

生成器按 field.valueType/controlType 生成文本、数字、金额、日期、日期时间、日期范围和布尔值；引用字段保持空值，等待真实选项回填；文件类只生成 preview 占位元数据。

- [ ] **Step 4: 写失败测试，覆盖查询、分页、CRUD 和重置**

```typescript
test('编辑和删除只改变当前 Session', async () => {
    const store = new PreviewSessionStore(schema, { seed: 3 })
    const id = await store.save({ dataDomains: { baseInfo: { applicantName: '王五' } } })
    expect((await store.detail(id)).dataDomains.baseInfo).toMatchObject({ applicantName: '王五' })
    await store.delete(id)
    await expect(store.detail(id)).rejects.toThrow('模拟记录不存在')
})
```

- [ ] **Step 5: 实现 Store 并运行测试和共享包类型检查**

```bash
pnpm exec vitest run packages/react-components/app-form-page-template/general-template-1/preview-data-generator.test.ts packages/react-components/app-form-page-template/general-template-1/preview-session-store.test.ts
pnpm --filter @repo/react-components check-types
```

---

### Task 5: PreviewRuntimeClient 的强隔离边界

**Files:**

- Create: `packages/react-components/app-form-page-template/general-template-1/preview-runtime-client.ts`
- Create: `packages/react-components/app-form-page-template/general-template-1/preview-runtime-client.test.ts`
- Modify: `packages/react-components/app-form-page-template/general-template-1/runtime-client.ts`

- [ ] **Step 1: 写失败测试，Schema 即使携带正式 bindings 也不能触发正式 CRUD HTTP**

```typescript
test('预览 CRUD 永远委托会话存储', async () => {
    const client = createPreviewRuntimeClient({ formId: 'F1', versionId: 'V5', store, api })
    await client.delete(schemaWithProductionBindings, 'P1')
    expect(store.delete).toHaveBeenCalledWith('P1')
    expect(api.delete).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: 写失败测试，选项必须调用 preview-options**

断言字段数据域编码、字段编码、keyword 和 cascadeValues 被发送到管理端草稿选项接口；非引用字段返回空数组。

- [ ] **Step 3: 实现客户端**

`getSchemaByPermission/getSchema` 从预加载的 LIST/FORM/DETAIL Schema Map 返回；page/detail/save/delete 委托 Store；loadOptions 是唯一业务数据相关 HTTP，并且只能调用管理端 preview-options。

- [ ] **Step 4: 运行聚焦测试与类型检查**

---

### Task 6: 通用模板 Surface 和独立预览页

**Files:**

- Create: `packages/react-components/app-form-page-template/general-template-1/surface.tsx`
- Modify: `packages/react-components/app-form-page-template/general-template-1/index.tsx`
- Modify: `packages/react-components/app-form-page-template/general-template-1/record-drawer.tsx`
- Modify: `packages/react-components/app-form-page-template/index.ts`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/form-preview/index.tsx`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/form-preview/index.module.scss`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/form-preview/preview-page.test.tsx`
- Modify: `apps/sc-cloud-platform/src/router/index.tsx`

- [ ] **Step 1: 写 Surface 失败测试**

要求 Surface 接收 LIST Schema、runtimeClient 和可选的初始场景，不自行解析页面权限；新增、编辑、详情仍复用当前 Drawer 和 Editor Renderer。

- [ ] **Step 2: 从 `GeneralPageTemplate1` 提取纯展示 Surface**

正式 `GeneralPageTemplate1` 只负责按 permissionId 加载已发布 LIST Schema，然后把原有 actionRef、Drawer 和 runtimeClient 传给 Surface，保证正式页面行为不变。

- [ ] **Step 3: 写预览页失败测试**

覆盖缺少 formId/versionId、三场景 Schema 加载、revision 显示、刷新草稿重建 Store、重置模拟数据不重取 Schema、fatal 只阻止单场景。

- [ ] **Step 4: 实现独立页面和路由**

```tsx
{
    path: 'preview',
    element: (
        <Auth>
            {asyncComponent(() => import('@/pages/business-standard/form-manage/form-preview'))}
        </Auth>
    ),
}
```

- [ ] **Step 5: 运行组件测试、共享包和平台类型检查**

---

### Task 7: 版本级预览入口与未保存分流

**Files:**

- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/preview-entry.ts`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/preview-entry.test.ts`
- Modify: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/app-form-designer.tsx`
- Modify: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/app-form-data-domain-config.tsx`
- Modify: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/rule-settings/index.tsx`

- [ ] **Step 1: 写 URL 和决策纯函数失败测试**

```typescript
test('预览 URL 携带当前版本和来源步骤', () => {
    expect(buildFormPreviewUrl(context)).toContain('versionId=VERSION_5')
    expect(buildFormPreviewUrl(context)).toContain('source=designer')
    expect(buildFormPreviewUrl(context)).toContain('sourceStep=layout')
})
```

- [ ] **Step 2: 实现 `buildFormPreviewUrl` 和 `openSavedDraftPreview`**

统一使用 `window.open(url, '_blank', 'noopener,noreferrer')`。有 dirty 状态时调用 Ant Design confirm：`保存并预览`、`预览已保存草稿`、`取消`；保存失败不打开。

- [ ] **Step 3: 在两个截图对应头部增加“预览”**

表单设计和数据域配置均按 `版本选择 -> 刷新 -> 预览 -> 保存 -> 发布` 排列，始终绑定 `designer.versionId`；规则配置复用父级当前版本。

- [ ] **Step 4: 运行纯函数测试和平台类型检查**

---

### Task 8: 通用模板设计 Manifest 和设计快照投影

**Files:**

- Create: `packages/react-components/app-form-page-template/template-designer-manifest.ts`
- Create: `packages/react-components/app-form-page-template/template-designer-manifest.test.ts`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/designer-schema-projector.ts`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/designer-schema-projector.test.ts`

- [ ] **Step 1: 写 Manifest 失败测试**

断言 GENERAL_TEMPLATE_1 的 LIST 固定槽位是 LIST_SEARCH 和 LIST_TABLE；FORM/DETAIL 根是 FORM_ROOT；固定槽位不可删除；LIST_TABLE 只接受 FIELD；FORM_ROOT 接受 NORMAL/TABS/REGION。

- [ ] **Step 2: 实现数据化 Manifest**

```typescript
export interface TemplateDesignerManifest {
    templateCode: string
    version: string
    scenes: Record<AppFormScene, TemplateSceneManifest>
    properties: Record<string, TemplatePropertyDefinition[]>
}
```

属性只允许枚举、布尔、数字和受限字符串，不接受 CSS 文本或可执行函数。

- [ ] **Step 3: 写设计快照投影失败测试**

输入当前未保存的 designer.designTree/dataDomains/fields，输出 `AppFormRenderSchema`；节点顺序、gridSpan、controlType 和 LIST_SEARCH/LIST_TABLE 字段必须保持一致；不得生成 apiBindings。

- [ ] **Step 4: 实现 projector 并运行聚焦测试**

---

### Task 9: 所见即所得画布接入现有设计器

**Files:**

- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/index.tsx`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/resource-panel.tsx`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/property-panel.tsx`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/design-overlay.tsx`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/index.module.scss`
- Create: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/wysiwyg-designer.test.tsx`
- Modify: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/app-form-designer.tsx`
- Modify: `apps/sc-cloud-platform/src/pages/business-standard/form-manage/app-form-designer.module.scss`

- [ ] **Step 1: 写失败组件测试**

覆盖场景栏、设计/试运行、选择节点、固定槽位删除禁用、非法拖放拒绝、字段顺序更新、右侧属性过滤、未保存修改只进入设计投影、试运行使用已保存 Schema。

- [ ] **Step 2: 实现三栏画布**

左侧字段与结构树、中央真实 Surface、右侧 Manifest 属性面板。设计 Overlay 截获点击并映射 nodeId；试运行关闭 Overlay 并注入 PreviewRuntimeClient。

- [ ] **Step 3: 复用现有保存、revision 和冲突状态**

画布只通过 `onNodesChange/onFieldsChange/onSelectedNodeChange` 回调修改父级状态，不直接请求 API。撤销/重做保存最多 50 个纯快照；版本切换和保存成功清理历史。

- [ ] **Step 4: 替换步骤 1/2 的树式主画布，保留结构树作为辅助入口**

页面布局和字段配置合并到所见即所得设计工作区；规则配置仍保留现有步骤并共享当前版本。

- [ ] **Step 5: 运行组件测试、Node 契约测试和平台类型检查**

```bash
pnpm exec vitest run apps/sc-cloud-platform/src/pages/business-standard/form-manage/wysiwyg-designer/*.test.tsx
node --test apps/sc-cloud-platform/src/pages/business-standard/form-manage/app-form-designer-layout.test.mjs
pnpm --filter sc-cloud-platform check-types
```

---

### Task 10: 全量回归与交付

**Files:**

- Modify only focused changelog/test files if verification finds feature-specific gaps.

- [ ] **Step 1: 后端完整聚焦验证**

```bash
mvn -q -pl shengzhiyun-platform-basic-domain/shengzhiyun-platform-basic-service -am -Dtest=AppFormPreviewApplicationServiceTest,AppFormDesignerApplicationServiceTest test
```

- [ ] **Step 2: 前端完整聚焦验证**

```bash
pnpm exec vitest run packages/react-components/app-form-page-template packages/react-components/app-form-runtime apps/sc-cloud-platform/src/pages/business-standard/form-manage
pnpm --filter @repo/react-components check-types
pnpm --filter sc-cloud-platform check-types
node --test apps/sc-cloud-platform/src/pages/business-standard/form-manage/*.test.mjs
```

- [ ] **Step 3: 静态门禁**

```bash
git -C sc-cloud-core diff --check
git -C shengzhiyun-platform diff --check
```

- [ ] **Step 4: 对照规格逐项确认**

确认：版本入口正确、保存后预览、LIST/FORM/DETAIL、模拟 CRUD 隔离、真实选项、草稿规则、刷新 revision、固定模板槽位、设计/试运行同源渲染和正式运行时仍只接受 PUBLISHED。

- [ ] **Step 5: 交给用户手动验收**

不使用浏览器自动化。提供改动文件、验证命令、已知环境依赖和手工入口 URL；不代替用户执行界面验收。
