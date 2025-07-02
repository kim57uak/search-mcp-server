# 설치 안내서 (MCP Naver Search Server)

이 안내서는 MCP Naver Search Server를 로컬 환경에 설치하고 실행하는 방법을 설명합니다.

## 사전 요구 사항

*   [Node.js](https://nodejs.org/) (버전 18.x 이상 권장)
*   [npm](https://www.npmjs.com/) (Node.js 설치 시 함께 설치됨)
*   웹 브라우저 (Puppeteer 사용 시 Chrome/Chromium, Selenium 사용 시 Chrome, Firefox 등)

## 설치 단계

1.  **프로젝트 클론 또는 다운로드:**

    만약 Git을 사용한다면, 다음 명령어로 프로젝트를 클론합니다:
    ```bash
    git clone <저장소_URL> # 실제 저장소 URL로 변경해주세요.
    cd mcp-naver-search-server
    ```
    또는 프로젝트 소스 코드를 다운로드하고 압축을 해제합니다.

2.  **의존성 설치:**

    프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 필요한 모든 Node.js 라이브러리를 설치합니다:
    ```bash
    npm install
    ```
    이 과정에서 `@modelcontextprotocol/sdk`, `puppeteer`, `puppeteer-extra`, `selenium-webdriver`, `cheerio` 등 `package.json`에 명시된 모든 패키지가 `node_modules` 디렉토리에 설치됩니다.

    **중요:** 웹 크롤러(Puppeteer 또는 Selenium)를 사용하기 위해서는 추가 설정이 필요할 수 있습니다. 아래 "크롤러 설정 및 설치 안내" 섹션을 참조하세요.

## 실행 방법

### 1. 개발 모드로 실행 (Nodemon 사용)

개발 중에는 코드가 변경될 때마다 서버가 자동으로 재시작되도록 Nodemon을 사용하는 것이 편리합니다.
다음 명령어로 개발 모드 서버를 시작할 수 있습니다:
```bash
npm run dev
```
서버는 표준 입출력(stdio)을 통해 요청을 대기합니다.

### 2. 프로덕션 모드로 실행

프로덕션 환경에서는 다음 명령어로 서버를 시작합니다:
```bash
npm start
```
서버는 표준 입출력(stdio)을 통해 요청을 대기합니다.

## 서버 확인

서버가 성공적으로 실행되면, 다음과 유사한 로그 메시지가 콘솔에 출력됩니다 (실제 도구 목록은 다를 수 있음):
```
[Server] MCP Server connected via StdioTransport.
[Server] MCP Naver Search server started successfully. Ready to accept requests via stdio.
[Server] Available tools: naverSearch, fetchUrl
```
이는 서버가 표준 입력(stdin)을 통해 MCP 요청을 받을 준비가 되었음을 의미합니다.

## MCP 도구 호출

Stdio를 통해 실행되는 MCP 서버는 표준 입력(stdin)으로 JSON 형식의 요청을 받고, 표준 출력(stdout)으로 JSON 형식의 응답을 보냅니다.

**요청 형식 예시 (`naverSearch` 도구):**
```json
{
  "tool": "naverSearch",
  "inputs": {
    "query": "날씨",
    "includeHtml": false
  },
  "id": "request-123"
}
```
* `id` 필드는 선택 사항이며, 클라이언트가 요청과 응답을 매칭하는 데 사용할 수 있습니다.

**요청 보내는 방법 (터미널에서 직접 입력 또는 파일 리디렉션):**

1.  **직접 입력:**
    서버 실행 후, 위 JSON 요청을 한 줄로 입력하거나 복사하여 터미널에 붙여넣고 Enter 키를 누릅니다. (JSON 형식이 깨지지 않도록 주의)
    예를 들어, 서버가 실행 중인 터미널에 다음과 같이 입력합니다:
    `{"tool": "naverSearch", "inputs": {"query": "오늘 날씨", "includeHtml": false}, "id": "weather-req-01"}`
    그리고 Enter를 누르면 서버가 응답을 출력합니다.

2.  **파일 리디렉션:**
    *   요청 내용을 `request.json` 파일로 저장합니다.
        ```json
        // request.json
        {
          "tool": "naverSearch",
          "inputs": {
            "query": "오늘의 주요 뉴스",
            "includeHtml": false
          },
          "id": "news-request-001"
        }
        ```
    *   다음과 같이 서버를 실행하면서 파일 내용을 표준 입력으로 전달합니다:
        ```bash
        npm start < request.json
        ```
        또는 개발 모드에서는:
        ```bash
        npm run dev < request.json
        ```

**예상 응답 (stdout):**
서버는 처리 결과를 표준 출력으로 JSON 형식으로 반환합니다.
```json
{
  "id": "request-123",
  "tool": "naverSearch",
  "status": "success",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"query\":\"날씨\",\"resultText\":\"오늘 날씨는 맑음... (검색 결과)\",\"retrievedAt\":\"YYYY-MM-DDTHH:mm:ss.sssZ\"}"
      }
    ]
  }
}
```
오류 발생 시 `status`는 `"error"`가 되고 `error` 필드에 상세 내용이 포함될 수 있습니다.

자세한 도구 사용법 및 요청/응답 형식은 [DEVELOPER_MANUAL.ko.md](DEVELOPER_MANUAL.ko.md)를 참조하십시오.

## 환경 변수 (선택 사항)

다음과 같은 환경 변수를 사용하여 서버 설정을 변경할 수 있습니다. 모든 크롤러 관련 설정은 `src/config/serviceConfig.js` 파일 내의 `crawler` 객체에 해당합니다.

*   `NODE_ENV`: 애플리케이션 환경 (`development` 또는 `production`). 기본값: `development`.
*   `CRAWLER_TYPE`: 사용할 크롤러를 지정합니다 (`'puppeteer'` 또는 `'selenium'`). 기본값: `'puppeteer'`.

### Puppeteer 설정 (`CRAWLER_TYPE='puppeteer'` 또는 기본값일 때)
*   `PUPPETEER_EXECUTABLE_PATH`: Chrome/Chromium 실행 파일의 전체 경로. 설정하지 않으면 시스템에서 자동으로 찾거나 내부적으로 다운로드된 버전을 사용합니다. (예: `/usr/bin/google-chrome`, `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`)
*   `PUPPETEER_HEADLESS`: 헤드리스 모드 실행 여부 (`true` 또는 `false`). 기본값: `true`.
*   `PUPPETEER_ARGS`: Puppeteer 실행 시 브라우저에 전달할 추가 인자 (쉼표로 구분). (예: `--window-size=1920,1080,--disable-gpu`)
*   `PUPPETEER_USER_AGENT`: 사용할 사용자 에이전트 문자열.
*   `PUPPETEER_WAIT_UNTIL`: 페이지 로드 완료 대기 조건 (예: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`). 기본값: `networkidle2`.
*   `PUPPETEER_TIMEOUT`: 페이지 로드 또는 작업의 최대 대기 시간 (밀리초). 기본값: `60000` (60초).

### Selenium 설정 (`CRAWLER_TYPE='selenium'`일 때)
*   `SELENIUM_BROWSER`: Selenium이 제어할 브라우저 이름 (예: `'chrome'`, `'firefox'`, `'edge'`, `'safari'`). 기본값: `'chrome'`.
*   `SELENIUM_DRIVER_PATH`: 해당 브라우저의 WebDriver 실행 파일 전체 경로. 설정하지 않으면 시스템 `PATH`에서 찾습니다. **(필수 설정일 수 있음, 아래 "Selenium WebDriver 설정" 참조)**
*   `SELENIUM_HEADLESS`: 헤드리스 모드 실행 여부 (`true` 또는 `false`). 기본값: `true`. (브라우저 및 드라이버가 지원해야 함)
*   `SELENIUM_ARGS`: WebDriver 실행 시 브라우저에 전달할 추가 인자 (쉼표로 구분).
*   `SELENIUM_USER_AGENT`: 사용할 사용자 에이전트 문자열 (브라우저 시작 옵션으로 설정).
*   `SELENIUM_PAGE_LOAD_TIMEOUT`: 페이지 로드 최대 대기 시간 (밀리초). 기본값: `60000` (60초).
*   `SELENIUM_SCRIPT_TIMEOUT`: 비동기 스크립트 실행 최대 대기 시간 (밀리초). 기본값: `30000` (30초).

### 기타 설정
*   `NAVER_SEARCH_BASE_URL`: Naver 검색에 사용될 기본 URL.
*   `NAVER_SEARCH_REFERER`: Naver 검색 시 사용할 Referer URL.
*   (로그 레벨, 포트 등 다른 설정은 `src/config/serviceConfig.js` 및 관련 모듈 참조)

환경 변수는 운영체제에서 직접 설정하거나, 프로젝트 루트에 `.env` 파일을 생성하여 관리할 수 있습니다. (예: `NODE_ENV=production npm start`)
`.env` 파일은 `.gitignore`에 의해 버전 관리에서 제외되도록 하는 것이 일반적입니다.
```env
# .env 파일 예시
NODE_ENV=production
CRAWLER_TYPE=selenium
SELENIUM_BROWSER=chrome
SELENIUM_DRIVER_PATH=/usr/local/bin/chromedriver # 실제 chromedriver 경로로 수정
PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

## 크롤러 설정 및 설치 안내

이 서버는 웹 페이지 콘텐츠를 가져오기 위해 Puppeteer 또는 Selenium을 사용합니다. `CRAWLER_TYPE` 환경 변수를 통해 어떤 크롤러를 사용할지 선택할 수 있습니다.

### 1. Puppeteer

Puppeteer는 Headless Chrome 또는 Chromium 브라우저를 제어하기 위한 Node.js 라이브러리입니다.

*   **라이브러리 설치**: `npm install` 명령을 실행하면 `package.json`에 정의된 `puppeteer`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth`가 자동으로 설치됩니다.
*   **브라우저 실행 파일**:
    *   기본적으로 `puppeteer` 패키지는 호환되는 버전의 Chromium을 자동으로 다운로드하여 사용합니다.
    *   만약 시스템에 이미 설치된 Chrome/Chromium을 사용하고 싶다면, `PUPPETEER_EXECUTABLE_PATH` 환경 변수를 통해 해당 실행 파일의 경로를 지정할 수 있습니다.
*   **Stealth Plugin**: `puppeteer-extra-plugin-stealth`는 웹사이트의 자동화 탐지를 우회하는 데 도움을 줄 수 있습니다.

### 2. Selenium WebDriver

Selenium은 다양한 웹 브라우저를 자동화하는 데 사용되는 강력한 도구입니다.

*   **라이브러리 설치**: `npm install` 명령을 실행하면 `package.json`에 정의된 `selenium-webdriver` 라이브러리가 자동으로 설치됩니다.
    ```bash
    # npm install selenium-webdriver # 이미 package.json에 포함되어 npm install 시 자동 설치됨
    ```
*   **WebDriver 실행 파일 설정 (필수)**:
    `selenium-webdriver` 라이브러리 외에도, **제어하려는 각 브라우저에 맞는 WebDriver 실행 파일**을 별도로 다운로드하여 시스템이 접근 가능한 위치에 두어야 합니다.
    1.  **WebDriver 다운로드**:
        *   **ChromeDriver (Chrome 브라우저용)**: [https://chromedriver.chromium.org/downloads](https://chromedriver.chromium.org/downloads)
        *   **GeckoDriver (Firefox 브라우저용)**: [https://github.com/mozilla/geckodriver/releases](https://github.com/mozilla/geckodriver/releases)
        *   **EdgeDriver (Microsoft Edge용)**: [https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
        *   (다른 브라우저의 WebDriver는 해당 브라우저의 공식 웹사이트에서 찾아보세요.)
    2.  **WebDriver 경로 설정 방법**:
        *   **방법 1 (권장): 시스템 PATH에 추가**: 다운로드한 WebDriver 실행 파일이 있는 디렉토리의 경로를 시스템의 `PATH` 환경 변수에 추가합니다. 이렇게 하면 별도의 경로 지정 없이 Selenium이 WebDriver를 찾을 수 있습니다.
        *   **방법 2: 환경 변수로 직접 지정**: `SELENIUM_DRIVER_PATH` 환경 변수를 사용하여 WebDriver 실행 파일의 전체 경로를 직접 지정합니다. (예: `SELENIUM_DRIVER_PATH=/usr/local/bin/chromedriver` 또는 `SELENIUM_DRIVER_PATH=C:\WebDrivers\chromedriver.exe`)

### 3. Cheerio (HTML 파서)

Cheerio는 서버 사이드에서 HTML을 효율적으로 파싱하고 DOM을 조작하기 위한 라이브러리입니다. 크롤링으로 가져온 HTML 문자열에서 특정 데이터를 추출하거나 불필요한 부분을 제거하는 데 사용됩니다.

*   **라이브러리 설치**: `npm install` 명령을 실행하면 `package.json`에 정의된 `cheerio` 라이브러리가 자동으로 설치됩니다.
    ```bash
    # npm install cheerio # 이미 package.json에 포함되어 npm install 시 자동 설치됨
    ```
