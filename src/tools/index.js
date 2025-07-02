// src/tools/index.js
import { naverSearchTool as naverSearchTool } from './naverSearchTool.js';
import { urlFetcherTool } from './urlFetcherTool.js'; // 새 도구 가져오기
// 다른 도구들이 있다면 여기에 추가
// import { anotherTool } from './anotherTool.js';

export const tools = [
  {
    ...naverSearchTool,
    description: `naver web search`, // 기존 도구 설명 유지 또는 수정
  },
  {
    ...urlFetcherTool,
    description: `특정 url 접근을 통한 웹 컨텐츠 검색`, // 새 도구에 설명 추가
  },
  // anotherTool,
];
