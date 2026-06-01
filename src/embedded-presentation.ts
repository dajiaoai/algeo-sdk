import { EmbeddedTarget } from './embedded-target';
import {
  AlgeoError,
  type AlgeoPresentationCreateOptions,
  type EmbeddedPresentationEventListenerMap,
  type EmbeddedPresentationEventMap,
  type EmbeddedPresentationEventName,
  type FileContentLatest,
  type GetSlideCountResult,
  type LoadFileResult,
  type LoadShareByIdResult,
  type ReplResult,
  type SwitchSlideResult,
} from './shared';

export class EmbeddedPresentation extends EmbeddedTarget<
  EmbeddedPresentationEventMap,
  EmbeddedPresentationEventName,
  EmbeddedPresentationEventListenerMap
> {
  private currentContent?: FileContentLatest;
  private currentSlideIndex = 0;
  private slideCount = 0;
  private whitelistError?: AlgeoError;

  constructor(container: HTMLElement) {
    super(container, 'presentation');
  }

  async initialize(
    options: AlgeoPresentationCreateOptions = {},
    baseUrl?: string,
  ): Promise<void> {
    await this.init({
      baseUrl,
      initialId: options.shareId,
    });
  }

  protected override acceptsEventMessage(): boolean {
    return false;
  }

  setWhitelistError(error: AlgeoError): void {
    this.whitelistError = error;
  }

  private ensureWhitelistAccess(methodName: string): void {
    if (!this.whitelistError) {
      return;
    }

    const error = new AlgeoError(
      `演示模式调用 ${methodName} 被白名单限制。${this.whitelistError.message}`,
      this.whitelistError.code,
      this.whitelistError.details,
    );

    console.error(error);
    throw error;
  }

  async loadShareById(id: string): Promise<LoadShareByIdResult> {
    this.ensureWhitelistAccess('loadShareById');
    const result = await this.post<LoadShareByIdResult>('loadShareById', {
      id,
    });
    this.currentContent = undefined;
    this.currentSlideIndex = 0;
    this.slideCount = 0;
    return result;
  }

  async loadFile(content: FileContentLatest): Promise<LoadFileResult> {
    this.ensureWhitelistAccess('loadFile');
    const result = await this.post<LoadFileResult>('loadContent', { content });
    this.currentContent = content;
    this.currentSlideIndex = 0;
    this.slideCount = content.slides.length;
    return result;
  }

  async switchSlide(index: number): Promise<SwitchSlideResult> {
    this.ensureWhitelistAccess('switchSlide');
    const result = await this.post<SwitchSlideResult>('switchSlide', { index });
    this.currentSlideIndex = index;
    return result;
  }

  async getSlideCount(): Promise<GetSlideCountResult> {
    this.ensureWhitelistAccess('getSlideCount');
    const result = await this.post<GetSlideCountResult>('getSlideCount', {});
    this.slideCount = result.count;
    return result;
  }

  async repl(command: string): Promise<ReplResult> {
    this.ensureWhitelistAccess('repl');
    return this.post<ReplResult>('repl', { command });
  }
}
