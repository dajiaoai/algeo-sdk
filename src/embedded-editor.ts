import { EmbeddedTarget } from './embedded-target';
import {
  AlgeoError,
  type AlgeoEditorCreateOptions,
  type AlgeoEditorUiConfig,
  type ContentChangeEvent,
  type DocumentApi,
  EMBED_ERROR_CODES,
  type EmbeddedEditorEventListenerMap,
  type EmbeddedEditorEventMap,
  type EmbeddedEditorEventName,
  type FileContentV10,
  type GetContentResult,
  type HistoryApi,
  type LoadFileResult,
  type ModeApi,
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
        this.recordHistoryMutation();
      },
      duplicate: async (index: number, targetIndex?: number) =>
        this.addSlide('duplicateSlide', { index, targetIndex }),
      reorder: async (fromIndex: number, toIndex: number) => {
        await this.post('reorderSlide', { fromIndex, toIndex });
        if (this.currentSlideIndex === fromIndex) {
          this.currentSlideIndex = toIndex;
        }
        this.recordHistoryMutation();
      },
    };

    this.history = {
      getCount: () => this.historyCount,
      getCurrentIndex: () => this.historyCurrentIndex,
      undo: async () => {
        await this.post('undo', {});
        if (this.historyCurrentIndex > 0) {
          this.historyCurrentIndex -= 1;
        }
      },
      redo: async () => {
        await this.post('redo', {});
        if (this.historyCurrentIndex < this.historyCount - 1) {
          this.historyCurrentIndex += 1;
        }
      },
      jumpTo: async (index: number) => {
        await this.post('jumpHistory', { index });
        this.historyCurrentIndex = index;
      },
      canUndo: () => this.historyCurrentIndex > 0,
      canRedo: () =>
        this.historyCurrentIndex >= 0 &&
        this.historyCurrentIndex < this.historyCount - 1,
      clear: async () => {
        await this.post('clearHistory', {});
        this.historyCount = 0;
        this.historyCurrentIndex = -1;
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

    if (options.initialContent) {
      await this.loadContent(options.initialContent, 'initialContent');
    }
  }

  private async loadContent(
    content: FileContentV10,
    source: ContentChangeEvent['source'],
  ): Promise<void> {
    await this.post<LoadFileResult>('loadContent', { content });
    this.currentContent = content;
    this.currentSlideIndex = 0;
    this.slideCount = content.slides.length;
    this.historyCount = Math.max(this.historyCount, 1);
    this.historyCurrentIndex = this.historyCount - 1;
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
    this.recordHistoryMutation();
    return result;
  }

  private recordHistoryMutation(): void {
    this.historyCount += 1;
    this.historyCurrentIndex = this.historyCount - 1;
  }
}
