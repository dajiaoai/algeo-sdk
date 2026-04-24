import { AlgeoError, type AlgeoErrorPayload, type EmbedReadyMessage, type EmbedResponseMessage, type FileContentV10, EMBED_ERROR_CODES } from '@dajiaoai/algeo-protocol';
/** SDK 版本号，构建时由 rollup 注入 */
export declare const VERSION = "__ALGEO_SDK_VERSION__";
/** 从协议层 re-export，供外部使用 */
export type { FileContentV10, AlgeoErrorPayload };
export { AlgeoError, EMBED_ERROR_CODES };
export interface AlgeoSdkOptions {
    /** 内嵌页基础 URL，默认 https://dajiaoai.com */
    baseUrl?: string;
    /** 内嵌模式，默认 presentation */
    mode?: AlgeoEmbedMode;
    /** 初始加载的内容 ID，可选 */
    initialId?: string;
}
export type AlgeoEmbedMode = 'presentation' | 'editor';
export interface AlgeoEditorAuthOptions {
    appId: string;
}
export interface AlgeoEditorUiConfig {
    navbar?: boolean;
    slidePanel?: boolean;
    toolboxPanel?: boolean;
    algebraPanel?: boolean;
    docPanel?: boolean;
}
export type AlgeoEditorSaveResult = {
    status: 'success';
} | {
    status: 'error';
    message: string;
};
export interface AlgeoEditorCreateOptions {
    auth?: AlgeoEditorAuthOptions;
    shareId?: string;
    initialContent?: FileContentV10;
    ui?: AlgeoEditorUiConfig;
}
export interface AlgeoPresentationCreateOptions {
    shareId?: string;
}
export type AlgeoCreateOptions = {
    baseUrl?: string;
    mode: 'editor';
    editor: AlgeoEditorCreateOptions;
} | {
    baseUrl?: string;
    mode: 'presentation';
    presentation: AlgeoPresentationCreateOptions;
};
export interface ReadyEvent {
    type: 'ready';
    mode: AlgeoEmbedMode;
    version: string | null;
}
export interface ContentChangeEvent {
    type: 'contentChange';
    source: 'loadContent' | 'loadFile' | 'loadShareById' | 'initialContent' | 'user';
    content?: FileContentV10;
    shareId?: string;
}
export interface SlideChangeEvent {
    type: 'slideChange';
    index: number;
}
export interface SaveRequestEvent {
    type: 'save';
    content: FileContentV10;
    stage: 'request';
}
export interface SaveSuccessEvent {
    type: 'save';
    content: FileContentV10;
    stage: 'success';
}
export type SaveEvent = SaveRequestEvent | SaveSuccessEvent;
export interface SaveRequestMessage {
    type: 'save';
    requestId: string;
    content: FileContentV10;
}
export interface EmbeddedEditorEventMap {
    ready: ReadyEvent;
    contentChange: ContentChangeEvent;
    slideChange: SlideChangeEvent;
    save: SaveEvent;
}
export interface EmbeddedPresentationEventMap {
    ready: ReadyEvent;
}
export type EmbeddedEditorEventName = keyof EmbeddedEditorEventMap;
export type EmbeddedPresentationEventName = keyof EmbeddedPresentationEventMap;
export type EmbeddedEditorEventListenerMap = {
    ready: (event: ReadyEvent) => void;
    contentChange: (event: ContentChangeEvent) => void;
    slideChange: (event: SlideChangeEvent) => void;
    save: (event: SaveEvent) => void | AlgeoEditorSaveResult | Promise<void | AlgeoEditorSaveResult>;
};
export type EmbeddedPresentationEventListenerMap = {
    [K in EmbeddedPresentationEventName]: (event: EmbeddedPresentationEventMap[K]) => void;
};
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
export interface SlideIndexResult {
    index: number;
}
export interface GetContentResult {
    content: FileContentV10;
}
export interface GetHistoryStateResult {
    count: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
}
export interface DocumentApi {
    loadContent(content: FileContentV10): Promise<void>;
    getContent(): Promise<FileContentV10>;
}
export interface SlidesApi {
    getCount(): number;
    getCurrentIndex(): number;
    switchTo(index: number): Promise<void>;
    add(): Promise<SlideIndexResult>;
    addAt(index: number): Promise<SlideIndexResult>;
    remove(index: number): Promise<void>;
    duplicate(index: number, targetIndex?: number): Promise<SlideIndexResult>;
    reorder(fromIndex: number, toIndex: number): Promise<void>;
}
export interface HistoryApi {
    getCount(): number;
    getCurrentIndex(): number;
    undo(): Promise<void>;
    redo(): Promise<void>;
    jumpTo(index: number): Promise<void>;
    canUndo(): boolean;
    canRedo(): boolean;
    clear(): Promise<void>;
}
export interface ModeApi {
    getUiConfig(): AlgeoEditorUiConfig;
    setUiConfig(config: Partial<AlgeoEditorUiConfig>): Promise<void>;
}
export declare function generateRequestId(): string;
export declare function isResponseMessage(msg: unknown): msg is EmbedResponseMessage;
export declare function isReadyMessage(msg: unknown): msg is EmbedReadyMessage;
export type EmbedEventMessage = ContentChangeEvent | SlideChangeEvent | SaveSuccessEvent;
export declare function isSaveRequestMessage(msg: unknown): msg is SaveRequestMessage;
export declare function isEmbedEventMessage(msg: unknown): msg is EmbedEventMessage;
export declare function normalizeBaseUrl(baseUrl: string): string;
export declare function normalizeMode(mode?: AlgeoEmbedMode): AlgeoEmbedMode;
export declare function getEmbedPath(mode: AlgeoEmbedMode): string;
export interface EmbedInitOptions extends AlgeoSdkOptions {
    auth?: AlgeoEditorAuthOptions;
}
export declare function buildEmbedSrc(options: EmbedInitOptions): string;
export type KnownEventName = 'ready' | 'contentChange' | 'slideChange' | 'save';
export type TEventName<T extends string> = Extract<T, KnownEventName>;
