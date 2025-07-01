// src/server.js
import express from 'express';
import http from 'http'; // Express 앱을 위해 http 모듈 사용
import { McpServer } from '@modelcontextprotocol/sdk'; // StdioClientTransport 제거
import { tools } from './tools/index.js';
import logger from './utils/logger.cjs';
import { environment } from './config/serviceConfig.js'; // serviceConfig 제거

const PORT = process.env.PORT || 3000;

async function main() {
  logger.info(`[Server] Initializing MCP Server in ${environment} mode...`);

  // 1. MCP 서버 인스턴스 생성
  // McpServer 생성자가 transport를 직접 받는지, 아니면 별도 연결인지 SDK 문서를 봐야 명확합니다.
  // 우선 transport 없이 생성 시도 후, 별도 http 리스너를 구성합니다.
  const mcpServer = new McpServer({
    logger: logger.child({ context: 'McpServer' }), // MCP 서버에 로거 전달
    // tools: tools, // McpServer 생성자에 직접 tools를 전달할 수도 있음 (SDK 문서 확인 필요)
  });

  // 2. 도구 등록
  for (const tool of tools) {
    try {
      await mcpServer.registerTool(tool);
      logger.info(`[Server] Tool "${tool.name}" registered successfully.`);
    } catch (error) {
      logger.error(
        `[Server] Failed to register tool "${tool.name}": ${error.message}`,
        { stack: error.stack },
      );
    }
  }

  // 3. HTTP 서버 설정 (Express 사용)
  const app = express();
  app.use(express.json()); // JSON 요청 본문 파싱

  // MCP 도구 실행을 위한 엔드포인트
  app.post('/mcp', async (req, res) => {
    const { tool: toolName, inputs, requestId } = req.body;
    logger.info(`[HTTP] Received MCP request for tool: ${toolName}`, {
      requestId,
      inputs,
    });

    if (!toolName || typeof toolName !== 'string') {
      logger.warn('[HTTP] Invalid MCP request: Missing or invalid tool name.');
      return res
        .status(400)
        .json({
          error: { message: 'Tool name is required and must be a string.' },
        });
    }

    if (!inputs || typeof inputs !== 'object') {
      logger.warn(
        '[HTTP] Invalid MCP request: Missing or invalid inputs object.',
      );
      return res
        .status(400)
        .json({ error: { message: 'Inputs object is required.' } });
    }

    try {
      // McpServer의 executeTool (또는 유사한) 메소드를 사용하여 도구 실행
      // 이 부분은 MCP SDK의 실제 API에 따라 달라집니다.
      // 가상의 executeTool 메소드가 있다고 가정합니다.
      // 실제로는 mcpServer.processRequest({ tool: toolName, inputs, id: requestId }) 와 같은 형태일 수 있습니다.

      // MCP SDK의 `processRequest` 메소드가 존재한다고 가정하고 사용합니다.
      // 이 메소드는 일반적으로 요청 객체를 받아 처리 후 응답 객체를 반환하거나,
      // 오류 발생 시 예외를 던집니다.
      const mcpResponse = await mcpServer.processRequest({
        tool: toolName,
        inputs,
        id: requestId,
      });

      logger.info(
        `[HTTP] Successfully processed MCP request for tool: ${toolName}`,
        { requestId },
      );
      res.status(200).json(mcpResponse);
    } catch (error) {
      logger.error(
        `[HTTP] Error processing MCP request for tool "${toolName}": ${error.message}`,
        { requestId, stack: error.stack, inputs },
      );
      // ZodError인 경우 좀 더 친절한 메시지 제공 가능
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: {
            message: 'Input validation failed.',
            details: error.errors,
            tool: toolName,
          },
        });
      }
      // 일반적인 MCP 오류 응답 형식 (가정)
      // SDK가 오류를 특정 형식으로 반환한다면 해당 형식을 따릅니다.
      // 여기서는 발생한 오류 메시지를 기반으로 응답을 구성합니다.
      res.status(500).json({
        error: {
          message: error.message || 'An internal server error occurred.',
          tool: toolName,
          // stack: environment === 'development' ? error.stack : undefined, // 개발 모드에서만 스택 노출
        },
      });
    }
  });

  // 기본 라우트 (헬스 체크 등)
  app.get('/', (req, res) => {
    res.send(`MCP Google Search Server is running in ${environment} mode.`);
  });

  const httpServer = http.createServer(app);

  httpServer.listen(PORT, () => {
    logger.info(`[Server] HTTP server listening on port ${PORT}`);
    logger.info(
      `[Server] MCP Google Search server started successfully. Ready to accept requests.`,
    );
    logger.info(
      `[Server] Available tools: ${tools.map((t) => t.name).join(', ')}`,
    );
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
    httpServer.close(() => {
      logger.info('[Server] HTTP server closed.');
      // mcpServer.close(); // MCP 서버 종료 로직이 있다면 호출
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error(`[Server] Failed to start the server: ${error.message}`, {
    stack: error.stack,
  });
  process.exit(1);
});
