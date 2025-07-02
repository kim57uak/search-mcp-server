// src/services/searchService.js
import { serviceConfig } from '../config/serviceConfig.js';
import logger from '../utils/logger.cjs';
import { createCrawler } from '../crawlers/crawlerFactory.js'; // CrawlerFactory 임포트
import { cleanHtml } from '../utils/htmlParser.js';

// 크롤러 인스턴스를 관리하기 위한 변수.
// 실제 프로덕션 환경에서는 요청별로 생성하거나,
// 애플리케이션 레벨에서 싱글톤 또는 풀링 전략을 사용할 수 있습니다.
// 여기서는 간단하게 함수 호출 시마다 생성/종료하는 방식을 사용합니다.
// let crawler = null; // 이 방식 대신 각 함수 내에서 생성/종료

/**
 * Naver 검색을 수행합니다. (함수명은 naverSearch이지만 내부 로직은 Google을 가리키고 있었음. 주석 참고)
 * @param {string} query - 검색어
 * @param {boolean} includeHtml - 결과에 HTML 태그를 포함할지 여부
 * @returns {Promise<object>} 검색 결과 객체 { query, resultText, retrievedAt }
 * @throws {Error} 검색 중 오류 발생 시
 */
export const naverSearch = async (query, includeHtml = false) => {
  // 함수명을 naverSearch로 유지하되, serviceConfig.naverSearch를 사용하도록 명확히 함.
  // 이전 코드에서 Google search 주석이 있었으나, 설정은 naverSearch를 따르고 있었음.
  logger.info(
    `[SearchService] Initiating Naver search for query: "${query}", includeHtml: ${includeHtml}`,
  );

  // 도구 레벨에서 Zod로 유효성 검사가 수행되므로 서비스 레벨에서는 제거 또는 간소화
  // if (!query || typeof query !== 'string' || query.trim() === '') {
  //   logger.error('[SearchService] Invalid query provided for Naver search.');
  //   throw new Error('유효한 검색어를 입력해야 합니다.');
  // }

  const { baseUrl, referer } = serviceConfig.naverSearch;
  const searchUrl = `${baseUrl}${encodeURIComponent(query)}`;

  let crawlerInstance = null;
  try {
    // serviceConfig.crawler에서 크롤러 설정을 가져옴
    crawlerInstance = await createCrawler(serviceConfig.crawler);
    logger.info(`[SearchService] Using ${crawlerInstance.constructor.name} for Naver search.`);

    // pageOptions 구성
    const pageOptions = {
      referer, // Naver 검색 시 사용할 Referer
      // 필요시 serviceConfig.crawler.type에 따라 waitUntil, timeout 등을 여기서 설정 가능
      // 예: waitUntil: serviceConfig.crawler[serviceConfig.crawler.type]?.waitUntil
    };

    logger.info(`[SearchService] Requesting URL via ${crawlerInstance.constructor.name}: ${searchUrl}`);
    const rawHtml = await crawlerInstance.getRawHtml(searchUrl, pageOptions);

    logger.info('[SearchService] Raw HTML received for Naver search');
    const resultText = cleanHtml(rawHtml, includeHtml);
    logger.debug('[SearchService] Cleaned Naver search result text:', resultText.substring(0, 200));
    const retrievedAt = new Date().toISOString();

    logger.info(
      `[SearchService] Successfully retrieved and processed Naver search results for query: "${query}"`,
    );

    return {
      query,
      resultText,
      retrievedAt,
    };
  } catch (error) {
    logger.error(
      `[SearchService] Error during Naver search for query "${query}": ${error.message}`,
      { stack: error.stack },
    );
    throw error;
  } finally {
    if (crawlerInstance) {
      await crawlerInstance.close();
      logger.info(`[SearchService] ${crawlerInstance.constructor.name} instance closed after Naver search.`);
    }
  }
};

/**
 * Bing 검색을 수행합니다.
 * @param {string} query - 검색어
 * @param {boolean} includeHtml - 결과에 HTML 태그를 포함할지 여부
 * @returns {Promise<object>} 검색 결과 객체 { query, resultText, retrievedAt, searchEngine: 'bing' }
 * @throws {Error} 검색 중 오류 발생 시
 */
export const bingSearch = async (query, includeHtml = false) => {
  logger.info(
    `[SearchService] Initiating Bing search for query: "${query}", includeHtml: ${includeHtml}`,
  );

  // 도구 레벨에서 Zod로 유효성 검사가 수행되므로 서비스 레벨에서는 제거 또는 간소화
  // if (!query || typeof query !== 'string' || query.trim() === '') {
  //   logger.error('[SearchService] Invalid query provided for Bing search.');
  //   throw new Error('유효한 검색어를 입력해야 합니다.');
  // }

  const { baseUrl, referer } = serviceConfig.bingSearch;
  const searchUrl = `${baseUrl}${encodeURIComponent(query)}`;

  let crawlerInstance = null;
  try {
    crawlerInstance = await createCrawler(serviceConfig.crawler);
    logger.info(`[SearchService] Using ${crawlerInstance.constructor.name} for Bing search.`);

    const pageOptions = {
      referer, // Bing 검색 시 사용할 Referer
    };

    logger.info(`[SearchService] Requesting URL via ${crawlerInstance.constructor.name}: ${searchUrl}`);
    const rawHtml = await crawlerInstance.getRawHtml(searchUrl, pageOptions);

    logger.info('[SearchService] Raw HTML received for Bing search');
    const resultText = cleanHtml(rawHtml, includeHtml);
    logger.debug('[SearchService] Cleaned Bing search result text:', resultText.substring(0, 200));
    const retrievedAt = new Date().toISOString();

    logger.info(
      `[SearchService] Successfully retrieved and processed Bing search results for query: "${query}"`,
    );

    return {
      query,
      resultText,
      retrievedAt,
      searchEngine: 'bing',
    };
  } catch (error) {
    logger.error(
      `[SearchService] Error during Bing search for query "${query}": ${error.message}`,
      { stack: error.stack },
    );
    throw error;
  } finally {
    if (crawlerInstance) {
      await crawlerInstance.close();
      logger.info(`[SearchService] ${crawlerInstance.constructor.name} instance closed after Bing search.`);
    }
  }
};

/**
 * Daum 검색을 수행합니다.
 * @param {string} query - 검색어
 * @param {boolean} includeHtml - 결과에 HTML 태그를 포함할지 여부
 * @returns {Promise<object>} 검색 결과 객체 { query, resultText, retrievedAt, searchEngine: 'daum' }
 * @throws {Error} 검색 중 오류 발생 시
 */
export const daumSearch = async (query, includeHtml = false) => {
  logger.info(
    `[SearchService] Initiating Daum search for query: "${query}", includeHtml: ${includeHtml}`,
  );

  // 도구 레벨에서 Zod로 유효성 검사가 수행되므로 서비스 레벨에서는 제거 또는 간소화
  // if (!query || typeof query !== 'string' || query.trim() === '') {
  //   logger.error('[SearchService] Invalid query provided for Daum search.');
  //   throw new Error('유효한 검색어를 입력해야 합니다.');
  // }

  // serviceConfig에서 daumSearch 설정을 가져옵니다.
  const { baseUrl, referer, defaultParams = {} } = serviceConfig.daumSearch;
  // Daum 검색 URL 구성 (기본 파라미터와 쿼리 결합)
  // 예시: const searchUrl = `${baseUrl}${encodeURIComponent(query)}&${new URLSearchParams(defaultParams).toString()}`;
  // Daum의 경우 q 파라미터 외에 다른 파라미터가 URL에 이미 포함되어 있을 수 있으므로, 단순하게 query만 추가합니다.
  // 필요하다면 defaultParams를 사용하여 URL을 더 정교하게 구성할 수 있습니다.
  const searchUrl = `${baseUrl}${encodeURIComponent(query)}`;

  let crawlerInstance = null;
  try {
    crawlerInstance = await createCrawler(serviceConfig.crawler);
    logger.info(`[SearchService] Using ${crawlerInstance.constructor.name} for Daum search.`);

    const pageOptions = {
      referer, // Daum 검색 시 사용할 Referer
    };

    logger.info(`[SearchService] Requesting URL via ${crawlerInstance.constructor.name}: ${searchUrl}`);
    const rawHtml = await crawlerInstance.getRawHtml(searchUrl, pageOptions);

    logger.info('[SearchService] Raw HTML received for Daum search');
    const resultText = cleanHtml(rawHtml, includeHtml);
    logger.debug('[SearchService] Cleaned Daum search result text:', resultText.substring(0, 200));
    const retrievedAt = new Date().toISOString();

    logger.info(
      `[SearchService] Successfully retrieved and processed Daum search results for query: "${query}"`,
    );

    return {
      query,
      resultText,
      retrievedAt,
      searchEngine: 'daum', // 어떤 검색엔진을 사용했는지 명시 (선택적)
    };
  } catch (error) {
    logger.error(
      `[SearchService] Error during Daum search for query "${query}": ${error.message}`,
      { stack: error.stack },
    );
    throw error;
  } finally {
    if (crawlerInstance) {
      await crawlerInstance.close();
      logger.info(`[SearchService] ${crawlerInstance.constructor.name} instance closed after Daum search.`);
    }
  }
};

/**
 * 주어진 URL의 내용을 가져와 텍스트 콘텐츠를 추출합니다.
 * @param {string} url - 가져올 웹 페이지의 URL
 * @returns {Promise<object>} 추출된 텍스트 콘텐츠와 요청 시간을 포함하는 객체 { url, textContent, retrievedAt }
 * @throws {Error} URL 가져오기 또는 처리 중 오류 발생 시
 */
export const fetchUrlContent = async (url) => {
  logger.info(`[SearchService] Initiating content fetch for URL: "${url}"`);

  // 도구 레벨에서 Zod로 유효성 검사가 수행되므로 서비스 레벨에서는 제거 또는 간소화
  // if (!url || typeof url !== 'string' || !url.startsWith('http')) {
  //   logger.error('[SearchService] Invalid URL provided for content fetch.');
  //   throw new Error('유효한 URL을 입력해야 합니다 (예: http://example.com).');
  // }

  let crawlerInstance = null;
  try {
    crawlerInstance = await createCrawler(serviceConfig.crawler);
    logger.info(`[SearchService] Using ${crawlerInstance.constructor.name} for URL fetch.`);

    // fetchUrlContent는 특정 pageOptions이 크게 필요 없을 수 있으나, 필요시 여기에 추가
    // const pageOptions = {
    //   userAgent: 'MyCustomAgent/1.0', // 예시
    // };
    // const rawHtml = await crawlerInstance.getRawHtml(url, pageOptions);

    logger.info(`[SearchService] Requesting URL via ${crawlerInstance.constructor.name}: ${url}`);
    const rawHtml = await crawlerInstance.getRawHtml(url); // 기본 옵션으로 호출

    logger.info('[SearchService] Raw HTML received from URL');
    const textContent = cleanHtml(rawHtml, false); // 항상 HTML 태그 제거
    logger.debug('[SearchService] Cleaned text content from URL:', textContent.substring(0, 500));
    const retrievedAt = new Date().toISOString();

    logger.info(
      `[SearchService] Successfully retrieved and processed content for URL: "${url}"`,
    );

    return {
      url,
      textContent,
      retrievedAt,
    };
  } catch (error) {
    logger.error(
      `[SearchService] Error during content fetch for URL "${url}": ${error.message}`,
      { stack: error.stack },
    );
    throw error;
  } finally {
    if (crawlerInstance) {
      await crawlerInstance.close();
      logger.info(`[SearchService] ${crawlerInstance.constructor.name} instance closed after URL fetch.`);
    }
  }
};
