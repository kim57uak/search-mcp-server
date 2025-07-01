// src/services/searchService.js
import axios from 'axios';
import striptags from 'striptags'; // HTML 태그 제거용
// import * as cheerio from 'cheerio'; // HTML 파싱 및 선택적 태그 제거/추출용 (striptags로 충분하면 cheerio는 불필요)
import { serviceConfig } from '../config/serviceConfig.js';
import logger from '../utils/logger.cjs';

/**
 * HTML 문자열에서 HTML 태그를 제거하거나 특정 부분만 추출합니다.
 * 이 함수는 매뉴얼에서 언급된 cleanObject와 유사한 역할을 합니다.
 * @param {string} htmlString - 원본 HTML 문자열
 * @param {boolean} includeHtml - HTML 태그를 포함할지 여부
 * @returns {string} 처리된 문자열
 */
const cleanHtml = (htmlString, includeHtml) => {
  if (includeHtml) {
    // TODO: 만약 특정 검색 결과 영역만 추출하고 싶다면 cheerio를 사용하여 해당 로직 구현
    // 예: const $ = cheerio.load(htmlString);
    //     const searchResultsHtml = $('#search-results-container').html(); // 가상의 ID
    //     return searchResultsHtml || htmlString; // 특정 영역이 없으면 원본 반환
    return htmlString; // 현재는 전체 HTML 반환
  }
  return striptags(htmlString);
};

/**
 * Google 검색을 수행합니다.
 * @param {string} query - 검색어
 * @param {boolean} includeHtml - 결과에 HTML 태그를 포함할지 여부 (true: 포함, false: 제거)
 * @returns {Promise<object>} 검색 결과 객체 { query, resultText, retrievedAt, (includeHtml ? rawHtml : undefined) }
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

  const { baseUrl } = serviceConfig.googleSearch; // defaultParams 제거
  const searchUrl = `${baseUrl}?q=${encodeURIComponent(query)}`;
  // 실제 Google 검색 시에는 User-Agent 등 헤더 설정이 필요할 수 있음
  // Google은 자동화된 쿼리를 차단할 수 있으므로, 실제 서비스에서는 Google Custom Search API 사용을 권장합니다.
  // 이 예제에서는 웹 페이지를 직접 가져오는 방식을 사용합니다.

  try {
    logger.debug(`[SearchService] Requesting URL: ${searchUrl}`);
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (response.status !== 200) {
      logger.error(
        `[SearchService] Failed to fetch Google search results. Status: ${response.status}`,
      );
      throw new Error(`Google 검색 요청 실패: 상태 코드 ${response.status}`);
    }

    const rawHtml = response.data;
    const resultText = cleanHtml(rawHtml, includeHtml);
    const retrievedAt = new Date().toISOString();

    logger.info(
      `[SearchService] Successfully retrieved and processed search results for query: "${query}"`,
    );

    const searchResult = {
      query,
      resultText, // HTML이 제거되었거나, includeHtml=true 시 원본 HTML (또는 특정 부분)
      retrievedAt,
    };

    if (includeHtml) {
      // 만약 cleanHtml에서 전체 HTML이 아닌 특정 부분만 추출했다면,
      // 원본 전체 HTML도 제공하고 싶을 경우 아래와 같이 추가 가능
      // searchResult.rawHtml = rawHtml;
    }

    return searchResult;
  } catch (error) {
    logger.error(
      `[SearchService] Error during Google search for query "${query}": ${error.message}`,
      { stack: error.stack },
    );
    if (axios.isAxiosError(error)) {
      throw new Error(`Google 검색 중 네트워크 오류 발생: ${error.message}`);
    }
    throw error; // 이미 Error 객체인 경우 그대로 throw
  }
};

// 다른 검색 관련 서비스 함수가 필요하면 여기에 추가
// 예: export const anotherSearchOperation = async (...) => { ... };
