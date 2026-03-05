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

## 示例列表

| 文件                     | 说明                                         |
| ------------------------ | -------------------------------------------- |
| 01-basic-iframe.html     | 基础嵌入：iframe src 直接带分享 ID           |
| 02-empty-load-by-id.html | 空画板 + loadById：通过 postMessage 动态加载 |
| 03-switch-slide.html     | 切换画板：switchSlide 多画板切换             |
| 04-sdk-usage.html        | SDK 方式：使用 AlgeoSdk 封装                 |
| 05-side-by-side.html     | 并排对比：两个 iframe 展示不同内容           |

## 测试说明

- 将示例中的 `E8NHN7OP` 替换为真实分享 ID 进行测试
- 案例 04 依赖 `../dist/algeo-sdk.umd.js`，需先执行 `npm run build`
