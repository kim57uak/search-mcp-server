// src/crawlers/seleniumCrawler.js
import { Builder, By, until, Capabilities } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import firefox from 'selenium-webdriver/firefox.js';
import logger from '../utils/logger.cjs';

/**
 * @implements {WebCrawlerInterface}
 * Selenium WebDriver를 사용하여 웹 페이지를 크롤링하는 클래스입니다.
 */
class SeleniumCrawler {
  /** @type {import('selenium-webdriver').WebDriver | null} */
  #driver = null;
  /** @type {object} */
  #config;

  /**
   * SeleniumCrawler 인스턴스를 생성합니다.
   * @param {object} config - Selenium 설정 객체.
   * @param {string} [config.browser='chrome'] - 사용할 브라우저 ('chrome', 'firefox' 등).
   * @param {string} [config.driverPath] - WebDriver 실행 파일 경로 (옵션, PATH에 설정된 경우 생략 가능).
   * @param {boolean} [config.headless=true] - 헤드리스 모드 사용 여부.
   * @param {string[]} [config.args=[]] - 브라우저 실행 시 추가 인수.
   * @param {string} [config.userAgent] - 기본 사용자 에이전트.
   * @param {object} [config.defaultHeaders] - 기본 HTTP 헤더 (Selenium은 직접적인 헤더 설정이 제한적일 수 있음).
   * @param {number} [config.pageLoadTimeout=30000] - 페이지 로드 타임아웃 (ms).
   * @param {number} [config.scriptTimeout=30000] - 스크립트 실행 타임아웃 (ms).
   * @param {object} [config.proxy] - 프록시 설정 (예: { httpProxy: 'host:port' })
   */
  constructor(config) {
    this.#config = {
      browser: 'chrome',
      headless: true,
      pageLoadTimeout: 30000, // 기본값 30초
      scriptTimeout: 30000, // 기본값 30초
      args: [],
      ...config,
    };
    logger.info('[SeleniumCrawler] Initialized with config:', this.#config);
  }

  /**
   * Selenium WebDriver 인스턴스를 시작합니다.
   * 이미 실행 중인 인스턴스가 있으면 해당 인스턴스를 반환합니다.
   * @async
   * @returns {Promise<import('selenium-webdriver').WebDriver>} WebDriver 객체
   * @throws {Error} WebDriver 실행 중 오류 발생 시
   */
  async launch() {
    if (this.#driver) {
      try {
        await this.#driver.getTitle();
        logger.info('[SeleniumCrawler] WebDriver already launched.');
        return this.#driver;
      } catch (e) {
        logger.warn('[SeleniumCrawler] Existing WebDriver session seems inactive. Re-launching.');
        await this.close();
      }
    }

    try {
      const builder = new Builder().forBrowser(this.#config.browser);
      let options;

      switch (this.#config.browser.toLowerCase()) {
        case 'chrome':
          options = new chrome.Options();
          if (this.#config.headless) {
            options.addArguments('--headless');
          }
          options.addArguments('--no-sandbox');
          options.addArguments('--disable-dev-shm-usage');
          options.addArguments('--disable-gpu');
          if (this.#config.userAgent) {
            options.addArguments(`--user-agent=${this.#config.userAgent}`);
          }
          (this.#config.args || []).forEach(arg => options.addArguments(arg));
          if (this.#config.driverPath) {
            const service = new chrome.ServiceBuilder(this.#config.driverPath);
            builder.setChromeService(service);
          }
          builder.setChromeOptions(options);
          break;
        case 'firefox':
          options = new firefox.Options();
          if (this.#config.headless) {
            options.addArguments('-headless');
          }
          if (this.#config.userAgent) {
            await options.setPreference('general.useragent.override', this.#config.userAgent);
          }
          (this.#config.args || []).forEach(arg => options.addArguments(arg));
          if (this.#config.driverPath) {
             const service = new firefox.ServiceBuilder(this.#config.driverPath);
             builder.setFirefoxService(service);
          }
          builder.setFirefoxOptions(options);
          break;
        default:
          throw new Error(`Unsupported browser: ${this.#config.browser}`);
      }

      if (this.#config.proxy) {
        builder.setProxy(this.#config.proxy);
      }

      this.#driver = await builder.build();

      await this.#driver.manage().setTimeouts({
        pageLoad: this.#config.pageLoadTimeout,
        script: this.#config.scriptTimeout,
      });

      logger.info(`[SeleniumCrawler] WebDriver for ${this.#config.browser} launched successfully.`);
      return this.#driver;
    } catch (error) {
      logger.error(`[SeleniumCrawler] Error launching WebDriver: ${error.message}`, { stack: error.stack });
      this.#driver = null;
      throw new Error(`Selenium WebDriver를 실행할 수 없습니다 (${this.#config.browser}): ${error.message}`);
    }
  }

  /**
   * 특정 URL로 이동하여 페이지의 원시 HTML 콘텐츠를 반환합니다.
   * @async
   * @param {string} url - 가져올 페이지의 URL
   * @param {object} [options={}] - 크롤링 동작을 제어하는 추가 옵션
   * @param {string} [options.userAgent] - (주의: Selenium은 시작 시점에 설정, 중간 변경 어려움)
   * @param {object} [options.headers] - (주의: Selenium은 직접적인 요청 헤더 수정이 제한적임)
   * @param {string} [options.referer] - (주의: Selenium에서 Referer 직접 설정은 어려움, 보통 JS로 처리)
   * @param {string|number} [options.waitUntil] - Selenium에서는 주로 Explicit Waits로 구현. 여기서는 타임아웃으로 간주.
   * @param {number} [options.timeout] - 페이지 로드 타임아웃 (ms).
   * @returns {Promise<string>} 페이지의 raw HTML 문자열
   * @throws {Error} 페이지 로드 또는 콘텐츠 가져오기 중 오류 발생 시
   */
  async getRawHtml(url, options = {}) {
    try {
      const driver = await this.launch();
      if (!driver) {
        throw new Error('Selenium WebDriver가 초기화되지 않았습니다.');
      }

      if (options.headers && Object.keys(options.headers).length > 0) {
        logger.warn('[SeleniumCrawler] Custom headers per request are not easily supported by Selenium. They might be ignored.');
      }
      if (options.referer) {
        logger.warn('[SeleniumCrawler] Custom referer per request is not easily supported by Selenium. It might be ignored.');
      }
      if (options.userAgent && options.userAgent !== this.#config.userAgent) {
        logger.warn('[SeleniumCrawler] Dynamic User-Agent change per request is not supported by Selenium. Initial User-Agent is used.');
      }

      logger.info(`[SeleniumCrawler] Navigating to URL: ${url}`);
      const pageLoadTimeout = options.timeout || this.#config.pageLoadTimeout;

      await driver.get(url);

      if (typeof options.waitUntil === 'string') {
        if (options.waitUntil === 'domcontentloaded' || options.waitUntil === 'load' || options.waitUntil === 'networkidle0' || options.waitUntil === 'networkidle2') {
          logger.info(`[SeleniumCrawler] Waiting for body to be located (as a proxy for waitUntil: ${options.waitUntil}). Timeout: ${pageLoadTimeout}ms`);
          await driver.wait(until.elementLocated(By.tagName('body')), pageLoadTimeout);
        }
      } else if (typeof options.waitUntil === 'number') {
        logger.info(`[SeleniumCrawler] Explicitly waiting for ${options.waitUntil}ms.`);
        await driver.sleep(options.waitUntil);
      }

      const rawHtml = await driver.getPageSource();
      logger.info(`[SeleniumCrawler] Successfully retrieved HTML content from ${url}`);
      return rawHtml;
    } catch (error) {
      logger.error(`[SeleniumCrawler] Error getting raw HTML from URL "${url}": ${error.message}`, { stack: error.stack });
      if (error.name === 'TimeoutError' || error.message.toLowerCase().includes('timeout waiting for page to load')) {
        throw new Error(`URL 요청 시간 초과: ${url}`);
      } else if (error.name === 'NoSuchWindowError' || error.message.toLowerCase().includes('no such window')) {
         this.#driver = null;
         throw new Error(`브라우저 창이 닫혔거나 사용할 수 없습니다: ${url}`);
      }
      throw new Error(`URL에서 HTML을 가져오는 중 오류 발생: ${url} (${error.message})`);
    }
  }

  /**
   * Selenium WebDriver를 종료하고 관련 리소스를 해제합니다.
   * @async
   * @returns {Promise<void>}
   */
  async close() {
    if (this.#driver) {
      try {
        await this.#driver.quit();
        logger.info('[SeleniumCrawler] WebDriver quit successfully.');
      } catch (error) {
        logger.error(`[SeleniumCrawler] Error quitting WebDriver: ${error.message}`, { stack: error.stack });
      } finally {
        this.#driver = null;
      }
    } else {
      logger.info('[SeleniumCrawler] WebDriver already quit or not launched.');
    }
  }
}

export default SeleniumCrawler;
