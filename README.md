# Algeo SDK

大角几何内嵌画板 SDK，支持在任意网页中嵌入几何画板，通过 postMessage 与内嵌页通信。

## 安装

### npm

```bash
# 安装最新版本
npm install @dajiaoai/algeo-sdk

# 安装指定版本（推荐生产环境锁定版本）
npm install @dajiaoai/algeo-sdk@1.0.0
```

在 `package.json` 中：

```json
{
  "dependencies": {
    "@dajiaoai/algeo-sdk": "1.0.0" // 精确版本，生产推荐
  }
}
```

或使用 semver 范围：

```json
{
  "dependencies": {
    "@dajiaoai/algeo-sdk": "^1.0.0" // 兼容 1.x 的更新
  }
}
```

### CDN

**api.dajiaoai.com（推荐）**：

```html
<!-- 引用具体版本（推荐生产环境） -->
<script src="https://api.dajiaoai.com/js/algeo-sdk@1.0.0/algeo-sdk.umd.js"></script>

<!-- 引用最新版本 -->
<script src="https://api.dajiaoai.com/js/algeo-sdk@latest/algeo-sdk.umd.js"></script>
```

**unpkg**：

```html
<script src="https://unpkg.com/@dajiaoai/algeo-sdk@1.0.0/dist/algeo-sdk.umd.js"></script>
<script src="https://unpkg.com/@dajiaoai/algeo-sdk@latest/dist/algeo-sdk.umd.js"></script>
```

**jsDelivr**：

```html
<script src="https://cdn.jsdelivr.net/npm/@dajiaoai/algeo-sdk@1.0.0/dist/algeo-sdk.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@dajiaoai/algeo-sdk@latest/dist/algeo-sdk.umd.js"></script>
```

> 生产环境建议使用**具体版本号**，避免自动升级带来的兼容性风险。

## 使用方式

### 方式一：SDK（绑定 DOM）

```javascript
import { AlgeoSdk } from '@dajiaoai/algeo-sdk';

const container = document.getElementById('algeo-container');
const sdk = new AlgeoSdk(container, {
  baseUrl: 'https://dajiaoai.com',
  initialId: 'E8NHN7OP', // 可选，初始加载的分享 ID
});

// 等待就绪（可选）
window.addEventListener('message', (e) => {
  if (e.data?.type === 'ready') {
    console.log('内嵌页就绪', e.data.version);
  }
});

// 调用方法
sdk.loadShareById('E8NHN7OP').then(() => console.log('加载成功'));
sdk.getSlideCount().then(({ count }) => console.log('画板数量:', count));
sdk.switchSlide(1).then(() => console.log('切换画板'));

// 销毁
// sdk.destroy();
```

### 方式二：直接 iframe（无 SDK）

直接在 iframe 的 `src` 中指定分享 ID，无需引入 SDK：

```html
<iframe id="algeo-embed" src="https://dajiaoai.com/e/E8NHN7OP" allow="fullscreen"></iframe>
<script>
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'ready') console.log('就绪', e.data.version);
  });
</script>
```

如需动态加载、切换画板等能力，请使用方式一（SDK）。详见 [postMessage 协议](#postmessage-协议)。

> **全屏支持**：建议在 iframe 上添加 `allow="fullscreen"`，以便内嵌画板使用全屏功能。SDK 方式创建的 iframe 已自动包含此属性。

## API

### `VERSION`

SDK 版本号字符串，构建时注入，可用于运行时校验：

```javascript
import { VERSION } from '@dajiaoai/algeo-sdk';
console.log('Algeo SDK version:', VERSION);
```

### `new AlgeoSdk(container, options?)`

- `container`: 挂载的 DOM 元素
- `options.baseUrl`: 内嵌页基础 URL，默认 `https://dajiaoai.com`
- `options.initialId`: 初始加载的分享 ID，可选

### `sdk.loadShareById(id: string): Promise<LoadShareByIdResult>`

按分享 ID 加载内容。

### `sdk.loadFile(content: FileContent): Promise<LoadFileResult>`

加载完整文件数据（覆盖式）。

### `sdk.getSlideCount(): Promise<GetSlideCountResult>`

查询当前画板数量。返回 `{ count: number }`。

### `sdk.switchSlide(index: number): Promise<SwitchSlideResult>`

切换到指定索引的画板。

### `sdk.repl(command: string): Promise<ReplResult>`

执行 REPL 指令，返回面向 AI 的文档/文本内容。`command` 为 REPL 可用的单个指令，如 `help`、`list`、`list_slides`、`eval` 等。返回 `{ output: string }`。

### `sdk.destroy(): void`

销毁实例，移除 iframe 与事件监听。

## postMessage 协议

| 方法            | 请求 payload                                                | 说明                                    |
| --------------- | ----------------------------------------------------------- | --------------------------------------- |
| `loadShareById` | `{ type: 'loadShareById', id: string, requestId? }`         | 按分享 ID 加载                          |
| `loadFile`      | `{ type: 'loadFile', content: FileContentV10, requestId? }` | 加载文件数据                            |
| `getSlideCount` | `{ type: 'getSlideCount', requestId? }`                     | 查询画板数量                            |
| `switchSlide`   | `{ type: 'switchSlide', index: number, requestId? }`        | 切换画板                                |
| `repl`          | `{ type: 'repl', command: string, requestId? }`             | 执行 REPL 指令，返回面向 AI 的文档/文本 |

响应格式：

- 成功：`{ type: 'response', requestId, success: true, result? }`
- 失败：`{ type: 'response', requestId, success: false, error: { code, message, details? } }`

内嵌页就绪时向父页面发送：`{ type: 'ready', version }`
