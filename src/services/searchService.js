// src/services/searchService.js
// import { load } from 'cheerio'; // 이제 htmlParser.js에서 사용
import { serviceConfig } from '../config/serviceConfig.js';
import logger from '../utils/logger.cjs';
import { getRawHtml } from '../utils/puppeteerHelper.js'; // Puppeteer 헬퍼 함수 임포트
import { cleanHtml } from '../utils/htmlParser.js'; // htmlParser 임포트

/**
 * Google 검색을 수행합니다.
 * @param {string} query - 검색어
 * @param {boolean} includeHtml - 결과에 HTML 태그를 포함할지 여부
 * @returns {Promise<object>} 검색 결과 객체 { query, resultText, retrievedAt }
 * @throws {Error} 검색 중 오류 발생 시
 */
export const googleSearch = async (query, includeHtml = false) => {
  logger.info(
    `[SearchService] Initiating Google search for query: "${query}", includeHtml: ${includeHtml}`,
  );

  if (!query || typeof query !== 'string' || query.trim() === '') {
    logger.error('[SearchService] Invalid query provided.');
    throw new Error('유효한 검색어를 입력해야 합니다.');
  }

  const { baseUrl, referer } = serviceConfig.googleSearch;
  const searchUrl = `${baseUrl}${encodeURIComponent(query)}`;

  try {
    logger.info(`[SearchService] Requesting URL via puppeteerHelper: ${searchUrl}`);
    // puppeteerHelper 사용 시, userAgent, headers 등은 serviceConfig.puppeteer 또는 helper의 기본값 사용
    const rawHtml = await getRawHtml(searchUrl, { referer }); // Google 검색 시 referer 전달

    logger.info('[SearchService] Raw HTML received for Google search');
    const resultText = cleanHtml(rawHtml, includeHtml);
    logger.debug('[SearchService] Cleaned Google search result text:', resultText.substring(0, 200));
    const retrievedAt = new Date().toISOString();

    logger.info(
      `[SearchService] Successfully retrieved and processed Google search results for query: "${query}"`,
    );

    return {
      query,
      resultText,
      retrievedAt,
    };
  } catch (error) {
    logger.error(
      `[SearchService] Error during Google search for query "${query}": ${error.message}`,
      { stack: error.stack },
    );
    // puppeteerHelper에서 발생한 특정 오류 메시지를 그대로 전달하거나, 여기서 추가 처리 가능
    throw error; // 에러를 다시 throw하여 상위 핸들러에서 처리
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

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    logger.error('[SearchService] Invalid URL provided.');
    throw new Error('유효한 URL을 입력해야 합니다 (예: http://example.com).');
  }

  try {
    logger.info(`[SearchService] Requesting URL via puppeteerHelper: ${url}`);
    // 특정 페이지 옵션이 필요 없다면 getRawHtml(url) 만 호출
    // 예: User-Agent나 특정 헤더를 이 URL에만 다르게 적용하고 싶다면 pageOptions으로 전달
    const rawHtml = await getRawHtml(url); // 기본 설정으로 URL 내용 가져오기

    logger.info('[SearchService] Raw HTML received from URL');
    // fetchUrlContent는 항상 HTML 태그를 제거하고 텍스트만 반환하므로 includeHtml=false 와 동일하게 처리
    const textContent = cleanHtml(rawHtml, false);
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
    // puppeteerHelper에서 발생한 특정 오류 메시지를 그대로 전달하거나, 여기서 추가 처리 가능
    // 예를 들어, "URL을 찾을 수 없습니다" 또는 "URL 요청 시간 초과" 등의 메시지는 puppeteerHelper에서 이미 생성됨
    throw error; // 에러를 다시 throw하여 상위 핸들러에서 처리
  }
};
