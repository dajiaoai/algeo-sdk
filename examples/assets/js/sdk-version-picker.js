(function () {
  window.createSdkVersionPicker = function (root, getVersions) {
    const input = root.querySelector('[role="combobox"]');
    const toggle = root.querySelector('.sdk-version-toggle');
    const menu = root.querySelector('.sdk-version-menu');
    const list = root.querySelector('[role="listbox"]');
    const status = root.querySelector('[role="status"]');
    let versions = ['latest'];
    let request;
    let loadingMessage = '';
    let filter = '';
    let activeIndex = -1;

    function setActive(index) {
      list.children[activeIndex]?.removeAttribute('data-active');
      activeIndex = index;
      const option = list.children[index];
      if (option) {
        option.setAttribute('data-active', '');
        input.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function render() {
      setActive(-1);
      const matches = versions.filter(version => version.toLowerCase().includes(filter));
      list.replaceChildren(...matches.map((version, index) => {
        const option = document.createElement('div');
        option.className = 'sdk-version-option';
        option.id = list.id + '-' + index;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(version === input.value.trim()));
        option.textContent = version;
        return option;
      }));
      list.scrollTop = 0;
      status.textContent = loadingMessage || (matches.length ? '' : '未找到匹配版本');
    }

    function open(query = '') {
      if (input.disabled) return;
      const wasClosed = menu.hidden;
      filter = query.trim().toLowerCase();
      menu.hidden = false;
      root.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      if (!request && wasClosed) {
        loadingMessage = '正在加载版本…';
        request = getVersions().then(published => {
          versions = ['latest', ...published];
          loadingMessage = '';
        }).catch(() => {
          loadingMessage = '版本列表加载失败';
          request = null;
        }).finally(() => {
          if (!menu.hidden) render();
        });
      }
      render();
    }

    function close() {
      setActive(-1);
      menu.hidden = true;
      root.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
    }

    function choose(option) {
      input.value = option.textContent;
      close();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    input.addEventListener('focus', () => input.select());
    input.addEventListener('click', () => {
      if (menu.hidden) {
        input.select();
        open();
      }
    });
    input.addEventListener('input', () => open(input.value));

    input.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (menu.hidden) open();
        const count = list.children.length;
        if (count) {
          const step = event.key === 'ArrowDown' ? 1 : -1;
          const next = activeIndex === -1 && step === -1 ? count - 1 : (activeIndex + step + count) % count;
          setActive(next);
        }
      } else if (event.key === 'Escape' && !menu.hidden) {
        event.preventDefault();
        close();
      } else if (event.key === 'Enter' && !menu.hidden && list.children[activeIndex]) {
        event.preventDefault();
        choose(list.children[activeIndex]);
      }
    });

    toggle.addEventListener('mousedown', event => event.preventDefault());
    toggle.addEventListener('click', () => {
      input.focus();
      if (menu.hidden) open();
      else close();
    });

    list.addEventListener('mousedown', event => {
      if (event.target.closest('[role="option"]')) event.preventDefault();
    });
    list.addEventListener('click', event => {
      const option = event.target.closest('[role="option"]');
      if (option) choose(option);
    });
    root.addEventListener('focusout', event => {
      if (!root.contains(event.relatedTarget)) close();
    });

    return { close };
  };
})();
