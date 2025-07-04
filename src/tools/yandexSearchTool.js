// src/tools/yandexSearchTool.js
import { z } from 'zod';
import logger from '../utils/logger.cjs';
import { yandexSearch } from '../services/searchService.js';

export const yandexSearchTool = {
  name: 'yandexSearch',
  description:
    'Yandex 검색을 수행하고 결과를 반환합니다. 러시아어 번역된 검색어 사용이 권장됩니다.',
  inputSchema: {
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false),
  },
  async handler({ query, includeHtml }) {
    if (typeof query !== 'string' || !query.trim()) {
      const errMsg = '[YandexSearchTool] 검색어(query)는 필수이며, 빈 문자열일 수 없습니다.';
      logger.error(errMsg, { query });
      throw new Error(errMsg);
    }
    logger.info(
      `[YandexSearchTool] Received request - Query: "${query}", Include HTML: ${includeHtml}`,
    );
    logger.warn(
      `[YandexSearchTool] Query translation to Russian is recommended for optimal Yandex search results. Current query: "${query}"`,
    );

    try {
      const searchResult = await yandexSearch(query, includeHtml);
      logger.info(
        `[YandexSearchTool] Successfully executed Yandex search for query: "${query}" (used: "${searchResult.query}")`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(searchResult) }],
      };
    } catch (error) {
      logger.error(
        `[YandexSearchTool] Error during Yandex search for query "${query}": ${error.message}`,
        { stack: error.stack, query, includeHtml },
      );
      throw error;
    }
  },
};
