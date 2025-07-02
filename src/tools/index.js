// src/tools/index.js
import { naverSearchTool } from './naverSearchTool.js';
import { urlFetcherTool } from './urlFetcherTool.js';
import { daumSearchTool } from './daumSearchTool.js'; // daumSearchTool 임포트

export const tools = [
  naverSearchTool, // naverSearchTool의 원본 객체를 그대로 사용
  urlFetcherTool,  // urlFetcherTool의 원본 객체를 그대로 사용
  daumSearchTool   // daumSearchTool의 원본 객체를 그대로 사용
];
