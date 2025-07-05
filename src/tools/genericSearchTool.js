// src/tools/genericSearchTool.js
import { z } from 'zod';
import { executeGenericSearch, performIntegratedSearch } } from '../services/searchService.js';
import logger from '../utils/logger.cjs';

export const genericSearchTool = {
  name: 'search',
  description: `웹 검색을 수행합니다. 특정 검색 엔진을 지정하거나, 언어 코드를 제공하여 해당 언어를 지원하는 여러 엔진에서 검색할 수 있습니다.
엔진을 지정하지 않으면 사용 가능한 여러 엔진에서 통합 검색을 시도합니다.
지원되는 검색 엔진 목록은 'search_engines.json' 파일을 참고하세요.
결과에서 HTML 태그를 포함할지 여부를 선택할 수 있습니다.`,
  inputSchema: {
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    engineName: z.string().optional(), // 예: "Naver", "Bing" 등. 지정하지 않으면 통합 검색 시도.
    languageCode: z.string().optional(), // 예: "ko", "en". engineName과 함께 사용되거나, 통합 검색 시 필터로 사용.
    includeHtml: z.boolean().optional().default(false),
  },
  async handler({ query, engineName, languageCode, includeHtml }) {
    logger.info(
      `[GenericSearchTool] Executing with query: "${query}", engine: ${engineName}, lang: ${languageCode}, includeHtml: ${includeHtml}`,
    );

    try {
      let result;
      if (engineName) {
        // 특정 엔진 지정 시
        logger.info(`[GenericSearchTool] Performing search on specific engine: ${engineName}`);
        result = await executeGenericSearch(query, engineName, languageCode, includeHtml);
      } else {
        // 엔진 미지정 시 통합 검색 (languageCode는 필터로 사용될 수 있음)
        logger.info(`[GenericSearchTool] Performing integrated search. Language filter: ${languageCode || 'any'}`);
        result = await performIntegratedSearch(query, languageCode, includeHtml);
      }

      logger.info(
        `[GenericSearchTool] Successfully executed search for query: "${query}"`,
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
        `[GenericSearchTool] Error executing for query "${query}": ${error.message}`,
        { error: error.stack, query, engineName, languageCode, includeHtml },
      );
      throw error;
    }
  },
};
