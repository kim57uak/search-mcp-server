// src/crawlers/humanLikeGoogleCrawler.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import logger from '../utils/logger.cjs';
import { serviceConfig } from '../config/serviceConfig.js'; // 설정 값 사용을 위해 임포트

// StealthPlugin의 모든 옵션을 명시적으로 활성화
const stealth = StealthPlugin();
// 공식적으로 지원되는 evasions만 활성화
stealth.enabledEvasions.add('navigator.plugins');
stealth.enabledEvasions.add('navigator.languages');
stealth.enabledEvasions.add('navigator.webdriver');
stealth.enabledEvasions.add('chrome.runtime');
stealth.enabledEvasions.add('media.codecs');
stealth.enabledEvasions.add('iframe.contentWindow');
stealth.enabledEvasions.add('window.outerdimensions');
stealth.enabledEvasions.add('user-agent-override');
puppeteer.use(stealth);

// sleep 함수 추가 (클래스 외부)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 다양한 user-agent pool 정의
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-G991N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  // ... 필요시 추가 ...
];

class HumanLikeGoogleCrawler {
  /** @type {import('puppeteer').Browser | null} */
  #browser = null;
  /** @type {object} */
  #config;

  constructor(config) {
    this.#config = {
      headless: false,
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

    // Mac 환경에서 remote-debugging-port/user-data-dir 옵션 추가
    // if (process.platform === 'darwin') {
    //   this.#config.args.push('--remote-debugging-port=9222');
    //   this.#config.args.push('--user-data-dir=/Users/dolpaks/chrometemp');
    // }

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
         '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');

      logger.info(`[HumanLikeGoogleCrawler] Launching browser with executablePath: ${executablePath}`);
      logger.info('[HumanLikeGoogleCrawler] Launching browser with args:', this.#config.args);
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
   * @param {boolean} [retry=false] - CAPTCHA/비정상 트래픽 감지 시 1회 재시도
   * @param {object} [pageOptions={}] - 페이지 이동 및 상호작용 관련 옵션
   * @param {string} [pageOptions.referer] - Referer 헤더 값
   * @returns {Promise<string>} 검색 결과 페이지의 raw HTML 문자열
   */
  async searchAndGetResults(query, retry = false, pageOptions = {}) {
    let page;
    try {
      const browser = await this.launch();
      if (!browser) {
        throw new Error('HumanLikeGoogleCrawler 브라우저가 초기화되지 않았습니다.');
      }
      page = await browser.newPage();

      // Viewport 설정(1920x1080)
      await page.setViewport({ width: 1920, height: 1080 });
      await sleep(500 + Math.random() * 1000); // 페이지 생성 후 대기

      // 다양한 user-agent pool에서 무작위 선택 적용
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
      await page.setUserAgent(randomUA);
      await sleep(500 + Math.random() * 1000); // User-Agent 설정 후 대기

      // 사용자 에이전트 및 헤더 설정
      const headers = { ...(this.#config.defaultHeaders || {}) };
      if (pageOptions.referer) {
        headers['Referer'] = pageOptions.referer;
      }
      // Google 검색에 특화된 헤더 추가 (예: Accept-Language)
      headers['Accept-Language'] = headers['Accept-Language'] || 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7';
      await page.setExtraHTTPHeaders(headers);

      // Google 검색 페이지 설정 로드
      const { baseUrl, searchInputSelector } = serviceConfig.googleSearch;
      const DEFAULT_TIMEOUT = 60000; // 60초로 상향

      logger.info(`[HumanLikeGoogleCrawler] Navigating to Google homepage: ${baseUrl}`);
      await page.goto(baseUrl, {
        waitUntil: this.#config.waitUntil || 'domcontentloaded',
        timeout: DEFAULT_TIMEOUT,
      });

      // 쿠키 동의 자동 처리
      await this.handleCookieConsent(page);

      // 인간 행동 시뮬레이션: 마우스 이동, 클릭, 포커스, 랜덤 대기
      logger.info('[HumanLikeGoogleCrawler] Simulating human-like mouse movement to search input.');
      const searchBox = await page.$(searchInputSelector);
      if (searchBox) {
        const boundingBox = await searchBox.boundingBox();
        if (boundingBox) {
          await page.mouse.move(
            boundingBox.x + boundingBox.width / 2 + Math.random() * 10,
            boundingBox.y + boundingBox.height / 2 + Math.random() * 10,
            { steps: 10 }
          );
          await sleep(700 + Math.random() * 800); // 마우스 이동 후 대기
          await searchBox.click();
          await sleep(700 + Math.random() * 800); // 클릭 후 대기
        }
      }

      // 검색어 천천히 타이핑
      logger.info(`[HumanLikeGoogleCrawler] Typing query "${query}" into search input: ${searchInputSelector}`);
      await page.type(searchInputSelector, query, { delay: 120 + Math.random() * 80 });
      await sleep(700 + Math.random() * 800); // 타이핑 후 대기

      // 엔터키 입력 및 결과 대기
      logger.info(`[HumanLikeGoogleCrawler] Pressing Enter to submit search query.`);
      await Promise.all([
        page.waitForNavigation({ waitUntil: this.#config.waitUntil || 'domcontentloaded', timeout: DEFAULT_TIMEOUT }),
        page.keyboard.press('Enter')
      ]);
      await sleep(700 + Math.random() * 800); // 엔터 후 대기

      // 결과 페이지 주요 요소 대기 (예외 처리 강화)
      logger.info('[HumanLikeGoogleCrawler] Waiting for search results to appear.');
      let searchResultsAppeared = false;
      try {
        await page.waitForSelector('#search, .g, .rc', { timeout: DEFAULT_TIMEOUT });
        searchResultsAppeared = true;
      } catch {
        const pageContent = await page.content();
        if (/로봇이 아닙니다|비정상 트래픽|captcha|자동 검색|보안문자/i.test(pageContent)) {
          logger.error('[HumanLikeGoogleCrawler] CAPTCHA/비정상 트래픽 감지됨. HTML 일부:', pageContent.slice(0, 500));
          throw new Error('Google 검색 중 CAPTCHA/비정상 트래픽으로 중단됨.');
        } else {
          logger.error('[HumanLikeGoogleCrawler] 검색 결과 없음. HTML 일부:', pageContent.slice(0, 500));
          throw new Error('Google 검색 결과를 찾을 수 없습니다.');
        }
      }

      if (searchResultsAppeared) {
        // 랜덤 스크롤/마우스 이동(1~2회)
        for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
          await page.mouse.move(100 + Math.random() * 400, 300 + Math.random() * 200, { steps: 5 });
          await sleep(700 + Math.random() * 800);
          await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 300));
          await sleep(700 + Math.random() * 800);
        }
      }

      // 캡차/비정상 트래픽 감지 및 재시도(최대 2회, 5~10초 랜덤 대기)
      const pageContent = await page.content();
      if (/로봇이 아닙니다|비정상 트래픽|captcha|자동 검색|보안문자/i.test(pageContent)) {
        logger.warn('[HumanLikeGoogleCrawler] CAPTCHA or abnormal traffic detected. Retrying after delay...');
        await sleep(5000 + Math.random() * 5000); // 5~10초 대기
        // 최대 2회까지 재시도
        if (typeof retry === 'number') {
          if (retry < 2) {
            return await this.searchAndGetResults(query, retry + 1, pageOptions);
          } else {
            throw new Error('Google 검색 중 CAPTCHA/비정상 트래픽으로 중단됨. (최대 재시도 초과)');
          }
        } else if (!retry) {
          // 최초 호출이면 retry=0으로 시작
          return await this.searchAndGetResults(query, 1, pageOptions);
        } else {
          throw new Error('Google 검색 중 CAPTCHA/비정상 트래픽으로 중단됨.');
        }
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
          await sleep(1000 + Math.random() * 1000); // 클릭 후 잠시 대기
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
