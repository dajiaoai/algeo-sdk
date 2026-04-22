# Algeo SDK

大角几何内嵌画板 SDK，支持在任意网页中嵌入几何画板，通过 postMessage 与内嵌页通信。

## 安装

### npm

```bash
# 安装最新版本
npm install @dajiaoai/algeo-sdk

# 安装指定版本（推荐生产环境锁定版本）
npm install @dajiaoai/algeo-sdk@2.0.0
```

在 `package.json` 中：

```json
{
  "dependencies": {
    "@dajiaoai/algeo-sdk": "2.0.0" // 精确版本，生产推荐
  }
}
```

或使用 semver 范围：

```json
{
  "dependencies": {
    "@dajiaoai/algeo-sdk": "^2.0.0" // 兼容 2.x 的更新
  }
}
```

### CDN

**unpkg**：

```html
<script src="https://unpkg.com/@dajiaoai/algeo-sdk@2.0.0/dist/algeo-sdk.umd.js"></script>
<script src="https://unpkg.com/@dajiaoai/algeo-sdk@latest/dist/algeo-sdk.umd.js"></script>
```

**jsDelivr**：

```html
<script src="https://cdn.jsdelivr.net/npm/@dajiaoai/algeo-sdk@2.0.0/dist/algeo-sdk.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@dajiaoai/algeo-sdk@latest/dist/algeo-sdk.umd.js"></script>
```

> 生产环境建议使用**具体版本号**，避免自动升级带来的兼容性风险。

## 使用方式

### 方式一：演示模式

```javascript
import { createPresentation } from '@dajiaoai/algeo-sdk';

const container = document.getElementById('algeo-container');
const presentation = await createPresentation(container, {
  shareId: '33TA3484',
});

presentation.on('ready', (event) => {
  console.log('演示模式已就绪', event.version);
});

presentation.loadShareById('33TA3484').then(() => console.log('加载成功'));
presentation
  .getSlideCount()
  .then(({ count }) => console.log('画板数量:', count));
presentation.switchSlide(1).then(() => console.log('切换画板'));

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
></iframe>
```

如需动态加载、切换画板等能力，请使用方式一（SDK）。详见 [API](#API)。

> **全屏支持**：建议在 iframe 上添加 `allow="fullscreen"`，以便内嵌画板使用全屏功能。SDK 方式创建的 iframe 已自动包含此属性。

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
  },
  onSave: async (context) => {
    const response = await fetch('/api/geometry-doc/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: context.content,
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
  },
});

editor.on('ready', (event) => {
  console.log('iframe 已完成初始化', event);
});
```

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

```javascript
create(container, {
  mode: 'editor',
  editor: options,
});
```

#### `createPresentation(container, options): Promise<EmbeddedPresentation>`

演示模式快捷入口。该函数负责真正创建并初始化 `EmbeddedPresentation`。

```javascript
create(container, {
  mode: 'presentation',
  presentation: options,
});
```

#### `create(container, options)`

异步创建并初始化具体实例。在 iframe 加载完成并收到 ready 消息后 resolve。

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

| 属性             | 类型                                             | 默认值 | 说明                                                   |
| ---------------- | ------------------------------------------------ | ------ | ------------------------------------------------------ |
| `auth`           | `{ appId: string }`                              | -      | 编辑模式鉴权参数，其中 `appId` 会参与默认路由生成      |
| `shareId`        | `string`                                         | `''`   | 编辑模式初始分享 ID，会映射到 `/embed/edit/:appId/:id` |
| `initialContent` | `FileContentV10`                                 | -      | 初始化后自动注入的文件内容                             |
| `ui`             | `Partial<AlgeoEditorUiConfig>`                   | -      | 编辑器 UI 开关配置                                     |
| `onSave`         | `(context) => SaveResult \| Promise<SaveResult>` | -      | 宿主接管保存流程，`context` 仅包含纯净文件内容         |

**AlgeoPresentationCreateOptions：**

| 属性      | 类型     | 默认值 | 说明                                   |
| --------- | -------- | ------ | -------------------------------------- |
| `shareId` | `string` | `''`   | 演示模式初始分享 ID，会映射到 `/e/:id` |

默认路径规则：

- `mode: 'presentation'` -> `/e`，若传 `presentation.shareId` 则生成 `/e/:id`
- `mode: 'editor'` -> `/embed/edit/:appId`，其中 `:appId` 来自 `editor.auth.appId`；若传 `editor.shareId` 则生成 `/embed/edit/:appId/:id`

**示例：**

```javascript
const presentation = await create(container, {
  mode: 'presentation',
  presentation: {
    shareId: '33TA3484',
  },
});
```

---

### 类 `EmbeddedPresentation`

演示模式实例，保留当前已上线的 iframe 能力。

#### 实例属性（只读）

| 属性      | 类型             | 说明                                 |
| --------- | ---------------- | ------------------------------------ |
| `ready`   | `boolean`        | 是否已就绪（收到 iframe ready 通知） |
| `version` | `string \| null` | 内嵌页协议版本                       |

#### 事件订阅

##### `presentation.on(event, listener): () => void`

当前稳定提供以下事件：

| 事件名    | 说明              |
| --------- | ----------------- |
| `ready`   | iframe 完成初始化 |
| `destroy` | 实例销毁时触发    |

`contentChange` 与 `slideChange` 不会在 SDK 主动调用 `loadFile`、`loadShareById`、`switchSlide` 等方法时由本地直接触发。这类事件应由 iframe 页面在用户操作后主动回传给宿主，当前版本尚未在该桥接层中提供该事件通道。

---

#### 实例方法

##### `presentation.loadShareById(id: string): Promise<LoadShareByIdResult>`

按分享 ID 加载内容。

| 参数 | 类型     | 说明                   |
| ---- | -------- | ---------------------- |
| `id` | `string` | 分享 ID，如 `33TA3484` |

**返回值：** `{ success: true }`

---

##### `presentation.loadFile(content: FileContent): Promise<LoadFileResult>`

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

#### `editor.document`

| 方法                   | 说明                             |
| ---------------------- | -------------------------------- |
| `loadContent(content)` | 加载完整画板文件内容             |
| `getContent()`         | 获取当前内存中的画板文件内容     |
| `save()`               | 调用宿主提供的 `onSave` 保存钩子 |

#### `editor.slides`

| 方法                             | 说明                 |
| -------------------------------- | -------------------- |
| `getCount()`                     | 获取当前已知画板数量 |
| `getCurrentIndex()`              | 获取当前已知画板索引 |
| `switchTo(index)`                | 切换画板             |
| `add()`                          | 在末尾新增画板       |
| `addAt(index)`                   | 在指定位置新增画板   |
| `remove(index)`                  | 删除指定画板         |
| `duplicate(index, targetIndex?)` | 复制画板             |
| `reorder(fromIndex, toIndex)`    | 重排画板             |

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

| 方法                  | 说明             |
| --------------------- | ---------------- |
| `getUiConfig()`       | 获取当前 UI 配置 |
| `setUiConfig(config)` | 更新 UI 配置     |

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

| 错误码             | 说明                        |
| ------------------ | --------------------------- |
| `IFRAME_NOT_READY` | iframe 未加载完成即调用方法 |
| `TIMEOUT`          | 请求超时（30 秒）           |
| `DESTROYED`        | SDK 已销毁                  |
| `MISSING_APP_ID`   | 编辑模式缺少 `auth.appId`   |
| `BAD_REQUEST`      | 非法请求（如重复 init）     |
