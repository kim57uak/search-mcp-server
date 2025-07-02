// src/crawlers/crawlerFactory.js
import PuppeteerCrawler from './puppeteerCrawler.js';
import SeleniumCrawler from './seleniumCrawler.js';
import logger from '../utils/logger.cjs';

/**
 * @typedef {object} CrawlerConfig
 * @property {'puppeteer' | 'selenium'} type - 사용할 크롤러 유형
 * @property {object} [puppeteer] - Puppeteer 설정 (type이 'puppeteer'일 경우 사용)
 * @property {object} [selenium] - Selenium 설정 (type이 'selenium'일 경우 사용)
 */

/**
 * 지정된 설정에 따라 적절한 웹 크롤러 인스턴스를 생성합니다.
 * @param {CrawlerConfig} config - 크롤러 설정 객체.
 * @returns {Promise<PuppeteerCrawler|SeleniumCrawler>} 생성된 크롤러 인스턴스.
 * @throws {Error} 지원되지 않는 크롤러 유형이거나 설정이 부적절할 경우.
 */
async function createCrawler(config) {
  if (!config || !config.type) {
    logger.error('[CrawlerFactory] Crawler type not specified in config.');
    throw new Error('크롤러 유형(config.type)이 지정되지 않았습니다.');
  }

  logger.info(`[CrawlerFactory] Attempting to create crawler of type: ${config.type}`);

  switch (config.type.toLowerCase()) {
    case 'puppeteer':
      if (!config.puppeteer) {
        logger.error('[CrawlerFactory] Puppeteer config not provided for puppeteer crawler type.');
        throw new Error("크롤러 유형이 'puppeteer'이지만, puppeteer 설정이 제공되지 않았습니다.");
      }
      return new PuppeteerCrawler(config.puppeteer);

    case 'selenium':
      if (!config.selenium) {
        logger.error('[CrawlerFactory] Selenium config not provided for selenium crawler type.');
        throw new Error("크롤러 유형이 'selenium'이지만, selenium 설정이 제공되지 않았습니다.");
      }
      return new SeleniumCrawler(config.selenium);

    default:
      logger.error(`[CrawlerFactory] Unsupported crawler type: ${config.type}`);
      throw new Error(`지원되지 않는 크롤러 유형입니다: ${config.type}`);
  }
}

export { createCrawler };
