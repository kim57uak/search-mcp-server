// src/tools/daumSearchTool.js
import { z } from 'zod';
import { daumSearch as searchServiceDaumSearch } from '../services/searchService.js';
import logger from '../utils/logger.cjs';

export const daumSearchTool = {
  name: 'daumSearch',
  description:
    'Daum 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.',
  inputSchema: {
    // inputSchema는 객체여야 하며, z.object()로 감싸야 합니다.
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false), // 기본값은 HTML 태그 제거
  },
  async handler({ query, includeHtml }) {
    logger.info(
      `[DaumSearchTool] Executing with query: "${query}", includeHtml: ${includeHtml}`,
    );

    try {
      const result = await searchServiceDaumSearch(query, includeHtml);

      logger.info(
        `[DaumSearchTool] Successfully executed for query: "${query}"`,
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      logger.error(
        `[DaumSearchTool] Error executing for query "${query}": ${error.message}`,
        { error: error.stack },
      );
      // searchService에서 발생한 오류를 그대로 throw하여 server.js의 최상위 오류 처리기가 처리하도록 함
      throw error;
    }
  },
};
