// src/crawlers/axiosGoogleCrawler.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.cjs';

class AxiosGoogleCrawler {
  constructor(config = {}) {
    this.config = {
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    
    this.setupSession();
  }

  setupSession() {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };

    this.session = axios.create({
      headers,
      timeout: this.config.timeout,
      validateStatus: (status) => status < 500, // Accept 4xx errors
      maxRedirects: 5
    });

    logger.info('[AxiosGoogleCrawler] Session configured with browser-like headers');
  }

  async searchGoogle(query, includeHtml = true, maxPages = 3) {
    logger.info(`[AxiosGoogleCrawler] Starting Google search for: "${query}"`);
    
    const allResults = [];
    
    for (let page = 0; page < maxPages; page++) {
      // Use Google News URL with latest news sorting and pagination
      const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko&when=1h&sort=date${page > 0 ? `&start=${page * 10}` : ''}`;
    
      let attempt = 0;
      while (attempt < this.config.maxRetries) {
        try {
          logger.info(`[AxiosGoogleCrawler] Page ${page + 1} - Attempt ${attempt + 1} - Requesting: ${searchUrl}`);
          
          const response = await this.session.get(searchUrl);
          
          if (response.status !== 200) {
            logger.error(`[AxiosGoogleCrawler] HTTP ${response.status} received`);
            throw new Error(`HTTP ${response.status} error`);
          }

          const html = response.data;
          const pageResult = {
            page: page + 1,
            query,
            resultText: includeHtml ? html : this.extractTextFromHtml(html),
            retrievedAt: new Date().toISOString(),
            searchEngine: 'google',
            searchUrl
          };
          
          allResults.push(pageResult);
          logger.info(`[AxiosGoogleCrawler] Successfully retrieved page ${page + 1}`);
          break;

        } catch (error) {
          attempt++;
          logger.error(`[AxiosGoogleCrawler] Page ${page + 1} - Attempt ${attempt} failed: ${error.message}`);
          
          if (attempt >= this.config.maxRetries) {
            logger.error(`[AxiosGoogleCrawler] Page ${page + 1} failed after ${this.config.maxRetries} attempts`);
            break;
          }
          
          await this.sleep(this.config.retryDelay * attempt);
        }
      }
      
      // Add delay between pages
      if (page < maxPages - 1) {
        await this.sleep(1000);
      }
    }
    
    if (allResults.length === 0) {
      throw new Error(`Google search failed for all ${maxPages} pages`);
    }
    
    return {
      query,
      totalPages: allResults.length,
      maxPages,
      results: allResults,
      retrievedAt: new Date().toISOString(),
      searchEngine: 'google'
    };
  }

  extractTextFromHtml(html) {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, noscript').remove();
    
    // Extract main content areas
    const contentSelectors = [
      '#search',
      '#main',
      '.g',
      '.rc',
      'body'
    ];
    
    let text = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        text = element.text();
        break;
      }
    }
    
    // Clean up whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    // No persistent connection to close with axios
    logger.info('[AxiosGoogleCrawler] Crawler closed');
  }
}

export default AxiosGoogleCrawler;