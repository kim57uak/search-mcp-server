// tests/tools/googleSearchTool.test.js
import { jest } from '@jest/globals';
import { googleSearchTool } from '../../src/tools/googleSearchTool.js';
import * as searchService from '../../src/services/searchService.js'; // 모듈 전체를 가져오도록 복원
import logger from '../../src/utils/logger.cjs';

// searchService.googleSearch 함수 모킹
jest.mock('../../src/services/searchService.js', () => ({
  __esModule: true,
  googleSearch: jest.fn(),
}));
// logger 모킹
jest.mock('../../src/utils/logger.cjs', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
}));

describe('GoogleSearchTool - handler', () => {
  const mockQuery = 'test tool query';
  const mockServiceResult = {
    query: mockQuery,
    resultText: 'Mocked search result text',
    retrievedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // 각 테스트 전에 모킹 초기화
    searchService.googleSearch.mockReset(); // mockedGoogleSearch -> searchService.googleSearch
    logger.info.mockClear();
    logger.error.mockClear();
  });

  test('should call searchService.googleSearch and return formatted result', async () => {
    searchService.googleSearch.mockResolvedValue(mockServiceResult); // mockedGoogleSearch -> searchService.googleSearch

    const inputs = { query: mockQuery, includeHtml: false };
    const result = await googleSearchTool.handler(inputs);

    expect(searchService.googleSearch).toHaveBeenCalledTimes(1); // mockedGoogleSearch -> searchService.googleSearch
    expect(searchService.googleSearch).toHaveBeenCalledWith(mockQuery, false); // mockedGoogleSearch -> searchService.googleSearch
    expect(result.content).toBeDefined();
    expect(result.content.length).toBe(1);
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual(mockServiceResult);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Executing with query'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Successfully executed'),
    );
  });

  test('should call searchService.googleSearch with includeHtml true', async () => {
    searchService.googleSearch.mockResolvedValue({
      ...mockServiceResult,
      resultText: '<p>html</p>',
    });

    const inputs = { query: mockQuery, includeHtml: true };
    await googleSearchTool.handler(inputs);

    expect(searchService.googleSearch).toHaveBeenCalledTimes(1);
    expect(searchService.googleSearch).toHaveBeenCalledWith(mockQuery, true);
  });

  test('should throw error if searchService.googleSearch throws an error', async () => {
    const errorMessage = 'Service Error';
    searchService.googleSearch.mockRejectedValue(new Error(errorMessage));

    const inputs = { query: mockQuery, includeHtml: false };
    await expect(googleSearchTool.handler(inputs)).rejects.toThrow(
      errorMessage,
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage),
      expect.any(Object),
    );
  });

  // inputSchema Zod 유효성 검사는 McpServer 레벨에서 처리될 것으로 예상되므로,
  // 여기서는 핸들러가 유효한 입력을 받는다고 가정하고 테스트합니다.
  // 만약 핸들러 내부에서 추가적인 입력 유효성 검사를 한다면 해당 테스트도 추가합니다.
});
