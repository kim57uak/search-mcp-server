// src/tools/index.js
import { googleSearchTool } from './googleSearchTool.js';
import { urlFetcherTool } from './urlFetcherTool.js';
import { genericSearchTool } from './genericSearchTool.js';

export const tools = [
  googleSearchTool,
  //humanLikeGoogleSearchTool,
  urlFetcherTool,
  genericSearchTool,
];