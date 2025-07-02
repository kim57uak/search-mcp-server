// src/config/serviceConfig.js
import { findChromePath } from '../utils/chromePathFinder.js';

// 환경 변수에서 Google 검색 기본 URL을 가져오거나 기본값을 사용합니다.
const NAVER_SEARCH_BASE_URL =
  process.env.GOOGLE_SEARCH_BASE_URL || 'https://search.naver.com/search.naver?ie=utf8&query='; // 네이버 검색으로 되어있던 것을 Google로 변경 고려 또는 변수명 변경
  // process.env.GOOGLE_SEARCH_BASE_URL || 'https://www.google.com/search?q=';


export const serviceConfig = {
  naverSearch: {
    baseUrl: NAVER_SEARCH_BASE_URL,
    // 필요에 따라 다른 Google 검색 관련 설정을 추가할 수 있습니다.
    // 예: 기본 검색 매개변수, API 키 (만약 사용한다면) 등
    defaultParams: {
      // 예: hl: 'ko' // 기본 한국어 검색
    },
    referer: 'https://www.google.com/', // Google 검색 시 사용할 Referer
  },
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || findChromePath() || null, // OS별 기본 경로 자동 탐색
    headless: process.env.PUPPETEER_HEADLESS !== 'false', // 기본값 true, 'false' 문자열일 때만 false
    args: process.env.PUPPETEER_ARGS ? process.env.PUPPETEER_ARGS.split(',') : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--start-maximized'],
    userAgent: process.env.PUPPETEER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
    defaultHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      // 'User-Agent'는 puppeteer.userAgent 설정을 따르므로 여기서 중복 설정하지 않음
    },
    waitUntil: process.env.PUPPETEER_WAIT_UNTIL || 'networkidle2', // 'load', 'domcontentloaded', 'networkidle0', 'networkidle2'
    timeout: process.env.PUPPETEER_TIMEOUT ? parseInt(process.env.PUPPETEER_TIMEOUT, 10) : 60000, // ms 단위, 기본 60초
  },
  // 다른 서비스 설정을 추가할 수 있습니다.
};

// MCP 서버에서 사용할 환경 변수 (선택 사항, 예시)
export const environment = process.env.NODE_ENV || 'development';
