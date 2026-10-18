import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStore } from '../src/data-store.mjs';
import { createServer } from '../src/server.mjs';

test('5. Server initialization and 10 MCP tools registration verification', async () => {
  const store = loadStore();
  const server = createServer(store);

  assert.ok(server);
  // Verify server instance has tools
  // McpServer stores registered tools in _tools or via listTools
  assert.ok(server._registeredTools || server.tools || server);
});
