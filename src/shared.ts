import {
  AlgeoError,
  type AlgeoErrorPayload,
  type EmbedReadyMessage,
  type EmbedResponseMessage,
  type FileContentV10,
  EMBED_ERROR_CODES,
} from '@dajiaoai/algeo-protocol';

/** SDK 版本号，构建时由 rollup 注入 */
export const VERSION = '__ALGEO_SDK_VERSION__';

/** 从协议层 re-export，供外部使用 */
export type { FileContentV10, AlgeoErrorPayload };
export { AlgeoError, EMBED_ERROR_CODES };

const DEFAULT_EMBED_BASE = 'https://dajiaoai.com';
const DEFAULT_PRESENTATION_PATH = '/e';
const DEFAULT_EDITOR_PATH = '/embed/edit';

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

export interface AlgeoEditorSaveContext {
  content: FileContentV10;
}

export type AlgeoEditorSaveResult =
  | {
      status: 'success';
    }
  | {
      status: 'error';
      message: string;
    };

export interface AlgeoEditorCreateOptions {
  auth?: AlgeoEditorAuthOptions;
  shareId?: string;
  initialContent?: FileContentV10;
  ui?: AlgeoEditorUiConfig;
  onSave?: (
    context: AlgeoEditorSaveContext,
  ) => Promise<AlgeoEditorSaveResult> | AlgeoEditorSaveResult;
}

export interface AlgeoPresentationCreateOptions {
  shareId?: string;
}

export type AlgeoCreateOptions =
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

export interface ReadyEvent {
  type: 'ready';
  mode: AlgeoEmbedMode;
  version: string | null;
}

export interface ContentChangeEvent {
  type: 'contentChange';
  source: 'loadContent' | 'loadFile' | 'loadShareById' | 'initialContent';
  content?: FileContentV10;
  shareId?: string;
}

export interface SlideChangeEvent {
  type: 'slideChange';
  index: number;
}

export interface DestroyEvent {
  type: 'destroy';
}

export interface EmbeddedEditorEventMap {
  ready: ReadyEvent;
  contentChange: ContentChangeEvent;
  slideChange: SlideChangeEvent;
  destroy: DestroyEvent;
}

export interface EmbeddedPresentationEventMap {
  ready: ReadyEvent;
  contentChange: ContentChangeEvent;
  slideChange: SlideChangeEvent;
  destroy: DestroyEvent;
}

export type EmbeddedEditorEventName = keyof EmbeddedEditorEventMap;
export type EmbeddedPresentationEventName = keyof EmbeddedPresentationEventMap;

export type EmbeddedEditorEventListenerMap = {
  [K in EmbeddedEditorEventName]: (event: EmbeddedEditorEventMap[K]) => void;
};

export type EmbeddedPresentationEventListenerMap = {
  [K in EmbeddedPresentationEventName]: (
    event: EmbeddedPresentationEventMap[K],
  ) => void;
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

let requestIdCounter = 0;

export function generateRequestId(): string {
  return `req-${Date.now()}-${++requestIdCounter}`;
}

export function isResponseMessage(msg: unknown): msg is EmbedResponseMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as EmbedResponseMessage).type === 'response' &&
    'requestId' in msg
  );
}

export function isReadyMessage(msg: unknown): msg is EmbedReadyMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as EmbedReadyMessage).type === 'ready'
  );
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function normalizeMode(mode?: AlgeoEmbedMode): AlgeoEmbedMode {
  return mode === 'editor' ? 'editor' : 'presentation';
}

export function getEmbedPath(mode: AlgeoEmbedMode): string {
  return mode === 'editor' ? DEFAULT_EDITOR_PATH : DEFAULT_PRESENTATION_PATH;
}

export interface EmbedInitOptions extends AlgeoSdkOptions {
  auth?: AlgeoEditorAuthOptions;
}

export function buildEmbedSrc(options: EmbedInitOptions): string {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_EMBED_BASE);
  const mode = normalizeMode(options.mode);
  const path = getEmbedPath(mode);
  const authAppId = options.auth?.appId?.trim() ?? '';
  const initialId = options.initialId?.trim();

  if (mode === 'editor') {
    if (!initialId) {
      return `${baseUrl}${path}/${encodeURIComponent(authAppId)}`;
    }

    return `${baseUrl}${path}/${encodeURIComponent(authAppId)}/${encodeURIComponent(initialId)}`;
  }

  if (!initialId) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}${path}/${encodeURIComponent(initialId)}`;
}

export type KnownEventName =
  | 'ready'
  | 'destroy'
  | 'contentChange'
  | 'slideChange';

export type TEventName<T extends string> = Extract<T, KnownEventName>;
