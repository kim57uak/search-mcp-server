// src/tools/perplexitySearchTool.js
import { z } from 'zod';
import Perplexity from '@perplexity-ai/perplexity_ai';
import logger from '../utils/logger.cjs';

export const perplexitySearchTool = {
  name: 'perplexitySearch',
  description:
    'Perplexity AI의 검색 API를 사용하여 최신 정보를 검색합니다. 실시간 웹 검색 결과를 제공합니다.',
  inputSchema: {
    query: z.string().min(1, { message: '검색어(query)는 필수입니다.' }),
    country: z.string().optional(),
  },
  async handler({ query, country, includeHtml }) {
    if (typeof query !== 'string' || !query.trim()) {
      const errMsg =
        '[PerplexitySearchTool] 검색어(query)는 필수이며, 빈 문자열일 수 없습니다.';
      logger.error(errMsg, { query });
      throw new Error(errMsg);
    }

    logger.info(
      `[PerplexitySearchTool] Received request - Query: "${query}", Country: ${country || 'none'}, Include HTML: ${includeHtml}`,
    );

    try {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        const errorMsg = 'PERPLEXITY_API_KEY environment variable is required. Please set it in your environment or .env file.';
        logger.error(`[PerplexitySearchTool] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const client = new Perplexity({ apiKey });

      const searchParams = {
        query,
        maxResults: 3,
        maxTokensPerPage: 1024,
        country: country || 'KR',
      };

      const search = await client.search.create(searchParams);

      const formattedResult = {
        query,
        country: country || 'KR',
        results:
          search.results?.map((result) => ({
            title: result.title,
            url: result.url,
            snippet: includeHtml
              ? result.snippet
              : result.snippet?.replace(/<[^>]*>/g, ''),
            date: result.date || null,
            last_updated: result.last_updated || null,
          })) || [],
        retrievedAt: new Date().toISOString(),
        searchEngine: 'perplexity',
        totalResults: search.results?.length || 0,
      };

      logger.info(
        `[PerplexitySearchTool] Successfully executed Perplexity search for query: "${query}"`,
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(formattedResult) }],
      };
    } catch (error) {
      logger.error(
        `[PerplexitySearchTool] Error during Perplexity search for query "${query}": ${error.message}`,
        { stack: error.stack, query, country, includeHtml },
      );
      throw error;
    }
  },
};
