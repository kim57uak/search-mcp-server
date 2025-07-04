// src/tools/yahooSearchTool.js
import { z } from 'zod';
import logger from '../utils/logger.cjs';
import { yahooSearch } from '../services/searchService.js';

export const yahooSearchTool = {
  name: 'yahooSearch',
  description:
    'Yahoo.com (영어권) 검색을 수행하고 결과를 반환합니다. 영어 번역된 검색어 사용이 권장됩니다.',
  inputSchema: {
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false),
  },
  async handler({ query, includeHtml }) {
    if (typeof query !== 'string' || !query.trim()) {
      const errMsg = '[YahooSearchTool] 검색어(query)는 필수이며, 빈 문자열일 수 없습니다.';
      logger.error(errMsg, { query });
      throw new Error(errMsg);
    }
    logger.info(
      `[YahooSearchTool] Received request - Query: "${query}", Include HTML: ${includeHtml}`,
    );
    logger.warn(
      `[YahooSearchTool] Query translation to English is recommended for optimal Yahoo.com search results. Current query: "${query}"`,
    );

    try {
      const searchResult = await yahooSearch(query, includeHtml);
      logger.info(
        `[YahooSearchTool] Successfully executed Yahoo.com search for query: "${query}" (used: "${searchResult.query}")`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(searchResult) }],
      };
    } catch (error) {
      logger.error(
        `[YahooSearchTool] Error during Yahoo.com search for query "${query}": ${error.message}`,
        { stack: error.stack, query, includeHtml },
      );
      throw error;
    }
  },
};
