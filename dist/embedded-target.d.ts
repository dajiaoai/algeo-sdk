import { AlgeoError, type AlgeoEmbedMode, type EmbedInitOptions, type EmbedRequestMessage, type EmbedEventMessage, type ReadyEvent } from './shared';
export declare abstract class EmbeddedTarget<EventMap extends {
    ready: ReadyEvent;
}, EventName extends keyof EventMap & string, ListenerMap extends Record<EventName, (event: any) => void>> {
    protected readonly container: HTMLElement;
    protected readonly embedMode: AlgeoEmbedMode;
    protected iframe?: HTMLIFrameElement;
    protected pending: Map<string, {
        resolve: (value: unknown) => void;
        reject: (err: AlgeoError) => void;
    }>;
    private listenerBuckets;
    private messageHandler?;
    private destroyed;
    protected _ready: boolean;
    protected _version: string | null;
    private resizeObserver?;
    private lastContainerSize;
    protected constructor(container: HTMLElement, embedMode: AlgeoEmbedMode);
    get ready(): boolean;
    get version(): string | null;
    /**
     * 主动通知内嵌页重新测量尺寸并重绘画布。
     */
    resize(): void;
    on<T extends EventName>(event: T, listener: ListenerMap[T]): () => void;
    protected getListeners<T extends EventName>(event: T): ListenerMap[T][];
    off<T extends EventName>(event: T, listener: ListenerMap[T]): void;
    protected emit<T extends EventName>(event: T, payload: EventMap[T]): void;
    protected handleEventMessage(_event: Extract<EventMap[EventName], EmbedEventMessage>): void;
    protected acceptsEventMessage(): boolean;
    protected handleRequestMessage(_message: EmbedRequestMessage, _sourceWindow: Window): boolean;
    private cleanupMessageHandler;
    private cleanupIframe;
    private resetRuntimeState;
    protected init(options: EmbedInitOptions): Promise<void>;
    protected post<T>(type: string, payload: Record<string, unknown>, options?: {
        timeoutMs?: number;
    }): Promise<T>;
    protected postEvent(type: string, payload?: Record<string, unknown>): void;
    /**
     * 让内嵌页重新测量尺寸并重绘画布：向 iframe 发送 `resize` 事件。
     * 真正的重绘逻辑由内嵌页（bridge）监听该消息后执行。
     */
    private setupResizeObserver;
    private cleanupResizeObserver;
    destroy(): Promise<void>;
}
