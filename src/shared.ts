import {
  AlgeoError,
  type AlgeoErrorPayload,
  type AiRunPayloadV1,
  type AiStreamEventV1,
  type EmbedReadyMessage,
  type EmbedResponseMessage,
  type FileContentLatest,
  EMBED_ERROR_CODES,
} from '@dajiaoai/algeo-protocol';

/** SDK 版本号，构建时由 rollup 注入 */
export const VERSION = '__ALGEO_SDK_VERSION__';

/** 从协议层 re-export，供外部使用 */
export type { FileContentLatest, AlgeoErrorPayload };
export type {
  AiRawSseEventV1,
  AiResponseRecordV1,
  AiRunPayloadV1,
  AiStreamEventV1,
  GeometryOpV1,
  OpenAiChatMessageV1,
} from '@dajiaoai/algeo-protocol';
export { AlgeoError, EMBED_ERROR_CODES };

const DEFAULT_EMBED_BASE = 'https://dajiaoai.com';
const DEFAULT_PRESENTATION_PATH = '/embed/present';
const DEFAULT_EDITOR_PATH = '/embed/edit';

export const EMBED_TIMEOUT_MS = 30000;

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
  helpEntry?: boolean;
  aiChatPanel?: boolean;
}

export interface AlgeoPresentationUiConfig {
  logo?: boolean;
  slidePanel?: boolean;
  pencilToolbar?: boolean;
  zoomControl?: boolean;
}

export type AlgeoFontFormat = 'woff2' | 'woff' | 'truetype' | 'opentype';

export type AlgeoFontSource =
  | {
      type: 'url';
      url: string;
      format?: AlgeoFontFormat;
    }
  | {
      type: 'base64';
      /** 支持纯 base64 字符串或完整的 data URL。 */
      data: string;
      mimeType?: string;
      format?: AlgeoFontFormat;
    };

export interface AlgeoFontResource {
  /** 字体标识，同时作为 FontFace family、CSS font-family 和文档字体标识。 */
  key: string;
  source: AlgeoFontSource;
}

export interface AlgeoFontOption {
  /** 对应自定义字体资源的 key，或系统 font-family。 */
  key: string;
  /** 字体选择器中的展示名称。 */
  name: string;
  /** 默认 custom；system 类型不要求存在对应字体资源。 */
  type?: 'custom' | 'system';
}

export interface AlgeoFontConfig {
  /** 需要在内嵌页面中加载并注册的字体文件。 */
  resources?: AlgeoFontResource[];
  /** 编辑器字体选择器中展示的字体及顺序。 */
  catalog?: AlgeoFontOption[];
  /** 新建文本使用的默认字体 key。 */
  defaultFont?: string;
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
  initialContent?: FileContentLatest;
  ui?: AlgeoEditorUiConfig;
  /** 字体资源、字体选择器列表及默认字体配置。 */
  fonts?: AlgeoFontConfig;
  /** 接入方提供的只读图片资源库。 */
  resourceLibrary?: ResourceLibraryProvider;
}

export interface ResourceLibraryQuery {
  /** 页码，从 1 开始。 */
  page: number;
  /** 每页数量，最大 100。 */
  pageSize: number;
  keyword?: string;
  mediaTypes?: string[];
}

export interface ResourceLibraryQueryContext {
  signal: AbortSignal;
}

export interface ResourceLibraryProvider {
  query(
    params: ResourceLibraryQuery,
    context: ResourceLibraryQueryContext,
  ): Promise<ResourceLibraryResult>;
}

export interface ResourceLibraryItem {
  id: string;
  name: string;
  mediaType: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface ResourceLibraryPageInfo {
  page: number;
  pageSize: number;
  hasNext: boolean;
  total?: number;
}

export interface ResourceLibraryResult {
  items: ResourceLibraryItem[];
  pageInfo: ResourceLibraryPageInfo;
}

export interface AlgeoPresentationCreateOptions {
  auth?: AlgeoEditorAuthOptions;
  shareId?: string;
  ui?: AlgeoPresentationUiConfig;
  /** 字体资源及默认字体配置。 */
  fonts?: AlgeoFontConfig;
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
  source:
    | 'loadContent'
    | 'loadFile'
    | 'loadShareById'
    | 'initialContent'
    | 'ai'
    | 'user';
  content?: FileContentLatest;
  shareId?: string;
}

export interface SlideChangeEvent {
  type: 'slideChange';
  index: number;
}

export interface SaveRequestEvent {
  type: 'save';
  content: FileContentLatest;
  stage: 'request';
}

export interface SaveSuccessEvent {
  type: 'save';
  content: FileContentLatest;
  stage: 'success';
}

export type SaveEvent = SaveRequestEvent | SaveSuccessEvent;

export interface SaveRequestMessage {
  type: 'save';
  requestId: string;
  content: FileContentLatest;
}

export interface AiApi {
  setDraft(draft: AiDraftPayloadV1): Promise<void>;
  clearDraft(): Promise<void>;
  consumeStream(input: {
    stream: ReadableStream<Uint8Array>;
    signal?: AbortSignal;
  }): Promise<void>;
  pushStreamEvent(event: AiStreamEventV1): void;
}

export interface AiDraftPayloadV1 {
  text?: string;
  images?: string[];
  openPanel?: boolean;
  focus?: boolean;
}

export interface AiRequestEvent {
  type: 'aiRequest';
  payload: AiRunPayloadV1;
  signal: AbortSignal;
}

export interface AiCancelEvent {
  type: 'aiCancel';
  runId: string | null;
  reason: 'user' | 'superseded' | 'destroyed';
}

export interface AiRequestMessage {
  type: 'aiRequest';
  requestId: string;
  payload: AiRunPayloadV1;
}

export interface ResourceLibraryQueryMessage {
  type: 'resourceLibraryQuery';
  requestId: string;
  params: ResourceLibraryQuery;
}

export interface ResourceLibraryCancelMessage {
  type: 'resourceLibraryCancel';
  requestId: string;
}

export interface EmbeddedEditorEventMap {
  ready: ReadyEvent;
  contentChange: ContentChangeEvent;
  slideChange: SlideChangeEvent;
  save: SaveEvent;
  aiRequest: AiRequestEvent;
  aiCancel: AiCancelEvent;
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
  save: (
    event: SaveEvent,
  ) => void | AlgeoEditorSaveResult | Promise<void | AlgeoEditorSaveResult>;
  aiRequest: (event: AiRequestEvent) => void | Promise<void>;
  aiCancel: (event: AiCancelEvent) => void;
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

export interface SetMasterTemplateResult {
  success: true;
}

export interface SwitchSlideResult {
  success: true;
}

export interface GetSlideCountResult {
  count: number;
}

export interface GetCurrentViewBoundsResult {
  /** 与 ExportImageViewMode.viewBound 格式一致，可直接传给 exportImage。 */
  viewBounds: ExportViewBound | null;
}

export interface ReplResult {
  output: string;
}

export interface SlideIndexResult {
  index: number;
}

export type ExportImageFormat = 'png' | 'jpg' | 'svg';

/**
 * 导出的逻辑视野区域（世界坐标）。
 */
/**
 * 旧版 2D 导出视野（世界坐标）。使用时会调用兼容的 exportSlideImage 实现。
 * @deprecated 请改用 ExportViewBound（left/top/right/bottom）。
 */
export interface ExportViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number;
}

/**
 * 2D 导出视野的四条世界坐标边界。
 */
export interface ExportViewBound {
  left: number;
  top: number;
  right: number;
  bottom: number;
  /**
   * 相机缩放比例（每世界坐标单位对应的像素数）。
   * 省略时使用目标画板文件中的 camera.scale。
   */
  scale?: number;
}

/**
 * 3D 画板的导出相机覆盖项。未提供的字段沿用画板当前 camera3d。
 */
export interface ExportViewCamera3D {
  offset?: [number, number, number];
  pitch?: number;
  yaw?: number;
  scale?: number;
  /** 3D 导出的逻辑输出宽度（px），默认 1024。 */
  width?: number;
  /** 3D 导出的逻辑输出高度（px），默认 1024。 */
  height?: number;
}

/** 导出留白，单位为输出像素 px。 */
export type ExportPadding = number | { horizontal?: number; vertical?: number };

interface ExportImageBaseOptions {
  slideIndices?: number[];
  format?: ExportImageFormat;
  /** 仅 jpg 生效，0~1 */
  quality?: number;
}

/**
 * 场景一（size）：
 * 从目标输出宽高扣除每侧 minPadding 后，根据图形可视包围盒自动计算 pixelRatio，
 * 使图形完整 contain 在可用区域并居中；最终画布严格等于指定输出宽高。
 */
export interface ExportImageSizeMode extends ExportImageBaseOptions {
  mode: 'size';
  width: number;
  height: number;
  /** 每侧最小留白，单位为输出像素 px。 */
  minPadding?: ExportPadding;
}

/**
 * 场景二（view）：viewBound 的四条边界均为世界坐标。
 * scale 省略时从文件的 camera.scale 读取。
 * 输出像素 = (right - left, bottom - top) x viewBound.scale x pixelRatio。
 */
export interface ExportImageViewMode extends ExportImageBaseOptions {
  mode: 'view';
  /** 2D 画板的世界坐标视野；使用新宿主导出实现。 */
  viewBound?: ExportViewBound;
  /**
   * 2D 画板的旧版世界坐标视野；使用兼容的旧宿主导出实现。
   * @deprecated 请改用 viewBound。
   */
  viewBounds?: ExportViewBounds;
  /** 3D 画板的相机视野。 */
  viewCamera3d?: ExportViewCamera3D;
  pixelRatio?: number;
}

/**
 * 场景三（contain）：
 * 内容按文件 camera 的 scale 1:1 渲染，最终画布 = 包围盒世界尺寸 x scale x pixelRatio + 两侧 padding。
 * padding 为最终输出的绝对像素，可分别指定水平与垂直方向。
 */
export interface ExportImageContainMode extends ExportImageBaseOptions {
  mode: 'contain';
  pixelRatio?: number;
  /** 每侧绝对留白，单位为最终输出像素 px */
  padding?: ExportPadding;
}

export type ExportImageOptions =
  | ExportImageSizeMode
  | ExportImageViewMode
  | ExportImageContainMode;

/**
 * 旧的扁平导出参数。
 * @deprecated 请改用 ExportImageOptions 的三种 mode；format:'latex' 请改用 exportLatex。
 */
export interface ExportSlideImageOptions {
  slideIndices?: number[];
  format?: ExportImageFormat | 'latex';
  width?: number;
  height?: number;
  quality?: number;
  autoFit?: boolean;
  padding?: number;
}

export interface ExportedSlideImage {
  index: number;
  blob: Blob;
  format: ExportImageFormat;
  width: number;
  height: number;
}

export interface ExportSlideImageResult {
  images: ExportedSlideImage[];
}

export interface ExportLatexOptions {
  slideIndices?: number[];
  /** 是否生成可独立编译的 standalone 文档，默认 true */
  standalone?: boolean;
}

export interface ExportedLatex {
  index: number;
  code: string;
  /** TikZ 通过 path 引用的图片资源；调用方应保持相对目录结构落盘。 */
  assets: Array<{ path: string; blob: Blob; mediaType: string }>;
  /** 可直接下载的导出文件；包含图片时为 ZIP，否则为 TeX。 */
  blob: Blob;
  fileName: string;
  format: 'tex' | 'zip';
}

export interface ExportLatexResult {
  items: ExportedLatex[];
}

export interface GetContentResult {
  content: FileContentLatest;
}

export interface GetHistoryStateResult {
  count: number;
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

export interface DocumentApi {
  loadContent(content: FileContentLatest): Promise<void>;
  getContent(): Promise<FileContentLatest>;
}

export interface SlidesApi {
  getCount(): number;
  getCurrentIndex(): number;
  getCurrentViewBounds(): Promise<ExportViewBound | null>;
  switchTo(index: number): Promise<void>;
  add(): Promise<SlideIndexResult>;
  addAt(index: number): Promise<SlideIndexResult>;
  remove(index: number): Promise<void>;
  duplicate(index: number, targetIndex?: number): Promise<SlideIndexResult>;
  reorder(fromIndex: number, toIndex: number): Promise<void>;
  /**
  /**
   * 导出画板图片。支持三种 mode：
   * - size：目标输出宽高、minPadding 与图形包围盒
   *   自动计算 pixelRatio，使图形完整 contain 在可用区域。
   * - view：指定视野 viewBound 与 pixelRatio
   * - contain：由 pixelRatio 与绝对 px padding 自动计算最终宽高。
   *
   * 旧的扁平 ExportSlideImageOptions 已废弃，实现层不再接受；请改用上述三模式 ExportImageOptions。
   * format:'latex' 请改用 exportLatex。
   */
  exportImage(options: ExportImageOptions): Promise<ExportedSlideImage[]>;

  /** 导出画板为 LaTeX/TikZ 源码 */
  exportLatex(options?: ExportLatexOptions): Promise<ExportedLatex[]>;
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
  setMasterTemplate(template: string): Promise<SetMasterTemplateResult>;
}

export interface PresentationModeApi {
  getUiConfig(): AlgeoPresentationUiConfig;
  setUiConfig(config: Partial<AlgeoPresentationUiConfig>): Promise<void>;
  setMasterTemplate(template: string): Promise<SetMasterTemplateResult>;
}

let requestIdCounter = 0;

export function generateRequestId(): string {
  return `req-${Date.now()}-${++requestIdCounter}`;
}

export function validateFontConfig(config: AlgeoFontConfig): void {
  const resourceKeys = new Set<string>();

  for (const resource of config.resources ?? []) {
    const key = resource.key.trim();
    if (!key) {
      throw new AlgeoError(
        'fonts.resources[].key 不能为空。',
        EMBED_ERROR_CODES.BAD_REQUEST,
      );
    }
    resourceKeys.add(key);
  }

  const catalogKeys = new Set<string>();
  for (const option of config.catalog ?? []) {
    const key = option.key.trim();
    if (!key || !option.name.trim()) {
      throw new AlgeoError(
        'fonts.catalog[] 的 key 和 name 不能为空。',
        EMBED_ERROR_CODES.BAD_REQUEST,
      );
    }
    if ((option.type ?? 'custom') === 'custom' && !resourceKeys.has(key)) {
      throw new AlgeoError(
        `自定义字体 ${key} 未提供对应的字体资源。`,
        EMBED_ERROR_CODES.BAD_REQUEST,
      );
    }
    catalogKeys.add(key);
  }

  const defaultFont = config.defaultFont?.trim();
  if (defaultFont && config.catalog && !catalogKeys.has(defaultFont)) {
    throw new AlgeoError(
      `默认字体 ${defaultFont} 不在 fonts.catalog 中。`,
      EMBED_ERROR_CODES.BAD_REQUEST,
    );
  }
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

export type EmbedEventMessage =
  | ContentChangeEvent
  | SlideChangeEvent
  | SaveSuccessEvent
  | AiCancelEvent;

export type EmbedRequestMessage =
  | SaveRequestMessage
  | AiRequestMessage
  | ResourceLibraryQueryMessage
  | ResourceLibraryCancelMessage;

export function isSaveRequestMessage(msg: unknown): msg is SaveRequestMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as { type?: unknown }).type === 'save' &&
    typeof (msg as { requestId?: unknown }).requestId === 'string' &&
    typeof (msg as { content?: unknown }).content === 'object'
  );
}

export function isAiRequestMessage(msg: unknown): msg is AiRequestMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as { type?: unknown }).type === 'aiRequest' &&
    typeof (msg as { requestId?: unknown }).requestId === 'string' &&
    typeof (msg as { payload?: unknown }).payload === 'object' &&
    (msg as { payload?: unknown }).payload !== null
  );
}

export function isResourceLibraryRequestMessage(
  msg: unknown,
): msg is ResourceLibraryQueryMessage | ResourceLibraryCancelMessage {
  if (typeof msg !== 'object' || msg === null) {
    return false;
  }

  const value = msg as Record<string, unknown>;
  if (typeof value.requestId !== 'string') {
    return false;
  }

  if (value.type === 'resourceLibraryCancel') {
    return true;
  }

  return (
    value.type === 'resourceLibraryQuery' &&
    typeof value.params === 'object' &&
    value.params !== null
  );
}

export function isEmbedEventMessage(msg: unknown): msg is EmbedEventMessage {
  if (typeof msg !== 'object' || msg == null || !('type' in msg)) {
    return false;
  }

  if ('requestId' in msg) {
    return false;
  }

  const type = (msg as { type?: unknown }).type;
  if (type === 'slideChange') {
    return typeof (msg as SlideChangeEvent).index === 'number';
  }

  if (type === 'save') {
    const stage = (msg as { stage?: unknown }).stage;
    return (
      typeof (msg as SaveSuccessEvent).content === 'object' &&
      (stage === undefined || stage === 'success')
    );
  }

  if (type === 'contentChange') {
    return true;
  }

  if (type === 'aiCancel') {
    const runId = (msg as { runId?: unknown }).runId;
    const reason = (msg as { reason?: unknown }).reason;
    return (
      (runId === null || typeof runId === 'string') &&
      (reason === 'user' || reason === 'superseded' || reason === 'destroyed')
    );
  }

  return false;
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
  const appId = options.auth?.appId?.trim() ?? '';
  const initialId = options.initialId?.trim();

  if (!initialId) {
    return `${baseUrl}${path}/${encodeURIComponent(appId)}`;
  }

  return `${baseUrl}${path}/${encodeURIComponent(appId)}/${encodeURIComponent(initialId)}`;
}

export type KnownEventName =
  | 'ready'
  | 'contentChange'
  | 'slideChange'
  | 'save'
  | 'aiRequest'
  | 'aiCancel';

export type TEventName<T extends string> = Extract<T, KnownEventName>;
