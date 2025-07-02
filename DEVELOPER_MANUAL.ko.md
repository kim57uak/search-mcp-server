# MCP Naver Search Server 개발자 매뉴얼

이 문서는 MCP Naver Search Server의 아키텍처, 구성 요소 및 개발 가이드라인에 대한 자세한 개요를 제공합니다.

## 1. 📖 프로젝트 개요

MCP Naver Search Server는 모델 컨텍스트 프로토콜(MCP) SDK를 사용하여 구축된 Node.js 애플리케이션입니다. Naver 웹 검색 기능을 수행하는 MCP 도구(`naverSearchTool`)와 특정 URL의 콘텐츠를 가져오는 도구(`urlFetcherTool`)를 노출합니다. 이 서버는 웹 크롤링 작업에 Puppeteer 또는 Selenium을 선택적으로 사용할 수 있도록 유연하게 설계되었으며, 유지보수성과 확장성을 보장하기 위해 SOLID 원칙을 염두에 두고 개발되었습니다.

서버는 모델 컨텍스트 프로토콜(MCP) SDK (`@modelcontextprotocol/sdk`)를 사용하여 구축되었습니다. 이 SDK는 프로젝트의 핵심 종속성이며, `package.json` 파일을 통해 관리되고 표준 `npm install` 프로세스의 일부로 설치됩니다. MCP 호환 서비스 및 도구를 만들고 관리하는 데 필요한 도구와 인터페이스를 제공합니다.

## 2. 🧱 프로젝트 구조

프로젝트는 모듈식 구조를 따릅니다:

mcp-naver-search-server/
├── logs/                  # 로그 파일 (gitignored)
├── src/                   # 소스 코드
│   ├── config/            # 설정 파일
│   │   └── serviceConfig.js # 서비스별 설정 (Naver 검색, 크롤러 설정 등)
│   ├── crawlers/          # 웹 크롤러 구현체 및 팩토리
│   │   ├── puppeteerCrawler.js # Puppeteer 기반 크롤러
│   │   ├── seleniumCrawler.js  # Selenium 기반 크롤러
│   │   └── crawlerFactory.js   # 크롤러 인스턴스 생성 팩토리
│   ├── interfaces/        # (개념적) 인터페이스 정의 (실제 파일은 없음)
│   │   └── webCrawlerInterface.js # 웹 크롤러 인터페이스 (문서용)
│   ├── server.js          # 주 서버 초기화 및 MCP 요청 처리 (Stdio 기반)
│   ├── tools/             # MCP 도구 정의
│   │   ├── naverSearchTool.js # Naver 검색 도구
│   │   ├── urlFetcherTool.js   # URL 콘텐츠 가져오기 도구
│   │   └── index.js       # 모든 도구 내보내기
│   ├── services/          # 비즈니스 로직 모듈
│   │   └── searchService.js   # 검색 및 URL 콘텐츠 가져오기 로직
│   ├── transports/        # 전송 계층 설정 (stdioTransport.js)
│   └── utils/             # 유틸리티 함수
│       ├── logger.cjs        # 로깅 유틸리티
│       ├── chromePathFinder.js # Chrome 실행 경로 탐색 유틸리티
│       └── htmlParser.js     # HTML 파싱 및 정리 유틸리티
├── tests/                 # 테스트 코드 (현재 일부 보류됨)
├── .gitignore
├── .prettierrc.json       # Prettier 설정
├── DEVELOPER_MANUAL.ko.md # 이 파일
├── INSTALL.md             # 사용자를 위한 설치 안내서
├── eslint.config.mjs      # ESLint 설정 (flat config)
├── jest.config.js         # Jest 설정
├── nodemon.json           # Nodemon 설정
├── package.json           # 프로젝트 메타데이터 및 종속성
└── package-lock.json      # 종속성의 정확한 버전 기록

### 🔑 주요 구성 요소:

*   📄 **`src/server.js`**:
    *   `@modelcontextprotocol/sdk`에서 `McpServer` 인스턴스를 초기화합니다.
    *   `src/tools/index.js`에서 모든 도구 정의(예: `naverSearchTool`, `fetchUrlTool`)를 가져옵니다.
    *   가져온 도구들을 MCP 서버에 등록합니다.
    *   `src/transports/stdioTransport.js`에서 생성된 `StdioServerTransport`를 사용하여 MCP 서버를 연결합니다.
    *   서버는 표준 입출력(stdio)을 통해 MCP 요청을 수신하고 응답합니다.
    *   최상위 오류 처리 로직을 포함합니다.

*   🛠️ **`src/tools/`**:
    *   **`naverSearchTool.js`**: `naverSearch` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`urlFetcherTool.js`**: `fetchUrl` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`index.js`**: 모든 도구 정의를 집계하고 배열로 내보내 `server.js`가 사용하도록 합니다.

*   ⚙️ **`src/config/serviceConfig.js`**:
    *   `searchService.js` 및 크롤러(`PuppeteerCrawler`, `SeleniumCrawler`)를 위한 설정을 중앙에서 관리합니다.
    *   Naver 검색을 위한 `baseUrl`, `referer` 등을 포함합니다.
    *   **크롤러 설정 (`crawler`)**:
        *   `type`: 사용할 크롤러 유형 (`'puppeteer'` 또는 `'selenium'`). 환경 변수 `CRAWLER_TYPE`으로 제어.
        *   `puppeteer`: Puppeteer 관련 설정 (예: `executablePath`, `headless`, `args`, `userAgent`, `timeout` 등). 환경 변수 `PUPPETEER_*` 시리즈로 제어.
        *   `selenium`: Selenium 관련 설정 (예: `browser`, `driverPath`, `headless`, `args`, `userAgent`, `pageLoadTimeout` 등). 환경 변수 `SELENIUM_*` 시리즈로 제어.
    *   애플리케이션 환경(`NODE_ENV`) 정보도 포함합니다.

*   📦 **`src/services/searchService.js`**:
    *   Naver 검색 수행 및 지정된 URL의 콘텐츠 가져오기와 관련된 비즈니스 로직을 담당합니다.
    *   `src/crawlers/crawlerFactory.js`의 `createCrawler` 함수를 사용하여 현재 설정에 맞는 크롤러(Puppeteer 또는 Selenium) 인스턴스를 동적으로 생성합니다.
    *   생성된 크롤러 인스턴스의 `getRawHtml` 메서드를 호출하여 웹 페이지의 raw HTML을 가져옵니다.
    *   `src/utils/htmlParser.js`의 `cleanHtml` 함수를 사용하여 HTML에서 불필요한 태그를 제거하고 텍스트 콘텐츠를 추출합니다.
    *   `naverSearch(query, includeHtml)` 함수는 검색 결과를 가져와 처리하고, `{ query, resultText, retrievedAt }` 형태의 객체를 반환합니다.
    *   `fetchUrlContent(url)` 함수는 지정된 URL의 텍스트 콘텐츠를 가져와 처리하고, `{ url, textContent, retrievedAt }` 형태의 객체를 반환합니다.
    *   각 함수 실행 후 크롤러 인스턴스의 `close()` 메서드를 호출하여 리소스를 정리합니다.

*   🔩 **`src/crawlers/`**:
    *   **`puppeteerCrawler.js`**: `WebCrawlerInterface`를 구현하는 Puppeteer 기반 크롤러입니다. 생성자에서 Puppeteer 설정을 받아 브라우저를 실행하고, `getRawHtml` 메서드로 페이지 콘텐츠를 가져옵니다. `puppeteer-extra`와 `puppeteer-extra-plugin-stealth`를 사용하여 봇 탐지 우회를 시도합니다.
    *   **`seleniumCrawler.js`**: `WebCrawlerInterface`를 구현하는 Selenium WebDriver 기반 크롤러입니다. 생성자에서 Selenium 및 브라우저 설정을 받아 WebDriver 세션을 시작하고, `getRawHtml` 메서드로 페이지 콘텐츠를 가져옵니다. Chrome, Firefox 등 다양한 브라우저를 지원할 수 있도록 설계되었습니다.
    *   **`crawlerFactory.js`**: `createCrawler(config)` 함수를 제공합니다. `serviceConfig.crawler` 설정을 기반으로 `PuppeteerCrawler` 또는 `SeleniumCrawler` 인스턴스를 생성하여 반환합니다. 이를 통해 `searchService.js`는 구체적인 크롤러 구현에 직접 의존하지 않습니다.
    *   **`src/interfaces/webCrawlerInterface.js` (개념적)**: `getRawHtml(url, options)`, `launch(config)`, `close()` 등의 메서드를 포함하는 웹 크롤러의 공통 인터페이스를 정의합니다. 실제 파일로 존재하지 않을 수 있지만, `PuppeteerCrawler`와 `SeleniumCrawler`가 이 인터페이스를 따르도록 설계되었습니다.

*   🚇 **`src/transports/stdioTransport.js`**:
    *   `@modelcontextprotocol/sdk`의 `StdioServerTransport` 인스턴스를 생성하고 구성하는 팩토리 함수(`createStdioTransport`)를 제공합니다.

*   🪵 **`src/utils/`**:
    *   **`logger.cjs`**: `winston` 라이브러리를 사용하여 설정 가능한 로깅 시스템을 구현합니다. 콘솔 및 파일 로깅을 지원합니다.
    *   **`chromePathFinder.js`**: 시스템에 설치된 Google Chrome의 실행 경로를 찾는 유틸리티 함수를 제공합니다. `serviceConfig.js`에서 Puppeteer의 `executablePath` 기본값을 설정하는 데 사용됩니다.
    *   **`htmlParser.js`**: `cheerio`를 사용하여 HTML 문자열을 파싱하고, 불필요한 태그 제거, 텍스트 콘텐츠 추출 등의 작업을 수행하는 `cleanHtml` 함수를 제공합니다.

## 3. 🔧 MCP 도구 구현

### 3.1. 🛠️ `naverSearch` 도구 (`src/tools/naverSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 Naver 웹 검색을 수행하고, HTML 태그 포함 여부(`includeHtml`)에 따라 처리된 결과를 반환합니다. (내부적으로 `searchService.naverSearch` 호출)
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      query: z.string().min(1, { message: "검색어(query)는 필수입니다." }),
      includeHtml: z.boolean().optional().default(false),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 함수 실행 정보, 입력 파라미터, 결과 및 오류를 기록합니다.
    2.  입력으로 받은 `query`와 `includeHtml` 값을 `searchService.naverSearch` 함수에 전달하여 호출합니다.
    3.  `searchService`로부터 받은 결과 객체를 JSON 문자열로 변환하여 MCP 콘텐츠 구조(`{ type: "text", text: "..." }`)로 포맷합니다.
    4.  성공 시 포맷된 콘텐츠를 반환하고, 예외 발생 시 오류를 전파하여 `server.js`의 오류 처리기에서 처리하도록 합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "query": "사용자 검색어",
      "resultText": "Naver 검색 결과 (HTML 태그 포함 또는 제거됨)",
      "retrievedAt": "2024-01-01T12:00:00.000Z"
    }
    ```

### 3.2. 🛠️ `fetchUrl` 도구 (`src/tools/urlFetcherTool.js`)

*   🎯 **목적**: 사용자가 제공한 URL의 웹 페이지 콘텐츠를 가져와 주요 텍스트 내용을 추출하여 반환합니다.
*   📜 **설명**: `특정 url 접근을 통한 웹 컨텐츠 검색`
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      url: z.string().url({ message: "유효한 URL을 입력해야 합니다." }),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 함수 실행 정보, 입력 파라미터, 결과 및 오류를 기록합니다.
    2.  입력으로 받은 `url` 값을 `searchService.fetchUrlContent` 함수에 전달하여 호출합니다.
    3.  `searchService`로부터 받은 결과 객체를 JSON 문자열로 변환하여 MCP 콘텐츠 구조(`{ type: "text", text: "..." }`)로 포맷합니다.
    4.  성공 시 포맷된 콘텐츠를 반환하고, 예외 발생 시 오류를 전파하여 `server.js`의 오류 처리기에서 처리하도록 합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "url": "입력된 URL",
      "textContent": "추출된 웹 페이지 텍스트 내용...",
      "retrievedAt": "2024-01-02T10:00:00.000Z"
    }
    ```

## 4. ⚙️ 설정 관리

애플리케이션 설정은 `src/config/serviceConfig.js`에서 중앙 관리됩니다. 환경 변수를 통해 다양한 설정을 재정의할 수 있습니다. (자세한 내용은 [INSTALL.md](INSTALL.md) 및 `src/config/serviceConfig.js` 주석 참조)

*   **Naver 검색 관련**: `NAVER_SEARCH_BASE_URL` 등 (예시, 실제 변수명은 `serviceConfig.js` 확인 필요)
*   **Puppeteer 관련**:
    *   `PUPPETEER_EXECUTABLE_PATH`: Chrome/Chromium 실행 파일 경로. 설정하지 않으면 OS별 기본 경로를 사용합니다.
        *   **Windows 예시**: `C:\Program Files\Google\Chrome\Application\chrome.exe`
        *   **macOS 예시**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
        *   **Linux 예시**: `/usr/bin/google-chrome`
    *   `PUPPETEER_HEADLESS`: `true` 또는 `false`. 기본값 `true`.
    *   `PUPPETEER_ARGS`: Puppeteer 실행 인자 (쉼표로 구분).
    *   `PUPPETEER_USER_AGENT`: 사용할 User-Agent 문자열.
    *   `PUPPETEER_WAIT_UNTIL`: 페이지 로드 대기 조건 (예: `networkidle2`).
    *   `PUPPETEER_TIMEOUT`: 페이지 로드 타임아웃 (밀리초 단위).
*   **실행 환경**: `NODE_ENV` (예: `development`, `production`)

## 5. 💪 SOLID 원칙 적용

서버는 SOLID 원칙을 준수하는 것을 목표로 합니다:

*   🎯 **단일 책임 원칙 (SRP)**: 각 모듈(예: `server.js`, `googleSearchTool.js`, `urlFetcherTool.js`, `searchService.js`, `puppeteerHelper.js`, `htmlParser.js`, `serviceConfig.js`, `logger.cjs`)은 명확히 구분된 책임을 가집니다. `puppeteerHelper.js`는 Puppeteer 관련 작업을, `htmlParser.js`는 HTML 파싱 및 정제 작업을 각각 캡슐화하여 `searchService.js`의 책임을 더욱 명확히 합니다.
*   🧩 **개방/폐쇄 원칙 (OCP)**: 새로운 MCP 도구를 추가할 때 기존 도구나 서비스 로직을 크게 수정할 필요 없이 `src/tools/`에 새 파일을 추가하고 `src/tools/index.js`에 등록하는 방식으로 확장이 용이합니다. 서비스 로직 및 유틸리티 함수도 유사하게 확장 가능합니다.
*   🔗 **인터페이스 분리 원칙 (ISP)**: 각 MCP 도구는 명확한 입력 스키마와 출력 형식을 정의하여 클라이언트에게 필요한 최소한의 인터페이스만 제공합니다.
*   🔌 **의존관계 역전 원칙 (DIP)**: 도구 정의 파일은 구체적인 웹 기술(Puppeteer, Cheerio) 직접 호출 대신 추상화된 `searchService.js`에 의존합니다. `searchService.js`는 다시 `puppeteerHelper.js`와 `htmlParser.js`에 의존하여 세부 구현으로부터 분리됩니다.

## 6. ✨ 새로운 MCP 도구 추가 (예시)

1.  **서비스 로직 정의 (선택 사항, 권장):**
    *   새로운 비즈니스 로직이 필요하면 `src/services/`에 새 서비스 파일(예: `newFeatureService.js`)을 만들거나 기존 서비스(`searchService.js`)에 함수를 추가합니다. 이 서비스 함수는 필요에 따라 `createCrawler`를 사용하여 크롤러 인스턴스를 얻고 `getRawHtml`을 호출할 수 있습니다.
2.  **도구 정의 파일 생성:**
    *   `src/tools/`에 새 JavaScript 파일(예: `myNewTool.js`)을 만듭니다.
    *   `zod`를 사용하여 `inputSchema`를 정의하고, `async handler` 함수 내에 로직을 구현합니다. 핸들러는 필요시 서비스 함수를 호출합니다.
    *   `logger.cjs`를 사용하여 로깅을 추가합니다.
    *   MCP 콘텐츠 형식으로 결과를 반환합니다.
    ```javascript
    // src/tools/myNewTool.js
    import { z } from 'zod';
    import logger from '../utils/logger.cjs';
    // import { myServiceFunction } from '../services/myService.js'; // 필요시

    export const myNewTool = {
      name: "myNewToolName",
      description: "새로운 도구에 대한 설명입니다.",
      inputSchema: z.object({
        param1: z.string(),
      }),
      async handler({ param1 }) {
        logger.info(`Executing myNewToolName with param1: ${param1}`);
        try {
          // const result = await myServiceFunction(param1);
          const result = { message: `Result for ${param1}` };
          logger.info(`myNewToolName completed successfully.`);
          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
          };
        } catch (error) {
          logger.error(`Error in myNewToolName: ${error.message}`, { error: error.stack });
          throw error;
        }
      },
    };
    ```
3.  **도구 등록:**
    *   `src/tools/index.js`를 열어 새 도구를 가져오고 `tools` 배열에 추가합니다.
    ```javascript
    // src/tools/index.js
    import { naverSearchTool } from './naverSearchTool.js'; // naverSearchTool로 변경
    import { urlFetcherTool } from './urlFetcherTool.js'; // urlFetcherTool 추가 (이미 존재한다면 수정 없음)
    import { myNewTool } from "./myNewTool.js"; // 새 도구 가져오기

    export const tools = [
      naverSearchTool, // naverSearchTool로 변경
      urlFetcherTool,  // urlFetcherTool 추가 (이미 존재한다면 수정 없음)
      myNewTool, // 배열에 추가
    ];
    ```
4.  서버를 재시작하면 새 도구를 사용할 수 있습니다. (Stdio 방식에서는 재실행)

## 7. 🚀 실행 및 테스트

서버 실행 지침은 [INSTALL.md](INSTALL.md)를 참조하십시오. Stdio 기반이므로, 서버 실행 후 표준 입력을 통해 JSON 형식으로 MCP 요청을 전송하고 표준 출력을 통해 결과를 확인합니다.

**예시: `naverSearch` 도구 호출 (터미널에서 `request.json` 파일 사용)**

1.  `request.json` 파일 생성:
    ```json
    {
      "tool": "naverSearch",
      "inputs": {
        "query": "MCP SDK",
        "includeHtml": true
      },
      "id": "dev-manual-example-001"
    }
    ```
2.  `fetchUrl` 도구 호출을 위한 `request_fetch.json` 파일 생성 (예시):
    ```json
    {
      "tool": "fetchUrl",
      "inputs": {
        "url": "https://www.naver.com" // 예시 URL 변경
      },
      "id": "dev-manual-example-002"
    }
    ```
3.  서버 실행 및 요청 전달:
    ```bash
    # naverSearch 예시
    npm start < request.json

    # fetchUrl 예시
    npm start < request_fetch.json
    ```
    또는 개발 모드:
    ```bash
    # naverSearch 예시
    npm run dev < request.json

    # fetchUrl 예시
    npm run dev < request_fetch.json
    ```
    서버는 표준 출력으로 MCP 응답을 JSON 형태로 출력합니다.

테스트는 현재 스킵되었지만, 향후 `Jest`를 사용하여 단위 테스트 및 통합 테스트를 추가할 예정입니다.
테스트 실행 명령어 (구현 시): `npm test`

## 8. 💡 일반적인 문제 해결

*   **SDK 관련 오류:** `@modelcontextprotocol/sdk`의 특정 버전과 호환성 문제가 발생하거나, `McpServer`, `StdioServerTransport` 등의 API가 예상과 다를 경우, SDK 문서를 참조하거나 버전을 확인해야 합니다.
*   **JSON 입력 오류:** Stdio로 JSON 요청을 전달할 때, JSON 형식이 정확해야 합니다. 형식이 잘못된 경우 서버에서 파싱 오류가 발생할 수 있습니다.
*   **Puppeteer `executablePath` 오류**: Chrome/Chromium 브라우저를 찾을 수 없는 경우 발생합니다. `PUPPETEER_EXECUTABLE_PATH` 환경 변수를 설정하거나 `src/config/serviceConfig.js` 또는 `src/utils/puppeteerHelper.js`의 기본 경로 설정을 확인하고 사용자의 환경에 맞게 수정해야 합니다.
*   **웹 페이지 스크래핑 차단**: 일부 웹사이트는 자동화된 접근을 탐지하고 차단할 수 있습니다. `puppeteer-extra-plugin-stealth`가 이를 완화하는 데 도움이 되지만, 완벽하지 않을 수 있습니다. User-Agent 변경, 요청 간 지연 시간 추가 등의 추가 전략이 필요할 수 있습니다.

## 9. 🌱 향후 개선 사항

*   **테스트 커버리지 확대:** Jest를 사용하여 단위 테스트 및 통합 테스트를 철저히 작성합니다.
*   **`cheerio`를 사용한 HTML 결과 세분화:** `src/utils/htmlParser.js`의 `cleanHtml` 함수에서 `includeHtml=true`일 때, `selector` 옵션을 통해 특정 검색 결과 영역만 추출하는 기능을 더욱 발전시킬 수 있습니다. (현재는 기본적인 selector 기능만 포함)
*   **Naver Search API 연동 (선택 사항):** 현재는 Naver 웹 페이지를 직접 스크레이핑하는 방식이므로 불안정할 수 있습니다. 안정적인 운영을 위해 Naver Search API 또는 유사한 공식 API 사용을 고려할 수 있습니다. 이 경우 `serviceConfig.js`에 API 키 설정 등이 추가될 것입니다.
*   **더 정교한 오류 처리:** 사용자 정의 오류 클래스 및 세분화된 오류 코드를 `puppeteerHelper.js`, `htmlParser.js`, `searchService.js` 전반에 도입하여 클라이언트에게 더 명확한 오류 정보를 제공할 수 있습니다.
*   **Puppeteer 설정 고도화**: 프록시 설정, 쿠키 관리, 요청 인터셉트 등 더 다양한 Puppeteer 옵션을 `serviceConfig.js` 및 `puppeteerHelper.js`를 통해 제어할 수 있도록 확장합니다.

## cheerio 설치 및 사용 목적

HTML에서 script/style 등 불필요한 태그와 자바스크립트 코드를 완전히 제거하기 위해 cheerio를 사용합니다.

### 설치 명령어

```bash
npm install cheerio
```

### 사용 목적
- cheerio: HTML 파싱 및 특정 태그(script, style 등) 전체 삭제 가능
- 검색 결과에서 불필요한 코드, 광고, 스크립트 등을 깔끔하게 제거할 수 있음

## puppeteer-extra 및 stealth 플러그인 설치

Naver 등에서 자동화 탐지를 우회하기 위해 아래 패키지를 추가로 설치할 수 있습니다.

### 설치 명령어

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### 사용 목적
- puppeteer-extra: puppeteer를 확장하여 다양한 플러그인 적용 가능
- puppeteer-extra-plugin-stealth: 자동화 탐지(봇 차단) 우회 기능 제공

## Selenium WebDriver 설치

Selenium을 사용하기 위해서는 `selenium-webdriver` 라이브러리와 각 브라우저에 맞는 WebDriver가 필요합니다.

### 라이브러리 설치 명령어

```bash
npm install selenium-webdriver
```

### WebDriver 설치
사용하려는 브라우저(Chrome, Firefox 등)에 맞는 WebDriver를 다운로드하여 시스템 PATH에 추가하거나, `SELENIUM_DRIVER_PATH` 환경 변수를 통해 경로를 지정해야 합니다.
*   **ChromeDriver**: [https://chromedriver.chromium.org/downloads](https://chromedriver.chromium.org/downloads)
*   **GeckoDriver (Firefox)**: [https://github.com/mozilla/geckodriver/releases](https://github.com/mozilla/geckodriver/releases)
