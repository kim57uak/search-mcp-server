// src/tools/index.js
import { googleSearchTool } from './googleSearchTool.js';
import { urlFetcherTool } from './urlFetcherTool.js';
import { genericSearchTool } from './genericSearchTool.js'; // 새로운 일반 검색 도구

export const tools = [
  googleSearchTool,   // 유지
  urlFetcherTool,     // 유지
  genericSearchTool,  // 새로 추가
];

// 기존의 개별 검색 도구 및 integratedSearchTool은 제거됨
// import { naverSearchTool } from './naverSearchTool.js';
// import { daumSearchTool } from './daumSearchTool.js';
// import { bingSearchTool } from './bingSearchTool.js';
// import { nateSearchTool } from './nateSearchTool.js';
// import { baiduSearchTool } from './baiduSearchTool.js';
// import { yahooJapanSearchTool } from './yahooJapanSearchTool.js';
// import { yahooSearchTool } from './yahooSearchTool.js';
// import { yandexSearchTool } from './yandexSearchTool.js';
// import { integratedSearchTool } from './integratedSearchTool.js';
// ... 등등의 import는 이제 필요 없습니다.
