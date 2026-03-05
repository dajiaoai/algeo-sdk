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
- **SDK 注册**：使用 `AlgeoSdk` 封装（如 `02-sdk-usage.html`）

## 示例列表

| 文件                 | 说明                                             |
| -------------------- | ------------------------------------------------ |
| 01-basic-iframe.html | 基础嵌入：100% 宽度、居中 max-width、vh、双列等高频布局 |
| 02-sdk-usage.html    | SDK 方式：使用 AlgeoSdk 封装                     |
| 03-switch-slide.html | 切换画板：switchSlide 多画板切换                  |
| 04-load-file.html    | loadFile：输入 JSON 文本或导入 .json 文件        |
| 05-repl.html         | REPL：执行 REPL 指令，获取面向 AI 的文档/文本内容 |

## 测试说明

- 将示例中的 `E8NHN7OP` 替换为真实分享 ID 进行测试
- 案例 02、03、04 依赖 `../dist/algeo-sdk.umd.js`，需先执行 `npm run build`
