// src/config/serviceConfig.js
import { findChromePath } from '../utils/chromePathFinder.js';

// 검색 엔진별 Base URL 및 관련 설정은 search_engines.json으로 이전되었습니다.
// const NAVER_SEARCH_BASE_URL = ... (삭제)
// ... (다른 검색 엔진 BASE_URL 상수들도 모두 삭제)

const GOOGLE_PAGE_BASE_URL = // HumanLikeGoogleCrawler가 시작할 Google 페이지 URL
  process.env.GOOGLE_PAGE_BASE_URL || 'https://www.google.com';

// 환경 변수 getter 함수 (타입 변환 및 기본값 처리) - 유지
const getEnv = (key, defaultValue, type = 'string') => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  switch (type) {
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'number':
      return parseInt(value, 10);
    case 'array':
      return value.split(',').map((s) => s.trim());
    default:
      return value;
  }
};

export const serviceConfig = {
  // naverSearch, daumSearch, bingSearch, nateSearch, baiduSearch,
  // yahooJapanSearch, yahooSearch, yandexSearch 객체들은 삭제됨.
  // 해당 정보는 search_engines.json으로 이전.

  googleSearch: { // HumanLikeGoogleCrawler 특화 설정은 유지
    baseUrl: GOOGLE_PAGE_BASE_URL, // 크롤러가 시작할 Google 페이지 URL
    // searchUrl: (삭제) - search_engines.json의 Google 설정으로 대체
    // defaultParams: (삭제) - 필요시 search_engines.json에 유사 개념 반영 또는 SearchEngineManager에서 처리
    referer: getEnv('GOOGLE_SEARCH_REFERER', 'https://www.google.com/'),
    searchInputSelector: getEnv('GOOGLE_SEARCH_INPUT_SELECTOR', 'textarea[name="q"], input[name="q"]'),
    searchButtonSelector: getEnv('GOOGLE_SEARCH_BUTTON_SELECTOR', 'input[name="btnK"], button[name="btnK"]'),
    timeout: getEnv('GOOGLE_SEARCH_TIMEOUT', 60000, 'number'), // HumanLikeCrawler의 특정 작업 타임아웃
    waitUntil: getEnv('GOOGLE_SEARCH_WAIT_UNTIL', 'domcontentloaded'), // HumanLikeCrawler의 특정 작업 대기 조건
  },
  crawler: { // 일반 크롤러 및 Puppeteer/Selenium 기본 설정은 유지
    type: getEnv('CRAWLER_TYPE', 'puppeteer'),
    // type: getEnv('CRAWLER_TYPE', 'selenium'), // 필요시 Selenium으로 변경

    puppeteer: { // Puppeteer 기본 설정
      executablePath: getEnv(
        'PUPPETEER_EXECUTABLE_PATH', // Chrome/Chromium 실행 파일 경로
        findChromePath() || null,
      ),
      headless: getEnv('PUPPETEER_HEADLESS', true, 'boolean'),
      args: getEnv(
        'PUPPETEER_ARGS', // Puppeteer 실행 인자 (쉼표 구분)
        [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--start-maximized',
          '--disable-gpu',
        ],
        'array',
      ),
      userAgent: getEnv( // 기본 User-Agent
        'PUPPETEER_USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
      ),
      defaultHeaders: { // 기본 요청 헤더
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Connection: 'keep-alive',
      },
      waitUntil: getEnv('PUPPETEER_WAIT_UNTIL', 'networkidle2'), // 페이지 로드 대기 조건
      timeout: getEnv('PUPPETEER_TIMEOUT', 60000, 'number'), // 페이지 로드 타임아웃 (ms)
    },

    selenium: { // Selenium 기본 설정
      browser: getEnv('SELENIUM_BROWSER', 'chrome'), // 사용할 브라우저
      driverPath: getEnv('SELENIUM_DRIVER_PATH', null), // WebDriver 실행 파일 경로
      headless: getEnv('SELENIUM_HEADLESS', true, 'boolean'),
      args: getEnv('SELENIUM_ARGS', [], 'array'), // Selenium 브라우저 드라이버 추가 인자
      userAgent: getEnv(
        'SELENIUM_USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Selenium/4.0',
      ),
      defaultHeaders: { // 기본 요청 헤더 (일부 드라이버/브라우저만 지원)
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      pageLoadTimeout: getEnv('SELENIUM_PAGE_LOAD_TIMEOUT', 60000, 'number'), // 페이지 로드 타임아웃 (ms)
      scriptTimeout: getEnv('SELENIUM_SCRIPT_TIMEOUT', 30000, 'number'), // 스크립트 실행 타임아웃 (ms)
      proxy: undefined, // 프록시 설정 (필요시 객체로 구성)
    },
  },
  // 다른 서비스 관련 전역 설정을 여기에 추가할 수 있습니다.
};

// MCP 서버 환경 (development, production 등)
export const environment = getEnv('NODE_ENV', 'development');
