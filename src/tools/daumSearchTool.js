// src/tools/daumSearchTool.js
import { z } from 'zod';
import { daumSearch } from '../services/searchService.js'; // Corrected import
import logger from '../utils/logger.cjs';

const daumSearchInputSchema = z.object({
  query: z.string().min(1, { message: '검색어는 필수 입력 항목이며, 비워둘 수 없습니다.' }),
  includeHtml: z.boolean().default(false).describe('true로 설정하면 결과에 HTML 태그를 포함하고, false이면 제거된 텍스트만 반환합니다.'),
});

export const daumSearchTool = {
  name: 'daumSearch',
  description:
    'Daum 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.',
  inputSchema: daumSearchInputSchema, // Use the Zod schema object directly
  handler: async (rawInputs) => {
    const validationResult = daumSearchInputSchema.safeParse(rawInputs);
    if (!validationResult.success) {
      logger.error(
        '[DaumSearchTool] Invalid inputs for Daum search:',
        validationResult.error.flatten(),
      );
      throw new Error(
        `입력 값 유효성 검사 실패: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      );
    }
    const { query, includeHtml } = validationResult.data;

    logger.info(
      `[DaumSearchTool] Received request for Daum search with query: "${query}", includeHtml: ${includeHtml}`,
    );

    try {
      const searchResult = await daumSearch(query, includeHtml);
      logger.info(
        `[DaumSearchTool] Successfully performed Daum search for query: "${query}"`,
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
        `[DaumSearchTool] Error during Daum search for query "${query}": ${error.message}`,
        { stack: error.stack },
      );
      throw error;
    }
  },
};
