import { EmbeddedTarget } from './embedded-target';
import { AlgeoError, type AlgeoPresentationCreateOptions, type EmbeddedPresentationEventListenerMap, type EmbeddedPresentationEventMap, type EmbeddedPresentationEventName, type FileContentLatest, type GetSlideCountResult, type LoadFileResult, type LoadShareByIdResult, type ReplResult, type SwitchSlideResult } from './shared';
export declare class EmbeddedPresentation extends EmbeddedTarget<EmbeddedPresentationEventMap, EmbeddedPresentationEventName, EmbeddedPresentationEventListenerMap> {
    private currentContent?;
    private currentSlideIndex;
    private slideCount;
    private whitelistError?;
    constructor(container: HTMLElement);
    initialize(options?: AlgeoPresentationCreateOptions, baseUrl?: string): Promise<void>;
    protected acceptsEventMessage(): boolean;
    setWhitelistError(error: AlgeoError): void;
    private ensureWhitelistAccess;
    loadShareById(id: string): Promise<LoadShareByIdResult>;
    loadFile(content: FileContentLatest): Promise<LoadFileResult>;
    switchSlide(index: number): Promise<SwitchSlideResult>;
    getSlideCount(): Promise<GetSlideCountResult>;
    repl(command: string): Promise<ReplResult>;
}
