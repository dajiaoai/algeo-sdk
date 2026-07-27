# 更新日志

本文档记录 `@dajiaoai/algeo-sdk` 的版本更新。

## 2.10.0 - 2026-07-27

本版本汇总了自 `2.9.0` 以来的全部更新（包括此前发布的
`2.9.1`、`2.9.2` 及后续改动）。

### 重要变更

- 演示模式的应用标识由顶层 `appId` 调整为 `auth.appId`。
- 演示模式默认地址由 `/e/:shareId` 调整为
  `/embed/present/:appId/:shareId`。
- `editor.slides.exportImage()` 改为必传带 `mode` 的参数，并拆分为
  `size`、`view`、`contain` 三种导出模式。
- LaTeX/TikZ 导出从 `exportImage({ format: 'latex' })` 拆分为
  `editor.slides.exportLatex()`。

### 新增

- 新增 `editor.slides.exportLatex()`，支持导出完整 LaTeX 文档或 TikZ
  片段。
- 图片导出新增 `size`、`view`、`contain` 三种布局模式，支持 PNG、
  JPG 和 SVG。
- `view` 模式的 `viewBounds` 新增可选 `scale`，省略时使用画板文件的
  `camera.scale`。
- 演示模式 UI 配置新增 `slidePanel`、`pencilToolbar`、`zoomControl`，
  并为全部 UI 开关提供默认值。
- `EmbeddedEditor` 和 `EmbeddedPresentation` 新增 `resize()`，可主动
  通知内嵌页重新测量并重绘。
- SDK 通过 `ResizeObserver` 监听容器从隐藏恢复为可见，并自动触发一次
  重绘。
- 示例页支持导入画板文件。
- AI 对话草稿图片输入支持 URL 和 Base64。

### 调整与改进

- 完善 AI 对话草稿设置和演示模式配置。
- 更新图片导出示例，覆盖三种导出模式、LaTeX/TikZ 导出以及
  `viewBounds.scale`。
- 更新 README 中的安装、鉴权、路由、UI 配置、重绘和导出 API 文档。
- 新增“隐藏标签页恢复”示例，并更新示例导航。

### 迁移示例

演示模式鉴权：

```ts
const presentation = await createPresentation(container, {
  auth: { appId: 'YOUR_APP_ID' },
  shareId: 'YOUR_SHARE_ID',
});
```

图片与 LaTeX 导出：

```ts
const images = await editor.slides.exportImage({
  mode: 'view',
  viewBounds: { x: -5, y: -5, width: 10, height: 10, scale: 50 },
  pixelRatio: 2,
});

const latex = await editor.slides.exportLatex({
  standalone: true,
});
```
