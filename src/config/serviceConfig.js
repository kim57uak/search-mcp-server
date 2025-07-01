// src/config/serviceConfig.js

// 환경 변수에서 Google 검색 기본 URL을 가져오거나 기본값을 사용합니다.
const GOOGLE_SEARCH_BASE_URL =
  process.env.GOOGLE_SEARCH_BASE_URL || 'https://search.naver.com/search.naver?ie=utf8&query=';

export const serviceConfig = {
  googleSearch: {
    baseUrl: GOOGLE_SEARCH_BASE_URL,
    // 필요에 따라 다른 Google 검색 관련 설정을 추가할 수 있습니다.
    // 예: 기본 검색 매개변수, API 키 (만약 사용한다면) 등
    defaultParams: {
      // 예: hl: 'ko' // 기본 한국어 검색
    },
  },
  // 다른 서비스 설정을 추가할 수 있습니다.
};

// MCP 서버에서 사용할 환경 변수 (선택 사항, 예시)
export const environment = process.env.NODE_ENV || 'development';
