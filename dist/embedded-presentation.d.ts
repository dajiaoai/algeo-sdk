import { EmbeddedTarget } from './embedded-target';
import { type AlgeoPresentationCreateOptions, type EmbeddedPresentationEventListenerMap, type EmbeddedPresentationEventMap, type EmbeddedPresentationEventName, type FileContentV10, type GetSlideCountResult, type LoadFileResult, type LoadShareByIdResult, type ReplResult, type SwitchSlideResult } from './shared';
export declare class EmbeddedPresentation extends EmbeddedTarget<EmbeddedPresentationEventMap, EmbeddedPresentationEventName, EmbeddedPresentationEventListenerMap> {
    private currentContent?;
    private currentSlideIndex;
    private slideCount;
    constructor(container: HTMLElement);
    initialize(options?: AlgeoPresentationCreateOptions, baseUrl?: string): Promise<void>;
    protected acceptsEventMessage(): boolean;
    loadShareById(id: string): Promise<LoadShareByIdResult>;
    loadFile(content: FileContentV10): Promise<LoadFileResult>;
    switchSlide(index: number): Promise<SwitchSlideResult>;
    getSlideCount(): Promise<GetSlideCountResult>;
    repl(command: string): Promise<ReplResult>;
}
