// src/services/searchService.js
// import axios from 'axios';
// import striptags from 'striptags'; // HTML 태그 제거용
import { load } from 'cheerio';
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
  const $ = load(htmlString);
  $('script, style, noscript').remove();
  return $.text().replace(/\s+/g, ' ').trim();
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
  const searchUrl = `${baseUrl}${encodeURIComponent(query)}`;

  try {
    logger.info(`[SearchService] Requesting URL (puppeteer): ${searchUrl}`);
    // puppeteer 동적 import (ESM 호환)
    const puppeteer = (await import('puppeteer-extra')).default;
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({ 
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac용 크롬 경로
      args: ['--start-maximized'] // 브라우저를 최대화하여 실행
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.google.com/',
      'Connection': 'keep-alive',
    });
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    const rawHtml = await page.content();
    await browser.close();

    logger.info('[SearchService] Raw HTML received (puppeteer)');
    const resultText = cleanHtml(rawHtml, includeHtml);
    logger.debug('[SearchService] Cleaned result text:', resultText.substring(0, 200));
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
      // searchResult.rawHtml = rawHtml;
    }

    return searchResult;
  } catch (error) {
    logger.error(
      `[SearchService] Error during Google search for query "${query}": ${error.message}`,
      { stack: error.stack },
    );
    throw error;
  }
};

// 다른 검색 관련 서비스 함수가 필요하면 여기에 추가
// 예: export const anotherSearchOperation = async (...) => { ... };
