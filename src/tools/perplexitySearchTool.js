// src/tools/perplexitySearchTool.js
import { z } from 'zod';
import Perplexity from '@perplexity-ai/perplexity_ai';
import logger from '../utils/logger.cjs';

export const perplexitySearchTool = {
  name: 'perplexitySearch',
  description:
    'Search for the latest information using Perplexity AI search API. Provides real-time web search results.',
  inputSchema: {
    query: z.string().min(1, { message: 'Search query is required.' }).describe('The search query string to search for'),
    country: z.string().optional().describe('ISO 3166-1 alpha-2 country code for regional search results (e.g., "US", "KR", "JP")'),
    pageSize: z.number().int().min(1).max(10).optional().describe('Number of search results per page to return (1-10, default: 3)'),
  },
  async handler({ query, country, pageSize, includeHtml }) {
    if (typeof query !== 'string' || !query.trim()) {
      const errMsg =
        '[PerplexitySearchTool] 검색어(query)는 필수이며, 빈 문자열일 수 없습니다.';
      logger.error(errMsg, { query });
      throw new Error(errMsg);
    }

    logger.info(
      `[PerplexitySearchTool] Received request - Query: "${query}", Country: ${country || 'none'}, Page Size: ${pageSize || 3}, Include HTML: ${includeHtml}`,
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
        maxResults: pageSize || 3,
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
        { stack: error.stack, query, country, pageSize, includeHtml },
      );
      throw error;
    }
  },
};
