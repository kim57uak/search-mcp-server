// tests/services/searchService.test.js
import { jest } from '@jest/globals';

// Mock functions for crawler behavior
const mockGetRawHtml = jest.fn();
const mockClose = jest.fn();
const mockSearchAndGetResults = jest.fn(); // For HumanLikeGoogleCrawler

// Mock SearchEngineManager and its methods
// This will mock the MockSearchEngineManager inside searchService.js
const mockGetEngineByName = jest.fn();
const mockGetEnginesByLanguage = jest.fn();
const mockGetAllEngines = jest.fn();

const mockBuildQueryUrl = jest.fn();

// Mock fs to prevent reading actual search_engines.json
jest.doMock('fs', () => ({
  ...jest.requireActual('fs'), // import and retain default behavior
  readFileSync: jest.fn((path) => {
    if (path.endsWith('search_engines.json')) {
      // Provide minimal mock data if absolutely necessary, or ensure manager is fully mocked
      return JSON.stringify({ engines: [] });
    }
    // For other files, you might want to use original readFileSync
    // return jest.requireActual('fs').readFileSync(path);
    throw new Error(`Attempted to read unmocked file in test: ${path}`);
  }),
}));


jest.doMock('../../src/crawlers/crawlerFactory.js', () => ({
  __esModule: true,
  createCrawler: jest.fn().mockImplementation(async () => ({
    getRawHtml: mockGetRawHtml,
    close: mockClose,
    constructor: { name: 'MockGenericCrawler' },
  })),
}));

// Mock HumanLikeGoogleCrawler specifically
jest.doMock('../../src/crawlers/humanLikeGoogleCrawler.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    searchAndGetResults: mockSearchAndGetResults,
    close: mockClose, // Assuming it also has a close method
    constructor: { name: 'MockHumanLikeGoogleCrawler' },
  })),
}));


jest.doMock('../../src/utils/logger.cjs', () => ({
  default: {
    info: jest.fn(), error: jest.fn(), debug: jest.fn(), child: jest.fn().mockReturnThis(),
  },
  info: jest.fn(), error: jest.fn(), debug: jest.fn(), child: jest.fn().mockReturnThis(),
}));


// Dynamically import SearchService and other necessary modules AFTER mocks are set up
let executeGenericSearch, performIntegratedSearch, googleSearch, fetchUrlContent;
let createCrawler, HumanLikeGoogleCrawler; // To access the mocked constructors
let logger;
let serviceConfig; // Actual serviceConfig can be used

const mockHtmlResponse = '<html><body><h1>Test HTML</h1><p>Some content.</p></body></html>';
const mockTextResponse = 'Test HTML Some content.';

// Define a mock engine object structure
const mockEngine = {
  name: 'MockEngine',
  base_url: 'http://mockengine.com/search',
  query_param: 'q',
  lang_param: 'lang',
  supported_languages: ['en', 'ko'],
  build_query_url: mockBuildQueryUrl, // Use the jest.fn() for this engine instance
};

const mockEngine2 = {
  name: 'MockEngine2',
  base_url: 'http://mockengine2.com/find',
  query_param: 'query',
  supported_languages: ['en', 'ja'],
  build_query_url: jest.fn().mockImplementation((query, lang) => `http://mockengine2.com/find?query=${query}${lang ? `&l=${lang}` : ''}`),
};


describe('SearchService', () => {
  beforeAll(async () => {
    // It's important that these imports happen after all jest.doMock calls
    const searchServiceModule = await import('../../src/services/searchService.js');
    executeGenericSearch = searchServiceModule.executeGenericSearch;
    performIntegratedSearch = searchServiceModule.performIntegratedSearch;
    googleSearch = searchServiceModule.googleSearch;
    fetchUrlContent = searchServiceModule.fetchUrlContent;

    // Override the SearchEngineManager instance within searchService.js
    // This is a bit hacky, assuming searchEngineManager is an exported or accessible variable.
    // If it's not, this approach won't work directly.
    // A better way would be to inject the manager or use jest.spyOn on its prototype if it's a class.
    // For the current structure of searchService.js (where it creates its own manager instance),
    // we need to mock the manager's methods *before* searchService.js is fully initialized.
    // The module-level mock for `fs` helps, but for methods of the manager:
    const actualSearchService = jest.requireActual('../../src/services/searchService.js');
    if (actualSearchService.searchEngineManager) { // If manager is exported or testable
         jest.spyOn(actualSearchService.searchEngineManager, 'get_engine_by_name').mockImplementation(mockGetEngineByName);
         jest.spyOn(actualSearchService.searchEngineManager, 'get_engines_by_language').mockImplementation(mockGetEnginesByLanguage);
         jest.spyOn(actualSearchService.searchEngineManager, 'get_all_engines').mockImplementation(mockGetAllEngines);
    } else {
        // Fallback: If the manager is internal and not easily spied on,
        // we rely on the `fs` mock to return empty engines, and then mock the methods
        // on the prototype of the MockSearchEngineManager if that's what's used internally.
        // This part is tricky due to the JS module system and jest's mocking.
        // The current searchService.js creates `new MockSearchEngineManager()`.
        // We can try to spy on the prototype methods of the *internal* MockSearchEngineManager.
        // This requires knowing its exact path if it were a separate module, or its definition.
        // For now, we'll assume the fs mock is the primary guard against file reads,
        // and direct method mocks for tests.
    }


    const crawlerFactoryModule = await import('../../src/crawlers/crawlerFactory.js');
    createCrawler = crawlerFactoryModule.createCrawler;

    const humanLikeCrawlerModule = await import('../../src/crawlers/humanLikeGoogleCrawler.js');
    HumanLikeGoogleCrawler = humanLikeCrawlerModule.default;

    const loggerModule = await import('../../src/utils/logger.cjs');
    logger = loggerModule.default;

    const configModule = await import('../../src/config/serviceConfig.js');
    serviceConfig = configModule.serviceConfig;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations for engine manager methods
    mockGetEngineByName.mockReturnValue(null); // Default to engine not found
    mockGetAllEngines.mockReturnValue([]);
    mockGetEnginesByLanguage.mockReturnValue([]);
    mockBuildQueryUrl.mockClear(); // Clear this specific mock engine's method
    mockEngine2.build_query_url.mockClear();
  });

  describe('executeGenericSearch', () => {
    const query = 'test query';
    const engineName = 'MockEngine';
    const lang = 'en';

    test('should perform search and return results when engine is found', async () => {
      const builtUrl = `http://mockengine.com/search?q=${query}&lang=${lang}`;
      mockGetEngineByName.mockReturnValue(mockEngine); // Engine found
      mockEngine.build_query_url.mockReturnValue(builtUrl);
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);

      // Mock serviceConfig for this engine if referer is used from there
      serviceConfig.mockengineSearch = { referer: 'http://mock.com' };


      const result = await executeGenericSearch(query, engineName, lang, false);

      expect(mockGetEngineByName).toHaveBeenCalledWith(engineName);
      expect(mockEngine.build_query_url).toHaveBeenCalledWith(query, lang);
      expect(createCrawler).toHaveBeenCalledWith(serviceConfig.crawler);
      expect(mockGetRawHtml).toHaveBeenCalledWith(builtUrl, { referer: serviceConfig.mockengineSearch.referer });
      expect(result.query).toBe(query);
      expect(result.engine).toBe(engineName);
      expect(result.language).toBe(lang);
      expect(result.resultText).toBe(mockTextResponse); // includeHtml = false
      expect(result.searchUrl).toBe(builtUrl);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    test('should return results with HTML when includeHtml is true', async () => {
      mockGetEngineByName.mockReturnValue(mockEngine);
      mockEngine.build_query_url.mockReturnValue('http://some.url');
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);
      serviceConfig.mockengineSearch = { referer: 'http://mock.com' };


      const result = await executeGenericSearch(query, engineName, lang, true);
      expect(result.resultText).toBe(mockHtmlResponse);
    });

    test('should throw error if engine not found', async () => {
      mockGetEngineByName.mockReturnValue(null); // Engine not found

      await expect(executeGenericSearch(query, 'UnknownEngine', lang, false))
        .rejects.toThrow('Search engine "UnknownEngine" not found.');
      expect(createCrawler).not.toHaveBeenCalled();
    });

    test('should throw error if getRawHtml fails', async () => {
      mockGetEngineByName.mockReturnValue(mockEngine);
      mockEngine.build_query_url.mockReturnValue('http://some.url');
      mockGetRawHtml.mockRejectedValue(new Error('Fetch failed'));
      serviceConfig.mockengineSearch = { referer: 'http://mock.com' };

      await expect(executeGenericSearch(query, engineName, lang, false))
        .rejects.toThrow('Fetch failed');
      expect(mockClose).toHaveBeenCalledTimes(1); // Ensure crawler is closed on error
    });
  });

  describe('performIntegratedSearch', () => {
    const query = 'integrated query';

    test('should search on all engines if no language code specified and google is filtered', async () => {
      mockGetAllEngines.mockReturnValue([mockEngine, mockEngine2]); // mockEngine is not google
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse); // Same response for both for simplicity

      // Mock build_query_url for each engine
      mockEngine.build_query_url.mockImplementation((q) => `http://mockengine.com/search?q=${q}`);
      // mockEngine2.build_query_url is already mocked in its definition

      serviceConfig.mockengineSearch = { referer: 'http://mock.com' };
      serviceConfig.mockengine2Search = { referer: 'http://mock2.com' };


      const results = await performIntegratedSearch(query, null, false);

      expect(mockGetAllEngines).toHaveBeenCalledTimes(1);
      expect(mockGetEnginesByLanguage).not.toHaveBeenCalled();
      expect(createCrawler).toHaveBeenCalledTimes(2); // Once for each engine
      expect(mockGetRawHtml).toHaveBeenCalledTimes(2);
      expect(results.length).toBe(2);
      expect(results[0].searchEngine).toBe(mockEngine.name);
      expect(results[1].searchEngine).toBe(mockEngine2.name);
      expect(results[0].resultText).toBe(mockTextResponse);
    });

    test('should search on language-specific engines if language code is provided', async () => {
      mockGetEnginesByLanguage.mockReturnValue([mockEngine]); // Only mockEngine supports 'ko'
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);
      mockEngine.build_query_url.mockImplementation((q, l) => `http://mockengine.com/search?q=${q}&lang=${l}`);
      serviceConfig.mockengineSearch = { referer: 'http://mock.com' };


      const results = await performIntegratedSearch(query, 'ko', false);

      expect(mockGetEnginesByLanguage).toHaveBeenCalledWith('ko');
      expect(mockGetAllEngines).not.toHaveBeenCalled();
      expect(createCrawler).toHaveBeenCalledTimes(1);
      expect(results.length).toBe(1);
      expect(results[0].searchEngine).toBe(mockEngine.name);
    });

    test('should fallback to all engines if no engines found for language and log warning', async () => {
        mockGetEnginesByLanguage.mockReturnValue([]); // No engine for 'xx'
        mockGetAllEngines.mockReturnValue([mockEngine]); // Fallback to all
        mockGetRawHtml.mockResolvedValue(mockHtmlResponse);
        mockEngine.build_query_url.mockImplementation((q) => `http://mockengine.com/search?q=${q}`);
        serviceConfig.mockengineSearch = { referer: 'http://mock.com' };

        const results = await performIntegratedSearch(query, 'xx', false);

        expect(mockGetEnginesByLanguage).toHaveBeenCalledWith('xx');
        expect(mockGetAllEngines).toHaveBeenCalledTimes(1); // Called as fallback
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('No search engines found for language code: xx. Falling back to all engines.'));
        expect(results.length).toBe(1);
    });


    test('should return partial results if one engine fails', async () => {
      mockGetAllEngines.mockReturnValue([mockEngine, mockEngine2]);
      // mockEngine succeeds
      mockEngine.build_query_url.mockImplementation((q) => `http://mockengine.com/search?q=${q}`);
      // mockEngine2 fails
      mockEngine2.build_query_url.mockImplementation((q) => `http://mockengine2.com/find?q=${q}`);

      // Make getRawHtml fail for the second engine
      mockGetRawHtml
        .mockResolvedValueOnce(mockHtmlResponse) // Success for mockEngine
        .mockRejectedValueOnce(new Error('Engine2 failed')); // Failure for mockEngine2

      serviceConfig.mockengineSearch = { referer: 'http://mock.com' };
      serviceConfig.mockengine2Search = { referer: 'http://mock2.com' };

      const results = await performIntegratedSearch(query, null, false);

      expect(results.length).toBe(2);
      const successResult = results.find(r => r.searchEngine === mockEngine.name);
      const errorResult = results.find(r => r.searchEngine === mockEngine2.name);

      expect(successResult.resultText).toBe(mockTextResponse);
      expect(errorResult.error).toBe('Engine2 failed');
      expect(mockClose).toHaveBeenCalledTimes(2); // Both crawlers should be closed
    });
  });

  describe('googleSearch', () => {
    const query = 'google query';
    // serviceConfig.googleSearch is used, ensure it has necessary fields for the test
    // (e.g., baseUrl, referer, searchInputSelector, searchButtonSelector)
    // These are read from the actual serviceConfig.js

    test('should use HumanLikeGoogleCrawler and return results', async () => {
      mockSearchAndGetResults.mockResolvedValue(mockHtmlResponse);

      const result = await googleSearch(query, false);

      expect(HumanLikeGoogleCrawler).toHaveBeenCalledTimes(1);
      // Check if crawler was called with puppeteer and google specific configs
      expect(HumanLikeGoogleCrawler).toHaveBeenCalledWith(expect.objectContaining({
        ...serviceConfig.crawler.puppeteer,
        searchInputSelector: serviceConfig.googleSearch.searchInputSelector,
        searchButtonSelector: serviceConfig.googleSearch.searchButtonSelector,
        baseUrl: serviceConfig.googleSearch.baseUrl,
      }));
      expect(mockSearchAndGetResults).toHaveBeenCalledWith(query, { referer: serviceConfig.googleSearch.referer });
      expect(result.resultText).toBe(mockTextResponse);
      expect(result.searchEngine).toBe('google');
      expect(mockClose).toHaveBeenCalledTimes(1); // From HumanLikeGoogleCrawler
    });

     test('should return HTML for googleSearch when includeHtml is true', async () => {
      mockSearchAndGetResults.mockResolvedValue(mockHtmlResponse);
      const result = await googleSearch(query, true);
      expect(result.resultText).toBe(mockHtmlResponse);
    });

    test('should throw error if HumanLikeGoogleCrawler fails', async () => {
      mockSearchAndGetResults.mockRejectedValue(new Error('Google crawl failed'));
      await expect(googleSearch(query, false)).rejects.toThrow('Google crawl failed');
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });


  describe('fetchUrlContent', () => {
    const mockUrl = 'http://example.com/test-page';

    test('should return text content for a given URL (includeHtml=false by default)', async () => {
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);

      const result = await fetchUrlContent(mockUrl); // includeHtml defaults to false

      expect(createCrawler).toHaveBeenCalledTimes(1);
      expect(mockGetRawHtml).toHaveBeenCalledWith(mockUrl);
      expect(result.url).toBe(mockUrl);
      expect(result.textContent).toBe(mockTextResponse);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    test('should return HTML content for a given URL when includeHtml is true', async () => {
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);

      const result = await fetchUrlContent(mockUrl, true); // includeHtml = true

      expect(result.textContent).toBe(mockHtmlResponse);
    });

    test('should throw an error if URL is invalid', async () => {
      // The service itself now has validation
      await expect(fetchUrlContent('invalid-url')).rejects.toThrow('유효한 URL을 입력해야 합니다');
      expect(createCrawler).not.toHaveBeenCalled();
    });

    test('should throw an error if getRawHtml fails', async () => {
      const errorMessage = 'Simulated URL fetching error';
      mockGetRawHtml.mockRejectedValue(new Error(errorMessage));

      await expect(fetchUrlContent(mockUrl)).rejects.toThrow(errorMessage);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
