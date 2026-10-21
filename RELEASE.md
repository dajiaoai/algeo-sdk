# Algeo SDK 2.15.0 发布说明

- 发布包：`@dajiaoai/algeo-sdk@2.15.0`
- 整理日期：2026-10-21
- 对比基线：`2.14.0`（`8d07446`），包含此后 2.14.1、2.14.2 及本次新增能力。
- [完整代码对比](https://github.com/dajiaoai/algeo-sdk/compare/2.14.0...2.15.0)（发布 `2.15.0` 标签后可用）。

## 主要变更

### 画板信息与 3D 固定视图

- 新增 `editor.slides.getInfo(index?)`，返回 `{ index, exportIndex, cameraMode }`。`index` 从 0 开始，导出使用的 `exportIndex` 从 1 开始；省略索引时读取当前画板。
- 新增 `editor.slides.getViewCamera3d(index?)` 和 `setViewCamera3d(options)`，支持读取、局部更新及启用/关闭 3D 固定视图。
- 固定视图支持相机偏移、旋转、缩放、正交/透视/斜投影、视口尺寸和截取矩形。更新作为可撤销操作保存，SDK 随后刷新历史状态。
- 关闭固定视图保留已保存参数；读取时优先返回已启用的固定视图，否则返回画板相机已有参数；2D 画板读取返回 `null`，设置时报错。
- 新增对外类型 `SlideInfo`、`ViewCamera3d`、`SetViewCamera3dOptions`。

### 3D 图片导出

- `ExportViewCamera3D` 新增 `projection`、`obliqueAngle`、`obliqueScaleRatio`、`cropEnabled`、`crop`，支持在单次导出中覆盖投影和截取设置。
- `viewCamera3d` 导出支持空对象 `{}`。基础参数优先读取目标画板已启用的固定视图，否则读取画板相机，后者逻辑视口默认 `1024 × 1024` 且不截取。
- 3D 画板的 `contain` / `size` 导出使用固定视图或画板相机的视角和投影，以完整内容包围盒决定构图，不使用固定视图的截取范围。
- 扩展[图片导出示例](./examples/12-export-slide-image.html)，演示画板信息查询、3D 固定视图与导出配置。

### 编辑模式 REPL

- 新增 `editor.repl(command)`，返回 `{ output: string }`，支持指令执行与撤销、重做配合使用。
- 执行后自动同步画板数量、当前画板及历史状态，并清除内容缓存；异常携带状态时也会同步已完成操作的状态。
- 新增 [REPL 指令实验室](./examples/20-repl.html)，支持编辑/演示模式、几何构造、样式、动画和画板管理示例；统一示例的指令输出与错误反馈。

### 空白画板初始化

- 新增 `AlgeoEditorCreateOptions.initialMode: '2d' | '3d'`，默认创建 2D 空白画板。
- 明确初始化优先级：`initialContent` > `shareId` > 指定 `initialMode` 的空白画板。传入初始内容时不请求分享文件，已有文件保留自身画板模式。
- 示例配置允许将 `shareId` 显式清空，便于测试空白画板。

### 文件格式兼容（包含 2.14.1）

- `editor.document.loadContent()`、`presentation.loadFile()` 及编辑器的 `initialContent` 接受 `FileContentAny`。
- 加载前通过 `convertToLatest()` 将协议包支持的旧格式转换为最新格式，再发送到内嵌页并更新缓存。
- 对外导出 `FileContentAny`；`editor.document.getContent()` 仍返回 `FileContentLatest`。

### AI 协议构建产物（包含 2.14.2）

- 更新打包产物中的 OpenAI 请求结构校验，采用 `model_id`、`messages`、可选的 `extra_openai_params`，替代原先的 `model`、`input`、`previous_response_id` 等请求字段。
- 本次不调整依赖声明，`@dajiaoai/algeo-protocol` 仍为 `^1.5.2`。接入自定义 AI 服务时，应核对实际使用协议版本的请求结构。

## 升级与接入注意事项

发布到 npm 后，使用以下命令升级：

```bash
npm install @dajiaoai/algeo-sdk@2.15.0
```

```typescript
import { createEditor, VERSION } from '@dajiaoai/algeo-sdk';

const editor = await createEditor(document.getElementById('editor-root')!, {
  auth: { appId: 'YOUR_APP_ID' },
  initialMode: '3d',
});

console.log(VERSION); // 2.15.0
const info = await editor.slides.getInfo();
await editor.slides.setViewCamera3d({
  index: info.index,
  viewCamera3d: { yawDeg: 45, pitchDeg: 30, width: 1920, height: 1080 },
});
```

- 新增接口和导出行为依赖内嵌页实现；使用自托管 `baseUrl` 时，需同步支持这些能力的内嵌页。
- 固定视图接口的 `yawDeg`、`pitchDeg`、`obliqueAngleDeg` 使用**度**；单次导出相机覆盖项的 `yaw`、`pitch`、`obliqueAngle` 使用**弧度**，不能直接混用。
- 固定视图无保存值时默认尺寸为 `1920 × 1080`，与无固定视图的单次导出默认尺寸不同。
- REPL 调用不触发 `contentChange` / `slideChange`；如需最新内容，调用 `editor.document.getContent()`。执行失败时，已完成的修改不会自动回滚。
- SDK 画板管理接口索引从 0 开始，`exportImage` 的 `slideIndices` 从 1 开始，可使用 `getInfo()` 返回的 `exportIndex`。

## 发布步骤

以下命令均在 `algeo-sdk` 独立仓库内执行。

1. 确认 `package.json`、`package-lock.json` 的根版本及 `dist` 中注入的 `VERSION` 均为 `2.15.0`，工作区仅包含本次发布变更。
2. 安装依赖并执行发布检查：

   ```bash
   npm ci
   npm run typecheck
   npm run build
   npm pack --dry-run
   ```

3. 将版本、构建产物及发布说明一并提交并推送到 `main`。
4. 在具备 npm 发布权限的环境发布（该命令会再次构建并上传公开 npm 包）：

   ```bash
   npm run release
   ```

5. 发布成功后，按仓库既有命名约定创建并推送标签，再以本文件的主要变更与升级说明创建 GitHub Release：

   ```bash
   git tag -a 2.15.0 -m "Release 2.15.0"
   git push origin 2.15.0
   ```

6. 检查 npm 上的 `2.15.0` 包可安装、运行时 `VERSION` 正确，并在匹配的内嵌页上验证空白 3D 初始化、REPL 与撤销、画板信息查询及 3D 图片导出。

## 变更来源

| 提交 | 内容 |
| --- | --- |
| [`7190757`](https://github.com/dajiaoai/algeo-sdk/commit/7190757) | 2.14.1：旧文件格式自动转换及示例调整 |
| [`c2272fc`](https://github.com/dajiaoai/algeo-sdk/commit/c2272fc) | 编辑模式 REPL、分享 ID 处理及指令实验室 |
| [`64b11dd`](https://github.com/dajiaoai/algeo-sdk/commit/64b11dd) | REPL 示例指令反馈简化 |
| [`98ec46b`](https://github.com/dajiaoai/algeo-sdk/commit/98ec46b) | 空白画板模式与初始化优先级 |
| [`ab99f9f`](https://github.com/dajiaoai/algeo-sdk/commit/ab99f9f) | 2.14.2：OpenAI 请求结构的构建产物更新 |
| [`d9636bb`](https://github.com/dajiaoai/algeo-sdk/commit/d9636bb) | 画板信息、3D 固定视图、导出扩展及文档示例 |
