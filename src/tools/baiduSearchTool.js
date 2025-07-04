// src/tools/baiduSearchTool.js
import { z } from 'zod';
import logger from '../utils/logger.cjs';
import { baiduSearch } from '../services/searchService.js';

export const baiduSearchTool = {
  name: 'baiduSearch',
  description:
    'Baidu 검색을 수행하고 결과를 반환합니다. 중국어 번역된 검색어 사용이 권장됩니다.',
  inputSchema: {
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false),
  },
  async handler({ query, includeHtml }) {
    if (typeof query !== 'string' || !query.trim()) {
      const errMsg = '[BaiduSearchTool] 검색어(query)는 필수이며, 빈 문자열일 수 없습니다.';
      logger.error(errMsg, { query });
      throw new Error(errMsg);
    }
    logger.info(
      `[BaiduSearchTool] Received request - Query: "${query}", Include HTML: ${includeHtml}`,
    );
    // 실제 Baidu 검색 시에는 중국어로 번역된 query를 사용해야 함을 명시.
    // searchService.baiduSearch 내부에서 번역 처리를 가정하거나, 여기서 처리할 수 있음.
    // 현재는 searchService에서 placeholder로 처리 중.
    logger.warn(
      `[BaiduSearchTool] Query translation to Chinese is recommended for optimal Baidu search results. Current query: "${query}"`,
    );

    try {
      const searchResult = await baiduSearch(query, includeHtml);
      logger.info(
        `[BaiduSearchTool] Successfully executed Baidu search for query: "${query}" (used: "${searchResult.query}")`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(searchResult) }],
      };
    } catch (error) {
      logger.error(
        `[BaiduSearchTool] Error during Baidu search for query "${query}": ${error.message}`,
        { stack: error.stack, query, includeHtml },
      );
      throw error;
    }
  },
};
