// src/tools/index.js
import { googleSearchTool } from './googleSearchTool.js';
// 다른 도구들이 있다면 여기에 추가
// import { anotherTool } from './anotherTool.js';

export const tools = [
  {
    ...googleSearchTool,
    description: `google web search`,
  },

  // anotherTool,
];
