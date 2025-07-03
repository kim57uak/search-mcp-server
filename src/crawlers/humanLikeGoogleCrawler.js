// src/crawlers/humanLikeGoogleCrawler.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import logger from '../utils/logger.cjs';
import { serviceConfig } from '../config/serviceConfig.js'; // 설정 값 사용을 위해 임포트

puppeteer.use(StealthPlugin());

class HumanLikeGoogleCrawler {
  /** @type {import('puppeteer').Browser | null} */
  #browser = null;
  /** @type {object} */
  #config;

  constructor(config) {
    this.#config = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--start-maximized',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled', // Stealth plugin과 함께 사용
      ],
      waitUntil: 'networkidle2',
      timeout: 60000, // 기본 타임아웃 60초
      ...config, // 외부 설정으로 덮어쓰기
    };

    // User-Agent 및 Headers는 serviceConfig에서 가져오거나, 여기서 직접 정의할 수 있음
    this.#config.userAgent = this.#config.userAgent || serviceConfig.crawler.puppeteer.userAgent;
    this.#config.defaultHeaders = this.#config.defaultHeaders || serviceConfig.crawler.puppeteer.defaultHeaders;

    logger.info('[HumanLikeGoogleCrawler] Initialized with config:', this.#config);
  }

  async launch() {
    if (this.#browser && this.#browser.isConnected()) {
      logger.info('[HumanLikeGoogleCrawler] Browser already launched.');
      return this.#browser;
    }
    try {
      const executablePath = this.#config.executablePath ||
        (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' :
         process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
         '/usr/bin/google-chrome');

      logger.info(`[HumanLikeGoogleCrawler] Launching browser with executablePath: ${executablePath}`);
      this.#browser = await puppeteer.launch({
        headless: this.#config.headless,
        executablePath,
        args: this.#config.args,
        ignoreHTTPSErrors: true, // SSL 오류 무시 (필요에 따라)
      });
      logger.info('[HumanLikeGoogleCrawler] Browser launched successfully.');
      return this.#browser;
    } catch (error) {
      logger.error(`[HumanLikeGoogleCrawler] Error launching browser: ${error.message}`, { stack: error.stack });
      this.#browser = null;
      throw new Error(`HumanLikeGoogleCrawler 브라우저를 실행할 수 없습니다: ${error.message}`);
    }
  }

  /**
   * Google 검색을 수행하고 결과 페이지의 HTML을 반환합니다.
   * @param {string} query - 검색어
   * @param {object} [pageOptions={}] - 페이지 이동 및 상호작용 관련 옵션
   * @param {string} [pageOptions.referer] - Referer 헤더 값
   * @returns {Promise<string>} 검색 결과 페이지의 raw HTML 문자열
   */
  async searchAndGetResults(query, pageOptions = {}) {
    let page;
    try {
      const browser = await this.launch();
      if (!browser) {
        throw new Error('HumanLikeGoogleCrawler 브라우저가 초기화되지 않았습니다.');
      }
      page = await browser.newPage();

      // 사용자 에이전트 및 헤더 설정
      await page.setUserAgent(this.#config.userAgent);
      const headers = { ...(this.#config.defaultHeaders || {}) };
      if (pageOptions.referer) {
        headers['Referer'] = pageOptions.referer;
      }
      // Google 검색에 특화된 헤더 추가 (예: Accept-Language)
      headers['Accept-Language'] = headers['Accept-Language'] || 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7';
      await page.setExtraHTTPHeaders(headers);

      // Google 검색 페이지 설정 로드
      const { baseUrl, searchInputSelector, searchButtonSelector } = serviceConfig.googleSearch;

      logger.info(`[HumanLikeGoogleCrawler] Navigating to Google homepage: ${baseUrl}`);
      await page.goto(baseUrl, {
        waitUntil: this.#config.waitUntil,
        timeout: this.#config.timeout,
      });

      // 쿠키 동의창 등이 있을 경우 처리 (필요에 따라 추가)
      // 예: await this.handleCookieConsent(page);

      logger.info(`[HumanLikeGoogleCrawler] Typing query "${query}" into search input: ${searchInputSelector}`);
      await page.waitForSelector(searchInputSelector, { visible: true, timeout: this.#config.timeout / 2 });
      await page.type(searchInputSelector, query, { delay: Math.random() * 100 + 50 }); // 랜덤 딜레이

      // 검색 버튼 클릭 또는 Enter
      logger.info(`[HumanLikeGoogleCrawler] Attempting to click search button or press Enter.`);
      try {
        await page.waitForSelector(searchButtonSelector, { visible: true, timeout: 5000 }); // 버튼이 나타날 때까지 잠시 대기
        // 여러 버튼 중 실제로 보이는 첫 번째 버튼 클릭 시도
        const buttons = await page.$$(searchButtonSelector);
        let clicked = false;
        for (const button of buttons) {
          if (await button.isIntersectingViewport()) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: this.#config.waitUntil, timeout: this.#config.timeout }),
                button.click({ delay: Math.random() * 50 + 20 }) // 클릭 딜레이
            ]);
            clicked = true;
            logger.info(`[HumanLikeGoogleCrawler] Clicked search button: ${searchButtonSelector}`);
            break;
          }
        }
        if (!clicked) {
          logger.warn(`[HumanLikeGoogleCrawler] No visible search button found or clickable. Pressing Enter.`);
          await Promise.all([
            page.waitForNavigation({ waitUntil: this.#config.waitUntil, timeout: this.#config.timeout }),
            page.keyboard.press('Enter')
          ]);
        }
      } catch (e) {
        logger.warn(`[HumanLikeGoogleCrawler] Error clicking search button, pressing Enter. Error: ${e.message}`);
        await Promise.all([
            page.waitForNavigation({ waitUntil: this.#config.waitUntil, timeout: this.#config.timeout }),
            page.keyboard.press('Enter')
        ]);
      }

      logger.info('[HumanLikeGoogleCrawler] Search results page loaded.');
      const rawHtml = await page.content();
      return rawHtml;

    } catch (error) {
      logger.error(`[HumanLikeGoogleCrawler] Error during Google search for query "${query}": ${error.message}`, { stack: error.stack });
      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw new Error(`URL을 찾을 수 없습니다: ${serviceConfig.googleSearch.baseUrl}`);
      } else if (error.name === 'TimeoutError' || error.message.toLowerCase().includes('timeout')) {
        throw new Error(`Google 검색 중 시간 초과 발생: ${query}`);
      }
      throw new Error(`Google 검색 중 오류 발생: ${query} (${error.message})`);
    } finally {
      if (page) {
        try {
          await page.close();
          logger.info('[HumanLikeGoogleCrawler] Page closed.');
        } catch (closeError) {
          logger.warn(`[HumanLikeGoogleCrawler] Error closing page: ${closeError.message}`);
        }
      }
    }
  }

  async close() {
    if (this.#browser) {
      try {
        await this.#browser.close();
        logger.info('[HumanLikeGoogleCrawler] Browser closed successfully.');
      } catch (error) {
        logger.error(`[HumanLikeGoogleCrawler] Error closing browser: ${error.message}`, { stack: error.stack });
      } finally {
        this.#browser = null;
      }
    } else {
      logger.info('[HumanLikeGoogleCrawler] Browser already closed or not launched.');
    }
  }

  /**
   * (예시) 쿠키 동의 처리 함수
   * 실제 Google 페이지 구조에 맞게 선택자 등을 수정해야 합니다.
   */
  async handleCookieConsent(page) {
    try {
      const consentButtonSelectors = [
        'button[aria-label="Accept all"]', // 일반적인 동의 버튼
        'button[id*="consent"]',
        // 다른 가능한 선택자들
      ];
      for (const selector of consentButtonSelectors) {
        const button = await page.$(selector);
        if (button && await button.isIntersectingViewport()) {
          logger.info(`[HumanLikeGoogleCrawler] Found cookie consent button: ${selector}. Clicking...`);
          await button.click();
          await page.waitForTimeout(1000 + Math.random() * 1000); // 클릭 후 잠시 대기
          logger.info(`[HumanLikeGoogleCrawler] Clicked cookie consent button.`);
          return; // 하나 처리하면 종료
        }
      }
    } catch (error) {
      logger.warn(`[HumanLikeGoogleCrawler] Could not handle cookie consent: ${error.message}`);
    }
  }
}

export default HumanLikeGoogleCrawler;
// src/crawlers/humanLikeGoogleCrawler.js
// ... (이전 코드와 동일)

// HumanLikeGoogleCrawler 클래스에 getBrowser 메서드 추가
// async getBrowser() {
//   if (!this.#browser || !this.#browser.isConnected()) {
//     await this.launch();
//   }
//   return this.#browser;
// }

// ... (나머지 코드와 동일)
// 이 주석 처리된 부분은 searchService.js의 임시 코드와 관련된 것으로,
// searchService.js가 HumanLikeGoogleCrawler의 searchAndGetResults를 직접 사용하게 되면 필요 없어집니다.
// 따라서 HumanLikeGoogleCrawler 자체에는 getBrowser를 노출할 필요가 없습니다.
// searchService에서 HumanLikeGoogleCrawler 인스턴스를 만들고, searchAndGetResults를 호출하는 것이 올바른 패턴입니다.
