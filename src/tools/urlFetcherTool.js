// src/tools/urlFetcherTool.js
import { z } from 'zod';
import { fetchUrlContent } from '../services/searchService.js';
import logger from '../utils/logger.cjs';

const urlFetcherInputSchema = z.object({
  url: z.string().url({ message: '유효한 URL을 입력해야 합니다 (예: http://example.com).' }),
});

export const urlFetcherTool = {
  name: 'fetchUrl',
  description: '주어진 URL의 웹 페이지 내용을 가져와 텍스트 콘텐츠를 반환합니다.',
  inputSchema: urlFetcherInputSchema, // Use the Zod schema object directly
  handler: async (rawInputs) => {
    const validationResult = urlFetcherInputSchema.safeParse(rawInputs);
    if (!validationResult.success) {
      logger.error(
        '[UrlFetcherTool] Invalid inputs for URL fetch:',
        validationResult.error.flatten(),
      );
      throw new Error(
        `입력 값 유효성 검사 실패: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      );
    }
    const { url } = validationResult.data;

    logger.info(`[UrlFetcherTool] Received request to fetch URL: "${url}"`);

    try {
      const content = await fetchUrlContent(url);
      logger.info(`[UrlFetcherTool] Successfully fetched content for URL: "${url}"`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(content),
          },
        ],
      };
    } catch (error) {
      logger.error(
        `[UrlFetcherTool] Error fetching URL "${url}": ${error.message}`,
        { stack: error.stack },
      );
      throw error;
    }
  },
};
