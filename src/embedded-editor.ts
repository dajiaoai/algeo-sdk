import { EmbeddedTarget } from './embedded-target';
import { safeParseAiStreamEventV1 } from '@dajiaoai/algeo-protocol';
import {
  AlgeoError,
  type AiApi,
  type AiCancelEvent,
  type AiDraftPayloadV1,
  type AiRequestEvent,
  type AiRunPayloadV1,
  type AiStreamEventV1,
  type AlgeoEditorCreateOptions,
  type AlgeoEditorSaveResult,
  type AlgeoEditorUiConfig,
  type ContentChangeEvent,
  type DocumentApi,
  EMBED_ERROR_CODES,
  type EmbedRequestMessage,
  type EmbeddedEditorEventListenerMap,
  type EmbeddedEditorEventMap,
  type EmbeddedEditorEventName,
  type ExportImageOptions,
  type ExportLatexOptions,
  type ExportLatexResult,
  type ExportSlideImageOptions,
  type ExportSlideImageResult,
  type FileContentLatest,
  type GetContentResult,
  type GetHistoryStateResult,
  type HistoryApi,
  type LoadFileResult,
  type ModeApi,
  type SaveRequestEvent,
  type SaveEvent,
  type SaveRequestMessage,
  type SlideIndexResult,
  type SlidesApi,
  type SwitchSlideResult,
} from './shared';

export class EmbeddedEditor extends EmbeddedTarget<
  EmbeddedEditorEventMap,
  EmbeddedEditorEventName,
  EmbeddedEditorEventListenerMap
> {
  readonly document: DocumentApi;
  readonly slides: SlidesApi;
  readonly history: HistoryApi;
  readonly mode: ModeApi;
  readonly ai: AiApi;

  private currentContent?: FileContentLatest;
  private currentSlideIndex = 0;
  private slideCount = 0;
  private historyCount = 0;
  private historyCurrentIndex = -1;
  private uiConfig: AlgeoEditorUiConfig = {};
  private activeAiRun?: {
    controller: AbortController;
    requestId: string;
    runId: string | null;
  };

  constructor(container: HTMLElement) {
    super(container, 'editor');

    this.document = {
      loadContent: async (content: FileContentLatest) => {
        await this.loadContent(content, 'loadContent');
      },
      getContent: async () => {
        const result = await this.post<GetContentResult>('getContent', {});
        this.currentContent = result.content;
        this.currentSlideIndex = Math.min(
          this.currentSlideIndex,
          Math.max(result.content.slides.length - 1, 0),
        );
        this.slideCount = result.content.slides.length;
        await this.refreshHistoryState();
        return result.content;
      },
    };

    this.slides = {
      getCount: () => this.slideCount,
      getCurrentIndex: () => this.currentSlideIndex,
      switchTo: async (index: number) => {
        await this.switchTo(index);
      },
      add: async () => this.addSlide('addSlide', {}),
      addAt: async (index: number) => this.addSlide('addSlideAt', { index }),
      remove: async (index: number) => {
        await this.post('removeSlide', { index });
        this.slideCount = Math.max(0, this.slideCount - 1);
        this.currentSlideIndex = Math.min(
          this.currentSlideIndex,
          Math.max(this.slideCount - 1, 0),
        );
        await this.refreshHistoryState();
      },
      duplicate: async (index: number, targetIndex?: number) =>
        this.addSlide('duplicateSlide', { index, targetIndex }),
      reorder: async (fromIndex: number, toIndex: number) => {
        await this.post('reorderSlide', { fromIndex, toIndex });
        if (this.currentSlideIndex === fromIndex) {
          this.currentSlideIndex = toIndex;
        }
        await this.refreshHistoryState();
      },
      exportImage: async (options: ExportImageOptions) => {
        const result = await this.post<ExportSlideImageResult>(
          'exportSlideImage',
          { options },
        );
        return result.images;
      },
      exportLatex: async (options?: ExportLatexOptions) => {
        const result = await this.post<ExportLatexResult>('exportLatex', {
          options: options ?? {},
        });
        return result.items;
      },
    };

    this.history = {
      getCount: () => this.historyCount,
      getCurrentIndex: () => this.historyCurrentIndex,
      undo: async () => {
        await this.post('undo', {});
        await this.refreshHistoryState();
      },
      redo: async () => {
        await this.post('redo', {});
        await this.refreshHistoryState();
      },
      jumpTo: async (index: number) => {
        await this.post('jumpHistory', { index });
        await this.refreshHistoryState();
      },
      canUndo: () => this.historyCurrentIndex >= 0,
      canRedo: () => this.historyCurrentIndex < this.historyCount - 1,
      clear: async () => {
        await this.post('clearHistory', {});
        await this.refreshHistoryState();
      },
    };

    this.mode = {
      getUiConfig: () => ({ ...this.uiConfig }),
      setUiConfig: async (config: Partial<AlgeoEditorUiConfig>) => {
        await this.post('setUiConfig', { config });
        this.uiConfig = {
          ...this.uiConfig,
          ...config,
        };
      },
      setMasterTemplate: (template) =>
        this.post('setMasterTemplate', { template }),
    };

    this.ai = {
      setDraft: async (draft: AiDraftPayloadV1) => {
        await this.post('setAiDraft', { draft });
      },
      clearDraft: async () => {
        await this.post('clearAiDraft', {});
      },
      consumeStream: async ({ stream, signal }) => {
        await this.consumeAiStream(stream, signal);
      },
      pushStreamEvent: (event: AiStreamEventV1) => {
        this.pushAiStreamEvent(event);
      },
    };
  }

  async initialize(
    options: AlgeoEditorCreateOptions = {},
    baseUrl?: string,
  ): Promise<void> {
    if (!options.auth?.appId?.trim()) {
      throw new AlgeoError(
        '编辑模式需要提供 auth.appId。',
        EMBED_ERROR_CODES.MISSING_APP_ID,
      );
    }

    this.uiConfig = options.ui ? { ...options.ui } : {};

    await this.init({
      baseUrl,
      auth: options.auth,
      initialId: options.shareId,
    });

    if (Object.keys(this.uiConfig).length > 0) {
      await this.mode.setUiConfig(this.uiConfig);
    }

    const content = await this.document.getContent();
    this.currentContent = content;
    this.slideCount = content.slides.length;
    this.currentSlideIndex = 0;
    await this.refreshHistoryState();

    if (options.initialContent) {
      await this.loadContent(options.initialContent, 'initialContent');
    }
  }

  protected override handleEventMessage(
    event:
      | ContentChangeEvent
      | SaveEvent
      | { type: 'slideChange'; index: number }
      | AiCancelEvent,
  ): void {
    if (event.type === 'contentChange') {
      if (event.content) {
        this.currentContent = event.content;
        this.slideCount = event.content.slides.length;
        this.currentSlideIndex = Math.min(
          this.currentSlideIndex,
          Math.max(this.slideCount - 1, 0),
        );
      }
      return;
    }

    if (event.type === 'slideChange') {
      this.currentSlideIndex = event.index;
      return;
    }

    if (event.type === 'aiCancel') {
      event.runId = this.activeAiRun?.runId ?? event.runId;
      this.cancelActiveAi(event.reason, false);
      return;
    }

    this.currentContent = event.content;
    this.slideCount = event.content.slides.length;
    this.currentSlideIndex = Math.min(
      this.currentSlideIndex,
      Math.max(this.slideCount - 1, 0),
    );
  }

  protected override handleRequestMessage(
    message: EmbedRequestMessage,
    sourceWindow: Window,
  ): boolean {
    if (message.type === 'save') {
      void this.handleSaveRequest(message, sourceWindow);
      return true;
    }

    if (message.type === 'aiRequest') {
      void this.handleAiRequest(message, sourceWindow);
      return true;
    }

    return false;
  }

  override async destroy(): Promise<void> {
    this.cancelActiveAi('destroyed', true);
    await super.destroy();
  }

  private async loadContent(
    content: FileContentLatest,
    source: ContentChangeEvent['source'],
  ): Promise<void> {
    await this.post<LoadFileResult>('loadContent', { content });
    this.currentContent = content;
    this.currentSlideIndex = 0;
    this.slideCount = content.slides.length;
    await this.refreshHistoryState();
  }

  private async switchTo(index: number): Promise<void> {
    await this.post<SwitchSlideResult>('switchSlide', { index });
    this.currentSlideIndex = index;
  }

  private async addSlide(
    command: 'addSlide' | 'addSlideAt' | 'duplicateSlide',
    payload: Record<string, unknown>,
  ): Promise<SlideIndexResult> {
    const result = await this.post<SlideIndexResult>(command, payload);
    this.slideCount = Math.max(this.slideCount + 1, result.index + 1);
    this.currentSlideIndex = result.index;
    await this.refreshHistoryState();
    return result;
  }

  private async refreshHistoryState(): Promise<GetHistoryStateResult> {
    const state = await this.post<GetHistoryStateResult>('getHistoryState', {});
    this.historyCount = state.count;
    this.historyCurrentIndex = state.currentIndex;
    return state;
  }

  private async handleSaveRequest(
    message: SaveRequestMessage,
    sourceWindow: Window,
  ): Promise<void> {
    const respond = (
      payload:
        | {
            type: 'response';
            requestId: string;
            success: true;
            result: AlgeoEditorSaveResult;
          }
        | {
            type: 'response';
            requestId: string;
            success: false;
            error: { code: string; message: string };
          },
    ) => {
      sourceWindow.postMessage(payload, '*');
    };

    try {
      const result = await this.resolveSaveResult(message.content);
      respond({
        type: 'response',
        requestId: message.requestId,
        success: true,
        result,
      });
    } catch (error) {
      respond({
        type: 'response',
        requestId: message.requestId,
        success: false,
        error: {
          code: EMBED_ERROR_CODES.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  private async handleAiRequest(
    message: {
      type: 'aiRequest';
      requestId: string;
      payload: AiRunPayloadV1;
    },
    sourceWindow: Window,
  ): Promise<void> {
    const respond = (
      payload:
        | {
            type: 'response';
            requestId: string;
            success: true;
            result: { success: true };
          }
        | {
            type: 'response';
            requestId: string;
            success: false;
            error: { code: string; message: string };
          },
    ) => {
      sourceWindow.postMessage(payload, '*');
    };

    const listeners = this.getListeners('aiRequest');
    if (listeners.length === 0) {
      respond({
        type: 'response',
        requestId: message.requestId,
        success: false,
        error: {
          code: EMBED_ERROR_CODES.BAD_REQUEST,
          message: '宿主未配置 aiRequest 事件处理器',
        },
      });
      return;
    }

    this.cancelActiveAi('superseded', true);

    const controller = new AbortController();
    this.activeAiRun = {
      controller,
      requestId: message.requestId,
      runId: null,
    };

    const requestEvent: AiRequestEvent = {
      type: 'aiRequest',
      payload: message.payload,
      signal: controller.signal,
    };

    try {
      for (const listener of listeners) {
        await listener(requestEvent);
      }

      if (this.activeAiRun?.requestId === message.requestId) {
        this.activeAiRun = undefined;
      }

      respond({
        type: 'response',
        requestId: message.requestId,
        success: true,
        result: { success: true },
      });
    } catch (error) {
      if (this.activeAiRun?.requestId === message.requestId) {
        this.activeAiRun = undefined;
      }

      respond({
        type: 'response',
        requestId: message.requestId,
        success: false,
        error: {
          code: controller.signal.aborted
            ? EMBED_ERROR_CODES.BAD_REQUEST
            : EMBED_ERROR_CODES.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  private cancelActiveAi(
    reason: AiCancelEvent['reason'],
    shouldEmit: boolean,
  ): void {
    const activeRun = this.activeAiRun;
    if (!activeRun) {
      return;
    }

    this.activeAiRun = undefined;
    activeRun.controller.abort();

    if (shouldEmit) {
      this.emit('aiCancel', {
        type: 'aiCancel',
        runId: activeRun.runId,
        reason,
      });
    }
  }

  private async consumeAiStream(
    stream: ReadableStream<Uint8Array>,
    signal?: AbortSignal,
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completed = false;

    const abortReader = () => {
      void reader.cancel();
    };

    if (signal?.aborted) {
      await reader.cancel();
      return;
    }

    signal?.addEventListener('abort', abortReader, { once: true });

    try {
      while (!completed) {
        const { done, value } = await reader.read();
        if (signal?.aborted) {
          throw new DOMException('AI 请求已取消', 'AbortError');
        }

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const result = this.drainAiSseBuffer(buffer);
        buffer = result.rest;
        completed = result.completed;
      }

      buffer += decoder.decode();
      if (signal?.aborted) {
        throw new DOMException('AI 请求已取消', 'AbortError');
      }

      if (!completed && buffer.trim()) {
        completed = this.pushAiSseFrame(buffer);
      }
    } finally {
      signal?.removeEventListener('abort', abortReader);
      reader.releaseLock();
    }
  }

  private drainAiSseBuffer(buffer: string): {
    rest: string;
    completed: boolean;
  } {
    let rest = buffer;
    let completed = false;

    while (!completed) {
      const normalized = rest.replace(/\r\n/g, '\n');
      const index = normalized.indexOf('\n\n');
      if (index < 0) {
        break;
      }

      const frame = normalized.slice(0, index);
      rest = normalized.slice(index + 2);
      completed = this.pushAiSseFrame(frame);
    }

    return { rest, completed };
  }

  private pushAiSseFrame(frame: string): boolean {
    const event = this.parseAiSseFrame(frame);
    if (!event) {
      return false;
    }

    this.pushAiStreamEvent(event);
    return this.isAiSseTerminalEvent(event);
  }

  private parseAiSseFrame(frame: string): AiStreamEventV1 | null {
    let eventType = 'message';
    const dataLines: string[] = [];

    for (const line of frame.split(/\r?\n/)) {
      if (!line || line.startsWith(':')) {
        continue;
      }

      const separatorIndex = line.indexOf(':');
      const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
      const rawValue =
        separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
      const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue;

      if (field === 'event') {
        eventType = value;
      } else if (field === 'data') {
        dataLines.push(value);
      }
    }

    if (dataLines.length === 0) {
      return null;
    }

    const data = JSON.parse(dataLines.join('\n')) as Record<string, unknown>;
    return {
      type: 'raw',
      runId: this.getAiSseRunId(data),
      event: eventType,
      data,
    };
  }

  private getAiSseRunId(data: Record<string, unknown>): string {
    const response = this.asRecord(data.response);
    const explicitRunId = data.run_id ?? data.runId;
    if (typeof explicitRunId === 'string' && explicitRunId) {
      this.setActiveAiRunId(explicitRunId);
      return explicitRunId;
    }

    if (this.activeAiRun?.runId) {
      return this.activeAiRun.runId;
    }

    if (typeof response?.id === 'string' && response.id) {
      this.setActiveAiRunId(response.id);
      return response.id;
    }

    const generatedRunId = `run_${Date.now()}`;
    this.setActiveAiRunId(generatedRunId);
    return generatedRunId;
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private isAiSseTerminalEvent(event: AiStreamEventV1): boolean {
    const type =
      typeof event.data.type === 'string' ? event.data.type : event.event;
    return (
      type === 'response.completed' ||
      type === 'response.failed' ||
      type === 'response.incomplete' ||
      type === 'error' ||
      type === 'run.cancelled'
    );
  }

  private pushAiStreamEvent(event: AiStreamEventV1): void {
    const parsedEvent = safeParseAiStreamEventV1(event);
    if (!parsedEvent.success) {
      throw new AlgeoError(
        'Invalid AI stream event',
        EMBED_ERROR_CODES.BAD_REQUEST,
        parsedEvent.error,
      );
    }

    const streamEvent = parsedEvent.data;
    this.setActiveAiRunId(streamEvent.runId);

    this.postEvent('aiStreamEvent', { event: streamEvent });

    if (this.isAiSseTerminalEvent(streamEvent)) {
      this.activeAiRun = undefined;
    }
  }

  private setActiveAiRunId(runId: string): void {
    if (this.activeAiRun) {
      this.activeAiRun.runId = runId;
    }
  }

  private async resolveSaveResult(
    content: FileContentLatest,
  ): Promise<AlgeoEditorSaveResult> {
    const requestEvent: SaveRequestEvent = {
      type: 'save',
      stage: 'request',
      content,
    };

    for (const listener of this.getListeners('save')) {
      const result = await listener(requestEvent);
      if (result && typeof result === 'object' && 'status' in result) {
        return result;
      }
    }

    return {
      status: 'error',
      message: '宿主未配置 save 事件处理器',
    };
  }
}
