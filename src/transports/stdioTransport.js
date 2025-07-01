// src/transports/stdioTransport.js
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server'; // SDK에 따라 경로가 다를 수 있습니다. 예: '@modelcontextprotocol/sdk/dist/stdio-server-transport.js' 또는 '@modelcontextprotocol/sdk'
import logger from '../utils/logger.cjs';

/**
 * Creates and returns a new StdioServerTransport instance.
 * @returns {StdioServerTransport} A new instance of StdioServerTransport.
 */
export function createStdioTransport() {
  logger.info('[StdioTransport] Creating StdioServerTransport.');
  // StdioServerTransport 생성자에 옵션(예: logger)을 전달해야 할 수 있습니다.
  // const transport = new StdioServerTransport({ logger: logger.child({ context: 'StdioTransport' }) });
  const transport = new StdioServerTransport(); // 기본 생성자로 가정
  logger.info('[StdioTransport] StdioServerTransport instance created.');
  return transport;
}
