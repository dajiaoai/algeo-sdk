import { EmbeddedTarget } from './embedded-target';
import { type AlgeoEditorCreateOptions, type DocumentApi, type EmbeddedEditorEventListenerMap, type EmbeddedEditorEventMap, type EmbeddedEditorEventName, type HistoryApi, type ModeApi, type SlidesApi } from './shared';
export declare class EmbeddedEditor extends EmbeddedTarget<EmbeddedEditorEventMap, EmbeddedEditorEventName, EmbeddedEditorEventListenerMap> {
    readonly document: DocumentApi;
    readonly slides: SlidesApi;
    readonly history: HistoryApi;
    readonly mode: ModeApi;
    private currentContent?;
    private currentSlideIndex;
    private slideCount;
    private historyCount;
    private historyCurrentIndex;
    private uiConfig;
    private saveHandler?;
    constructor(container: HTMLElement);
    initialize(options?: AlgeoEditorCreateOptions, baseUrl?: string): Promise<void>;
    private loadContent;
    private switchTo;
    private addSlide;
    private recordHistoryMutation;
}
