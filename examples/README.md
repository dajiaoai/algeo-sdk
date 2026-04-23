# Algeo SDK 示例

本目录包含内嵌画板的不同用法示例。

## 运行方式

在 `packages/algeo-sdk` 目录下执行：

```bash
npx serve .
```

然后访问 http://localhost:3000/examples/ 或直接打开各 HTML 文件。

或仅启动 examples 目录：

```bash
npx serve examples
```

访问 http://localhost:3000/

## 推荐使用方式

- **直接 iframe**：在 iframe 的 `src` 中直接带分享 ID（如 `01-basic-iframe.html`）
- **演示模式**：使用 `createPresentation` 快速创建演示模式实例（如 `02-sdk-usage.html`）
- **编辑模式预接入**：使用 `createEditor` 提前联调未来的内嵌编辑页（如 `06-editor-mode.html`）

## 示例列表

| 文件                 | 模式     | 能力说明                                                        |
| -------------------- | -------- | --------------------------------------------------------------- |
| 01-basic-iframe.html | 演示模式 | 展示基础 iframe 嵌入方式，以及常见页面布局下的展示效果          |
| 02-sdk-usage.html    | 演示模式 | 展示如何用 `createPresentation` 快速创建可嵌入的演示实例        |
| 03-switch-slide.html | 演示模式 | 展示多画板演示内容的切换能力，适合课件式或分页式内容播放        |
| 04-load-file.html    | 演示模式 | 展示宿主加载 JSON 文件内容后，在 iframe 中直接进行演示          |
| 05-repl.html         | 演示模式 | 展示如何读取画板中的文本/结构信息，供 AI 理解、问答和内容解读   |
| 06-editor-mode.html  | 编辑模式 | 展示编辑器模式的基础接入方式，以及 UI 配置和嵌入参数控制能力    |
| 07-document-api.html | 编辑模式 | 展示宿主通过 DocumentApi 取回当前画板内容，读取最新的结构化数据 |
| 08-slides-api.html   | 编辑模式 | 展示宿主通过 SlidesApi 切换、新增、复制、删除与重排画板         |

## 全屏支持

所有示例中的 iframe 均添加了 `allow="fullscreen"`，以支持内嵌画板的全屏功能。SDK 方式创建的 iframe 由 SDK 自动设置该属性。

## 测试说明

- 将示例中的 `33TA3484` 替换为真实分享 ID 进行测试
- 依赖 `../dist/algeo-sdk.umd.js`，需先执行 `npm run build`
