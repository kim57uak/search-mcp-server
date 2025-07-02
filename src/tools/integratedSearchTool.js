// src/tools/integratedSearchTool.js
import { z } from 'zod';
import { integratedSearch } from '../services/integratedSearchService.js';
import logger from '../utils/logger.cjs';

const integratedSearchInputSchema = z.object({
  query: z.string().min(1, { message: '검색어는 필수 입력 항목이며, 비워둘 수 없습니다.' }),
  includeHtml: z.boolean().default(false).describe('true로 설정하면 결과에 HTML 태그를 포함하고, false이면 제거된 텍스트만 반환합니다.'),
});

export const integratedSearchTool = {
  name: 'integratedSearch',
  description:
    'Naver, Daum, Bing 검색 엔진에서 동시에 검색을 수행하고 통합된 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.',
  inputSchema: integratedSearchInputSchema, // Zod 스키마로 교체
  handler: async (rawInputs) => {
    // Zod 스키마로 유효성 검사 및 파싱
    const validationResult = integratedSearchInputSchema.safeParse(rawInputs);
    if (!validationResult.success) {
      logger.error(
        '[IntegratedSearchTool] Invalid inputs for integrated search:',
        validationResult.error.flatten(),
      );
      // MCP 에러 형식에 맞게 에러 메시지를 구성할 수 있음
      // 여기서는 간단히 Zod 에러 메시지를 사용
      throw new Error(
        `입력 값 유효성 검사 실패: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      );
    }
    const { query, includeHtml } = validationResult.data; // 검증되고 타입이 보장된 데이터

    logger.info(
      `[IntegratedSearchTool] Received request for integrated search with query: "${query}", includeHtml: ${includeHtml}`,
    );

    try {
      const searchResults = await integratedSearch(query, includeHtml);
      logger.info(
        `[IntegratedSearchTool] Successfully performed integrated search for query: "${query}"`,
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(searchResults),
          },
        ],
      };
    } catch (error) {
      logger.error(
        `[IntegratedSearchTool] Error during integrated search for query "${query}": ${error.message}`,
        { stack: error.stack },
      );
      throw error; // 서비스 레벨에서 발생한 에러는 그대로 전달
    }
  },
};
