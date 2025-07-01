// tests/services/searchService.test.js
import { jest } from '@jest/globals';
import axios from 'axios'; // 원래대로 복원
import { googleSearch } from '../../src/services/searchService.js';
import { serviceConfig } from '../../src/config/serviceConfig.js';
import logger from '../../src/utils/logger.cjs';

// axios 모킹
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    // default export 모킹
    get: jest.fn(),
  },
  // axios가 named export로 get을 제공하지 않는다면 아래는 제거 가능
  // get: jest.fn(),
}));
// logger 모킹 (선택 사항, 로그 출력을 확인하지 않으려면)
jest.mock('../../src/utils/logger.cjs', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(), // child 호출 시 자신을 반환하도록 설정
}));

describe('SearchService - googleSearch', () => {
  const mockQuery = 'test query';
  const mockHtmlResponse =
    '<html><body><h1>Test HTML</h1><p>Some content.</p></body></html>';
  const mockTextResponse = 'Test HTML Some content.';

  beforeEach(() => {
    // 각 테스트 전에 모킹 초기화
    axios.get.mockReset(); // mockedAxiosGet -> axios.get
    logger.info.mockClear();
    logger.error.mockClear();
    logger.debug.mockClear();
  });

  test('should return search results with HTML when includeHtml is true', async () => {
    axios.get.mockResolvedValue({ status: 200, data: mockHtmlResponse }); // mockedAxiosGet -> axios.get

    const result = await googleSearch(mockQuery, true);

    expect(axios.get).toHaveBeenCalledTimes(1); // mockedAxiosGet -> axios.get
    expect(axios.get).toHaveBeenCalledWith(
      // mockedAxiosGet -> axios.get
      `${serviceConfig.googleSearch.baseUrl}?q=${encodeURIComponent(mockQuery)}`,
      expect.any(Object), // Headers
    );
    expect(result.query).toBe(mockQuery);
    expect(result.resultText).toBe(mockHtmlResponse); // includeHtml=true, 원본 HTML 반환 (현재 cleanHtml 로직)
    expect(result.retrievedAt).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Initiating Google search'),
    );
  });

  test('should return search results without HTML (text only) when includeHtml is false', async () => {
    axios.get.mockResolvedValue({ status: 200, data: mockHtmlResponse });

    const result = await googleSearch(mockQuery, false);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result.query).toBe(mockQuery);
    expect(result.resultText).toBe(mockTextResponse); // includeHtml=false, striptags 적용
    expect(result.retrievedAt).toBeDefined();
  });

  test('should return search results without HTML (text only) by default', async () => {
    axios.get.mockResolvedValue({ status: 200, data: mockHtmlResponse });

    const result = await googleSearch(mockQuery); // includeHtml 생략 (기본값 false)

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result.query).toBe(mockQuery);
    expect(result.resultText).toBe(mockTextResponse);
    expect(result.retrievedAt).toBeDefined();
  });

  test('should throw an error if query is empty or invalid', async () => {
    await expect(googleSearch('')).rejects.toThrow(
      '유효한 검색어를 입력해야 합니다.',
    );
    await expect(googleSearch(null)).rejects.toThrow(
      '유효한 검색어를 입력해야 합니다.',
    );
    await expect(googleSearch(undefined)).rejects.toThrow(
      '유효한 검색어를 입력해야 합니다.',
    );
    await expect(googleSearch('   ')).rejects.toThrow(
      '유효한 검색어를 입력해야 합니다.',
    );
  });

  test('should throw an error if axios request fails', async () => {
    const errorMessage = 'Network Error';
    axios.get.mockRejectedValue(new Error(errorMessage));

    await expect(googleSearch(mockQuery)).rejects.toThrow(
      `Google 검색 중 네트워크 오류 발생: ${errorMessage}`,
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage),
      expect.any(Object),
    );
  });

  test('should throw an error if API returns non-200 status', async () => {
    const statusCode = 500;
    axios.get.mockResolvedValue({ status: statusCode, data: 'Error' });

    await expect(googleSearch(mockQuery)).rejects.toThrow(
      `Google 검색 요청 실패: 상태 코드 ${statusCode}`,
    );
  });
});
