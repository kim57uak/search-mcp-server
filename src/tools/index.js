// src/tools/index.js
// import { naverSearchTool } from './naverSearchTool.js';
// import { daumSearchTool } from './daumSearchTool.js';
// import { bingSearchTool } from './bingSearchTool.js';
// import { nateSearchTool } from './nateSearchTool.js'; // nateSearchTool 임포트
import { integratedSearchTool } from './integratedSearchTool.js';
import { urlFetcherTool } from './urlFetcherTool.js';

export const tools = [
  //naverSearchTool,
  //daumSearchTool,
  //bingSearchTool,
  //nateSearchTool, // nateSearchTool 추가
  urlFetcherTool,
  integratedSearchTool,
];
