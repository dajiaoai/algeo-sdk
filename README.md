# Algeo SDK

大角几何内嵌画板 SDK，支持在任意网页中嵌入几何画板，通过 postMessage 与内嵌页通信。

## 安装

### npm

```bash
# 安装最新版本
npm install @dajiaoai/algeo-sdk

# 安装指定版本（推荐生产环境锁定版本）
npm install @dajiaoai/algeo-sdk@1.2.1
```

在 `package.json` 中：

```json
{
  "dependencies": {
    "@dajiaoai/algeo-sdk": "1.2.1" // 精确版本，生产推荐
  }
}
```

或使用 semver 范围：

```json
{
  "dependencies": {
    "@dajiaoai/algeo-sdk": "^1.2.1" // 兼容 1.x 的更新
  }
}
```

### CDN

**unpkg**：

```html
<script src="https://unpkg.com/@dajiaoai/algeo-sdk@1.2.1/dist/algeo-sdk.umd.js"></script>
<script src="https://unpkg.com/@dajiaoai/algeo-sdk@latest/dist/algeo-sdk.umd.js"></script>
```

**jsDelivr**：

```html
<script src="https://cdn.jsdelivr.net/npm/@dajiaoai/algeo-sdk@1.2.1/dist/algeo-sdk.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@dajiaoai/algeo-sdk@latest/dist/algeo-sdk.umd.js"></script>
```

> 生产环境建议使用**具体版本号**，避免自动升级带来的兼容性风险。

## 使用方式

### 方式一：SDK（绑定 DOM）

```javascript
import { AlgeoSdk } from '@dajiaoai/algeo-sdk';

const container = document.getElementById('algeo-container');
const sdk = await AlgeoSdk.create(container, {
  baseUrl: 'https://dajiaoai.com',
  initialId: '33TA3484', // 可选，初始加载的分享 ID
});

// 等待就绪（可选）
window.addEventListener('message', (e) => {
  if (e.data?.type === 'ready') {
    console.log('内嵌页就绪', e.data.version);
  }
});

// 调用方法
sdk.loadShareById('33TA3484').then(() => console.log('加载成功'));
sdk.getSlideCount().then(({ count }) => console.log('画板数量:', count));
sdk.switchSlide(1).then(() => console.log('切换画板'));

// 销毁
// sdk.destroy();
```

### 方式二：直接 iframe（无 SDK）

直接在 iframe 的 `src` 中指定分享 ID，无需引入 SDK：

```html
<iframe
  id="algeo-embed"
  src="https://dajiaoai.com/e/33TA3484"
  allow="fullscreen"
></iframe>
```

如需动态加载、切换画板等能力，请使用方式一（SDK）。详见 [API](#API)。

> **全屏支持**：建议在 iframe 上添加 `allow="fullscreen"`，以便内嵌画板使用全屏功能。SDK 方式创建的 iframe 已自动包含此属性。

## API

### 常量

#### `VERSION`

SDK 版本号字符串，构建时注入，可用于运行时校验：

```javascript
import { VERSION } from '@dajiaoai/algeo-sdk';
console.log('Algeo SDK version:', VERSION);
```

---

### 类 `AlgeoSdk`

#### `AlgeoSdk.create(container, options?): Promise<AlgeoSdk>`

异步创建并初始化 SDK 实例。在 iframe 加载完成并收到 ready 消息后 resolve。

| 参数        | 类型              | 说明                    |
| ----------- | ----------------- | ----------------------- |
| `container` | `HTMLElement`     | 挂载 iframe 的 DOM 容器 |
| `options`   | `AlgeoSdkOptions` | 可选配置                |

**AlgeoSdkOptions：**

| 属性        | 类型     | 默认值                 | 说明                                  |
| ----------- | -------- | ---------------------- | ------------------------------------- |
| `baseUrl`   | `string` | `https://dajiaoai.com` | 内嵌页基础 URL                        |
| `initialId` | `string` | `''`                   | 初始加载的分享 ID，为空则加载空白画板 |

**示例：**

```javascript
const sdk = await AlgeoSdk.create(container, {
  baseUrl: 'https://dajiaoai.com',
  initialId: '33TA3484',
});
```

---

#### 实例属性（只读）

| 属性      | 类型             | 说明                                 |
| --------- | ---------------- | ------------------------------------ |
| `ready`   | `boolean`        | 是否已就绪（收到 iframe ready 通知） |
| `version` | `string \| null` | 内嵌页协议版本                       |

---

#### 实例方法

##### `sdk.loadShareById(id: string): Promise<LoadShareByIdResult>`

按分享 ID 加载内容。

| 参数 | 类型     | 说明                   |
| ---- | -------- | ---------------------- |
| `id` | `string` | 分享 ID，如 `33TA3484` |

**返回值：** `{ success: true }`

---

##### `sdk.loadFile(content: FileContent): Promise<LoadFileResult>`

加载完整文件数据（覆盖式），需符合 FileContentV10 格式。

| 参数      | 类型          | 说明         |
| --------- | ------------- | ------------ |
| `content` | `FileContent` | 文件内容对象 |

**FileContent 结构：**

```typescript
interface FileContent {
  slides: unknown[]; // 画板数据数组
  messages: unknown[]; // 消息数据
  metadata: {
    version: string; // 如 '10'
    shareOptions?: unknown;
  };
}
```

**返回值：** `{ success: true }`

---

##### `sdk.getSlideCount(): Promise<GetSlideCountResult>`

查询当前画板数量。

**返回值：** `{ count: number }`

---

##### `sdk.switchSlide(index: number): Promise<SwitchSlideResult>`

切换到指定索引的画板（索引从 0 开始）。

| 参数    | 类型     | 说明                   |
| ------- | -------- | ---------------------- |
| `index` | `number` | 画板索引，0 表示第一页 |

**返回值：** `{ success: true }`

---

##### `sdk.repl(command: string): Promise<ReplResult>`

执行 REPL 指令，返回面向 AI 的文档/文本内容。需先通过 `loadShareById` 或 `loadFile` 加载内容后，部分指令才有数据可查。

| 参数      | 类型     | 说明      |
| --------- | -------- | --------- |
| `command` | `string` | REPL 指令 |

**常用指令：**

| 指令          | 说明                          |
| ------------- | ----------------------------- |
| `help`        | 查看 REPL 帮助                |
| `list`        | 列出当前画板中的对象          |
| `list_slides` | 列出所有画板                  |
| `eval`        | 执行表达式（具体用法见 help） |

**返回值：** `{ output: string }` — 指令输出的文本内容

---

##### `sdk.destroy(): void`

销毁实例，移除 iframe 与事件监听，并拒绝所有未完成的 pending 请求。

---

### 错误处理

所有异步方法在失败时会 reject `AlgeoError`：

```javascript
try {
  await sdk.loadShareById('invalid');
} catch (e) {
  if (e.name === 'AlgeoError') {
    console.error(e.code, e.message, e.details);
  }
}
```

**常见错误码：**

| 错误码             | 说明                        |
| ------------------ | --------------------------- |
| `IFRAME_NOT_READY` | iframe 未加载完成即调用方法 |
| `TIMEOUT`          | 请求超时（30 秒）           |
| `DESTROYED`        | SDK 已销毁                  |
| `BAD_REQUEST`      | 非法请求（如重复 init）     |
