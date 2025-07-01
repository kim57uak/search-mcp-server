// src/transports/stdioTransport.js
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export function createStdioTransport() {
  return new StdioServerTransport();
}
