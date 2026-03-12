'use strict';

/**
 * 大角几何内嵌画板 SDK
 * 绑定 DOM 容器，自动创建 iframe 并封装 postMessage 通信
 */
/** SDK 版本号，构建时由 rollup 注入 */
const VERSION = '1.1.0';
const DEFAULT_EMBED_BASE = 'https://dajiaoai.com';
let requestIdCounter = 0;
function generateRequestId() {
    return `req-${Date.now()}-${++requestIdCounter}`;
}
class AlgeoSdkError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AlgeoSdkError';
    }
}
function isResponseMessage(msg) {
    return (typeof msg === 'object' &&
        msg !== null &&
        'type' in msg &&
        msg.type === 'response' &&
        'requestId' in msg);
}
function isReadyMessage(msg) {
    return (typeof msg === 'object' &&
        msg !== null &&
        'type' in msg &&
        msg.type === 'ready');
}
/**
 * 大角几何内嵌画板 SDK
 */
class AlgeoSdk {
    /** 是否已就绪（收到 iframe ready 通知） */
    get ready() {
        return this._ready;
    }
    /** 内嵌页协议版本 */
    get version() {
        return this._version;
    }
    constructor(container) {
        this.pending = new Map();
        this._ready = false;
        this._version = null;
        this.container = container;
    }
    static async create(container, options) {
        const ret = new AlgeoSdk(container);
        await ret.init(options);
        return ret;
    }
    async init(options = {}) {
        if (this.iframe) {
            throw new AlgeoSdkError('请勿多次调用init方法。', 'BAD_REQUEST');
        }
        return new Promise((resolve, reject) => {
            const baseUrl = options.baseUrl ?? DEFAULT_EMBED_BASE;
            const initialId = options.initialId ?? '';
            const src = initialId
                ? `${baseUrl}/e/${encodeURIComponent(initialId)}`
                : `${baseUrl}/e`;
            const iframe = this.iframe = document.createElement('iframe');
            iframe.id = 'algeo-embed';
            iframe.src = src;
            iframe.allow = 'fullscreen';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.addEventListener('error', reject);
            this.container.appendChild(iframe);
            this.messageHandler = (e) => {
                if (e.source !== iframe.contentWindow)
                    return;
                const { data } = e;
                if (isReadyMessage(data)) {
                    this._ready = true;
                    this._version = data.version;
                    resolve();
                    return;
                }
                if (isResponseMessage(data)) {
                    const { requestId, success } = data;
                    const pending = this.pending.get(requestId);
                    if (pending) {
                        this.pending.delete(requestId);
                        if (success) {
                            pending.resolve(data.result);
                        }
                        else {
                            const err = data.error;
                            pending.reject(new AlgeoSdkError(err.message, err.code, err.details));
                        }
                    }
                }
            };
            window.addEventListener('message', this.messageHandler);
        });
    }
    post(type, payload) {
        const requestId = generateRequestId();
        const msg = { type, requestId, ...payload };
        return new Promise((resolve, reject) => {
            if (!this._ready) {
                reject(new AlgeoSdkError('iframe 未加载完成', 'IFRAME_NOT_READY'));
            }
            this.pending.set(requestId, {
                resolve: resolve,
                reject,
            });
            const target = this.iframe?.contentWindow;
            if (!target) {
                this.pending.delete(requestId);
                reject(new AlgeoSdkError('iframe 未加载完成', 'IFRAME_NOT_READY'));
                return;
            }
            target.postMessage(msg, '*');
            // 超时兜底
            setTimeout(() => {
                if (this.pending.has(requestId)) {
                    this.pending.delete(requestId);
                    reject(new AlgeoSdkError('请求超时', 'TIMEOUT'));
                }
            }, 30000);
        });
    }
    /**
     * 按分享 ID 加载内容
     */
    loadShareById(id) {
        return this.post('loadShareById', { id });
    }
    /**
     * 加载完整文件内容（覆盖式）
     */
    loadFile(content) {
        return this.post('loadFile', { content });
    }
    /**
     * 切换到指定索引的画板
     */
    switchSlide(index) {
        return this.post('switchSlide', { index });
    }
    /**
     * 查询画板数量
     */
    getSlideCount() {
        return this.post('getSlideCount', {});
    }
    /**
     * 执行 REPL 指令，返回面向 AI 的文档/文本内容
     * @param command REPL 可用的单个 command 指令，如 help、list、list_slides、eval 等
     */
    repl(command) {
        return this.post('repl', { command });
    }
    /**
     * 销毁实例，移除 iframe 与事件监听
     */
    destroy() {
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
            this.messageHandler = undefined;
        }
        this.pending.forEach(({ reject }) => reject(new AlgeoSdkError('SDK 已销毁', 'DESTROYED')));
        this.pending.clear();
        if (this.iframe?.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
        }
    }
}

exports.AlgeoSdk = AlgeoSdk;
exports.AlgeoSdkError = AlgeoSdkError;
exports.VERSION = VERSION;
