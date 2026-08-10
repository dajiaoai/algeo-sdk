(function () {
  var STORAGE_KEY = 'ALGEO_EXAMPLES_CONFIG';
  var DEFAULT_CONFIG = {
    baseUrl: 'https://dajiaoai.com/',
    appId: 'YTVJDQZR',
    shareId: '33TA3484',
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
    ['baseUrl', 'appId', 'shareId'].forEach(function (key) {
      if (typeof config[key] === 'string') {
        var value = config[key].trim();
        if (value) next[key] = value;
      }
    });
    return next;
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

  function showRuntimeInfo(config) {
    function render() {
      if (!document.body) return;

      var info = document.getElementById('algeo-runtime-info');
      if (!info) {
        info = document.createElement('div');
        info.id = 'algeo-runtime-info';
        info.setAttribute('role', 'status');
        info.setAttribute('aria-label', '当前 Algeo Base URL');
        document.body.appendChild(info);
      }
      info.title = '当前示例使用的 Base URL：' + config.baseUrl;
      info.textContent = 'baseurl · ' + config.baseUrl;
      Object.assign(info.style, {
        position: 'fixed',
        right: '8px',
        bottom: '6px',
        zIndex: '2147483647',
        maxWidth: 'min(52vw, 360px)',
        padding: '3px 7px',
        overflow: 'hidden',
        color: '#64748b',
        background: 'rgba(255, 255, 255, 0.78)',
        border: '1px solid rgba(148, 163, 184, 0.24)',
        borderRadius: '999px',
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
        font: '10px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        opacity: '0.62',
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
  };
  showRuntimeInfo(window.ALGEO_CONFIG);
})();
