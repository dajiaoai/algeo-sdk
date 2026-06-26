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
    return next;
  }

  function resetConfig() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[Algeo examples] Failed to reset local config.', error);
    }
    window.ALGEO_CONFIG = Object.assign({}, DEFAULT_CONFIG);
    return window.ALGEO_CONFIG;
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
})();
