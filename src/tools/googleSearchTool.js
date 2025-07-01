// src/tools/googleSearchTool.js
import { z } from 'zod';
import { googleSearch as searchServiceGoogleSearch } from '../services/searchService.js'; // 서비스 함수 이름 변경 방지
import logger from '../utils/logger.cjs';

export const googleSearchTool = {
  name: 'googleSearch',
  description:
    'Google 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.',
  inputSchema: z.object({
    // inputSchema는 객체여야 합니다.
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    includeHtml: z.boolean().optional().default(false), // 기본값은 HTML 태그 제거
  }),
  async handler({ query, includeHtml }) {
    // zod가 유효성 검사 후 분해 할당
    logger.info(
      `[GoogleSearchTool] Executing with query: "${query}", includeHtml: ${includeHtml}`,
    );

    try {
      // searchService의 googleSearch 함수 호출
      const result = await searchServiceGoogleSearch(query, includeHtml);

      logger.info(
        `[GoogleSearchTool] Successfully executed for query: "${query}"`,
      );
      // MCP 콘텐츠 구조로 포맷하여 반환
      return {
        content: [
          {
            type: 'text', // 결과가 복잡한 객체이므로 JSON 문자열로 변환하여 text 타입으로 전달
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      logger.error(
        `[GoogleSearchTool] Error executing for query "${query}": ${error.message}`,
        { error: error.stack },
      );
      // 오류 발생 시 구조화된 오류 메시지를 포함하여 throw 하거나 반환할 수 있습니다.
      // MCP SDK가 오류를 어떻게 처리하는지에 따라 달라질 수 있습니다.
      // 여기서는 오류를 그대로 throw하여 server.js의 최상위 오류 처리기가 처리하도록 합니다.
      // 또는 MCP 표준 오류 형식으로 반환할 수도 있습니다.
      // 예: return { error: { message: error.message, code: 'SEARCH_FAILED' } };
      throw error; // 에러를 다시 던져서 상위에서 처리하도록 함
    }
  },
};
