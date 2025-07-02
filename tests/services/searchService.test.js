// tests/services/searchService.test.js
import { jest } from '@jest/globals';

// puppeteerHelper 모듈 전체를 모킹합니다.
// 실제 getRawHtml 함수 대신 jest.fn()을 반환하도록 설정합니다.
jest.mock('../../src/utils/puppeteerHelper.js', () => ({
  __esModule: true, // ES 모듈임을 나타냅니다.
  // default: jest.fn(), // 만약 default export를 모킹해야 한다면
  getRawHtml: jest.fn(), // named export 'getRawHtml'을 모킹합니다.
}));

// logger 모킹
jest.mock('../../src/utils/logger.cjs', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
}));

// 이제 모듈들을 import 합니다.
import { naverSearch } from '../../src/services/searchService.js';
import { serviceConfig } from '../../src/config/serviceConfig.js';
import logger from '../../src/utils/logger.cjs';
// getRawHtml을 import 합니다. 이 시점에서 jest.mock에 의해 모킹된 함수를 가져와야 합니다.
// import { getRawHtml } from '../../src/utils/puppeteerHelper.js'; // import 대신 require 시도

// 모킹된 함수를 require로 가져오기 시도 (주의: ES 모듈 환경에서는 비표준적)
const { getRawHtml } = require('../../src/utils/puppeteerHelper.js');


describe('SearchService - naverSearch', () => {
  const mockQuery = 'test query';
  const mockHtmlResponse =
    '<html><body><h1>Test HTML</h1><p>Some content.</p></body></html>';
  const mockTextResponse = 'Test HTML Some content.';

  beforeEach(() => {
    // 모든 모의 함수의 호출 기록 등을 초기화합니다.
    jest.clearAllMocks();
    // 또는 명시적으로:
    // getRawHtml.mockClear(); // jest.clearAllMocks()가 이미 처리해 줄 수 있음
    // logger.info.mockClear();
    // logger.error.mockClear();
    // logger.debug.mockClear();
  });

  test('should return search results with HTML when includeHtml is true', async () => {
    getRawHtml.mockResolvedValue(mockHtmlResponse);

    const result = await naverSearch(mockQuery, true);

    expect(getRawHtml).toHaveBeenCalledTimes(1);
    expect(getRawHtml).toHaveBeenCalledWith(
      `${serviceConfig.naverSearch.baseUrl}${encodeURIComponent(mockQuery)}`,
      { referer: serviceConfig.naverSearch.referer },
    );
    expect(result.query).toBe(mockQuery);
    expect(result.resultText).toContain('<h1>Test HTML</h1>');
    expect(result.retrievedAt).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Initiating Google search'),
    );
  });

  test('should return search results without HTML (text only) when includeHtml is false', async () => {
    getRawHtml.mockResolvedValue(mockHtmlResponse);

    const result = await naverSearch(mockQuery, false);

    expect(getRawHtml).toHaveBeenCalledTimes(1);
    expect(result.query).toBe(mockQuery);
    expect(result.resultText).toBe(mockTextResponse);
    expect(result.retrievedAt).toBeDefined();
  });

  test('should return search results without HTML (text only) by default', async () => {
    getRawHtml.mockResolvedValue(mockHtmlResponse);

    const result = await naverSearch(mockQuery);

    expect(getRawHtml).toHaveBeenCalledTimes(1);
    expect(result.query).toBe(mockQuery);
    expect(result.resultText).toBe(mockTextResponse);
    expect(result.retrievedAt).toBeDefined();
  });

  test('should throw an error if query is empty or invalid', async () => {
    // 이 테스트는 getRawHtml을 호출하지 않음
    await expect(naverSearch('')).rejects.toThrow(
      '유효한 검색어를 입력해야 합니다.',
    );
    await expect(naverSearch(null)).rejects.toThrow(
      '유효한 검색어를 입력해야 합니다.',
    );
    await expect(naverSearch(undefined)).rejects.toThrow(
      '유효한 검색어를 입력해야 합니다.',
    );
    await expect(naverSearch('   ')).rejects.toThrow(
      '유효한 검색어를 입력해야 합니다.',
    );
  });

  test('should throw an error if getRawHtml fails', async () => {
    const errorMessage = 'Puppeteer navigation failed';
    getRawHtml.mockRejectedValue(new Error(errorMessage));

    await expect(naverSearch(mockQuery)).rejects.toThrow(errorMessage);
    expect(getRawHtml).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(`Error during Google search for query "${mockQuery}": ${errorMessage}`),
      expect.any(Object),
    );
  });
});
