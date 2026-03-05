/**
 * 大角几何内嵌画板 SDK
 * 绑定 DOM 容器，自动创建 iframe 并封装 postMessage 通信
 */

const DEFAULT_EMBED_BASE = 'http://localhost:8080';

let requestIdCounter = 0;

function generateRequestId(): string {
  return `req-${Date.now()}-${++requestIdCounter}`;
}

/** loadFile 时传入的文件内容，需符合 FileContentV10 格式 */
export interface FileContent {
  slides: unknown[];
  messages: unknown[];
  metadata: { version: string; shareOptions?: unknown };
}

export interface AlgeoSdkOptions {
  /** 内嵌页基础 URL，默认 https://dajiaoai.com */
  baseUrl?: string;
  /** 初始加载的内容 ID，可选 */
  initialId?: string;
}

export interface LoadShareByIdResult {
  success: true;
}

export interface LoadFileResult {
  success: true;
}

export interface SwitchSlideResult {
  success: true;
}

export interface GetSlideCountResult {
  count: number;
}

export interface ReplResult {
  output: string;
}

export interface AlgeoErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class AlgeoSdkError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AlgeoSdkError';
  }
}

type ResponseMessage =
  | { type: 'response'; requestId: string; success: true; result?: unknown }
  | { type: 'response'; requestId: string; success: false; error: AlgeoErrorPayload };

type ReadyMessage = { type: 'ready'; version: string };

function isResponseMessage(msg: unknown): msg is ResponseMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as ResponseMessage).type === 'response' &&
    'requestId' in msg
  );
}

function isReadyMessage(msg: unknown): msg is ReadyMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as ReadyMessage).type === 'ready'
  );
}

/**
 * 大角几何内嵌画板 SDK
 */
export class AlgeoSdk {
  private container: HTMLElement;
  private iframe: HTMLIFrameElement;
  private baseUrl: string;
  private pending = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (err: AlgeoSdkError) => void;
    }
  >();
  private messageHandler: (e: MessageEvent) => void;
  private _ready = false;
  private _version: string | null = null;

  /** 是否已就绪（收到 iframe ready 通知） */
  get ready(): boolean {
    return this._ready;
  }

  /** 内嵌页协议版本 */
  get version(): string | null {
    return this._version;
  }

  constructor(container: HTMLElement, options: AlgeoSdkOptions = {}) {
    this.container = container;
    this.baseUrl = options.baseUrl ?? DEFAULT_EMBED_BASE;
    const initialId = options.initialId ?? '';
    const src = initialId
      ? `${this.baseUrl}/e/${encodeURIComponent(initialId)}`
      : `${this.baseUrl}/e`;

    this.iframe = document.createElement('iframe');
    this.iframe.id = 'algeo-embed';
    this.iframe.src = src;
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.container.appendChild(this.iframe);

    this.messageHandler = (e: MessageEvent) => {
      const { data } = e;
      if (isReadyMessage(data)) {
        this._ready = true;
        this._version = data.version;
        return;
      }
      if (isResponseMessage(data)) {
        const { requestId, success } = data;
        const pending = this.pending.get(requestId);
        if (pending) {
          this.pending.delete(requestId);
          if (success) {
            pending.resolve(data.result);
          } else {
            const err = data.error;
            pending.reject(
              new AlgeoSdkError(
                err.message,
                err.code,
                err.details,
              ),
            );
          }
        }
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  private post<T>(type: string, payload: Record<string, unknown>): Promise<T> {
    const requestId = generateRequestId();
    const msg = { type, requestId, ...payload };
    return new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      const target = this.iframe.contentWindow;
      if (!target) {
        this.pending.delete(requestId);
        reject(new AlgeoSdkError('iframe 未加载完成', 'IFRAME_NOT_READY'));
        return;
      }
      target.postMessage(msg, '*');
      // 超时兜底
      setTimeout(() => {
        if (this.pending.has(requestId)) {
          this.pending.delete(requestId);
          reject(new AlgeoSdkError('请求超时', 'TIMEOUT'));
        }
      }, 30000);
    });
  }

  /**
   * 按分享 ID 加载内容
   */
  loadShareById(id: string): Promise<LoadShareByIdResult> {
    return this.post<LoadShareByIdResult>('loadShareById', { id });
  }

  /**
   * 加载完整文件内容（覆盖式）
   */
  loadFile(content: FileContent): Promise<LoadFileResult> {
    return this.post<LoadFileResult>('loadFile', { content });
  }

  /**
   * 切换到指定索引的画板
   */
  switchSlide(index: number): Promise<SwitchSlideResult> {
    return this.post<SwitchSlideResult>('switchSlide', { index });
  }

  /**
   * 查询画板数量
   */
  getSlideCount(): Promise<GetSlideCountResult> {
    return this.post<GetSlideCountResult>('getSlideCount', {});
  }

  /**
   * 执行 REPL 指令，返回面向 AI 的文档/文本内容
   * @param command REPL 可用的单个 command 指令，如 help、list、list_slides、eval 等
   */
  repl(command: string): Promise<ReplResult> {
    return this.post<ReplResult>('repl', { command });
  }

  /**
   * 销毁实例，移除 iframe 与事件监听
   */
  destroy(): void {
    window.removeEventListener('message', this.messageHandler);
    this.pending.forEach(({ reject }) =>
      reject(new AlgeoSdkError('SDK 已销毁', 'DESTROYED')),
    );
    this.pending.clear();
    if (this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  }
}
