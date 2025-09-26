#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createStdioTransport } from './transports/stdioTransport.js'; // Import createStdioTransport
import { tools } from './tools/index.js'; // Import tools
import logger from './utils/logger.cjs';

async function main() {
  const server = new McpServer({
    name: 'MCP HNT Package Sale Product Server',
    version: '1.0.0',
  });

  // Register tools
  tools.forEach((tool) => {
    server.tool(tool.name, tool.description, tool.inputSchema, tool.handler);
    logger.info(`Registered tool: ${tool.name}`);
  });

  const transport = createStdioTransport(); // Use the factory function
  try {
    await server.connect(transport);
    logger.info('MCP Server connected via StdioTransport.');
    // Keep the process alive so it doesn't exit prematurely
    await new Promise(() => {});
  } catch (error) {
    logger.error('Failed to connect MCP Server:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    logger.info('MCP Server running and waiting for requests.');
    // This promise never resolves, keeping the process alive.
    return new Promise(() => {});
  })
  .catch((error) => {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  });
