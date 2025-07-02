// src/crawlers/puppeteerCrawler.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import logger from '../utils/logger.cjs';
// serviceConfig는 생성자나 launch 메서드를 통해 주입받는 것이 더 유연하지만,
// 기존 구조를 최대한 활용하기 위해 직접 import 할 수도 있습니다.
// 여기서는 생성자를 통해 주입받는 형태로 변경해보겠습니다.

puppeteer.use(StealthPlugin());

/**
 * @implements {WebCrawlerInterface}
 * Puppeteer를 사용하여 웹 페이지를 크롤링하는 클래스입니다.
 */
class PuppeteerCrawler {
  /** @type {import('puppeteer').Browser | null} */
  #browser = null;
  /** @type {object} */
  #config;

  /**
   * PuppeteerCrawler 인스턴스를 생성합니다.
   * @param {object} config - Puppeteer 설정 객체. serviceConfig.puppeteer와 유사한 구조.
   * @param {string} [config.executablePath] - Chrome/Chromium 실행 파일 경로.
   * @param {boolean} [config.headless=true] - 헤드리스 모드 사용 여부.
   * @param {string[]} [config.args=[]] - 브라우저 실행 시 추가 인수.
   * @param {string} [config.userAgent] - 기본 사용자 에이전트.
   * @param {object} [config.defaultHeaders] - 기본 HTTP 헤더.
   * @param {string} [config.waitUntil='networkidle2'] - 기본 페이지 로드 대기 조건.
   * @param {number} [config.timeout=30000] - 기본 타임아웃 (ms).
   */
  constructor(config) {
    this.#config = {
      headless: true,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
      waitUntil: 'networkidle2',
      timeout: 30000, // 기본값 30초
      ...config, // 외부에서 주입된 설정으로 덮어쓰기
    };

    // args는 외부 설정과 기본 설정을 병합하도록 수정
    if (config && config.args) {
      this.#config.args = [
        ...new Set([ // 중복 제거
          '--start-maximized',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          ...(config.args || [])
        ])
      ];
    }
    logger.info('[PuppeteerCrawler] Initialized with config:', this.#config);
  }

  /**
   * Puppeteer 브라우저 인스턴스를 시작합니다.
   * 이미 실행 중인 인스턴스가 있으면 해당 인스턴스를 반환합니다.
   * @async
   * @returns {Promise<import('puppeteer').Browser>} Puppeteer 브라우저 객체
   * @throws {Error} 브라우저 실행 중 오류 발생 시
   */
  async launch() {
    if (this.#browser && this.#browser.isConnected()) {
      logger.info('[PuppeteerCrawler] Browser already launched and connected.');
      return this.#browser;
    }

    try {
      const executablePath = this.#config.executablePath ||
        (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' :
         process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
         '/usr/bin/google-chrome');

      logger.info(`[PuppeteerCrawler] Launching browser with executablePath: ${executablePath}`);
      this.#browser = await puppeteer.launch({
        headless: this.#config.headless,
        executablePath,
        args: this.#config.args,
      });
      logger.info('[PuppeteerCrawler] Browser launched successfully.');
      return this.#browser;
    } catch (error) {
      logger.error(`[PuppeteerCrawler] Error launching browser: ${error.message}`, { stack: error.stack });
      this.#browser = null; // 실패 시 null로 설정
      throw new Error(`Puppeteer 브라우저를 실행할 수 없습니다: ${error.message}`);
    }
  }

  /**
   * 특정 URL로 이동하여 페이지의 원시 HTML 콘텐츠를 반환합니다.
   * @async
   * @param {string} url - 가져올 페이지의 URL
   * @param {object} [options={}] - 크롤링 동작을 제어하는 추가 옵션
   * @param {string} [options.userAgent] - 사용할 사용자 에이전트 문자열.
   * @param {object} [options.headers] - 요청에 포함할 추가 HTTP 헤더.
   * @param {string} [options.referer] - 요청 시 사용할 Referer 헤더 값.
   * @param {string} [options.waitUntil] - 페이지 로드 완료 조건.
   * @param {number} [options.timeout] - 페이지 로드 타임아웃 (ms).
   * @returns {Promise<string>} 페이지의 raw HTML 문자열
   * @throws {Error} 페이지 로드 또는 콘텐츠 가져오기 중 오류 발생 시
   */
  async getRawHtml(url, options = {}) {
    let page;
    try {
      // launch()를 호출하여 브라우저 인스턴스 확보
      const browser = await this.launch();
      if (!browser) {
        throw new Error('Puppeteer 브라우저가 초기화되지 않았습니다.');
      }
      page = await browser.newPage();

      const userAgent = options.userAgent || this.#config.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
      await page.setUserAgent(userAgent);

      const headers = { ...(this.#config.defaultHeaders || {}), ...(options.headers || {}) };
      if (options.referer) {
        headers['Referer'] = options.referer;
      }
      if (Object.keys(headers).length > 0) {
        await page.setExtraHTTPHeaders(headers);
      }

      logger.info(`[PuppeteerCrawler] Navigating to URL: ${url}`);
      await page.goto(url, {
        waitUntil: options.waitUntil || this.#config.waitUntil,
        timeout: options.timeout || this.#config.timeout,
      });

      const rawHtml = await page.content();
      logger.info(`[PuppeteerCrawler] Successfully retrieved HTML content from ${url}`);
      return rawHtml;
    } catch (error) {
      logger.error(`[PuppeteerCrawler] Error getting raw HTML from URL "${url}": ${error.message}`, { stack: error.stack });
      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw new Error(`URL을 찾을 수 없습니다: ${url}`);
      } else if (error.name === 'TimeoutError' || error.message.toLowerCase().includes('timeout')) {
        throw new Error(`URL 요청 시간 초과: ${url}`);
      }
      throw new Error(`URL에서 HTML을 가져오는 중 오류 발생: ${url} (${error.message})`);
    } finally {
      if (page) {
        try {
          await page.close();
          logger.info('[PuppeteerCrawler] Page closed.');
        } catch (closeError) {
          logger.warn(`[PuppeteerCrawler] Error closing page for ${url}: ${closeError.message}`);
        }
      }
      // getRawHtml 호출마다 브라우저를 닫을지, 아니면 close() 메서드를 통해 명시적으로 닫을지 결정 필요.
      // 기존 puppeteerHelper는 매번 닫았으므로, 동일한 동작을 원한다면 여기서 browser.close() 호출.
      // 여기서는 close() 메서드를 통해 명시적으로 닫도록 남겨둡니다.
      // 만약 매번 닫아야 한다면:
      // if (this.#browser) {
      //   await this.close();
      // }
    }
  }

  /**
   * Puppeteer 브라우저를 닫고 관련 리소스를 해제합니다.
   * @async
   * @returns {Promise<void>}
   */
  async close() {
    if (this.#browser) {
      try {
        await this.#browser.close();
        logger.info('[PuppeteerCrawler] Browser closed successfully.');
      } catch (error) {
        logger.error(`[PuppeteerCrawler] Error closing browser: ${error.message}`, { stack: error.stack });
        // throw error; // 필요에 따라 에러를 다시 던질 수 있음
      } finally {
        this.#browser = null;
      }
    } else {
      logger.info('[PuppeteerCrawler] Browser already closed or not launched.');
    }
  }
}

export default PuppeteerCrawler;
