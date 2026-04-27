import { AlgeoError, type AlgeoEmbedMode, type EmbedInitOptions, type EmbedEventMessage, type SaveRequestMessage, type ReadyEvent } from './shared';
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
    protected constructor(container: HTMLElement, embedMode: AlgeoEmbedMode);
    get ready(): boolean;
    get version(): string | null;
    on<T extends EventName>(event: T, listener: ListenerMap[T]): () => void;
    protected getListeners<T extends EventName>(event: T): ListenerMap[T][];
    off<T extends EventName>(event: T, listener: ListenerMap[T]): void;
    protected emit<T extends EventName>(event: T, payload: EventMap[T]): void;
    protected handleEventMessage(_event: Extract<EventMap[EventName], EmbedEventMessage>): void;
    protected acceptsEventMessage(): boolean;
    protected handleRequestMessage(_message: SaveRequestMessage, _sourceWindow: Window): boolean;
    private cleanupMessageHandler;
    private cleanupIframe;
    private resetRuntimeState;
    protected init(options: EmbedInitOptions): Promise<void>;
    protected post<T>(type: string, payload: Record<string, unknown>): Promise<T>;
    destroy(): Promise<void>;
}
