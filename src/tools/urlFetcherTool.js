// src/tools/urlFetcherTool.js
import { z } from 'zod';
import { fetchUrlContent } from '../services/searchService.js';
import logger from '../utils/logger.cjs';

export const urlFetcherTool = {
  name: 'fetchUrl',
  description: '지정된 URL의 웹 페이지 콘텐츠를 가져와 텍스트 형태로 반환합니다.',
  inputSchema: {
    url: z.string().url({ message: '유효한 URL을 입력해야 합니다.' }),
  },
  async handler({ url }) {
    logger.info(`[UrlFetcherTool] Executing with URL: "${url}"`);

    try {
      const result = await fetchUrlContent(url);
      logger.info(`[UrlFetcherTool] Successfully executed for URL: "${url}"`);
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
        `[UrlFetcherTool] Error executing for URL "${url}": ${error.message}`,
        { error: error.stack },
      );
      // MCP SDK 표준 오류 형식 또는 throw error
      // throw error; // searchService에서 이미 적절한 오류 메시지를 포함하여 throw 하고 있음
      // searchService에서 throw된 오류를 그대로 전달하여 server.js의 최상위 오류 처리기가 처리하도록 합니다.
      // 또는, 여기서 MCP 표준 오류 객체로 변환하여 반환할 수도 있습니다.
      // 예: return { error: { message: error.message, code: 'URL_FETCH_FAILED' } };
      // 현재는 searchService의 오류를 그대로 throw 합니다.
      throw error;
    }
  },
};
