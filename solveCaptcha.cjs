// solveCaptcha.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const os = require('os');
puppeteer.use(StealthPlugin());

function sleep(ms) { 
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 랜덤한 마우스 이동 함수
async function humanMouseMove(page, start, end) {
  const steps = 20 + Math.floor(Math.random() * 10);
  for (let i = 0; i < steps; i++) {
    const x = start.x + ((end.x - start.x) * i) / steps + Math.random() * 2;
    const y = start.y + ((end.y - start.y) * i) / steps + Math.random() * 2;
    await page.mouse.move(x, y);
    await sleep(10 + Math.random() * 10);
  }
}

async function humanLikeGoogleSearch(query) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // 실제 경로 확인!
    args: [
      // '--no-sandbox', // Mac에서는 주석처리
      // '--disable-setuid-sandbox', // Mac에서는 주석처리
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
      '--user-data-dir=/Users/dolpaks/chrometemp',
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // 실제 브라우저 환경과 유사한 User-Agent, Accept-Language 등 세팅
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  });

  // 구글 메인 페이지 진입
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

  // 쿠키 동의 버튼 처리 (있을 경우)
  try {
    const consentBtn = await page.$('button[aria-label="Accept all"]');
    if (consentBtn) {
      await consentBtn.click();
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    }
  } catch {}

  // 검색창 위치 파악 및 마우스 이동
  await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 10000 });
  const searchBox = await page.$('textarea[name="q"], input[name="q"]');
  if (!searchBox) {
    console.error('검색창을 찾을 수 없습니다.');
    await browser.close();
    return;
  }
  const box = await searchBox.boundingBox();
  await humanMouseMove(page, { x: 100, y: 100 }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await sleep(500 + Math.random() * 500);

  // 클릭 후 포커스
  await searchBox.click();
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

  // 검색어를 한 글자씩 천천히 입력
  for (const char of query) {
    await page.keyboard.type(char, { delay: 150 + Math.random() * 100 });
    if (Math.random() < 0.2) await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
  }
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 1000));

  // 엔터 입력
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

  // 결과 페이지에서 마우스 랜덤 이동/스크롤
  for (let i = 0; i < 2; i++) {
    await humanMouseMove(page, { x: 200, y: 200 }, { x: 400 + Math.random() * 200, y: 400 + Math.random() * 200 });
    await sleep(500 + Math.random() * 500);
    await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 300));
    await sleep(500 + Math.random() * 500);
  }

  // 결과 일부 출력
  const content = await page.content();
  console.log(content.slice(0, 1000));

  await browser.close();
}

humanLikeGoogleSearch('오늘의 환율');

