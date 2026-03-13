/**
 * 大角几何内嵌画板 SDK
 * 绑定 DOM 容器，自动创建 iframe 并封装 postMessage 通信
 */
import { AlgeoError, type AlgeoErrorPayload, type FileContentV10, EMBED_ERROR_CODES } from '@dajiaoai/algeo-protocol';
/** SDK 版本号，构建时由 rollup 注入 */
export declare const VERSION = "__ALGEO_SDK_VERSION__";
/** 从协议层 re-export，供外部使用 */
export type { FileContentV10, AlgeoErrorPayload };
export { AlgeoError, EMBED_ERROR_CODES };
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
/**
 * 大角几何内嵌画板 SDK
 */
export declare class AlgeoSdk {
    private container;
    private iframe?;
    private pending;
    private messageHandler?;
    private _ready;
    private _version;
    /** 是否已就绪（收到 iframe ready 通知） */
    get ready(): boolean;
    /** 内嵌页协议版本 */
    get version(): string | null;
    constructor(container: HTMLElement);
    static create(container: HTMLElement, options?: AlgeoSdkOptions): Promise<AlgeoSdk>;
    init(options?: AlgeoSdkOptions): Promise<void>;
    private post;
    /**
     * 按分享 ID 加载内容
     */
    loadShareById(id: string): Promise<LoadShareByIdResult>;
    /**
     * 加载完整文件内容（覆盖式）
     */
    loadFile(content: FileContentV10): Promise<LoadFileResult>;
    /**
     * 切换到指定索引的画板
     */
    switchSlide(index: number): Promise<SwitchSlideResult>;
    /**
     * 查询画板数量
     */
    getSlideCount(): Promise<GetSlideCountResult>;
    /**
     * 执行 REPL 指令，返回面向 AI 的文档/文本内容
     * @param command REPL 可用的单个 command 指令，如 help、list、list_slides、eval 等
     */
    repl(command: string): Promise<ReplResult>;
    /**
     * 销毁实例，移除 iframe 与事件监听
     */
    destroy(): void;
}
