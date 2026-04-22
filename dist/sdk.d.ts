import { EmbeddedEditor } from './embedded-editor';
import { EmbeddedPresentation } from './embedded-presentation';
import { type AlgeoCreateOptions, type AlgeoEditorCreateOptions, type AlgeoPresentationCreateOptions } from './shared';
export type EmbeddedInstance = EmbeddedEditor | EmbeddedPresentation;
export declare class AlgeoSdk {
    private constructor();
    static create(container: HTMLElement, options: AlgeoCreateOptions): Promise<EmbeddedInstance>;
    static createEditor(container: HTMLElement, options?: AlgeoEditorCreateOptions): Promise<EmbeddedEditor>;
    static createPresentation(container: HTMLElement, options?: AlgeoPresentationCreateOptions): Promise<EmbeddedPresentation>;
}
export declare function create(container: HTMLElement, options: {
    baseUrl?: string;
    mode: 'editor';
    editor: AlgeoEditorCreateOptions;
}): Promise<EmbeddedEditor>;
export declare function create(container: HTMLElement, options: {
    baseUrl?: string;
    mode: 'presentation';
    presentation: AlgeoPresentationCreateOptions;
}): Promise<EmbeddedPresentation>;
export declare function createEditor(container: HTMLElement, options?: AlgeoEditorCreateOptions, baseUrl?: string): Promise<EmbeddedEditor>;
export declare function createPresentation(container: HTMLElement, options?: AlgeoPresentationCreateOptions, baseUrl?: string): Promise<EmbeddedPresentation>;
