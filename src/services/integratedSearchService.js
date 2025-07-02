// src/services/integratedSearchService.js
import { naverSearch, daumSearch, bingSearch } from './searchService.js';
import logger from '../utils/logger.cjs';

/**
 * Naver, Daum, Bing 검색을 동시에 수행하고 결과를 통합합니다.
 * @param {string} query - 검색어
 * @param {boolean} includeHtml - 결과에 HTML 태그를 포함할지 여부
 * @returns {Promise<object>} 통합 검색 결과 객체
 * @throws {Error} 하나 이상의 검색 서비스에서 오류 발생 시
 */
export const integratedSearch = async (query, includeHtml = false) => {
  logger.info(
    `[IntegratedSearchService] Initiating integrated search for query: "${query}", includeHtml: ${includeHtml}`,
  );

  // 도구 레벨에서 Zod로 유효성 검사가 수행되므로 서비스 레벨에서는 제거 또는 간소화
  // if (!query || typeof query !== 'string' || query.trim() === '') {
  //   logger.error(
  //     '[IntegratedSearchService] Invalid query provided for integrated search.',
  //   );
  //   throw new Error('유효한 검색어를 입력해야 합니다.');
  // }

  try {
    const [naverResults, daumResults, bingResults] = await Promise.all([
      naverSearch(query, includeHtml).catch((err) => {
        logger.error(`[IntegratedSearchService] Naver search failed: ${err.message}`);
        return { error: 'Naver search failed', details: err.message, searchEngine: 'naver' };
      }),
      daumSearch(query, includeHtml).catch((err) => {
        logger.error(`[IntegratedSearchService] Daum search failed: ${err.message}`);
        return { error: 'Daum search failed', details: err.message, searchEngine: 'daum' };
      }),
      bingSearch(query, includeHtml).catch((err) => {
        logger.error(`[IntegratedSearchService] Bing search failed: ${err.message}`);
        return { error: 'Bing search failed', details: err.message, searchEngine: 'bing' };
      }),
    ]);

    const retrievedAt = new Date().toISOString();

    // 각 결과에 searchEngine 필드가 이미 searchService에서 추가되므로, 여기서는 집계만 수행
    const integratedResult = {
      query,
      results: [
        naverResults,
        daumResults,
        bingResults,
      ],
      retrievedAt,
    };

    logger.info(
      `[IntegratedSearchService] Successfully completed integrated search for query: "${query}"`,
    );
    return integratedResult;
  } catch (error) {
    // Promise.allSettled를 사용하지 않았으므로, 개별 catch에서 처리되지 않은 에러는 여기서 잡힐 수 있음
    // (현재는 개별 catch에서 모든 에러를 처리하고 에러 객체를 반환하므로 이 catch 블록은 실행되지 않을 가능성이 높음)
    logger.error(
      `[IntegratedSearchService] Unexpected error during integrated search for query "${query}": ${error.message}`,
      { stack: error.stack },
    );
    // 모든 검색이 실패했거나 예기치 않은 오류 발생 시
    throw new Error(`통합 검색 중 오류가 발생했습니다: ${error.message}`);
  }
};
