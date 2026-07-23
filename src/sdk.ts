import { EmbeddedEditor } from './embedded-editor';
import { EmbeddedPresentation } from './embedded-presentation';
import {
  AlgeoError,
  type AlgeoCreateOptions,
  type AlgeoEditorCreateOptions,
  type AlgeoPresentationCreateOptions,
  EMBED_ERROR_CODES,
  normalizeBaseUrl,
} from './shared';

export type EmbeddedInstance = EmbeddedEditor | EmbeddedPresentation;

const WHITELIST_CHECK_BASE_URL = 'https://open.dajiaoai.com/console';
const WHITELIST_CHECK_PATH = '/api/whitelist/check';

async function checkPresentationWhitelist(
  options: AlgeoPresentationCreateOptions,
): Promise<AlgeoError | null> {
  const appId = options.auth?.appId?.trim() ?? '';
  const host = window.location.host.trim();
  const url = new URL(
    `${normalizeBaseUrl(WHITELIST_CHECK_BASE_URL)}${WHITELIST_CHECK_PATH}`,
  );

  url.searchParams.set('appId', appId);
  url.searchParams.set('host', host);

  let matched = false;

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
    });

    if (response.ok) {
      const payload = (await response.json()) as { matched?: unknown };
      matched = payload.matched === true;
    }
  } catch {
    matched = false;
  }

  if (matched) {
    return null;
  }

  return new AlgeoError(
    `白名单校验未通过，appId="${appId || '(empty)'}"，host="${host || '(empty)'}"。`,
    EMBED_ERROR_CODES.BAD_REQUEST,
  );
}

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
  const whitelistError = await checkPresentationWhitelist(options);
  if (whitelistError) {
    presentation.setWhitelistError(whitelistError);
  }
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
