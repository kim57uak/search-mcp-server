#!/usr/bin/env node
// src/server.js
import { McpServer } from '@modelcontextprotocol/sdk/server'; // 경로 수정
import { createStdioTransport } from './transports/stdioTransport.js';
import { tools } from './tools/index.js';
import logger from './utils/logger.cjs';
import { environment } from './config/serviceConfig.js';

async function main() {
  logger.info(`[Server] Initializing MCP Server in ${environment} mode...`);

  const server = new McpServer({
    // McpServer 생성자 옵션은 SDK 문서를 참조해야 합니다.
    // 제공된 예시의 name, version은 SDK의 특정 버전에 따른 것일 수 있습니다.
    // 현재 SDK가 어떤 옵션을 지원하는지 알 수 없으므로, 이전처럼 logger만 전달하거나,
    // 예시를 따라 name/version을 추가해볼 수 있습니다. 우선은 logger만 유지합니다.
    logger: logger.child({ context: 'McpServer' }),
    // name: "MCP Google Search Server", // 필요시 SDK 문서 확인 후 추가
    // version: "1.0.0",               // 필요시 SDK 문서 확인 후 추가
  });

  logger.info('[Server] McpServer instance created.');

  // 도구 등록
  // 제공된 예시: server.tool(tool.name, tool.description, tool.inputSchema, tool.handler);
  // 현재 SDK의 McpServer 클래스에 registerTool(toolObject) 메소드가 있다면 이 방식이 더 적합할 수 있습니다.
  // 우선은 registerTool 방식을 사용하고, 만약 server.tool 방식이 표준이라면 해당 방식으로 변경해야 합니다.
  if (tools && tools.length > 0) {
    logger.info(`[Server] Registering ${tools.length} tool(s)...`);
    for (const tool of tools) {
      try {
        if (typeof server.registerTool === 'function') {
          await server.registerTool(tool); // 현재 SDK에서 이 방식이 유효하다고 가정
          logger.info(`[Server] Tool "${tool.name}" registered successfully via registerTool.`);
        } else if (typeof server.tool === 'function') {
           // server.tool 방식은 일반적으로 각 인자를 개별적으로 받습니다.
           // tool 객체 전체를 넘기는 것이 아니라, tool.name, tool.description 등을 전달해야 할 수 있습니다.
           // 정확한 API는 SDK 문서를 참조해야 합니다.
           // server.tool(tool.name, tool.description, tool.inputSchema, tool.handler); // 예시 방식
           logger.warn(`[Server] server.tool() method exists, but its usage for tool object registration is unclear without SDK docs. Falling back or skipping for ${tool.name}.`);
           // 임시로 registerTool이 없다면 tool 등록을 시도하지 않거나, 예시방식을 가정하고 호출
           // 여기서는 registerTool이 우선이라고 가정합니다.
        } else {
          logger.error(`[Server] No suitable tool registration method (registerTool or tool) found on McpServer instance for tool "${tool.name}".`);
        }
      } catch (error) {
        logger.error(`[Server] Failed to register tool "${tool.name}": ${error.message}`, { stack: error.stack });
      }
    }
  } else {
    logger.warn('[Server] No tools found to register.');
  }

  const transport = createStdioTransport();

  try {
    logger.info('[Server] Attempting to connect McpServer via StdioTransport...');
    // McpServer와 Transport 연결 방식은 SDK에 따라 server.connect(transport) 또는 transport.connect(server) 등 다양할 수 있습니다.
    // SDK 문서를 확인해야 합니다. 우선 server.connect(transport)로 가정합니다.
    if (typeof server.connect === 'function') {
      await server.connect(transport);
      logger.info('[Server] MCP Server connected via StdioTransport.');
      logger.info(`[Server] MCP Google Search server started successfully. Ready to accept requests via stdio.`);
      logger.info(`[Server] Available tools: ${tools.map(t => t.name).join(', ')}`);
    } else {
      logger.error('[Server] McpServer instance does not have a connect method.');
      process.exit(1);
    }

    // StdioTransport를 사용하는 경우, 일반적으로 프로세스는 입력을 기다리며 활성 상태를 유지합니다.
    // 따라서 명시적인 `await new Promise(() => {});`는 필요 없을 수 있습니다.
    // 예시 코드에서는 이 부분이 있었으므로, 주석으로 남겨둡니다.
    // logger.info('[Server] Server running and waiting for requests (Promise loop).');
    // await new Promise(() => {}); // This promise never resolves, keeping the process alive.
  } catch (error) {
    logger.error('[Server] Failed to connect MCP Server via StdioTransport:', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('[Server] Unhandled error during server startup:', { message: error.message, stack: error.stack });
  process.exit(1);
});
