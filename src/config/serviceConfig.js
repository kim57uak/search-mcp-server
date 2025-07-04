// src/config/serviceConfig.js
import { findChromePath } from '../utils/chromePathFinder.js';

const NAVER_SEARCH_BASE_URL =
  process.env.NAVER_SEARCH_BASE_URL ||
  'https://search.naver.com/search.naver?ie=utf8&query=';
const DAUM_SEARCH_BASE_URL = // Daum 검색 URL 추가
  process.env.DAUM_SEARCH_BASE_URL ||
  'https://search.daum.net/search?w=tot&DA=YZR&t__nil_searchbox=btn&sug=&sugo=&sq=&o=&q=';
const BING_SEARCH_BASE_URL =
  process.env.BING_SEARCH_BASE_URL || 'https://www.bing.com/search?q=';
const NATE_SEARCH_BASE_URL =
  process.env.NATE_SEARCH_BASE_URL ||
  'https://search.daum.net/nate?w=tot&DA=SBC&q=';
const GOOGLE_SEARCH_BASE_URL =
  process.env.GOOGLE_SEARCH_BASE_URL || 'https://www.google.com'; // Google 검색 페이지 URL
const BAIDU_SEARCH_BASE_URL =
  process.env.BAIDU_SEARCH_BASE_URL || 'https://www.baidu.com/s?wd=';
const YAHOO_JAPAN_SEARCH_BASE_URL =
  process.env.YAHOO_JAPAN_SEARCH_BASE_URL ||
  'https://search.yahoo.co.jp/search?p=';
const YAHOO_SEARCH_BASE_URL =
  process.env.YAHOO_SEARCH_BASE_URL || 'https://search.yahoo.com/search?p=';
const YANDEX_SEARCH_BASE_URL =
  process.env.YANDEX_SEARCH_BASE_URL || 'https://yandex.com/search/?text=';

// 환경 변수 getter 함수 (타입 변환 및 기본값 처리)
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
  naverSearch: {
    baseUrl: NAVER_SEARCH_BASE_URL,
    defaultParams: {
      // 예: hl: 'ko'
    },
    referer: getEnv('NAVER_SEARCH_REFERER', 'https://search.naver.com/'),
  },
  daumSearch: {
    // Daum 검색 설정 추가
    baseUrl: DAUM_SEARCH_BASE_URL,
    defaultParams: {
      // Daum 검색에 필요한 기본 파라미터가 있다면 추가
    },
    referer: getEnv('DAUM_SEARCH_REFERER', 'https://search.daum.net/'), // Daum 검색 시 사용할 Referer
  },
  bingSearch: {
    baseUrl: BING_SEARCH_BASE_URL,
    defaultParams: {},
    referer: getEnv('BING_SEARCH_REFERER', 'https://www.bing.com/'),
  },
  nateSearch: {
    baseUrl: NATE_SEARCH_BASE_URL,
    defaultParams: {
      // Nate 검색에 필요한 기본 파라미터가 있다면 추가
      // 예: DA: SBC 등은 URL에 이미 포함되어 있음
    },
    referer: getEnv('NATE_SEARCH_REFERER', 'https://search.nate.com/'), // Nate 검색 시 사용할 Referer (nate.com 메인 등)
  },
  googleSearch: {
    baseUrl: GOOGLE_SEARCH_BASE_URL, // 검색 페이지
    searchUrl: `${GOOGLE_SEARCH_BASE_URL}/search?q=`, // 실제 검색 요청 URL
    defaultParams: {
      // hl: 'ko' // 언어 설정 등
    },
    referer: getEnv('GOOGLE_SEARCH_REFERER', 'https://www.google.com/'),
    searchInputSelector: getEnv('GOOGLE_SEARCH_INPUT_SELECTOR', 'textarea[name="q"], input[name="q"]'), // 검색창 CSS 선택자
    searchButtonSelector: getEnv('GOOGLE_SEARCH_BUTTON_SELECTOR', 'input[name="btnK"], button[name="btnK"]'), // 검색 버튼 CSS 선택자
    timeout: 60000, // 60초로 상향
    waitUntil: 'domcontentloaded',
  },
  baiduSearch: {
    baseUrl: BAIDU_SEARCH_BASE_URL,
    referer: getEnv('BAIDU_SEARCH_REFERER', 'https://www.baidu.com/'),
  },
  yahooJapanSearch: {
    baseUrl: YAHOO_JAPAN_SEARCH_BASE_URL,
    referer: getEnv('YAHOO_JAPAN_SEARCH_REFERER', 'https://www.yahoo.co.jp/'),
  },
  yahooSearch: {
    baseUrl: YAHOO_SEARCH_BASE_URL,
    referer: getEnv('YAHOO_SEARCH_REFERER', 'https://www.yahoo.com/'),
  },
  yandexSearch: {
    baseUrl: YANDEX_SEARCH_BASE_URL,
    referer: getEnv('YANDEX_SEARCH_REFERER', 'https://yandex.com/'),
  },
  crawler: {
    // 사용할 크롤러 유형: 'puppeteer' 또는 'selenium'
    type: getEnv('CRAWLER_TYPE', 'puppeteer'), // 기본값 'puppeteer'
    //type: getEnv('CRAWLER_TYPE', 'selenium'), // 기본값 'puppeteer'

    puppeteer: {
      executablePath: getEnv(
        'PUPPETEER_EXECUTABLE_PATH',
        findChromePath() || null,
      ),
      headless: getEnv('PUPPETEER_HEADLESS', true, 'boolean'), // 환경변수 'false' 문자열일 때 false
      args: getEnv(
        'PUPPETEER_ARGS',
        [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--start-maximized',
          '--disable-gpu',
          //'--headless',
        ],
        'array',
      ),
      userAgent: getEnv(
        'PUPPETEER_USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
      ),
      defaultHeaders: {
        // defaultHeaders는 객체이므로 환경변수로 설정하기 복잡. 필요시 JSON 문자열 파싱.
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Connection: 'keep-alive',
      },
      waitUntil: getEnv('PUPPETEER_WAIT_UNTIL', 'networkidle2'),
      timeout: getEnv('PUPPETEER_TIMEOUT', 60000, 'number'), // ms 단위, 기본 60초
    },

    selenium: {
      // 사용할 브라우저: 'chrome', 'firefox', 'edge', 'safari' 등
      browser: getEnv('SELENIUM_BROWSER', 'chrome'),
      // WebDriver 실행 파일 경로 (옵션, PATH에 설정된 경우 null 또는 생략)
      driverPath: getEnv('SELENIUM_DRIVER_PATH', null),
      headless: getEnv('SELENIUM_HEADLESS', true, 'boolean'),
      args: getEnv('SELENIUM_ARGS', [], 'array'), // 예: ['--window-size=1920,1080']
      userAgent: getEnv(
        'SELENIUM_USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Selenium/4.0',
      ), // Selenium용 기본 UserAgent
      defaultHeaders: {
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      pageLoadTimeout: getEnv('SELENIUM_PAGE_LOAD_TIMEOUT', 60000, 'number'), // ms 단위, 기본 60초
      scriptTimeout: getEnv('SELENIUM_SCRIPT_TIMEOUT', 30000, 'number'), // ms 단위, 기본 30초
      proxy:
        undefined /*{ // 필요시 프록시 설정 (환경변수로 설정하려면 복잡하므로 코드 내 기본값 또는 별도 관리)
        httpProxy: getEnv('SELENIUM_HTTP_PROXY', null),
        sslProxy: getEnv('SELENIUM_SSL_PROXY', null),
        noProxy: getEnv('SELENIUM_NO_PROXY', null, 'array'),
      } */,
    },
  },
  // 다른 서비스 설정을 추가할 수 있습니다.
};

// MCP 서버에서 사용할 환경 변수 (선택 사항, 예시)
export const environment = getEnv('NODE_ENV', 'development');
