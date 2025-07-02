// tests/services/searchService.test.js
import { jest } from '@jest/globals';

// Mock 함수 정의
const mockGetRawHtml = jest.fn();
const mockClose = jest.fn();

// jest.doMock을 사용하여 crawlerFactory와 logger를 모킹합니다.
// 이 블록은 describe나 test 블록 바깥, 최상단에 위치해야 합니다.
jest.doMock('../../src/crawlers/crawlerFactory.js', () => ({
  __esModule: true,
  createCrawler: jest.fn().mockImplementation(async () => {
    return {
      getRawHtml: mockGetRawHtml,
      close: mockClose,
      constructor: { name: 'MockCrawler' }
    };
  }),
}));

jest.doMock('../../src/utils/logger.cjs', () => ({
  // __esModule: true, // CJS 모듈에는 불필요할 수 있음
  default: { // logger.cjs가 default export를 사용하는 경우 (실제로는 module.exports)
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
  // 만약 named export라면 아래처럼
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
}));


// serviceConfig는 실제 값을 사용하므로 그대로 import
import { serviceConfig } from '../../src/config/serviceConfig.js';

describe('SearchService', () => {
  let naverSearch;
  let fetchUrlContent;
  let createCrawler;
  let logger;

  const mockHtmlResponse = '<html><body><h1>Test HTML</h1><p>Some content.</p></body></html>';
  const mockTextResponse = 'Test HTML Some content.';

  beforeAll(async () => {
    // jest.doMock이 적용된 후 모듈을 동적으로 로드
    const searchServiceModule = await import('../../src/services/searchService.js');
    naverSearch = searchServiceModule.naverSearch;
    fetchUrlContent = searchServiceModule.fetchUrlContent;

    const crawlerFactoryModule = await import('../../src/crawlers/crawlerFactory.js');
    createCrawler = crawlerFactoryModule.createCrawler;

    // logger.cjs는 module.exports = winstonLogger; 형태이므로 default export처럼 취급
    const loggerModule = await import('../../src/utils/logger.cjs');
    logger = loggerModule.default; // .default를 붙여야 함
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('naverSearch', () => {
    const mockQuery = 'test query';

    test('should return search results with HTML when includeHtml is true', async () => {
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);

      const result = await naverSearch(mockQuery, true);

      expect(createCrawler).toHaveBeenCalledTimes(1);
      expect(createCrawler).toHaveBeenCalledWith(serviceConfig.crawler);

      expect(mockGetRawHtml).toHaveBeenCalledTimes(1);
      expect(mockGetRawHtml).toHaveBeenCalledWith(
        `${serviceConfig.naverSearch.baseUrl}${encodeURIComponent(mockQuery)}`,
        { referer: serviceConfig.naverSearch.referer },
      );
      expect(result.query).toBe(mockQuery);
      expect(result.resultText).toContain('<h1>Test HTML</h1>');
      expect(result.retrievedAt).toBeDefined();
      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Initiating Naver search for query: "${mockQuery}"`)
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Using MockCrawler for Naver search.')
      );
    });

    test('should return search results without HTML (text only) when includeHtml is false', async () => {
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);

      const result = await naverSearch(mockQuery, false);

      expect(mockGetRawHtml).toHaveBeenCalledTimes(1);
      expect(result.query).toBe(mockQuery);
      expect(result.resultText).toBe(mockTextResponse);
      expect(result.retrievedAt).toBeDefined();
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    test('should return search results without HTML (text only) by default', async () => {
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);

      const result = await naverSearch(mockQuery);

      expect(mockGetRawHtml).toHaveBeenCalledTimes(1);
      expect(result.query).toBe(mockQuery);
      expect(result.resultText).toBe(mockTextResponse);
      expect(result.retrievedAt).toBeDefined();
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if query is empty or invalid', async () => {
      await expect(naverSearch('')).rejects.toThrow('유효한 검색어를 입력해야 합니다.');
      expect(createCrawler).not.toHaveBeenCalled();
      expect(mockGetRawHtml).not.toHaveBeenCalled();
      expect(mockClose).not.toHaveBeenCalled();
    });

    test('should throw an error if getRawHtml fails, and call close', async () => {
      const errorMessage = 'Simulated HTML fetching error';
      mockGetRawHtml.mockRejectedValue(new Error(errorMessage));

      await expect(naverSearch(mockQuery)).rejects.toThrow(errorMessage);

      expect(createCrawler).toHaveBeenCalledTimes(1);
      expect(mockGetRawHtml).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error during Naver search for query "${mockQuery}": ${errorMessage}`),
        expect.any(Object),
      );
    });
  });

  describe('fetchUrlContent', () => {
    const mockUrl = 'http://example.com/test-page';

    test('should return text content for a given URL', async () => {
      mockGetRawHtml.mockResolvedValue(mockHtmlResponse);

      const result = await fetchUrlContent(mockUrl);

      expect(createCrawler).toHaveBeenCalledTimes(1);
      expect(createCrawler).toHaveBeenCalledWith(serviceConfig.crawler);

      expect(mockGetRawHtml).toHaveBeenCalledTimes(1);
      expect(mockGetRawHtml).toHaveBeenCalledWith(mockUrl);

      expect(result.url).toBe(mockUrl);
      expect(result.textContent).toBe(mockTextResponse);
      expect(result.retrievedAt).toBeDefined();
      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Using MockCrawler for URL fetch.`)
      );
    });

    test('should throw an error if URL is invalid', async () => {
      await expect(fetchUrlContent('invalid-url')).rejects.toThrow('유효한 URL을 입력해야 합니다');
      expect(createCrawler).not.toHaveBeenCalled();
      expect(mockGetRawHtml).not.toHaveBeenCalled();
    });

    test('should throw an error if getRawHtml fails, and call close', async () => {
      const errorMessage = 'Simulated URL fetching error';
      mockGetRawHtml.mockRejectedValue(new Error(errorMessage));

      await expect(fetchUrlContent(mockUrl)).rejects.toThrow(errorMessage);

      expect(createCrawler).toHaveBeenCalledTimes(1);
      expect(mockGetRawHtml).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error during content fetch for URL "${mockUrl}": ${errorMessage}`),
        expect.any(Object),
      );
    });
  });
});
