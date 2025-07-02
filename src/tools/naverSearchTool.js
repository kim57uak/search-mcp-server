// src/tools/naverSearchTool.js
import { z } from 'zod';
import { naverSearch } from '../services/searchService.js'; // Corrected import
import logger from '../utils/logger.cjs';

const naverSearchInputSchema = z.object({
  query: z.string().min(1, { message: '검색어는 필수 입력 항목이며, 비워둘 수 없습니다.' }),
  includeHtml: z.boolean().default(false).describe('true로 설정하면 결과에 HTML 태그를 포함하고, false이면 제거된 텍스트만 반환합니다.'),
});

export const naverSearchTool = {
  name: 'naverSearch',
  description:
    'Naver 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.',
  inputSchema: naverSearchInputSchema, // Use the Zod schema object directly
  handler: async (rawInputs) => {
    const validationResult = naverSearchInputSchema.safeParse(rawInputs);
    if (!validationResult.success) {
      logger.error(
        '[NaverSearchTool] Invalid inputs for Naver search:',
        validationResult.error.flatten(),
      );
      throw new Error(
        `입력 값 유효성 검사 실패: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      );
    }
    const { query, includeHtml } = validationResult.data;

    logger.info(
      `[NaverSearchTool] Received request for Naver search with query: "${query}", includeHtml: ${includeHtml}`,
    );

    try {
      const searchResult = await naverSearch(query, includeHtml);
      logger.info(
        `[NaverSearchTool] Successfully performed Naver search for query: "${query}"`,
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
        `[NaverSearchTool] Error during Naver search for query "${query}": ${error.message}`,
        { stack: error.stack },
      );
      throw error;
    }
  },
};
