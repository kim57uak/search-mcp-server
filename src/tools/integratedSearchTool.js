// src/tools/integratedSearchTool.js
import { integratedSearch } from '../services/integratedSearchService.js';
import logger from '../utils/logger.cjs';

export const integratedSearchTool = {
  name: 'integratedSearch',
  description:
    'Naver, Daum, Bing 검색 엔진에서 동시에 검색을 수행하고 통합된 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '검색할 단어나 문장입니다.',
      },
      includeHtml: {
        type: 'boolean',
        description:
          'true로 설정하면 결과에 HTML 태그를 포함하고, false이면 제거된 텍스트만 반환합니다.',
        default: false,
      },
    },
    required: ['query'],
  },
  handler: async (inputs) => {
    const { query, includeHtml = false } = inputs;
    logger.info(
      `[IntegratedSearchTool] Received request for integrated search with query: "${query}", includeHtml: ${includeHtml}`,
    );

    if (!query || typeof query !== 'string' || query.trim() === '') {
      logger.error(
        '[IntegratedSearchTool] Invalid query provided for integrated search.',
      );
      throw new Error('유효한 검색어를 입력해야 합니다.');
    }

    try {
      const searchResults = await integratedSearch(query, includeHtml);
      logger.info(
        `[IntegratedSearchTool] Successfully performed integrated search for query: "${query}"`,
      );
      // MCP 응답 형식에 맞게 content를 문자열화된 JSON으로 반환
      return {
        content: [
          {
            type: 'text', // 또는 'json' 등 응답의 성격에 맞게
            text: JSON.stringify(searchResults),
          },
        ],
      };
    } catch (error) {
      logger.error(
        `[IntegratedSearchTool] Error during integrated search for query "${query}": ${error.message}`,
        { stack: error.stack },
      );
      // MCP 에러 형식에 맞게 반환할 수 있으나, 여기서는 일단 에러를 그대로 throw
      // McpServer에서 에러를 적절히 처리할 것으로 예상
      throw error;
    }
  },
};
