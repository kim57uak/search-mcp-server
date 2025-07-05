// src/tools/urlFetcherTool.js
import { z } from 'zod';
import { fetchUrlContent } from '../services/searchService.js';
import logger from '../utils/logger.cjs';

export const urlFetcherTool = {
  name: 'fetchUrl',
  description:
    '제공된 URL의 웹 페이지 콘텐츠를 가져옵니다. 선택적으로 검색어(query)를 제공하면, 해당 URL에 검색어를 추가하여 요청하고 그 결과를 반환합니다. (예: URL이 검색 엔진의 기본 URL일 경우, query를 추가하여 검색 실행)',
  inputSchema: {
    url: z.string().url({ message: '유효한 URL을 입력해야 합니다.' }),
    query: z.string().optional(), // 검색어 (선택 사항)
    queryParamName: z.string().optional().default('q'), // 검색어를 전달할 URL 파라미터 이름 (기본값 'q')
    includeHtml: z.boolean().optional().default(false), // HTML 태그 포함 여부
  },
  async handler({ url, query, queryParamName, includeHtml }) {
    let targetUrl = url;
    let executionType = 'content fetch';

    if (query && query.trim() !== '') {
      executionType = 'custom URL search';
      try {
        const urlObject = new URL(url);
        // 기존 쿼리 파라미터는 유지하면서 새 검색어를 추가하거나 덮어씁니다.
        urlObject.searchParams.set(queryParamName, query);
        targetUrl = urlObject.toString();
      } catch (e) {
        logger.error(`[UrlFetcherTool] Invalid base URL provided for custom search: "${url}"`, { error: e });
        throw new Error(`커스텀 검색을 위한 기본 URL이 잘못되었습니다: ${url}`);
      }
    }

    logger.info(`[UrlFetcherTool] Executing ${executionType}. Target URL: "${targetUrl}", IncludeHTML: ${includeHtml}`);

    try {
      // searchService.fetchUrlContent는 이제 includeHtml 파라미터를 받습니다.
      const result = await fetchUrlContent(targetUrl, includeHtml);
      logger.info(`[UrlFetcherTool] Successfully executed ${executionType} for target URL: "${targetUrl}"`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ...result, originalUrl: url, queryUsed: query, targetUrl }),
          },
        ],
      };
    } catch (error) {
      logger.error(
        `[UrlFetcherTool] Error executing ${executionType} for target URL "${targetUrl}": ${error.message}`,
        { error: error.stack, originalUrl: url, queryUsed: query },
      );
      throw error;
    }
  },
};