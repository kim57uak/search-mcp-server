// src/tools/bingSearchTool.js
import { z } from 'zod';
import { bingSearch } from '../services/searchService.js';
import logger from '../utils/logger.cjs';

const bingSearchInputSchema = z.object({
  query: z.string().min(1, { message: '검색어는 필수 입력 항목이며, 비워둘 수 없습니다.' }),
  includeHtml: z.boolean().default(false).describe('true로 설정하면 결과에 HTML 태그를 포함하고, false이면 제거된 텍스트만 반환합니다.'),
});

export const bingSearchTool = {
  name: 'bingSearch',
  description:
    'Bing 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.',
  inputSchema: bingSearchInputSchema, // Use the Zod schema object directly
  handler: async (rawInputs) => {
    const validationResult = bingSearchInputSchema.safeParse(rawInputs);
    if (!validationResult.success) {
      logger.error(
        '[BingSearchTool] Invalid inputs for Bing search:',
        validationResult.error.flatten(),
      );
      throw new Error(
        `입력 값 유효성 검사 실패: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      );
    }
    const { query, includeHtml } = validationResult.data;

    logger.info(
      `[BingSearchTool] Received request for Bing search with query: "${query}", includeHtml: ${includeHtml}`,
    );

    try {
      const searchResult = await bingSearch(query, includeHtml);
      logger.info(
        `[BingSearchTool] Successfully performed Bing search for query: "${query}"`,
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(searchResult),
          },
        ],
      };
    } catch (error) {
      logger.error(
        `[BingSearchTool] Error during Bing search for query "${query}": ${error.message}`,
        { stack: error.stack },
      );
      throw error;
    }
  },
};
