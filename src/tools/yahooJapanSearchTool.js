// src/tools/yahooJapanSearchTool.js
import { z } from 'zod';
import logger from '../utils/logger.cjs';
import { yahooJapanSearch } from '../services/searchService.js';

export const yahooJapanSearchTool = {
  name: 'yahooJapanSearch',
  description:
    'Yahoo! JAPAN 검색엔진을 사용하여 검색을 수행하고 그 결과를 반환합니다. 입력 검색어는 일본어 또는 영어로 번역되어야 하며 (현재 placeholder로 처리), 검색 결과는 주로 일본어로 제공됩니다.',
  inputSchema: {
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false),
  },
  async handler({ query, includeHtml }) {
    if (typeof query !== 'string' || !query.trim()) {
      const errMsg = '[YahooJapanSearchTool] 검색어(query)는 필수이며, 빈 문자열일 수 없습니다.';
      logger.error(errMsg, { query });
      throw new Error(errMsg);
    }
    logger.info(
      `[YahooJapanSearchTool] Received request - Query: "${query}", Include HTML: ${includeHtml}`,
    );
    logger.warn(
      `[YahooJapanSearchTool] Query translation to Japanese or English is recommended for optimal Yahoo! JAPAN search results. Current query: "${query}"`,
    );

    try {
      const searchResult = await yahooJapanSearch(query, includeHtml);
      logger.info(
        `[YahooJapanSearchTool] Successfully executed Yahoo! JAPAN search for query: "${query}" (used: "${searchResult.query}")`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(searchResult) }],
      };
    } catch (error) {
      logger.error(
        `[YahooJapanSearchTool] Error during Yahoo! JAPAN search for query "${query}": ${error.message}`,
        { stack: error.stack, query, includeHtml },
      );
      throw error;
    }
  },
};
