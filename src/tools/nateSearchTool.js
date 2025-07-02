// src/tools/nateSearchTool.js
import { z } from 'zod';
import { nateSearch } from '../services/searchService.js';
import logger from '../utils/logger.cjs';

export const nateSearchTool = {
  name: 'nateSearch',
  description: 'Nate 검색 엔진을 사용하여 웹 검색을 수행합니다. HTML 태그 포함 여부를 선택할 수 있습니다.',
  inputSchema: z.object({
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false),
  }),
  async handler({ query, includeHtml }) {
    logger.info(
      `[NateSearchTool] Received request for Nate search with query: "${query}", includeHtml: ${includeHtml}`,
    );

    try {
      const searchResult = await nateSearch(query, includeHtml);
      logger.info(
        `[NateSearchTool] Successfully retrieved Nate search results for query: "${query}"`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(searchResult) }],
      };
    } catch (error) {
      logger.error(
        `[NateSearchTool] Error during Nate search for query "${query}": ${error.message}`,
        { error: error.stack }, // Log the full error object for more details
      );
      // MCP 표준에 따라 오류를 반환하거나 throw. 여기서는 throw하여 상위에서 처리하도록 함.
      throw error;
    }
  },
};
