// src/tools/index.js
//import { googleSearchTool } from './googleSearchTool.js';
import { urlFetcherTool } from './urlFetcherTool.js';
import { genericSearchTool } from './genericSearchTool.js'; // 새로운 일반 검색 도구

export const tools = [
 // googleSearchTool,   // 유지
  urlFetcherTool,     // 유지
  genericSearchTool,  // 새로 추가
];