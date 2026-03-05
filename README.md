# Algeo SDK

大角几何内嵌画板 SDK，支持在任意网页中嵌入几何画板，通过 postMessage 与内嵌页通信。

## 安装

```bash
npm install @dajiaoai/algeo-sdk
```

或通过 CDN（部署至 api.dajiaoai.com 后）：

```html
<script src="https://api.dajiaoai.com/algeo-sdk.min.js"></script>
```

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
sdk.loadById('E8NHN7OP').then(() => console.log('加载成功'));
sdk.switchSlide(1).then(() => console.log('切换画板'));

// 销毁
// sdk.destroy();
```

### 方式二：轻量 iframe-only（无 SDK）

直接使用 iframe + postMessage，无需引入 SDK：

```html
<iframe id="algeo-embed" src="https://dajiaoai.com/e/E8NHN7OP"></iframe>
<script>
  const iframe = document.getElementById('algeo-embed');
  window.addEventListener('message', (e) => {
    if (e.data.type === 'ready') console.log('就绪', e.data.version);
    if (e.data.type === 'response') console.log('响应', e.data);
  });
  iframe.contentWindow.postMessage(
    { type: 'loadById', id: 'E8NHN7OP', requestId: 'req-1' },
    '*',
  );
</script>
```

详见 [postMessage 协议](#postmessage-协议)。

## API

### `new AlgeoSdk(container, options?)`

- `container`: 挂载的 DOM 元素
- `options.baseUrl`: 内嵌页基础 URL，默认 `https://dajiaoai.com`
- `options.initialId`: 初始加载的分享 ID，可选

### `sdk.loadById(id: string): Promise<LoadByIdResult>`

按分享 ID 加载内容。

### `sdk.loadFile(content: FileContent): Promise<LoadFileResult>`

加载完整文件数据（覆盖式）。

### `sdk.switchSlide(index: number): Promise<SwitchSlideResult>`

切换到指定索引的画板。

### `sdk.destroy(): void`

销毁实例，移除 iframe 与事件监听。

## postMessage 协议

| 方法          | 请求 payload                                                | 说明         |
| ------------- | ----------------------------------------------------------- | ------------ |
| `loadById`    | `{ type: 'loadById', id: string, requestId? }`              | 按 id 加载   |
| `loadFile`    | `{ type: 'loadFile', content: FileContentV10, requestId? }` | 加载文件数据 |
| `switchSlide` | `{ type: 'switchSlide', index: number, requestId? }`        | 切换画板     |

响应格式：

- 成功：`{ type: 'response', requestId, success: true, result? }`
- 失败：`{ type: 'response', requestId, success: false, error: { code, message, details? } }`

内嵌页就绪时向父页面发送：`{ type: 'ready', version }`
