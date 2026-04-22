import { EmbeddedEditor } from './embedded-editor';
import { EmbeddedPresentation } from './embedded-presentation';
import {
  type AlgeoCreateOptions,
  type AlgeoEditorCreateOptions,
  type AlgeoPresentationCreateOptions,
} from './shared';

export type EmbeddedInstance = EmbeddedEditor | EmbeddedPresentation;

export class AlgeoSdk {
  private constructor() {}

  static async create(
    container: HTMLElement,
    options: AlgeoCreateOptions,
  ): Promise<EmbeddedInstance> {
    if (options.mode === 'editor') {
      return createEditor(container, options.editor, options.baseUrl);
    }

    return createPresentation(container, options.presentation, options.baseUrl);
  }

  static async createEditor(
    container: HTMLElement,
    options: AlgeoEditorCreateOptions = {},
  ): Promise<EmbeddedEditor> {
    return createEditor(container, options);
  }

  static async createPresentation(
    container: HTMLElement,
    options: AlgeoPresentationCreateOptions = {},
  ): Promise<EmbeddedPresentation> {
    return createPresentation(container, options);
  }
}

export async function create(
  container: HTMLElement,
  options: {
    baseUrl?: string;
    mode: 'editor';
    editor: AlgeoEditorCreateOptions;
  },
): Promise<EmbeddedEditor>;

export async function create(
  container: HTMLElement,
  options: {
    baseUrl?: string;
    mode: 'presentation';
    presentation: AlgeoPresentationCreateOptions;
  },
): Promise<EmbeddedPresentation>;

export async function create(
  container: HTMLElement,
  options: AlgeoCreateOptions,
): Promise<EmbeddedInstance> {
  if (options.mode === 'editor') {
    return createEditor(container, options.editor, options.baseUrl);
  }

  return createPresentation(container, options.presentation, options.baseUrl);
}

export async function createEditor(
  container: HTMLElement,
  options: AlgeoEditorCreateOptions = {},
  baseUrl?: string,
): Promise<EmbeddedEditor> {
  const editor = new EmbeddedEditor(container);
  await editor.initialize(options, baseUrl);
  return editor;
}

export async function createPresentation(
  container: HTMLElement,
  options: AlgeoPresentationCreateOptions = {},
  baseUrl?: string,
): Promise<EmbeddedPresentation> {
  const presentation = new EmbeddedPresentation(container);
  await presentation.initialize(options, baseUrl);
  return presentation;
}
