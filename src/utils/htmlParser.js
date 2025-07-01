// src/utils/htmlParser.js
import { load } from 'cheerio';
import logger from './logger.cjs'; // 로깅 추가 고려

/**
 * HTML 문자열에서 불필요한 태그를 제거하고 텍스트 콘텐츠를 추출하거나,
 * 원본 HTML의 특정 부분만 추출합니다.
 * @param {string} htmlString - 원본 HTML 문자열
 * @param {boolean} includeHtml - HTML 태그를 포함할지 여부. true이면 원본 HTML (또는 특정 부분) 반환, false이면 텍스트만 추출.
 * @param {string|null} [selector=null] - includeHtml이 true일 때, 특정 부분만 추출할 경우 사용할 CSS 선택자. null이면 전체 htmlString 반환.
 * @returns {string} 처리된 문자열
 */
export const cleanHtml = (htmlString, includeHtml, selector = null) => {
  if (includeHtml) {
    if (selector) {
      try {
        const $ = load(htmlString);
        const selectedHtml = $(selector).html();
        if (selectedHtml) {
          logger.debug(`[HtmlParser] Extracted HTML content with selector: ${selector}`);
          return selectedHtml;
        }
        logger.warn(`[HtmlParser] Selector "${selector}" did not find any content. Returning full HTML.`);
        return htmlString;
      } catch (e) {
        logger.error(`[HtmlParser] Error using selector "${selector}": ${e.message}. Returning full HTML.`);
        return htmlString;
      }
    }
    logger.debug('[HtmlParser] Returning full HTML as includeHtml is true and no selector provided.');
    return htmlString; // 전체 HTML 반환
  }

  // includeHtml is false, extract text content
  try {
    const $ = load(htmlString);
    // 제거할 태그 목록 확장 (광고, 댓글 등 일반적인 불필요 요소 추가 가능)
    $('script, style, noscript, iframe, header, footer, nav, aside, form, [aria-hidden="true"], .advertisement, #comments').remove();
    // body 내부의 텍스트를 우선적으로 가져오되, body가 없는 경우 전체 텍스트 시도
    let textContent = $('body').length ? $('body').text() : $.text();
    textContent = textContent.replace(/\s+/g, ' ').trim();
    logger.debug('[HtmlParser] Extracted text content after cleaning HTML.');
    return textContent;
  } catch (e) {
    logger.error(`[HtmlParser] Error cleaning HTML to extract text: ${e.message}. Returning original string as fallback.`);
    // 오류 발생 시 원본 문자열에서 간단한 태그 제거 시도 또는 원본 반환 (정책에 따라 결정)
    return htmlString.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
};
