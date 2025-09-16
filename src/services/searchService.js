// src/services/searchService.js
import { serviceConfig } from '../config/serviceConfig.js';
import logger from '../utils/logger.cjs';
import { createCrawler } from '../crawlers/crawlerFactory.js';
import HumanLikeGoogleCrawler from '../crawlers/humanLikeGoogleCrawler.js';
import AxiosGoogleCrawler from '../crawlers/axiosGoogleCrawler.js';
import { cleanHtml } from '../utils/htmlParser.js';
import { SearchEngineManager } from '../utils/searchEngineManager.js'; // 수정된 경로

// SearchEngineManager 인스턴스 생성
const searchEngineManager = new SearchEngineManager(); // 프로젝트 루트의 search_engines.json을 기본으로 사용


/**
 * Executes a search query on a specified search engine.
 * @param {string} query - The search query.
 * @param {string} engineName - The name of the search engine (e.g., "Google", "Naver").
 * @param {string} [languageCode] - Optional language code (e.g., "ko", "en").
 * @param {boolean} [includeHtml=false] - Whether to include raw HTML in the result.
 * @returns {Promise<object>} Search result object.
 * @throws {Error} If the engine is not found or if search fails.
 */
export const executeGenericSearch = async (query, engineName, languageCode = null, includeHtml = false) => {
  logger.info(
    `[SearchService] Initiating generic search. Query: "${query}", Engine: "${engineName}", Language: ${languageCode}, IncludeHTML: ${includeHtml}`
  );

  const engine = searchEngineManager.get_engine_by_name(engineName);
  if (!engine) {
    logger.error(`[SearchService] Search engine "${engineName}" not found.`);
    throw new Error(`Search engine "${engineName}" not found.`);
  }

  const engineConfig = serviceConfig[`${engineName.toLowerCase()}Search`] || {};
  const referer = engineConfig.referer || `${new URL(engine.base_url).protocol}//${new URL(engine.base_url).hostname}/`;

  const searchUrl = engine.build_query_url(query, languageCode);
  logger.info(`[SearchService] Constructed search URL: ${searchUrl}`);

  let crawlerInstance = null;
  try {
    crawlerInstance = await createCrawler(serviceConfig.crawler);
    logger.info(`[SearchService] Using ${crawlerInstance.constructor.name} for generic search on "${engineName}".`);

    const pageOptions = { referer };
    const rawHtml = await crawlerInstance.getRawHtml(searchUrl, pageOptions);
    const resultText = cleanHtml(rawHtml, includeHtml);
    const retrievedAt = new Date().toISOString();

    logger.info(`[SearchService] Successfully performed generic search on "${engineName}" for query: "${query}".`);
    return {
      query,
      engine: engineName,
      language: languageCode,
      resultText,
      retrievedAt,
      searchUrl
    };
  } catch (error) {
    logger.error(
      `[SearchService] Error during generic search on "${engineName}" for query "${query}": ${error.message}`,
      { stack: error.stack }
    );
    throw error;
  } finally {
    if (crawlerInstance) {
      await crawlerInstance.close();
      logger.info(`[SearchService] ${crawlerInstance.constructor.name} instance closed after generic search on "${engineName}".`);
    }
  }
};

/**
 * Performs an integrated search across multiple relevant search engines.
 * @param {string} query - The search query.
 * @param {string} [languageCode] - Optional language code to filter engines. If null, uses all engines.
 * @param {boolean} [includeHtml=false] - Whether to include raw HTML in the results.
 * @returns {Promise<Array<object>>} An array of search result objects from different engines.
 */
export const performIntegratedSearch = async (query, languageCode = null, includeHtml = false) => {
  logger.info(
    `[SearchService] Initiating integrated search. Query: "${query}", Language: ${languageCode}, IncludeHTML: ${includeHtml}`
  );

  let enginesToSearch;
  if (languageCode) {
    enginesToSearch = searchEngineManager.get_engines_by_language(languageCode);
    if (enginesToSearch.length === 0) {
        logger.warn(`[SearchService] No search engines found for language code: ${languageCode}. Falling back to all engines.`);
        enginesToSearch = searchEngineManager.get_all_engines();
    }
  } else {
    enginesToSearch = searchEngineManager.get_all_engines();
  }

  enginesToSearch = enginesToSearch.filter(engine => engine.name.toLowerCase() !== 'google');

  if (enginesToSearch.length === 0) {
    logger.warn('[SearchService] No engines available for integrated search after filtering.');
    return [];
  }

  const results = [];
  const searchPromises = enginesToSearch.map(engine =>
    executeGenericSearch(query, engine.name, languageCode, includeHtml)
      .then(result => ({ ...result, searchEngine: engine.name }))
      .catch(error => ({
        query,
        searchEngine: engine.name,
        language: languageCode,
        error: error.message,
        retrievedAt: new Date().toISOString(),
      }))
  );

  const settledResults = await Promise.allSettled(searchPromises);

  settledResults.forEach(settledResult => {
    if (settledResult.status === 'fulfilled') {
      results.push(settledResult.value);
    } else {
      // This case should ideally be caught by the .catch in the map above
      logger.error(`[SearchService] A promise was unexpectedly rejected in integrated search: ${settledResult.reason?.message || settledResult.reason}`, { stack: settledResult.reason?.stack });
      // results.push({ query, error: `Search failed for an engine: ${settledResult.reason?.message}`, retrievedAt: new Date().toISOString() });
    }
  });

  logger.info(`[SearchService] Integrated search completed for query: "${query}". Processed ${enginesToSearch.length} engines.`);
  return results;
};

/**
 * Google 검색을 수행합니다. (AxiosGoogleCrawler 우선, HumanLikeGoogleCrawler 폴백)
 * @param {string} query - 검색어
 * @param {boolean} [includeHtml=false] - 결과에 HTML 태그를 포함할지 여부
 * @returns {Promise<object>} 검색 결과 객체 { query, resultText, retrievedAt, searchEngine: 'google' }
 */

/**
 * HumanLikeGoogleCrawler를 직접 사용하여 Google 검색을 수행합니다.
 * @param {string} query - 검색어
 * @param {boolean} [includeHtml=false] - 결과에 HTML 태그를 포함할지 여부
 * @returns {Promise<object>} 검색 결과 객체 { query, resultText, retrievedAt, searchEngine: 'google' }
 */
export const humanLikeGoogleSearch = async (query, includeHtml = false) => {
  logger.info(
    `[SearchService] Initiating HumanLikeGoogleCrawler search for query: "${query}", includeHtml: ${includeHtml}`,
  );

  let crawlerInstance = null;
  try {
    crawlerInstance = new HumanLikeGoogleCrawler({
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 1000
    });
    logger.info(`[SearchService] Using HumanLikeGoogleCrawler for Google search.`);

    const rawHtml = await crawlerInstance.searchAndGetResults(query);
    const resultText = cleanHtml(rawHtml, includeHtml);
    const retrievedAt = new Date().toISOString();

    logger.info(
      `[SearchService] Successfully retrieved HumanLikeGoogleCrawler search results for query: "${query}"`,
    );

    return {
      query,
      resultText,
      retrievedAt,
      searchEngine: 'google',
    };
  } catch (error) {
    logger.error(
      `[SearchService] Error during HumanLikeGoogleCrawler search for query "${query}": ${error.message}`,
      { stack: error.stack },
    );
    throw error;
  } finally {
    if (crawlerInstance) {
      await crawlerInstance.close();
      logger.info(`[SearchService] ${crawlerInstance.constructor.name} instance closed after Google search.`);
    }
  }
};
export const googleSearch = async (query, includeHtml = false) => {
  logger.info(
    `[SearchService] Initiating Google search (axios-based) for query: "${query}", includeHtml: ${includeHtml}`,
  );

  let crawlerInstance = null;
  try {
    // Try axios-based crawler first (Python approach)
    crawlerInstance = new AxiosGoogleCrawler({
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 1000
    });
    logger.info(`[SearchService] Using AxiosGoogleCrawler for Google search.`);

    const result = await crawlerInstance.searchGoogle(query, includeHtml);
    
    logger.info(
      `[SearchService] Successfully retrieved Google search results for query: "${query}"`,
    );

    return result;
  } catch (axiosError) {
    logger.warn(
      `[SearchService] AxiosGoogleCrawler failed for query "${query}": ${axiosError.message}. Falling back to Puppeteer.`,
    );
    
    // Fallback to Puppeteer-based crawler
    try {
      const googleEngineConfig = serviceConfig.googleSearch;
      if (!googleEngineConfig) {
        throw new Error("Google search configuration is missing.");
      }

      const {
        baseUrl,
        referer,
      } = googleEngineConfig;

      const crawlerConfig = {
          ...(serviceConfig.crawler.puppeteer),
          searchInputSelector: googleEngineConfig.searchInputSelector,
          searchButtonSelector: googleEngineConfig.searchButtonSelector,
          baseUrl: baseUrl,
      };
      
      if (crawlerInstance) {
        await crawlerInstance.close();
      }
      
      crawlerInstance = new HumanLikeGoogleCrawler(crawlerConfig);
      logger.info(`[SearchService] Fallback to HumanLikeGoogleCrawler for Google search.`);

      const pageOptions = { referer };
      const rawHtml = await crawlerInstance.searchAndGetResults(query, pageOptions);

      logger.info('[SearchService] Raw HTML received from Puppeteer fallback');
      const resultText = cleanHtml(rawHtml, includeHtml);
      const retrievedAt = new Date().toISOString();

      return {
        query,
        resultText,
        retrievedAt,
        searchEngine: 'google',
      };
    } catch (puppeteerError) {
      logger.error(
        `[SearchService] Both crawlers failed for Google search "${query}": Axios: ${axiosError.message}, Puppeteer: ${puppeteerError.message}`,
      );
      throw new Error(`Google search failed: ${puppeteerError.message}`);
    }
  } finally {
    if (crawlerInstance) {
      await crawlerInstance.close();
      logger.info(`[SearchService] ${crawlerInstance.constructor.name} instance closed after Google search.`);
    }
  }
};

/**
 * 주어진 URL의 내용을 가져와 텍스트 콘텐츠를 추출합니다. - 유지되는 함수
 * @param {string} url - 가져올 웹 페이지의 URL
 * @param {boolean} [includeHtml=false] - HTML 태그를 포함할지 여부 (기본값 false)
 * @returns {Promise<object>} 추출된 텍스트 콘텐츠와 요청 시간을 포함하는 객체 { url, textContent, retrievedAt }
 */
export const fetchUrlContent = async (url, includeHtml = false) => {
  logger.info(`[SearchService] Initiating content fetch for URL: "${url}", includeHtml: ${includeHtml}`);

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    logger.error('[SearchService] Invalid URL provided for content fetch.');
    throw new Error('유효한 URL을 입력해야 합니다 (예: http://example.com).');
  }

  let crawlerInstance = null;
  try {
    crawlerInstance = await createCrawler(serviceConfig.crawler);
    logger.info(`[SearchService] Using ${crawlerInstance.constructor.name} for URL fetch.`);

    const rawHtml = await crawlerInstance.getRawHtml(url);

    logger.info('[SearchService] Raw HTML received from URL');
    const textContent = cleanHtml(rawHtml, includeHtml);
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
