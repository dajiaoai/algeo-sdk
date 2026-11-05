import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EmbeddedEditor } from '../dist/algeo-sdk.esm.js';

const item = { id: 'id', name: '母版', content: '{}' };
async function request(callbacks, operation, args = []) {
  const editor = new EmbeddedEditor({});
  editor.masterTemplates = callbacks;
  const responses = [];
  const accepted = editor.handleRequestMessage(
    {
      type: 'masterTemplateRequest',
      requestId: 'request-id',
      operation,
      args,
    },
    { postMessage: (message) => responses.push(message) },
  );
  assert.equal(accepted, true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(responses.length, 1);
  return responses[0];
}

test('SDK routes read-only system template requests to the host', async () => {
  const response = await request(
    { listSystem: async () => [item] },
    'listSystem',
  );
  assert.equal(response.success, true);
  assert.deepEqual(response.result, [item]);
});

test('SDK rejects missing callbacks, invalid arguments and duplicate IDs', async () => {
  assert.match((await request({}, 'listSystem')).error.message, /未配置/);
  assert.match(
    (await request({ listSystem: async () => [item] }, 'listSystem', ['id']))
      .error.message,
    /参数/,
  );
  assert.match(
    (await request({ listSystem: async () => [item, item] }, 'listSystem'))
      .error.message,
    /唯一/,
  );
});

test('SDK refuses personal templates and all write operations even if supplied at runtime', async () => {
  for (const operation of ['listMine', 'create', 'update', 'delete']) {
    let called = false;
    const response = await request(
      {
        [operation]: async () => {
          called = true;
        },
      },
      operation,
    );
    assert.equal(response.success, false);
    assert.match(response.error.message, /参数/);
    assert.equal(called, false);
  }
});
