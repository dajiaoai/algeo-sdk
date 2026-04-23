import { EmbeddedTarget } from './embedded-target';
import {
  type AlgeoPresentationCreateOptions,
  type EmbeddedPresentationEventListenerMap,
  type EmbeddedPresentationEventMap,
  type EmbeddedPresentationEventName,
  type FileContentV10,
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
  private currentContent?: FileContentV10;
  private currentSlideIndex = 0;
  private slideCount = 0;

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

  async loadShareById(id: string): Promise<LoadShareByIdResult> {
    const result = await this.post<LoadShareByIdResult>('loadShareById', {
      id,
    });
    this.currentContent = undefined;
    this.currentSlideIndex = 0;
    this.slideCount = 0;
    return result;
  }

  async loadFile(content: FileContentV10): Promise<LoadFileResult> {
    const result = await this.post<LoadFileResult>('loadContent', { content });
    this.currentContent = content;
    this.currentSlideIndex = 0;
    this.slideCount = content.slides.length;
    return result;
  }

  async switchSlide(index: number): Promise<SwitchSlideResult> {
    const result = await this.post<SwitchSlideResult>('switchSlide', { index });
    this.currentSlideIndex = index;
    return result;
  }

  async getSlideCount(): Promise<GetSlideCountResult> {
    const result = await this.post<GetSlideCountResult>('getSlideCount', {});
    this.slideCount = result.count;
    return result;
  }

  async repl(command: string): Promise<ReplResult> {
    return this.post<ReplResult>('repl', { command });
  }
}
