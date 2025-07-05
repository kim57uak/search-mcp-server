// src/services/searchService.js
import { serviceConfig } from '../config/serviceConfig.js';
import logger from '../utils/logger.cjs';
import { createCrawler } from '../crawlers/crawlerFactory.js';
import HumanLikeGoogleCrawler from '../crawlers/humanLikeGoogleCrawler.js';
import { cleanHtml } from '../utils/htmlParser.js';
import { SearchEngineManager } from '../../search_manager.py'; // Python 파일을 직접 임포트할 수 없습니다.

// Python으로 작성된 SearchEngineManager를 JavaScript 프로젝트에서 직접 사용하기 어렵습니다.
// 이 부분은 JavaScript로 재작성되거나, Python 프로세스를 별도로 실행하고 IPC를 통해 통신해야 합니다.
// 여기서는 JavaScript로 SearchEngineManager의 기능을 모방하여 진행합니다.
// 실제 프로덕션에서는 이 문제를 해결해야 합니다.

// Mock SearchEngineManager ( 원래는 search_manager.py 로부터 와야 함)
// 이 부분은 search_manager.py의 로직을 JavaScript로 변환한 가상 코드입니다.
// 실제로는 JSON 파일을 직접 읽고 처리하도록 구현합니다.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MockSearchEngine {
    constructor(name, baseUrl, queryParam, langParam, supportedLanguages) {
        this.name = name;
        this.base_url = baseUrl;
        this.query_param = queryParam;
        this.lang_param = langParam;
        this.supported_languages = supportedLanguages;
    }

    build_query_url(query, language = null) {
        const params = new URLSearchParams();
        params.append(this.query_param, query);
        if (language && this.lang_param && this.supported_languages.includes(language)) {
            params.append(this.lang_param, language);
        }
        // base_url에 이미 파라미터가 있을 수 있으므로, 이를 고려하여 조합
        const separator = this.base_url.includes('?') ? '&' : '?';
        return `${this.base_url}${separator}${params.toString()}`;
    }
}

class MockSearchEngineManager {
    constructor(configPath = "search_engines.json") {
        // configPath가 절대 경로가 아닐 경우, 이 파일의 위치를 기준으로 경로를 설정합니다.
        const resolvedConfigPath = path.isAbsolute(configPath) ? configPath : path.resolve(__dirname, '..', '..', configPath);
        this.configPath = resolvedConfigPath;
        this.engines = [];
        this._load_engines();
    }

    _load_engines() {
        try {
            const rawData = fs.readFileSync(this.configPath, 'utf-8');
            const config_data = JSON.parse(rawData);

            for (const engineData of config_data.engines || []) {
                const engine = new MockSearchEngine(
                    engineData.name,
                    engineData.base_url,
                    engineData.query_param,
                    engineData.lang_param,
                    engineData.supported_languages || []
                );
                this.engines.push(engine);
            }
        } catch (error) {
            logger.error(`[MockSearchEngineManager] Error loading or parsing '${this.configPath}': ${error.message}`, { stack: error.stack });
            // In a real app, you might throw or handle more gracefully
        }
    }

    get_all_engines() {
        return this.engines;
    }

    get_engines_by_language(language) {
        return this.engines.filter(engine => engine.supported_languages.includes(language));
    }

    get_engine_by_name(name) {
        return this.engines.find(engine => engine.name.toLowerCase() === name.toLowerCase()) || null;
    }
}

// search_manager.py 대신 MockSearchEngineManager 사용
const searchEngineManager = new MockSearchEngineManager();


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

  // Referer는 serviceConfig에서 가져오거나, search_engines.json에 추가하는 것을 고려.
  // 여기서는 serviceConfig에 해당 엔진의 referer 설정이 있다고 가정.
  // 예: const referer = serviceConfig[engineName.toLowerCase() + "Search"]?.referer;
  // 간단하게 하기 위해 여기서는 Referer를 하드코딩하거나, 설정 파일에 더 많은 정보가 필요함을 명시.
  // 실제로는 serviceConfig.js에서 가져오도록 수정 필요
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
      searchUrl // 반환값에 searchUrl 추가
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

  // Google (human-like)은 별도로 처리하거나, 여기서 제외하고 전용 tool을 사용하도록 유도
  // 여기서는 generic search 로직에 포함되지 않는다고 가정하고 필터링
  enginesToSearch = enginesToSearch.filter(engine => engine.name.toLowerCase() !== 'google');


  if (enginesToSearch.length === 0) {
    logger.warn('[SearchService] No engines available for integrated search after filtering.');
    return [];
  }

  const results = [];
  // 검색을 병렬로 수행
  const searchPromises = enginesToSearch.map(engine =>
    executeGenericSearch(query, engine.name, languageCode, includeHtml)
      .then(result => ({ ...result, searchEngine: engine.name })) // 성공한 결과
      .catch(error => ({ // 실패한 결과도 포함하여 어떤 엔진에서 오류가 났는지 알 수 있도록 함
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
      // executeGenericSearch 내에서 이미 에러를 잡아 객체로 반환하므로, 이 경우는 거의 없음.
      // 만약 executeGenericSearch가 에러를 throw하게 변경된다면 이 부분이 필요.
      logger.error(`[SearchService] A promise was rejected in integrated search: ${settledResult.reason}`);
      // results.push({ error: 'Failed to fetch from one engine', details: settledResult.reason });
    }
  });

  logger.info(`[SearchService] Integrated search completed for query: "${query}". Found ${results.length} results/errors.`);
  return results;
};


/**
 * Google 검색을 수행합니다. (인간과 유사한 행동 시뮬레이션) - 유지되는 함수
 * @param {string} query - 검색어
 * @param {boolean} [includeHtml=false] - 결과에 HTML 태그를 포함할지 여부
 * @returns {Promise<object>} 검색 결과 객체 { query, resultText, retrievedAt, searchEngine: 'google' }
 */
export const googleSearch = async (query, includeHtml = false) => {
  logger.info(
    `[SearchService] Initiating Google search (human-like) for query: "${query}", includeHtml: ${includeHtml}`,
  );

  const googleEngineConfig = serviceConfig.googleSearch;
  if (!googleEngineConfig) {
    logger.error("[SearchService] Google search configuration is missing in serviceConfig.");
    throw new Error("Google search configuration is missing.");
  }

  const {
    baseUrl, // Google 검색 페이지 URL (e.g., https://www.google.com)
    referer,
    // searchInputSelector, // HumanLikeGoogleCrawler 내부에서 사용
    // searchButtonSelector, // HumanLikeGoogleCrawler 내부에서 사용
  } = googleEngineConfig;

  let crawlerInstance = null;
  try {
    const crawlerConfig = {
        ...(serviceConfig.crawler.puppeteer),
        // HumanLikeGoogleCrawler에 필요한 추가 설정 (예: selectors)은 serviceConfig.googleSearch에서 가져와 전달
        searchInputSelector: googleEngineConfig.searchInputSelector,
        searchButtonSelector: googleEngineConfig.searchButtonSelector,
        baseUrl: baseUrl, // baseUrl도 전달하여 HumanLikeGoogleCrawler가 사용하도록 함
    };
    crawlerInstance = new HumanLikeGoogleCrawler(crawlerConfig); // 설정 객체 전달
    logger.info(`[SearchService] Using HumanLikeGoogleCrawler for Google search.`);

    const pageOptions = { referer };

    const rawHtml = await crawlerInstance.searchAndGetResults(query, pageOptions);

    logger.info('[SearchService] Raw HTML received for Google search');
    const resultText = cleanHtml(rawHtml, includeHtml);
    const retrievedAt = new Date().toISOString();

    logger.info(
      `[SearchService] Successfully retrieved and processed Google search results for query: "${query}"`,
    );

    return {
      query,
      resultText,
      retrievedAt,
      searchEngine: 'google',
    };
  } catch (error) {
    logger.error(
      `[SearchService] Error during Google search for query "${query}": ${error.message}`,
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

    // fetchUrlContent는 특정 pageOptions이 크게 필요 없을 수 있으나, 필요시 여기에 추가
    // const pageOptions = { userAgent: 'MyCustomAgent/1.0' };
    // const rawHtml = await crawlerInstance.getRawHtml(url, pageOptions);
    const rawHtml = await crawlerInstance.getRawHtml(url); // 기본 옵션으로 호출

    logger.info('[SearchService] Raw HTML received from URL');
    const textContent = cleanHtml(rawHtml, includeHtml); // includeHtml 파라미터 사용
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
