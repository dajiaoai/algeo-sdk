(function () {
  var STORAGE_KEY = 'ALGEO_EXAMPLES_CONFIG';
  var SDK_PACKAGE = '@dajiaoai/algeo-sdk';
  var SDK_BUNDLE = '/dist/algeo-sdk.umd.js';
  var sdkPromise;
  var DEFAULT_CONFIG = {
    baseUrl: 'https://dajiaoai.com/',
    appId: 'YTVJDQZR',
    shareId: 'OFUIG9TT',
    sdkSource: 'custom',
    sdkVersion: 'latest',
    sdkCustomUrl: '../dist/algeo-sdk.umd.js',
  };

  function readStoredConfig() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('[Algeo examples] Failed to read local config.', error);
      return {};
    }
  }

  function sanitizeConfig(config) {
    var next = {};
    ['baseUrl', 'appId', 'shareId', 'sdkVersion', 'sdkCustomUrl'].forEach(function (key) {
      if (typeof config[key] === 'string') {
        var value = config[key].trim();
        if (value || key === 'shareId') next[key] = value;
      }
    });
    if (['custom', 'npm'].includes(config.sdkSource)) {
      next.sdkSource = config.sdkSource;
    }
    return next;
  }

  function getSdkUrl(config) {
    if (config.sdkSource === 'npm') {
      if (!/^(latest|\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?)$/.test(config.sdkVersion)) {
        throw new Error('请输入完整的 npmjs 版本号或 latest。');
      }
      return 'https://cdn.jsdelivr.net/npm/' + SDK_PACKAGE + '@' +
        encodeURIComponent(config.sdkVersion) + SDK_BUNDLE;
    }
    if (!config.sdkCustomUrl) throw new Error('请输入 SDK 路径。');
    var url = new URL(config.sdkCustomUrl, document.baseURI);
    if (['http:', 'https:'].includes(url.protocol) ||
        (url.protocol === 'file:' && window.location.protocol === 'file:')) {
      return url.href;
    }
    throw new Error('SDK 路径须为 HTTP(S) URL 或相对路径。');
  }

  async function getNpmVersions() {
    var response = await fetch('https://registry.npmjs.org/' + encodeURIComponent(SDK_PACKAGE), {
      headers: { Accept: 'application/vnd.npm.install-v1+json' },
    });
    if (!response.ok) throw new Error('npmjs 版本列表请求失败 (' + response.status + ')');
    var metadata = await response.json();
    return Object.keys(metadata.versions).reverse();
  }

  function loadSdk() {
    if (!sdkPromise) {
      var config = window.ALGEO_CONFIG;
      var sdkUrl;
      sdkPromise = new Promise(function (resolve, reject) {
        sdkUrl = getSdkUrl(config);
        var script = document.createElement('script');
        script.src = sdkUrl;
        script.onload = function () {
          if (typeof window.AlgeoSdk?.create !== 'function') {
            reject(new Error('此 SDK 未提供示例所需的 AlgeoSdk.create()。'));
            return;
          }
          showRuntimeInfo(config, sdkUrl, window.AlgeoSdk.VERSION);
          resolve(window.AlgeoSdk);
        };
        script.onerror = function () {
          reject(new Error('无法下载 SDK 脚本。'));
        };
        document.head.appendChild(script);
      }).catch(function (error) {
        var message = document.createElement('p');
        message.setAttribute('role', 'alert');
        message.textContent = 'SDK 加载失败：' + error.message + ' ' +
          (sdkUrl || '') + ' ';
        Object.assign(message.style, {
          margin: '12px',
          padding: '12px',
          color: '#991b1b',
          background: '#fef2f2',
          overflowWrap: 'anywhere',
        });
        var link = document.createElement('a');
        link.href = './index.html';
        link.textContent = '返回示例首页检查配置';
        message.appendChild(link);
        document.body.prepend(message);
        throw error;
      });
    }
    return sdkPromise;
  }

  function mergeConfig(config) {
    var sanitized = sanitizeConfig(config || {});
    return Object.assign({}, DEFAULT_CONFIG, sanitized);
  }

  function getConfig() {
    return mergeConfig(readStoredConfig());
  }

  function setConfig(config) {
    var next = mergeConfig(config);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('[Algeo examples] Failed to save local config.', error);
    }
    window.ALGEO_CONFIG = next;
    showRuntimeInfo(next);
    return next;
  }

  function resetConfig() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[Algeo examples] Failed to reset local config.', error);
    }
    window.ALGEO_CONFIG = Object.assign({}, DEFAULT_CONFIG);
    showRuntimeInfo(window.ALGEO_CONFIG);
    return window.ALGEO_CONFIG;
  }

  function showRuntimeInfo(config, sdkUrl, sdkVersion) {
    function render() {
      if (!document.body) return;

      var info = document.getElementById('algeo-runtime-info');
      if (!info) {
        info = document.createElement('div');
        info.id = 'algeo-runtime-info';
        info.setAttribute('role', 'status');
        document.body.appendChild(info);
      }
      var isCustomBaseUrl = config.baseUrl.replace(/\/+$/, '') !== DEFAULT_CONFIG.baseUrl.replace(/\/+$/, '');
      info.title = '当前示例使用的 Base URL：' + config.baseUrl;
      info.textContent = 'baseurl · ' + config.baseUrl;
      if (sdkUrl) {
        info.title += '\nSDK: ' + sdkUrl;
        var source = config.sdkSource === 'npm' ? 'npm ' + config.sdkVersion : '自定义路径';
        info.textContent = 'SDK ' + (sdkVersion || source) + ' · ' + info.textContent;
      }
      Object.assign(info.style, {
        position: 'fixed',
        right: '8px',
        bottom: '6px',
        zIndex: '2147483647',
        maxWidth: 'min(52vw, 360px)',
        padding: '3px 7px',
        overflow: 'hidden',
        color: isCustomBaseUrl ? '#92400e' : '#64748b',
        background: isCustomBaseUrl ? '#fffbeb' : 'rgba(255, 255, 255, 0.78)',
        border: isCustomBaseUrl ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.24)',
        borderRadius: '999px',
        boxShadow: isCustomBaseUrl ? '0 2px 8px rgba(180, 83, 9, 0.18)' : '0 1px 4px rgba(15, 23, 42, 0.06)',
        font: '10px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        opacity: isCustomBaseUrl ? '1' : '0.62',
        pointerEvents: 'none',
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render, { once: true });
    } else {
      render();
    }
  }

  window.ALGEO_CONFIG_DEFAULTS = Object.assign({}, DEFAULT_CONFIG);
  window.ALGEO_CONFIG_STORAGE_KEY = STORAGE_KEY;
  window.ALGEO_CONFIG = getConfig();
  window.ALGEO_CONFIG_API = {
    get: getConfig,
    set: setConfig,
    reset: resetConfig,
    readStored: readStoredConfig,
    getSdkUrl: getSdkUrl,
    getNpmVersions: getNpmVersions,
    loadSdk: loadSdk,
  };
  showRuntimeInfo(window.ALGEO_CONFIG);
})();
