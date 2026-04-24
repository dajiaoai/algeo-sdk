import { EmbeddedTarget } from './embedded-target';
import { type AlgeoEditorCreateOptions, type ContentChangeEvent, type DocumentApi, type EmbeddedEditorEventListenerMap, type EmbeddedEditorEventMap, type EmbeddedEditorEventName, type HistoryApi, type ModeApi, type SaveEvent, type SaveRequestMessage, type SlidesApi } from './shared';
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
    constructor(container: HTMLElement);
    initialize(options?: AlgeoEditorCreateOptions, baseUrl?: string): Promise<void>;
    protected handleEventMessage(event: ContentChangeEvent | SaveEvent | {
        type: 'slideChange';
        index: number;
    }): void;
    protected handleRequestMessage(message: SaveRequestMessage, sourceWindow: Window): boolean;
    private loadContent;
    private switchTo;
    private addSlide;
    private refreshHistoryState;
    private handleSaveRequest;
    private resolveSaveResult;
}
