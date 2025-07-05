# 설치 안내서 (MCP Search Server)

이 안내서는 MCP Search Server를 로컬 환경에 설치하고 실행하는 방법을 설명합니다.

## 사전 요구 사항

*   [Node.js](https://nodejs.org/) (버전 18.x 이상 권장)
*   [npm](https://www.npmjs.com/) (Node.js 설치 시 함께 설치됨)
*   웹 브라우저 (Puppeteer 사용 시 Chrome/Chromium, Selenium 사용 시 Chrome, Firefox 등)

## 설치 단계

1.  **프로젝트 클론 또는 다운로드:**

    만약 Git을 사용한다면, 다음 명령어로 프로젝트를 클론합니다:
    ```bash
    git clone <저장소_URL> # 실제 저장소 URL로 변경해주세요.
    cd mcp-search-server # 디렉토리 이름이 변경되었을 수 있으니 확인 필요
    ```
    또는 프로젝트 소스 코드를 다운로드하고 압축을 해제합니다.

2.  **의존성 설치:**

    프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 필요한 모든 Node.js 패키지를 설치합니다:
    ```bash
    npm install
    ```
    이 명령어를 실행하면 `@modelcontextprotocol/sdk`, `puppeteer`, `selenium-webdriver`, `cheerio`, `winston`, `zod` 등 주요 패키지가 설치됩니다.

3.  **검색 엔진 설정 (`search_engines.json`):**

    프로젝트 루트 디렉토리에 있는 `search_engines.json` 파일은 서버가 사용할 검색 엔진들의 목록과 각 엔진의 설정을 정의합니다. 기본적으로 여러 검색 엔진이 설정되어 있을 수 있습니다. 필요에 따라 이 파일을 수정하여 사용할 검색 엔진을 추가, 제거 또는 변경할 수 있습니다. 자세한 형식은 `DEVELOPER_MANUAL.ko.md` 문서를 참조하십시오.

## 실행 방법

### 1. 개발 모드로 실행 (Nodemon 사용)

개발 중에는 코드가 변경될 때마다 서버가 자동으로 재시작되도록 Nodemon을 사용하는 것이 편리합니다.
```bash
npm run dev
```
서버는 표준 입출력(stdio)을 통해 요청을 대기합니다.

### 2. 프로덕션 모드로 실행
```bash
npm start
```
서버는 표준 입출력(stdio)을 통해 요청을 대기합니다.

## 서버 확인

서버가 성공적으로 실행되면, 다음과 유사한 로그 메시지가 콘솔에 출력됩니다:
```
[Server] MCP Server connected via StdioTransport.
[Server] MCP Search server started successfully. Ready to accept requests via stdio.
[Server] Available tools: search, googleSearch, fetchUrl
```
이는 서버가 표준 입력(stdin)을 통해 MCP 요청을 받을 준비가 되었음을 의미합니다. (실제 사용 가능한 도구 목록은 `src/tools/index.js` 설정에 따라 달라질 수 있습니다.)

## MCP 도구 호출

Stdio를 통해 실행되는 MCP 서버는 표준 입력(stdin)으로 JSON 형식의 요청을 받고, 표준 출력(stdout)으로 JSON 형식의 응답을 보냅니다.

**요청 형식 예시 (`search` 도구 - Naver 검색):**
```json
{
  "tool": "search",
  "inputs": {
    "query": "오늘의 날씨",
    "engineName": "Naver",
    "languageCode": "ko",
    "includeHtml": false
  },
  "id": "request-123"
}
```
* `id` 필드는 선택 사항이며, 클라이언트가 요청과 응답을 매칭하는 데 사용할 수 있습니다.

**요청 보내는 방법 (터미널에서 직접 입력 또는 파일 리디렉션):**

1.  **직접 입력:**
    서버 실행 후, 위 JSON 요청을 한 줄로 입력하거나 복사하여 터미널에 붙여넣고 Enter 키를 누릅니다.
    예: `{"tool": "search", "inputs": {"query": "오늘 날씨", "engineName": "Naver"}, "id": "weather-req-01"}`

2.  **파일 리디렉션:**
    *   요청 내용을 `request.json` 파일로 저장합니다.
        ```json
        // request.json
        {
          "tool": "search",
          "inputs": {
            "query": "KBO 프로야구 순위",
            "engineName": "Google", // 또는 다른 search_engines.json에 정의된 엔진
            "includeHtml": false
          },
          "id": "kbo-rank-request-001"
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

**예상 응답 (stdout - `search` 도구, 단일 엔진 검색 시):**
```json
{
  "id": "request-123", // 요청 시 보낸 id 또는 서버 생성 id
  "tool": "search",
  "status": "success",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"query\":\"오늘의 날씨\",\"engine\":\"Naver\",\"language\":\"ko\",\"resultText\":\"오늘 날씨는 매우 맑습니다... (검색 결과)\",\"retrievedAt\":\"YYYY-MM-DDTHH:mm:ss.sssZ\",\"searchUrl\":\"실제요청된URL\"}"
      }
    ]
  }
}
```
오류 발생 시 `status`는 `"error"`가 되고 `error` 필드에 상세 내용이 포함될 수 있습니다.
자세한 도구 사용법 및 요청/응답 형식은 `README.md` 또는 `DEVELOPER_MANUAL.ko.md`를 참조하십시오.

## 환경 변수 (선택 사항)

서버의 동작 일부는 환경 변수를 통해 제어할 수 있습니다. 주로 크롤러 관련 설정이 해당됩니다.
검색 엔진 자체의 URL, 쿼리 파라미터 등은 `search_engines.json` 파일에서 관리합니다.

*   `NODE_ENV`: 애플리케이션 환경 (`development` 또는 `production`). 기본값: `development`.
*   `CRAWLER_TYPE`: 일반 검색 시 사용할 크롤러를 지정합니다 (`'puppeteer'` 또는 `'selenium'`). `googleSearch` 도구는 항상 Puppeteer 기반의 특수 크롤러를 사용합니다. 기본값: `'puppeteer'`.

### Puppeteer 설정 (`CRAWLER_TYPE='puppeteer'` 또는 기본값일 때)
*   `PUPPETEER_EXECUTABLE_PATH`: Chrome/Chromium 실행 파일의 전체 경로.
*   `PUPPETEER_HEADLESS`: 헤드리스 모드 실행 여부 (`true` 또는 `false`). 기본값: `true`.
*   `PUPPETEER_ARGS`: Puppeteer 실행 시 브라우저에 전달할 추가 인자 (쉼표로 구분).
*   `PUPPETEER_USER_AGENT`: 사용할 사용자 에이전트 문자열.
*   `PUPPETEER_WAIT_UNTIL`: 페이지 로드 완료 대기 조건. 기본값: `networkidle2`.
*   `PUPPETEER_TIMEOUT`: 페이지 로드 또는 작업의 최대 대기 시간 (밀리초). 기본값: `60000`.

### Selenium 설정 (`CRAWLER_TYPE='selenium'`일 때)
*   `SELENIUM_BROWSER`: Selenium이 제어할 브라우저 이름. 기본값: `'chrome'`.
*   `SELENIUM_DRIVER_PATH`: 해당 브라우저의 WebDriver 실행 파일 전체 경로. **(필수 설정일 수 있음)**
*   `SELENIUM_HEADLESS`: 헤드리스 모드 실행 여부 (`true` 또는 `false`). 기본값: `true`.
*   `SELENIUM_ARGS`: WebDriver 실행 시 브라우저에 전달할 추가 인자 (쉼표로 구분).
*   `SELENIUM_USER_AGENT`: 사용할 사용자 에이전트 문자열.
*   `SELENIUM_PAGE_LOAD_TIMEOUT`: 페이지 로드 최대 대기 시간 (밀리초). 기본값: `60000`.
*   `SELENIUM_SCRIPT_TIMEOUT`: 비동기 스크립트 실행 최대 대기 시간 (밀리초). 기본값: `30000`.

### Google 검색 특수 설정 (`googleSearch` 도구 관련)
`src/config/serviceConfig.js` 파일 내 `googleSearch` 객체에서 다음 항목들을 설정할 수 있습니다 (환경 변수보다는 직접 파일 수정 권장):
*   `searchInputSelector`, `searchButtonSelector`: Google 검색 페이지의 UI 요소 선택자.

환경 변수는 운영체제에서 직접 설정하거나, 프로젝트 루트에 `.env` 파일을 생성하여 관리할 수 있습니다.
```env
# .env 파일 예시
NODE_ENV=production
CRAWLER_TYPE=selenium
SELENIUM_BROWSER=chrome
SELENIUM_DRIVER_PATH=/usr/local/bin/chromedriver # 실제 chromedriver 경로로 수정
# PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome # Puppeteer 사용 시
```
`.env` 파일은 보안을 위해 `.gitignore`에 추가하는 것이 일반적입니다.

## 크롤러 설정 및 설치 안내

이 서버는 웹 페이지 콘텐츠를 가져오기 위해 Puppeteer 또는 Selenium을 사용합니다. `CRAWLER_TYPE` 환경 변수와 `src/config/serviceConfig.js` 파일의 설정을 통해 크롤러 동작을 제어합니다.

### 1. Puppeteer

*   **라이브러리 설치**: `npm install` 시 `puppeteer`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth`가 자동 설치됩니다.
*   **브라우저 실행 파일**: 기본적으로 호환 Chromium을 자동 다운로드/사용합니다. 시스템 설치 Chrome/Chromium 사용 시 `PUPPETEER_EXECUTABLE_PATH` 환경 변수를 설정합니다.
*   **Stealth Plugin**: `puppeteer-extra-plugin-stealth`는 자동화 탐지 우회에 도움을 줄 수 있습니다 (주로 `googleSearch` 도구에서 활용).

### 2. Selenium WebDriver

*   **라이브러리 설치**: `npm install` 시 `selenium-webdriver`가 자동 설치됩니다.
*   **WebDriver 실행 파일 설정 (필수)**: 제어할 브라우저(Chrome, Firefox 등)에 맞는 WebDriver 실행 파일을 별도로 다운로드하여 시스템 `PATH`에 추가하거나, `SELENIUM_DRIVER_PATH` 환경 변수로 경로를 지정해야 합니다.
    *   **ChromeDriver**: [https://chromedriver.chromium.org/downloads](https://chromedriver.chromium.org/downloads)
    *   **GeckoDriver (Firefox)**: [https://github.com/mozilla/geckodriver/releases](https://github.com/mozilla/geckodriver/releases)
    *   **EdgeDriver (Microsoft Edge)**: [https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)

### 3. Cheerio (HTML 파서)

*   **라이브러리 설치**: `npm install` 시 `cheerio`가 자동 설치됩니다. HTML 파싱 및 데이터 추출에 사용됩니다.
