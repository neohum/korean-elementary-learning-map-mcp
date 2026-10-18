#!/usr/bin/env node
/**
 * packages/korean-elementary-learning-map-mcp/src/cli.mjs
 * 
 * Stdio transport CLI entrypoint for korean-elementary-learning-map-mcp.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadStore } from './data-store.mjs';
import { createServer } from './server.mjs';

async function main() {
  try {
    const store = loadStore();
    const server = createServer(store);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(
      `[korean-elementary-learning-map-mcp] Ready on stdio (Curricula: ${store.curricula.length}, Standards: ${store.standards.length}, Topics: ${store.topics.length})`
    );
  } catch (err) {
    console.error(`[korean-elementary-learning-map-mcp] Fatal error:`, err);
    process.exit(1);
  }
}

main();
