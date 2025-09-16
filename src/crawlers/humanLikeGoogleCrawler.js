// src/crawlers/humanLikeGoogleCrawler.js
import axios from 'axios';
import logger from '../utils/logger.cjs';

class HumanLikeGoogleCrawler {
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
    // Randomize User-Agent
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const headers = {
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };

    this.session = axios.create({
      headers,
      timeout: this.config.timeout,
      validateStatus: (status) => status < 500,
      maxRedirects: 5
    });

    logger.info('[HumanLikeGoogleCrawler] Session configured with randomized headers');
  }

  async getRawHtml(url) {
    logger.info(`[HumanLikeGoogleCrawler] Fetching URL: "${url}"`);
    
    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      try {
        // Random delay before request (1-3 seconds)
        await this.sleep(1000 + Math.random() * 2000);
        
        logger.info(`[HumanLikeGoogleCrawler] Attempt ${attempt + 1} - Requesting: ${url}`);
        
        const response = await this.session.get(url);
        
        if (response.status !== 200) {
          logger.error(`[HumanLikeGoogleCrawler] HTTP ${response.status} received`);
          throw new Error(`HTTP ${response.status} error`);
        }

        const html = response.data;
        
        // Check for CAPTCHA or access restrictions
        if (this.isCaptchaPage(html)) {
          logger.warn(`[HumanLikeGoogleCrawler] CAPTCHA detected on attempt ${attempt + 1}`);
          throw new Error('CAPTCHA detected');
        }
        
        logger.info(`[HumanLikeGoogleCrawler] Successfully retrieved HTML`);
        return html;

      } catch (error) {
        attempt++;
        logger.error(`[HumanLikeGoogleCrawler] Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt >= this.config.maxRetries) {
          throw new Error(`Request failed after ${this.config.maxRetries} attempts: ${error.message}`);
        }
        
        // Longer delay for CAPTCHA (5-10 seconds)
        const delay = error.message.includes('CAPTCHA') ? 
          5000 + Math.random() * 5000 : 
          this.config.retryDelay * attempt;
        
        await this.sleep(delay);
        
        // Refresh session on CAPTCHA
        if (error.message.includes('CAPTCHA')) {
          this.setupSession();
        }
      }
    }
  }

  async searchAndGetResults(query) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR`;
    return this.getRawHtml(searchUrl);
  }



  isCaptchaPage(html) {
    const captchaIndicators = [
      'unusual traffic',
      '로봇이 아닙니다',
      'having trouble accessing',
      'captcha',
      'verify you are human',
      'prove you are not a robot'
    ];
    
    return captchaIndicators.some(indicator => 
      html.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    logger.info('[HumanLikeGoogleCrawler] Crawler closed');
  }
}

export default HumanLikeGoogleCrawler;