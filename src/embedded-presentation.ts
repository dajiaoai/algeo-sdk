import { EmbeddedTarget } from './embedded-target';
import { convertToLatest } from '@dajiaoai/algeo-protocol';
import {
  AlgeoError,
  EMBED_ERROR_CODES,
  isLocalFileHost,
  isLocalLoopbackHost,
  type AlgeoPresentationCreateOptions,
  type AlgeoPresentationUiConfig,
  type EmbeddedPresentationEventListenerMap,
  type EmbeddedPresentationEventMap,
  type EmbeddedPresentationEventName,
  type FileContentAny,
  type FileContentLatest,
  type GetSlideCountResult,
  type LoadFileResult,
  type LoadShareByIdResult,
  type PresentationModeApi,
  type ReplResult,
  type SwitchSlideResult,
  readEmbedAppId,
  requireHttpHostForAppId,
  validateFontConfig,
} from './shared';

export class EmbeddedPresentation extends EmbeddedTarget<
  EmbeddedPresentationEventMap,
  EmbeddedPresentationEventName,
  EmbeddedPresentationEventListenerMap
> {
  readonly mode: PresentationModeApi;

  private currentContent?: FileContentLatest;
  private currentSlideIndex = 0;
  private slideCount = 0;
  private appId = '';
  private whitelistCheck?: Promise<void>;
  private whitelistError?: AlgeoError;
  private uiConfig: AlgeoPresentationUiConfig = {
    logo: true,
    slidePanel: true,
    pencilToolbar: true,
    zoomControl: true,
  };

  constructor(container: HTMLElement) {
    super(container, 'presentation');

    this.mode = {
      getUiConfig: () => ({ ...this.uiConfig }),
      setUiConfig: async (config: Partial<AlgeoPresentationUiConfig>) => {
        await this.ensureWhitelistAccess('setUiConfig');
        await this.post('setUiConfig', { config });
        this.uiConfig = {
          ...this.uiConfig,
          ...config,
        };
      },
      setMasterTemplate: async (template) => {
        await this.ensureWhitelistAccess('setMasterTemplate');
        return this.post('setMasterTemplate', { template });
      },
    };
  }

  async initialize(
    options: AlgeoPresentationCreateOptions = {},
    baseUrl?: string,
  ): Promise<void> {
    const appId = readEmbedAppId(options.auth);
    if (!this.iframe) {
      this.appId = appId;
      this.whitelistCheck = undefined;
    }
    // 未配置应用的部署页面按默认样式展示公开分享。
    if (!appId && !isLocalFileHost() && !isLocalLoopbackHost()) {
      await this.init({ baseUrl, initialId: options.shareId });
      return;
    }

    this.uiConfig = {
      logo: true,
      slidePanel: true,
      pencilToolbar: true,
      zoomControl: true,
      ...options.ui,
    };

    if (options.fonts) {
      validateFontConfig(options.fonts);
    }

    await this.init({
      baseUrl,
      auth: options.auth,
      initialId: options.shareId,
    });

    if (options.fonts) {
      await this.post('setFontConfig', { config: options.fonts });
    }

    await this.post('setUiConfig', { config: this.uiConfig });
  }

  protected override acceptsEventMessage(): boolean {
    return false;
  }

  setWhitelistError(error: AlgeoError): void {
    this.whitelistError = error;
  }

  private async checkWhitelist(appId: string): Promise<void> {
    if (!appId) {
      if (isLocalFileHost() || isLocalLoopbackHost()) return;
      throw new AlgeoError(
        '正式接入演示模式需要提供 auth.appId。',
        EMBED_ERROR_CODES.MISSING_APP_ID,
      );
    }

    requireHttpHostForAppId(appId);
    const host = window.location.hostname;
    const url = new URL('https://open.dajiaoai.com/console/api/whitelist/check');
    url.searchParams.set('appId', appId);
    url.searchParams.set('host', host);

    try {
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (response.ok && (await response.json()).matched === true) return;
    } catch {
      // 网络或响应解析失败时按鉴权失败处理。
    }

    throw new AlgeoError(
      `白名单校验未通过，appId="${appId}"，host="${host}"。请在开放平台将该主机加入应用白名单后重试。`,
      EMBED_ERROR_CODES.BAD_REQUEST,
    );
  }

  private async ensureWhitelistAccess(methodName: string): Promise<void> {
    try {
      if (this.whitelistError) throw this.whitelistError;
      this.whitelistCheck ??= this.checkWhitelist(this.appId);
      await this.whitelistCheck;
    } catch (cause) {
      if (!(cause instanceof AlgeoError)) throw cause;
      const error = new AlgeoError(
        `演示模式调用 ${methodName} 被白名单限制。${cause.message}`,
        cause.code,
        cause.details,
      );
      console.error(error);
      throw error;
    }
  }

  async loadShareById(id: string): Promise<LoadShareByIdResult> {
    await this.ensureWhitelistAccess('loadShareById');
    const result = await this.post<LoadShareByIdResult>('loadShareById', {
      id,
    });
    this.currentContent = undefined;
    this.currentSlideIndex = 0;
    this.slideCount = 0;
    return result;
  }

  async loadFile(content: FileContentAny): Promise<LoadFileResult> {
    await this.ensureWhitelistAccess('loadFile');
    const latestContent = convertToLatest(content);
    const result = await this.post<LoadFileResult>('loadContent', {
      content: latestContent,
    });
    this.currentContent = latestContent;
    this.currentSlideIndex = 0;
    this.slideCount = latestContent.slides.length;
    return result;
  }

  async switchSlide(index: number): Promise<SwitchSlideResult> {
    await this.ensureWhitelistAccess('switchSlide');
    const result = await this.post<SwitchSlideResult>('switchSlide', { index });
    this.currentSlideIndex = index;
    return result;
  }

  async getSlideCount(): Promise<GetSlideCountResult> {
    await this.ensureWhitelistAccess('getSlideCount');
    const result = await this.post<GetSlideCountResult>('getSlideCount', {});
    this.slideCount = result.count;
    return result;
  }

  async repl(command: string): Promise<ReplResult> {
    await this.ensureWhitelistAccess('repl');
    return this.post<ReplResult>('repl', { command });
  }
}
