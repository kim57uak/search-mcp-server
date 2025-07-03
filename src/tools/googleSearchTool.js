// src/tools/googleSearchTool.js
import { z } from 'zod';
import logger from '../utils/logger.cjs';
import { googleSearch } from '../services/searchService.js'; // searchService에서 googleSearch 함수 임포트

export const googleSearchTool = {
  name: 'googleSearch',
  description:
    'Google 검색을 수행하고 결과를 반환합니다. "인간처럼" 검색 페이지와 상호작용하여 결과를 가져옵니다.',
  inputSchema: z.object({
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false),
  }),
  async handler({ query, includeHtml }) {
    logger.info(
      `[GoogleSearchTool] Received request - Query: "${query}", Include HTML: ${includeHtml}`,
    );

    try {
      const searchResult = await googleSearch(query, includeHtml);
      logger.info(
        `[GoogleSearchTool] Successfully executed Google search for query: "${query}"`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(searchResult) }],
      };
    } catch (error) {
      logger.error(
        `[GoogleSearchTool] Error during Google search for query "${query}": ${error.message}`,
        { stack: error.stack, query, includeHtml },
      );
      // MCP에서는 오류를 다시 throw하여 server.js의 중앙 오류 처리기에서 처리하도록 함
      throw error;
    }
  },
};
