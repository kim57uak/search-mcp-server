// src/tools/index.js
// import { naverSearchTool } from './naverSearchTool.js';
// import { daumSearchTool } from './daumSearchTool.js';
// import { bingSearchTool } from './bingSearchTool.js';
// import { nateSearchTool } from './nateSearchTool.js'; // nateSearchTool 임포트
import { googleSearchTool } from './googleSearchTool.js'; // googleSearchTool 임포트
import { baiduSearchTool } from './baiduSearchTool.js';
import { yahooJapanSearchTool } from './yahooJapanSearchTool.js';
import { yahooSearchTool } from './yahooSearchTool.js';
import { yandexSearchTool } from './yandexSearchTool.js';
import { integratedSearchTool } from './integratedSearchTool.js';
import { urlFetcherTool } from './urlFetcherTool.js';


export const tools = [
  //naverSearchTool,
  //daumSearchTool,
  //bingSearchTool,
  //nateSearchTool, // nateSearchTool 추가
  googleSearchTool, // googleSearchTool 추가
  baiduSearchTool,
  yahooJapanSearchTool,
  yahooSearchTool,
  yandexSearchTool,
  urlFetcherTool,
  integratedSearchTool,
];
