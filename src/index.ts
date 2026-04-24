export { AlgeoError, EMBED_ERROR_CODES, VERSION } from './shared';
export type { FileContentV10 } from '@dajiaoai/algeo-protocol';

export type {
  AlgeoCreateOptions,
  AlgeoEditorAuthOptions,
  AlgeoEditorCreateOptions,
  AlgeoEditorSaveResult,
  AlgeoEditorUiConfig,
  AlgeoEmbedMode,
  AlgeoErrorPayload,
  AlgeoPresentationCreateOptions,
  ContentChangeEvent,
  DocumentApi,
  EmbeddedEditorEventListenerMap,
  EmbeddedEditorEventMap,
  EmbeddedEditorEventName,
  EmbeddedPresentationEventListenerMap,
  EmbeddedPresentationEventMap,
  EmbeddedPresentationEventName,
  GetContentResult,
  GetSlideCountResult,
  HistoryApi,
  LoadFileResult,
  LoadShareByIdResult,
  ModeApi,
  ReadyEvent,
  ReplResult,
  SlideChangeEvent,
  SlideIndexResult,
  SlidesApi,
  SwitchSlideResult,
  SaveEvent,
} from './shared';

export { EmbeddedPresentation } from './embedded-presentation';
export { EmbeddedEditor } from './embedded-editor';
export {
  AlgeoSdk,
  create,
  createEditor,
  createPresentation,
  type EmbeddedInstance,
} from './sdk';
