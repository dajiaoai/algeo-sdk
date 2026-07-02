# Algeo SDK

大角几何内嵌画板 SDK，支持在任意网页中嵌入几何画板，通过 postMessage 与内嵌页通信。

## 安装

### npm

```bash
# 安装最新版本
npm install @dajiaoai/algeo-sdk

# 安装指定主次版本
 npm install @dajiaoai/algeo-sdk@2.7.0
```

在 `package.json` 中：

```json
{
  "dependencies": {
    "@dajiaoai/algeo-sdk": "~2.7.0"
  }
}
```

或使用 semver 范围：

```json
{
  "dependencies": {
    "@dajiaoai/algeo-sdk": "^2.7.0" // 兼容 2.x 的更新（升级范围更大）
  }
}
```

### CDN

**unpkg**：

```html
<script src="https://unpkg.com/@dajiaoai/algeo-sdk@2.7.0/dist/algeo-sdk.umd.min.js"></script>
<script src="https://unpkg.com/@dajiaoai/algeo-sdk@latest/dist/algeo-sdk.umd.min.js"></script>
```

**jsDelivr**：

```html
<script src="https://cdn.jsdelivr.net/npm/@dajiaoai/algeo-sdk@2.7.0/dist/algeo-sdk.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@dajiaoai/algeo-sdk@latest/dist/algeo-sdk.umd.min.js"></script>
```

> 生产环境建议锁定到 **2.7.x**（如 `~2.7.0`），在兼容边界内自动接收修复版本。

## 使用方式

### 方式一：演示模式

```javascript
import { createPresentation } from '@dajiaoai/algeo-sdk';

const container = document.getElementById('algeo-container');
const presentation = await createPresentation(container, {
  appId: 'YTVJDQZR',
  shareId: '33TA3484',
  ui: {
    logo: false,
  },
});

presentation.on('ready', (event) => {
  console.log('演示模式已就绪', event.version);
});

presentation.loadShareById('33TA3484').then(() => console.log('加载成功'));
presentation
  .getSlideCount()
  .then(({ count }) => console.log('画板数量:', count));
presentation.switchSlide(1).then(() => console.log('切换画板'));
presentation.mode
  .setMasterTemplate(masterTemplateContent)
  .then(() => console.log('母版风格已更新'));

// 销毁
// presentation.destroy();
```

### 方式二：直接 iframe（无 SDK）

直接在 iframe 的 `src` 中指定分享 ID，无需引入 SDK：

```html
<iframe
  id="algeo-embed"
  src="https://dajiaoai.com/e/33TA3484"
  allow="fullscreen"
  referrerpolicy="origin"
></iframe>
```

如需动态加载、切换画板等能力，请使用方式一（SDK）。详见 [API](#API)。

> **全屏支持**：建议在 iframe 上添加 `allow="fullscreen"`，以便内嵌画板使用全屏功能。SDK 方式创建的 iframe 已自动包含此属性。

> **Referrer 透传**：SDK 方式创建的 iframe 会自动设置 `referrerpolicy="origin"`，便于内嵌页稳定获取宿主域名信息；若使用直接 iframe 方式，建议手动补上该属性。

### 方式三：编辑模式

```javascript
import { createEditor } from '@dajiaoai/algeo-sdk';

const editor = await createEditor(document.getElementById('editor-root'), {
  auth: {
    appId: 'xxxx',
  },
  initialContent,
  ui: {
    navbar: true,
    slidePanel: true,
    toolboxPanel: true,
    algebraPanel: false,
    docPanel: false,
    helpEntry: false,
    aiChatPanel: true,
  },
});

editor.on('ready', (event) => {
  console.log('iframe 已完成初始化', event);
});

editor.on('contentChange', (event) => {
  console.log('用户编辑后返回完整内容', event.content);
});

editor.on('slideChange', (event) => {
  console.log('用户切换后的最新画板索引', event.index);
});

await editor.mode.setMasterTemplate(masterTemplateContent);

editor.on('save', async (event) => {
  if (event.stage === 'request') {
    const response = await fetch('/api/geometry-doc/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: event.content,
      }),
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: '保存失败',
      };
    }

    return {
      status: 'success',
    };
  }

  console.log('用户点击保存按钮且宿主返回成功后的完整内容', event.content);
});

editor.on('aiRequest', async ({ payload, signal }) => {
  // 接入方自行进行后端鉴权
  const response = await fetch('/api/xxxx', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI 请求失败：${response.status}`);
  }

  await editor.ai.consumeStream({
    stream: response.body,
    signal,
  });
});

editor.on('aiCancel', ({ runId, reason }) => {
  console.log('用户取消 AI 生成', runId, reason);
});

await editor.ai.setDraft({
  text: '请根据这张图生成一道几何题',
  images: ['https://example.com/figure.png'],
  openPanel: true,
  focus: true,
});

await editor.ai.clearDraft();
```

编辑器内嵌页点击保存按钮时，会触发 `editor.on('save', listener)` 的请求阶段监听器。只有宿主返回 `{ status: 'success' }` 后，iframe 才会展示成功态，并向外触发 `save` 的成功阶段事件。

开启 `ui.aiChatPanel` 后，iframe 内的 AI 对话请求会通过 `editor.on('aiRequest', listener)` 交给宿主处理。宿主完成登录、权限、额度等业务校验后，将后端返回的大角几何标准 SSE 流传给 `editor.ai.consumeStream()` 即可。

如需通过统一入口分发模式，也可以使用 `create`：

```javascript
import { create } from '@dajiaoai/algeo-sdk';

const editor = await create(document.getElementById('editor-root'), {
  mode: 'editor',
  editor: {
    auth: { appId: 'xxxx' },
    initialContent,
  },
});
```

## API

### 常量

#### `VERSION`

SDK 版本号字符串，构建时注入，可用于运行时校验：

```javascript
import { VERSION } from '@dajiaoai/algeo-sdk';
console.log('Algeo SDK version:', VERSION);
```

---

### 入口函数

#### `create(container, options): Promise<EmbeddedEditor | EmbeddedPresentation>`

统一入口，按 `mode` 分发到具体实例：

- `mode: 'editor'` -> `EmbeddedEditor`
- `mode: 'presentation'` -> `EmbeddedPresentation`

#### `createEditor(container, options): Promise<EmbeddedEditor>`

编辑模式快捷入口。该函数负责真正创建并初始化 `EmbeddedEditor`。

该快捷入口不暴露 `baseUrl` 配置。如需自定义宿主地址，请使用统一入口 `create(container, { mode: 'editor', baseUrl, editor: options })`。

```javascript
create(container, {
  mode: 'editor',
  baseUrl: 'https://your-host.example',
  editor: options,
});
```

#### `createPresentation(container, options): Promise<EmbeddedPresentation>`

演示模式快捷入口。该函数负责真正创建并初始化 `EmbeddedPresentation`。

创建成功后，SDK 会额外调用 `https://open.dajiaoai.com/console/api/whitelist/check`，使用 `options.appId` 与当前页面 `hostname` 做白名单校验。若未命中白名单，iframe 仍会完成初始化并呈现页面，`createPresentation` 仍会成功返回实例，但后续 `loadShareById`、`loadFile`、`switchSlide`、`getSlideCount`、`repl` 等演示模式 API 会被拒绝，并在控制台输出包含方法名的错误，便于接入方感知并处理。

```javascript
create(container, {
  mode: 'presentation',
  baseUrl: 'https://your-host.example',
  presentation: options,
});
```

#### `create(container, options)`

异步创建并初始化具体实例。在 iframe 加载完成并收到 ready 消息后 resolve；若 30 秒内未收到 ready，则会以 `TIMEOUT` 错误 reject。

| 参数        | 类型                 | 说明                    |
| ----------- | -------------------- | ----------------------- |
| `container` | `HTMLElement`        | 挂载 iframe 的 DOM 容器 |
| `options`   | `AlgeoCreateOptions` | 创建配置                |

**AlgeoCreateOptions：**

```typescript
type AlgeoCreateOptions =
  | {
      baseUrl?: string;
      mode: 'editor';
      editor: AlgeoEditorCreateOptions;
    }
  | {
      baseUrl?: string;
      mode: 'presentation';
      presentation: AlgeoPresentationCreateOptions;
    };
```

**AlgeoEditorCreateOptions：**

| 属性             | 类型                           | 默认值 | 说明                                                   |
| ---------------- | ------------------------------ | ------ | ------------------------------------------------------ |
| `auth`           | `{ appId: string }`            | -      | 编辑模式鉴权参数，其中 `appId` 会参与默认路由生成      |
| `shareId`        | `string`                       | `''`   | 编辑模式初始分享 ID，会映射到 `/embed/edit/:appId/:id` |
| `initialContent` | `FileContentLatest`            | -      | 初始化后自动注入的文件内容                             |
| `ui`             | `Partial<AlgeoEditorUiConfig>` | -      | 编辑器 UI 开关配置                                     |

**AlgeoEditorUiConfig：**

| 属性           | 类型      | 默认值  | 说明                 |
| -------------- | --------- | ------- | -------------------- |
| `navbar`       | `boolean` | -       | 是否展示顶部导航栏   |
| `slidePanel`   | `boolean` | -       | 是否展示画板列表     |
| `toolboxPanel` | `boolean` | -       | 是否展示工具栏       |
| `algebraPanel` | `boolean` | -       | 是否展示代数面板     |
| `docPanel`     | `boolean` | -       | 是否展示文档面板     |
| `helpEntry`    | `boolean` | -       | 是否展示帮助入口     |
| `aiChatPanel`  | `boolean` | `false` | 是否展示 AI 对话面板 |

**AlgeoPresentationCreateOptions：**

| 属性      | 类型                                 | 默认值 | 说明                                                     |
| --------- | ------------------------------------ | ------ | -------------------------------------------------------- |
| `appId`   | `string`                             | `''`   | 演示模式白名单校验使用的应用标识，SDK 会用它请求校验接口 |
| `shareId` | `string`                             | `''`   | 演示模式初始分享 ID，会映射到 `/e/:id`                   |
| `ui`      | `Partial<AlgeoPresentationUiConfig>` | -      | 演示模式 UI 配置                                         |

默认路径规则：

- `mode: 'presentation'` -> `/e`，若传 `presentation.shareId` 则生成 `/e/:id`
- `mode: 'editor'` -> `/embed/edit/:appId`，其中 `:appId` 来自 `editor.auth.appId`；若传 `editor.shareId` 则生成 `/embed/edit/:appId/:id`

**示例：**

```javascript
const presentation = await create(container, {
  mode: 'presentation',
  presentation: {
    appId: 'xxxx',
    shareId: '33TA3484',
  },
});
```

---

### 类 `EmbeddedPresentation`

演示模式实例，保留当前已上线的 iframe 能力。

#### 实例属性（只读）

| 属性      | 类型                  | 说明                                 |
| --------- | --------------------- | ------------------------------------ |
| `ready`   | `boolean`             | 是否已就绪（收到 iframe ready 通知） |
| `version` | `string \| null`      | 内嵌页协议版本                       |
| `mode`    | `PresentationModeApi` | 演示模式展示控制能力                 |

#### 事件订阅

##### `presentation.on(event, listener): () => void`

当前稳定提供以下事件：

| 事件名  | 说明              |
| ------- | ----------------- |
| `ready` | iframe 完成初始化 |

---

#### 实例方法

##### `presentation.mode`

| 方法                          | 说明             |
| ----------------------------- | ---------------- |
| `getUiConfig()`               | 获取当前 UI 配置 |
| `setUiConfig(config)`         | 更新 UI 配置     |
| `setMasterTemplate(template)` | 设置母版风格     |

##### `presentation.loadShareById(id: string): Promise<LoadShareByIdResult>`

按分享 ID 加载内容。

| 参数 | 类型     | 说明                   |
| ---- | -------- | ---------------------- |
| `id` | `string` | 分享 ID，如 `33TA3484` |

**返回值：** `{ success: true }`

---

##### `presentation.loadFile(content: FileContent): Promise<LoadFileResult>`

加载完整文件数据（覆盖式），需符合 FileContentLatest 格式。

| 参数      | 类型          | 说明         |
| --------- | ------------- | ------------ |
| `content` | `FileContent` | 文件内容对象 |

**FileContent 结构：**

```typescript
interface FileContent {
  slides: unknown[]; // 画板数据数组
  messages: unknown[]; // 消息数据（最新版本为会话数组）
  metadata: {
    version: string; // 如 '11'
    shareOptions?: unknown;
  };
}
```

**返回值：** `{ success: true }`

---

##### `presentation.getSlideCount(): Promise<GetSlideCountResult>`

查询当前画板数量。

**返回值：** `{ count: number }`

---

##### `presentation.switchSlide(index: number): Promise<SwitchSlideResult>`

切换到指定索引的画板（索引从 0 开始）。

| 参数    | 类型     | 说明                   |
| ------- | -------- | ---------------------- |
| `index` | `number` | 画板索引，0 表示第一页 |

**返回值：** `{ success: true }`

---

##### `presentation.repl(command: string): Promise<ReplResult>`

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

### 类 `EmbeddedEditor`

编辑模式实例不再暴露一组扁平方法，而是拆成 capability units。

#### 实例属性（只读）

| 属性       | 类型          | 说明                                 |
| ---------- | ------------- | ------------------------------------ |
| `ready`    | `boolean`     | 是否已就绪（收到 iframe ready 通知） |
| `version`  | `string`      | 内嵌页协议版本                       |
| `document` | `DocumentApi` | 画板文件相关能力                     |
| `slides`   | `SlidesApi`   | 多画板管理能力                       |
| `history`  | `HistoryApi`  | 历史记录能力                         |
| `mode`     | `ModeApi`     | 编辑器展示模式控制                   |
| `ai`       | `AiApi`       | AI 对话流式响应透传能力              |

#### `editor.document`

| 方法                   | 说明                             |
| ---------------------- | -------------------------------- |
| `loadContent(content)` | 加载完整画板文件内容             |
| `getContent()`         | 异步获取 iframe 当前实时画板内容 |

#### `editor.slides`

| 方法                             | 说明                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getCount()`                     | 获取当前已知画板数量                                                                                                                                                                                                                                 |
| `getCurrentIndex()`              | 获取当前已知画板索引                                                                                                                                                                                                                                 |
| `switchTo(index)`                | 切换画板                                                                                                                                                                                                                                             |
| `add()`                          | 在末尾新增画板                                                                                                                                                                                                                                       |
| `addAt(index)`                   | 在指定位置新增画板                                                                                                                                                                                                                                   |
| `remove(index)`                  | 删除指定画板                                                                                                                                                                                                                                         |
| `duplicate(index, targetIndex?)` | 复制画板                                                                                                                                                                                                                                             |
| `reorder(fromIndex, toIndex)`    | 重排画板                                                                                                                                                                                                                                             |
| `exportImage(options?)`          | 导出画板为图片或可编辑排版内容，返回 `ExportedSlideImage[]`，每项含 `index`、`blob`、`format`、`width`、`height`。可选参数 `slideIndices`（1-based，不传则导出全部）、`format`（`'png'`/`'jpg'`/`'svg'`/`'latex'`）、`width`、`height`、`quality`（0~1，仅 jpg）、`autoFit`、`padding` |

#### `editor.history`

| 方法                | 说明                 |
| ------------------- | -------------------- |
| `getCount()`        | 获取当前已知历史步数 |
| `getCurrentIndex()` | 获取当前已知历史游标 |
| `undo()`            | 撤销                 |
| `redo()`            | 重做                 |
| `jumpTo(index)`     | 跳转到指定历史位置   |
| `canUndo()`         | 判断是否可撤销       |
| `canRedo()`         | 判断是否可重做       |
| `clear()`           | 清空历史             |

#### `editor.mode`

| 方法                          | 说明             |
| ----------------------------- | ---------------- |
| `getUiConfig()`               | 获取当前 UI 配置 |
| `setUiConfig(config)`         | 更新 UI 配置     |
| `setMasterTemplate(template)` | 设置母版风格     |

#### `editor.ai`

| 方法                | 说明                                                                |
| ------------------- | ------------------------------------------------------------------- |
| `setDraft()`        | 设置 AI 对话框草稿，支持 `text`、`images`、`openPanel`、`focus`     |
| `clearDraft()`      | 清空 AI 对话框草稿文本与图片                                        |
| `consumeStream()`   | 消费接入方后端返回的大角几何标准 SSE 流，并实时转发给 iframe        |
| `pushStreamEvent()` | 高级接口；接入方已自行解析 SSE 或使用非标准传输时，手动推送流式事件 |

#### 编辑器事件

`editor.on(event, listener)` 当前支持以下事件：

| 事件名          | 事件数据                                                   | 说明                                                                              |
| --------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ready`         | `{ type: 'ready', mode, version }`                         | iframe 初始化完成                                                                 |
| `contentChange` | `{ type: 'contentChange', source, content }`               | 用户、AI 或 SDK 加载内容后回传完整 `FileContentLatest`                            |
| `slideChange`   | `{ type: 'slideChange', index }`                           | 用户在 iframe 内切换画板后回传当前索引                                            |
| `save`          | `{ type: 'save', stage: 'request' \| 'success', content }` | `stage: 'request'` 时用于宿主处理保存，`stage: 'success'` 时表示保存成功后的通知  |
| `aiRequest`     | `{ type: 'aiRequest', payload, signal }`                   | iframe 发起 AI 请求，宿主应调用自有后端并将响应流交给 `editor.ai.consumeStream()` |
| `aiCancel`      | `{ type: 'aiCancel', runId, reason }`                      | 用户停止生成、新请求替代旧请求或 editor 销毁时触发                                |

#### 事件与销毁

- `editor.on(event, listener)` / `editor.off(event, listener)`
- `editor.destroy(): Promise<void>`

##### `presentation.destroy(): Promise<void>`

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

| 错误码             | 说明                                              |
| ------------------ | ------------------------------------------------- |
| `IFRAME_NOT_READY` | iframe 未加载完成即调用方法                       |
| `TIMEOUT`          | 请求或初始化超时（30 秒）                         |
| `DESTROYED`        | SDK 已销毁                                        |
| `MISSING_APP_ID`   | 编辑模式缺少 `auth.appId`                         |
| `BAD_REQUEST`      | 非法请求（如重复 init、演示模式白名单校验未通过） |
