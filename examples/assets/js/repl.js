(async function () {
  const presets = [
    {
      group: '帮助与查询',
      title: '查看命令帮助',
      description:
        '从 help 开始了解 REPL；也可以输入 help Point、help style 或 help animation。',
      code: 'help',
    },
    {
      group: '帮助与查询',
      title: '查询画板与对象',
      description: '读取当前画板信息、对象定义和所有画板编号，不修改内容。',
      code: 'info\nlist\nlist_slides',
    },
    {
      group: '几何构造',
      title: '创建点、线段与圆',
      description:
        '创建两个点、一条线段和一个圆；所有示例对象使用 demo_ 前缀。',
      code: 'def demo_A := Point(-2,0)\ndef demo_B := Point(2,0)\ndef demo_seg := Segment(demo_A,demo_B)\ndef demo_circle := Circle(demo_A,3)',
    },
    {
      group: '几何构造',
      title: '求交点与表达式值',
      description: '构造直线与圆，在指定位置附近求交点，再读取交点坐标。',
      code: 'def demo_line := Line(Point(-3,0),Point(3,0))\ndef demo_c := Circle(Point(0,0),2)\nintersect demo_P := demo_line with demo_c near (2,0)\neval demo_P.x',
    },
    {
      group: '样式与标签',
      title: '修改颜色、大小与标签',
      description: '创建一个点，设置颜色和大小，添加动态标签并查看最终样式。',
      code: 'def demo_styled := Point(1,1)\nstyle #demo_styled { color: #1267e9; pointSize: 8; }\nlabel demo_styled := "示例点 {{id}}"\ncheck_style #demo_styled',
    },
    {
      group: '动画与交互',
      title: '滑动条驱动动点',
      description: '拖动滑动条，观察点的横坐标随之变化。',
      code: 'def demo_t := Slider(?:=0).withMin(-3).withMax(3).withStep(0.1)\ndef demo_moving := Point(demo_t,1)',
    },
    {
      group: '动画与交互',
      title: '按钮播放动画',
      description: '执行后在画板中点击“播放动画”，通过多行事件启动滑动条。',
      code: 'def demo_anim := Slider(?:=0).withMin(-3).withMax(3).withSpeed(1).withDirection(SliderDirection.pingpong)\ndef demo_dot := Point(demo_anim,0)\ndef demo_play := Button("播放动画")\non demo_play.click do\n  play demo_anim\nend\ncheck_event demo_play.click',
    },
    {
      group: '画板管理',
      title: '新建画板并绘图',
      description:
        '每次执行都会新增并切换到一个画板。list_slides 显示从 1 开始的编号，可用 switch_slide 1 切回第一个画板。',
      code: 'new_slide\ndef demo_origin := Point(0,0)\nlist_slides',
    },
  ];
  const get = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') || 'editor';
  const config = window.ALGEO_CONFIG;
  let sdk;
  let busy = false;
  let hasOutput = false;

  function updateControls() {
    get('run').disabled = busy || !sdk;
    get('undo').disabled =
      busy || !sdk || mode !== 'editor' || !sdk.history.canUndo();
    get('redo').disabled =
      busy || !sdk || mode !== 'editor' || !sdk.history.canRedo();
  }

  function appendOutput(command, text, error = false) {
    const output = get('output');
    if (!hasOutput) output.replaceChildren();
    hasOutput = true;
    const entry = document.createElement('pre');
    entry.textContent = `> ${command}\n${text || '(无输出)'}`;
    if (error) entry.className = 'error';
    output.appendChild(entry);
    output.scrollTop = output.scrollHeight;
  }

  function showPreset() {
    const preset = presets[Number(get('preset').value)];
    get('command').value = preset.code;
    get('preset-description').textContent = preset.description;
  }

  let group;
  presets.forEach((preset, index) => {
    if (!group || group.label !== preset.group) {
      group = document.createElement('optgroup');
      group.label = preset.group;
      get('preset').appendChild(group);
    }
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = preset.title;
    group.appendChild(option);
  });
  get('preset').value = '0';
  get('preset').addEventListener('change', showPreset);
  showPreset();

  for (const name of ['editor', 'presentation']) {
    const url = new URL(location.href);
    url.searchParams.set('mode', name);
    get(name + '-link').href = url.href;
    if (name === mode) get(name + '-link').setAttribute('aria-current', 'page');
  }
  get('mode-label').textContent = mode === 'editor' ? '编辑模式' : '演示模式';
  get('undo').hidden = get('redo').hidden = mode !== 'editor';
  get('reload').addEventListener('click', () => location.reload());
  get('clear-output').addEventListener('click', () => {
    get('output').replaceChildren();
    hasOutput = false;
  });

  async function perform(action) {
    if (!sdk || busy) return;
    const command = get('command').value.trim();
    if (action === 'repl' && !command) {
      appendOutput('repl', '请先输入 REPL 指令。', true);
      get('command').focus();
      return;
    }
    busy = true;
    updateControls();
    try {
      if (action === 'repl') {
        // Keep the full script intact, including on … do … end blocks.
        const { output } = await sdk.repl(command);
        appendOutput(command, output);
      } else {
        await sdk.history[action]();
        appendOutput(action, action === 'undo' ? '已撤销' : '已重做');
      }
    } catch (error) {
      const message = `${error.code ? '[' + error.code + '] ' : ''}${error.message || String(error)}`;
      appendOutput(action === 'repl' ? command : action, message, true);
    } finally {
      busy = false;
      updateControls();
    }
  }

  get('run').addEventListener('click', () => perform('repl'));
  get('undo').addEventListener('click', () => perform('undo'));
  get('redo').addEventListener('click', () => perform('redo'));
  get('command').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      perform('repl');
    }
  });

  try {
    if (!['editor', 'presentation'].includes(mode)) {
      throw new Error(
        'mode 仅支持 editor 或 presentation，请使用上方模式入口重新打开。',
      );
    }
    if (!config?.appId)
      throw new Error('请先在示例首页或 config.js 中配置 appId。');
    const shareId = params.has('shareId')
      ? params.get('shareId').trim()
      : config.shareId;
    sdk = await AlgeoSdk.create(get('algeo-container'), {
      baseUrl: config.baseUrl,
      mode,
      [mode]: {
        auth: { appId: config.appId },
        ...(shareId ? { shareId } : {}),
      },
    });
    if (typeof sdk.repl !== 'function') {
      sdk.destroy();
      sdk = undefined;
      throw new Error('当前 SDK 不支持此模式的 REPL，请先构建最新版本。');
    }
  } catch (error) {
    appendOutput('初始化', error.message || String(error), true);
  }
  updateControls();
})();
