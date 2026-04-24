import { EmbeddedEditor } from './embedded-editor';
import { EmbeddedPresentation } from './embedded-presentation';
import {
  type AlgeoCreateOptions,
  type AlgeoEditorCreateOptions,
  type AlgeoPresentationCreateOptions,
} from './shared';

export type EmbeddedInstance = EmbeddedEditor | EmbeddedPresentation;

async function createEditorInstance(
  container: HTMLElement,
  options: AlgeoEditorCreateOptions = {},
  baseUrl?: string,
): Promise<EmbeddedEditor> {
  const editor = new EmbeddedEditor(container);
  await editor.initialize(options, baseUrl);
  return editor;
}

async function createPresentationInstance(
  container: HTMLElement,
  options: AlgeoPresentationCreateOptions = {},
  baseUrl?: string,
): Promise<EmbeddedPresentation> {
  const presentation = new EmbeddedPresentation(container);
  await presentation.initialize(options, baseUrl);
  return presentation;
}

function createEmbeddedInstance(
  container: HTMLElement,
  options: AlgeoCreateOptions,
): Promise<EmbeddedInstance> {
  if (options.mode === 'editor') {
    return createEditorInstance(container, options.editor, options.baseUrl);
  }

  return createPresentationInstance(
    container,
    options.presentation,
    options.baseUrl,
  );
}

export class AlgeoSdk {
  private constructor() {}

  static async create(
    container: HTMLElement,
    options: AlgeoCreateOptions,
  ): Promise<EmbeddedInstance> {
    return createEmbeddedInstance(container, options);
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
  return createEmbeddedInstance(container, options);
}

export async function createEditor(
  container: HTMLElement,
  options: AlgeoEditorCreateOptions = {},
): Promise<EmbeddedEditor> {
  return createEditorInstance(container, options);
}

export async function createPresentation(
  container: HTMLElement,
  options: AlgeoPresentationCreateOptions = {},
): Promise<EmbeddedPresentation> {
  return createPresentationInstance(container, options);
}
