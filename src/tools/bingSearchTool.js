// src/tools/bingSearchTool.js
import { z } from 'zod';
import { bingSearch } from '../services/searchService.js';
import logger from '../utils/logger.cjs';

export const bingSearchTool = {
  name: 'bingSearch',
  description: 'Bing을 사용하여 웹 검색을 수행하고 검색 결과를 반환합니다.',
  inputSchema: {
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false),
  },
  async handler({ query, includeHtml }) {
    logger.info(
      `[bingSearchTool] Received request - Query: "${query}", Include HTML: ${includeHtml}`,
    );
    try {
      const searchResult = await bingSearch(query, includeHtml);
      logger.info(
        `[bingSearchTool] Successfully retrieved Bing search results for query: "${query}"`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(searchResult) }],
      };
    } catch (error) {
      logger.error(
        `[bingSearchTool] Error during Bing search for query "${query}": ${error.message}`,
        { error: error.stack },
      );
      // MCP SDK는 오류 객체를 자동으로 직렬화하여 오류 응답으로 변환합니다.
      // 따라서 여기서 오류를 다시 throw하면 됩니다.
      throw error;
    }
  },
};