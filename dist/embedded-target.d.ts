import { AlgeoError, type AlgeoEmbedMode, type EmbedInitOptions, type ContentChangeEvent, type DestroyEvent, type ReadyEvent, type SlideChangeEvent } from './shared';
export declare abstract class EmbeddedTarget<EventMap extends {
    ready: ReadyEvent;
    contentChange: ContentChangeEvent;
    slideChange: SlideChangeEvent;
    destroy: DestroyEvent;
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
    off<T extends EventName>(event: T, listener: ListenerMap[T]): void;
    protected emit<T extends EventName>(event: T, payload: EventMap[T]): void;
    protected init(options: EmbedInitOptions): Promise<void>;
    protected post<T>(type: string, payload: Record<string, unknown>): Promise<T>;
    destroy(): Promise<void>;
}
