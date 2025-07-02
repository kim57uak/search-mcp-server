// src/utils/puppeteerHelper.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import logger from './logger.cjs';
import { serviceConfig } from '../config/serviceConfig.js';

puppeteer.use(StealthPlugin());

/**
 * Puppeteer 브라우저 인스턴스를 생성하고 초기화합니다.
 * @returns {Promise<import('puppeteer').Browser>} Puppeteer 브라우저 객체
 * @throws {Error} 브라우저 실행 중 오류 발생 시
 */
async function launchBrowser() {
  try {
    const executablePath = serviceConfig.puppeteer.executablePath ||
      (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' :
       process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
       '/usr/bin/google-chrome'); // OS별 기본 경로 제공 및 환경 변수 우선

    logger.info(`[PuppeteerHelper] Launching browser with executablePath: ${executablePath}`);
    const browser = await puppeteer.launch({
      headless: serviceConfig.puppeteer.headless !== undefined ? serviceConfig.puppeteer.headless : true,
      executablePath,
      args: serviceConfig.puppeteer.args || ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'], // 기본 args에 sandbox 옵션 추가
    });
    return browser;
  } catch (error) {
    logger.error(`[PuppeteerHelper] Error launching browser: ${error.message}`, { stack: error.stack });
    throw new Error(`Puppeteer 브라우저를 실행할 수 없습니다: ${error.message}`);
  }
}

/**
 * 주어진 URL로부터 웹 페이지의 raw HTML 콘텐츠를 가져옵니다.
 * @param {string} url - 가져올 페이지의 URL
 * @param {object} [pageOptions] - Puppeteer 페이지에 적용할 추가 옵션 (예: userAgent, extraHeaders)
 * @returns {Promise<string>} 페이지의 raw HTML 문자열
 * @throws {Error} 페이지 로드 또는 콘텐츠 가져오기 중 오류 발생 시
 */
export async function getRawHtml(url, pageOptions = {}) {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    if (pageOptions.userAgent) {
      await page.setUserAgent(pageOptions.userAgent);
    } else {
      await page.setUserAgent(serviceConfig.puppeteer.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }

    let headers;
    if (pageOptions.extraHeaders) {
      headers = { ...pageOptions.extraHeaders };
    } else {
      headers = { ...serviceConfig.puppeteer.defaultHeaders };
    }

    const referer = pageOptions.referer; // Referer는 URL마다 다를 수 있으므로 pageOptions에서 받도록 함
    if (referer) {
      headers['Referer'] = referer;
    }
    await page.setExtraHTTPHeaders(headers);

    logger.info(`[PuppeteerHelper] Navigating to URL: ${url}`);
    await page.goto(url, {
      waitUntil: pageOptions.waitUntil || serviceConfig.puppeteer.waitUntil || 'networkidle2',
      timeout: pageOptions.timeout || serviceConfig.puppeteer.timeout || 30000 // 기본 타임아웃 30초
    });
    const rawHtml = await page.content();
    logger.info(`[PuppeteerHelper] Successfully retrieved HTML content from ${url}`);
    return rawHtml;
  } catch (error) {
    logger.error(`[PuppeteerHelper] Error getting raw HTML from URL "${url}": ${error.message}`, { stack: error.stack });
    if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      throw new Error(`URL을 찾을 수 없습니다: ${url}`);
    } else if (error.name === 'TimeoutError' || error.message.toLowerCase().includes('timeout')) {
      throw new Error(`URL 요청 시간 초과: ${url}`);
    }
    throw new Error(`URL에서 HTML을 가져오는 중 오류 발생: ${url} (${error.message})`);
  } finally {
    if (browser) {
      await browser.close();
      logger.info('[PuppeteerHelper] Browser closed.');
    }
  }
}
