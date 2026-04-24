import { EmbeddedTarget } from './embedded-target';
import {
  AlgeoError,
  type AlgeoEditorCreateOptions,
  type AlgeoEditorSaveResult,
  type AlgeoEditorUiConfig,
  type ContentChangeEvent,
  type DocumentApi,
  EMBED_ERROR_CODES,
  type EmbeddedEditorEventListenerMap,
  type EmbeddedEditorEventMap,
  type EmbeddedEditorEventName,
  type FileContentV10,
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

  private currentContent?: FileContentV10;
  private currentSlideIndex = 0;
  private slideCount = 0;
  private historyCount = 0;
  private historyCurrentIndex = -1;
  private uiConfig: AlgeoEditorUiConfig = {};

  constructor(container: HTMLElement) {
    super(container, 'editor');

    this.document = {
      loadContent: async (content: FileContentV10) => {
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

    this.uiConfig = options.ui || {};

    await this.init({
      baseUrl,
      auth: options.auth,
      initialId: options.shareId,
    });

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
      | { type: 'slideChange'; index: number },
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

    this.currentContent = event.content;
    this.slideCount = event.content.slides.length;
    this.currentSlideIndex = Math.min(
      this.currentSlideIndex,
      Math.max(this.slideCount - 1, 0),
    );
  }

  protected override handleRequestMessage(
    message: SaveRequestMessage,
    sourceWindow: Window,
  ): boolean {
    if (message.type !== 'save') {
      return false;
    }

    void this.handleSaveRequest(message, sourceWindow);
    return true;
  }

  private async loadContent(
    content: FileContentV10,
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

  private async resolveSaveResult(
    content: FileContentV10,
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
