import {
  AlgeoError,
  type AlgeoEmbedMode,
  buildEmbedSrc,
  EMBED_ERROR_CODES,
  type EmbedInitOptions,
  generateRequestId,
  type EmbedEventMessage,
  isEmbedEventMessage,
  isReadyMessage,
  isResponseMessage,
  isSaveRequestMessage,
  type SaveRequestMessage,
  type ReadyEvent,
  type TEventName,
} from './shared';

export abstract class EmbeddedTarget<
  EventMap extends {
    ready: ReadyEvent;
  },
  EventName extends keyof EventMap & string,
  ListenerMap extends Record<EventName, (event: any) => void>,
> {
  protected iframe?: HTMLIFrameElement;
  protected pending = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (err: AlgeoError) => void;
    }
  >();
  private listenerBuckets = new Map<EventName, Set<ListenerMap[EventName]>>();
  private messageHandler?: (e: MessageEvent) => void;
  private destroyed = false;
  protected _ready = false;
  protected _version: string | null = null;

  protected constructor(
    protected readonly container: HTMLElement,
    protected readonly embedMode: AlgeoEmbedMode,
  ) {}

  get ready(): boolean {
    return this._ready;
  }

  get version(): string | null {
    return this._version;
  }

  on<T extends EventName>(event: T, listener: ListenerMap[T]): () => void {
    let bucket = this.listenerBuckets.get(event) as
      | Set<ListenerMap[T]>
      | undefined;
    if (!bucket) {
      bucket = new Set<ListenerMap[T]>();
      this.listenerBuckets.set(event, bucket as Set<ListenerMap[EventName]>);
    }
    bucket.add(listener);
    return () => this.off(event, listener);
  }

  protected getListeners<T extends EventName>(event: T): ListenerMap[T][] {
    const bucket = this.listenerBuckets.get(event) as
      | Set<ListenerMap[T]>
      | undefined;
    return bucket ? Array.from(bucket) : [];
  }

  off<T extends EventName>(event: T, listener: ListenerMap[T]): void {
    const bucket = this.listenerBuckets.get(event) as
      | Set<ListenerMap[T]>
      | undefined;
    bucket?.delete(listener);
  }

  protected emit<T extends EventName>(event: T, payload: EventMap[T]): void {
    const bucket = this.listenerBuckets.get(event) as
      | Set<ListenerMap[T]>
      | undefined;
    bucket?.forEach((listener) => listener(payload));
  }

  protected handleEventMessage(
    _event: Extract<EventMap[EventName], EmbedEventMessage>,
  ): void {}

  protected acceptsEventMessage(): boolean {
    return true;
  }

  protected handleRequestMessage(
    _message: SaveRequestMessage,
    _sourceWindow: Window,
  ): boolean {
    return false;
  }

  protected async init(options: EmbedInitOptions): Promise<void> {
    if (this.iframe) {
      throw new AlgeoError(
        '请勿多次调用init方法。',
        EMBED_ERROR_CODES.BAD_REQUEST,
      );
    }

    return new Promise((resolve, reject) => {
      const src = buildEmbedSrc({
        ...options,
        mode: this.embedMode,
      });

      const iframe = (this.iframe = document.createElement('iframe'));
      iframe.id = 'algeo-embed';
      iframe.src = src;
      iframe.allow = 'fullscreen';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.addEventListener('error', reject);
      this.container.appendChild(iframe);

      this.messageHandler = (e: MessageEvent) => {
        if (e.source !== iframe.contentWindow) {
          return;
        }

        const { data } = e;
        if (isReadyMessage(data)) {
          this._ready = true;
          this._version = data.version;
          this.emit(
            'ready' as TEventName<EventName>,
            {
              type: 'ready',
              mode: this.embedMode,
              version: this._version,
            } as unknown as EventMap[TEventName<EventName>],
          );
          resolve();
          return;
        }

        if (isResponseMessage(data)) {
          const pending = this.pending.get(data.requestId);
          if (!pending) {
            return;
          }

          this.pending.delete(data.requestId);
          if (data.success) {
            pending.resolve(data.result);
            return;
          }

          const err = data.error;
          pending.reject(
            new AlgeoError(
              err?.message ?? '未知错误',
              err?.code ?? EMBED_ERROR_CODES.UNKNOWN_ERROR,
              err?.details,
            ),
          );
          return;
        }

        if (
          isSaveRequestMessage(data) &&
          this.handleRequestMessage(data, iframe.contentWindow as Window)
        ) {
          return;
        }

        if (this.acceptsEventMessage() && isEmbedEventMessage(data)) {
          this.handleEventMessage(
            data as Extract<EventMap[EventName], EmbedEventMessage>,
          );
          this.emit(
            data.type as TEventName<EventName>,
            data as unknown as EventMap[TEventName<EventName>],
          );
        }
      };

      window.addEventListener('message', this.messageHandler);
    });
  }

  protected post<T>(
    type: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const requestId = generateRequestId();
    const msg = { type, requestId, ...payload };

    return new Promise<T>((resolve, reject) => {
      if (this.destroyed) {
        reject(new AlgeoError('SDK 已销毁', EMBED_ERROR_CODES.DESTROYED));
        return;
      }

      if (!this._ready) {
        reject(
          new AlgeoError(
            'iframe 未加载完成',
            EMBED_ERROR_CODES.IFRAME_NOT_READY,
          ),
        );
        return;
      }

      const target = this.iframe?.contentWindow;
      if (!target) {
        reject(
          new AlgeoError(
            'iframe 未加载完成',
            EMBED_ERROR_CODES.IFRAME_NOT_READY,
          ),
        );
        return;
      }

      this.pending.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      target.postMessage(msg, '*');
      setTimeout(() => {
        if (this.pending.has(requestId)) {
          this.pending.delete(requestId);
          reject(new AlgeoError('请求超时', EMBED_ERROR_CODES.TIMEOUT));
        }
      }, 30000);
    });
  }

  async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = undefined;
    }

    this.pending.forEach(({ reject }) => {
      reject(new AlgeoError('SDK 已销毁', EMBED_ERROR_CODES.DESTROYED));
    });
    this.pending.clear();

    if (this.iframe?.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  }
}
