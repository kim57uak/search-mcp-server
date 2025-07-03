# MCP Naver Search Server 개발자 매뉴얼

이 문서는 MCP Naver Search Server의 아키텍처, 구성 요소 및 개발 가이드라인에 대한 자세한 개요를 제공합니다.

## 1. 📖 프로젝트 개요

MCP Search Server는 모델 컨텍스트 프로토콜(MCP) SDK를 사용하여 구축된 Node.js 애플리케이션입니다. Naver, Daum, Bing, Nate 웹 검색 기능을 수행하는 MCP 도구들(`naverSearchTool`, `daumSearchTool`, `bingSearchTool`, `nateSearchTool`) 및 특정 URL의 콘텐츠를 가져오는 도구(`urlFetcherTool`), 그리고 이들을 통합하여 검색하는 `integratedSearchTool`을 노출합니다. 이 서버는 웹 크롤링 작업에 Puppeteer 또는 Selenium을 선택적으로 사용할 수 있도록 유연하게 설계되었으며, 유지보수성과 확장성을 보장하기 위해 SOLID 원칙을 염두에 두고 개발되었습니다.

서버는 모델 컨텍스트 프로토콜(MCP) SDK (`@modelcontextprotocol/sdk`)를 사용하여 구축되었습니다. 이 SDK는 프로젝트의 핵심 종속성이며, `package.json` 파일을 통해 관리되고 표준 `npm install` 프로세스의 일부로 설치됩니다. MCP 호환 서비스 및 도구를 만들고 관리하는 데 필요한 도구와 인터페이스를 제공합니다.

## 2. 🧱 프로젝트 구조

프로젝트는 모듈식 구조를 따릅니다:

mcp-search-server/
├── logs/                  # 로그 파일 (gitignored)
├── src/                   # 소스 코드
│   ├── config/            # 설정 파일
│   │   └── serviceConfig.js # 서비스별 설정 (Naver/Daum/Bing/Nate/Google 검색, 크롤러 설정 등)
│   ├── crawlers/          # 웹 크롤러 구현체 및 팩토리
│   │   ├── puppeteerCrawler.js # Puppeteer 기반 일반 크롤러
│   │   ├── seleniumCrawler.js  # Selenium 기반 일반 크롤러
│   │   ├── humanLikeGoogleCrawler.js # Google 검색용 Puppeteer 기반 특수 크롤러
│   │   └── crawlerFactory.js   # 일반 크롤러 인스턴스 생성 팩토리
│   ├── interfaces/        # (개념적) 인터페이스 정의 (실제 파일은 없음)
│   │   └── webCrawlerInterface.js # 웹 크롤러 인터페이스 (문서용)
│   ├── server.js          # 주 서버 초기화 및 MCP 요청 처리 (Stdio 기반)
│   ├── tools/             # MCP 도구 정의
│   │   ├── naverSearchTool.js # Naver 검색 도구
│   │   ├── daumSearchTool.js   # Daum 검색 도구
│   │   ├── bingSearchTool.js   # Bing 검색 도구
│   │   ├── nateSearchTool.js   # Nate 검색 도구
│   │   ├── integratedSearchTool.js # 통합 검색 도구
│   │   ├── urlFetcherTool.js   # URL 콘텐츠 가져오기 도구
│   │   └── index.js       # 모든 도구 내보내기
│   ├── services/          # 비즈니스 로직 모듈
│   │   ├── searchService.js   # 개별 검색 및 URL 콘텐츠 가져오기 로직
│   │   └── integratedSearchService.js # 통합 검색 서비스 로직
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
    *   `src/tools/index.js`에서 모든 도구 정의(예: `naverSearchTool`, `daumSearchTool`, `bingSearchTool`, `nateSearchTool`, `googleSearchTool`, `integratedSearchTool`, `fetchUrlTool`)를 가져옵니다.
    *   가져온 도구들을 MCP 서버에 등록합니다.
    *   `src/transports/stdioTransport.js`에서 생성된 `StdioServerTransport`를 사용하여 MCP 서버를 연결합니다.
    *   서버는 표준 입출력(stdio)을 통해 MCP 요청을 수신하고 응답합니다.
    *   최상위 오류 처리 로직을 포함합니다.

*   🛠️ **`src/tools/`**:
    *   **`naverSearchTool.js`**: `naverSearch` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`daumSearchTool.js`**: `daumSearch` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`bingSearchTool.js`**: `bingSearch` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`nateSearchTool.js`**: `nateSearch` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`googleSearchTool.js`**: `googleSearch` MCP 도구를 정의합니다. Google 검색 시 "인간처럼" 동작하는 특수 크롤러를 사용합니다. (상세 설명은 아래 섹션 참조)
    *   **`integratedSearchTool.js`**: `integratedSearch` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`urlFetcherTool.js`**: `fetchUrl` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`index.js`**: 모든 도구 정의를 집계하고 배열로 내보내 `server.js`가 사용하도록 합니다.

*   ⚙️ **`src/config/serviceConfig.js`**:
    *   `searchService.js`, `integratedSearchService.js` 및 크롤러(`PuppeteerCrawler`, `SeleniumCrawler`, `HumanLikeGoogleCrawler`)를 위한 설정을 중앙에서 관리합니다.
    *   Naver, Daum, Bing, Nate, Google 검색을 위한 `baseUrl`, `referer`, Google 검색용 CSS 선택자 (`searchInputSelector`, `searchButtonSelector`) 등을 포함합니다.
    *   **크롤러 설정 (`crawler`)**:
        *   `type`: 일반 검색 시 사용할 크롤러 유형 (`'puppeteer'` 또는 `'selenium'`). 환경 변수 `CRAWLER_TYPE`으로 제어. Google 검색은 `HumanLikeGoogleCrawler`를 직접 사용합니다.
        *   `puppeteer`: Puppeteer 관련 설정 (예: `executablePath`, `headless`, `args`, `userAgent`, `timeout` 등). 환경 변수 `PUPPETEER_*` 시리즈로 제어.
        *   `selenium`: Selenium 관련 설정 (예: `browser`, `driverPath`, `headless`, `args`, `userAgent`, `pageLoadTimeout` 등). 환경 변수 `SELENIUM_*` 시리즈로 제어.
    *   애플리케이션 환경(`NODE_ENV`) 정보도 포함합니다.

*   📦 **`src/services/searchService.js`**:
    *   Naver, Daum, Bing, Nate, Google 개별 검색 수행 및 지정된 URL의 콘텐츠 가져오기와 관련된 비즈니스 로직을 담당합니다.
    *   일반 검색(`naverSearch`, `daumSearch` 등)의 경우 `src/crawlers/crawlerFactory.js`의 `createCrawler` 함수를 사용하여 현재 설정에 맞는 크롤러(Puppeteer 또는 Selenium) 인스턴스를 동적으로 생성하고, `getRawHtml` 메서드를 사용합니다.
    *   Google 검색(`googleSearch`)의 경우, `src/crawlers/humanLikeGoogleCrawler.js`의 `HumanLikeGoogleCrawler` 인스턴스를 직접 생성하고, `searchAndGetResults` 메서드를 사용하여 "인간처럼" 검색을 수행합니다. 이 크롤러는 검색어 입력, 버튼 클릭 등의 상호작용을 시뮬레이션합니다.
    *   `src/utils/htmlParser.js`의 `cleanHtml` 함수를 사용하여 HTML에서 불필요한 태그를 제거하고 텍스트 콘텐츠를 추출합니다.
    *   `naverSearch(query, includeHtml)`, `daumSearch(query, includeHtml)`, `bingSearch(query, includeHtml)`, `nateSearch(query, includeHtml)`, `googleSearch(query, includeHtml)` 함수는 각 검색 엔진의 검색 결과를 가져와 처리합니다.
    *   `fetchUrlContent(url)` 함수는 지정된 URL의 텍스트 콘텐츠를 가져와 처리합니다.
    *   각 함수 실행 후 크롤러 인스턴스의 `close()` 메서드를 호출하여 리소스를 정리합니다.
*   📦 **`src/services/integratedSearchService.js`**:
    *   `searchService.js`의 개별 검색 함수들(Naver, Daum, Bing, Nate, Google - Google 포함 여부 결정 필요)을 병렬로 호출하여 검색 결과를 통합하는 로직을 담당합니다.
    *   `Promise.all`을 사용하여 비동기 검색 작업을 효율적으로 처리합니다.
    *   개별 검색 실패 시에도 전체 통합 검색이 중단되지 않도록 오류를 처리하고, 실패 정보를 결과에 포함합니다.

*   🔩 **`src/crawlers/`**:
    *   **`puppeteerCrawler.js`**: `WebCrawlerInterface`를 구현하는 일반적인 Puppeteer 기반 크롤러입니다. 생성자에서 Puppeteer 설정을 받아 브라우저를 실행하고, `getRawHtml` 메서드로 페이지 콘텐츠를 가져옵니다.
    *   **`seleniumCrawler.js`**: `WebCrawlerInterface`를 구현하는 일반적인 Selenium WebDriver 기반 크롤러입니다. 생성자에서 Selenium 및 브라우저 설정을 받아 WebDriver 세션을 시작하고, `getRawHtml` 메서드로 페이지 콘텐츠를 가져옵니다.
    *   **`humanLikeGoogleCrawler.js`**: Google 검색 전용으로 설계된 Puppeteer 기반 크롤러입니다. `puppeteer-extra`와 `puppeteer-extra-plugin-stealth`를 사용하여 봇 탐지 우회를 시도하며, Google 검색 페이지에서 검색어를 입력하고 검색 버튼을 클릭하는 등의 "인간과 유사한" 상호작용을 수행하는 `searchAndGetResults` 메서드를 제공합니다.
    *   **`crawlerFactory.js`**: `createCrawler(config)` 함수를 제공합니다. `serviceConfig.crawler` 설정을 기반으로 일반 크롤러(`PuppeteerCrawler` 또는 `SeleniumCrawler`) 인스턴스를 생성하여 반환합니다. Google 검색에는 사용되지 않습니다.
    *   **`src/interfaces/webCrawlerInterface.js` (개념적)**: `getRawHtml(url, options)`, `launch(config)`, `close()` 등의 메서드를 포함하는 웹 크롤러의 공통 인터페이스를 정의합니다. `PuppeteerCrawler`와 `SeleniumCrawler`가 이 인터페이스를 따르도록 설계되었습니다. `HumanLikeGoogleCrawler`도 유사한 인터페이스(launch, close, searchAndGetResults)를 가집니다.

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

**예시: `googleSearch` 도구 호출 (터미널에서 `request_google.json` 파일 사용)**
1.  `request_google.json` 파일 생성:
    ```json
    {
      "tool": "googleSearch",
      "inputs": {
        "query": "오늘 날씨",
        "includeHtml": false
      },
      "id": "dev-manual-google-001"
    }
    ```

### 3.x. 🛠️ `googleSearch` 도구 (`src/tools/googleSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 Google 웹 검색을 수행하고, HTML 태그 포함 여부(`includeHtml`)에 따라 처리된 결과를 반환합니다. 이 도구는 `HumanLikeGoogleCrawler`를 사용하여 검색 페이지와 "인간처럼" 상호작용(검색어 입력, 버튼 클릭 등)합니다. (내부적으로 `searchService.googleSearch` 호출)
*   📜 **설명**: `Google 검색 (인간과 유사한 행동)`
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      query: z.string().min(1, { message: "검색어(query)는 필수입니다." }),
      includeHtml: z.boolean().optional().default(false),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 함수 실행 정보, 입력 파라미터, 결과 및 오류를 기록합니다.
    2.  입력으로 받은 `query`와 `includeHtml` 값을 `searchService.googleSearch` 함수에 전달하여 호출합니다.
    3.  `searchService`로부터 받은 결과 객체를 JSON 문자열로 변환하여 MCP 콘텐츠 구조(`{ type: "text", text: "..." }`)로 포맷합니다.
    4.  성공 시 포맷된 콘텐츠를 반환하고, 예외 발생 시 오류를 전파하여 `server.js`의 오류 처리기에서 처리하도록 합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "query": "사용자 검색어",
      "resultText": "Google 검색 결과 (HTML 태그 포함 또는 제거됨)",
      "retrievedAt": "2024-01-01T12:00:00.000Z",
      "searchEngine": "google"
    }
    ```

### 3.2. 🛠️ `daumSearch` 도구 (`src/tools/daumSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 Daum 웹 검색을 수행하고, HTML 태그 포함 여부(`includeHtml`)에 따라 처리된 결과를 반환합니다. (내부적으로 `searchService.daumSearch` 호출)
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      query: z.string().min(1, { message: "검색어(query)는 필수입니다." }),
      includeHtml: z.boolean().optional().default(false),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 함수 실행 정보, 입력 파라미터, 결과 및 오류를 기록합니다.
    2.  입력으로 받은 `query`와 `includeHtml` 값을 `searchService.daumSearch` 함수에 전달하여 호출합니다.
    3.  `searchService`로부터 받은 결과 객체를 JSON 문자열로 변환하여 MCP 콘텐츠 구조(`{ type: "text", text: "..." }`)로 포맷합니다.
    4.  성공 시 포맷된 콘텐츠를 반환하고, 예외 발생 시 오류를 전파하여 `server.js`의 오류 처리기에서 처리하도록 합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "query": "사용자 검색어",
      "resultText": "Daum 검색 결과 (HTML 태그 포함 또는 제거됨)",
      "retrievedAt": "2024-01-01T12:00:00.000Z",
      "searchEngine": "daum"
    }
    ```

### 3.3. 🛠️ `bingSearch` 도구 (`src/tools/bingSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 Bing 웹 검색을 수행하고, HTML 태그 포함 여부(`includeHtml`)에 따라 처리된 결과를 반환합니다. (내부적으로 `searchService.bingSearch` 호출)
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      query: z.string().min(1, { message: "검색어(query)는 필수입니다." }),
      includeHtml: z.boolean().optional().default(false),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 함수 실행 정보, 입력 파라미터, 결과 및 오류를 기록합니다.
    2.  입력으로 받은 `query`와 `includeHtml` 값을 `searchService.bingSearch` 함수에 전달하여 호출합니다.
    3.  `searchService`로부터 받은 결과 객체를 JSON 문자열로 변환하여 MCP 콘텐츠 구조(`{ type: "text", text: "..." }`)로 포맷합니다.
    4.  성공 시 포맷된 콘텐츠를 반환하고, 예외 발생 시 오류를 전파하여 `server.js`의 오류 처리기에서 처리하도록 합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "query": "사용자 검색어",
      "resultText": "Bing 검색 결과 (HTML 태그 포함 또는 제거됨)",
      "retrievedAt": "2024-01-01T12:00:00.000Z",
      "searchEngine": "bing"
    }
    ```

### 3.4. 🛠️ `nateSearch` 도구 (`src/tools/nateSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 Nate 웹 검색을 수행하고, HTML 태그 포함 여부(`includeHtml`)에 따라 처리된 결과를 반환합니다. (내부적으로 `searchService.nateSearch` 호출)
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      query: z.string().min(1, { message: "검색어(query)는 필수입니다." }),
      includeHtml: z.boolean().optional().default(false),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 함수 실행 정보, 입력 파라미터, 결과 및 오류를 기록합니다.
    2.  입력으로 받은 `query`와 `includeHtml` 값을 `searchService.nateSearch` 함수에 전달하여 호출합니다.
    3.  `searchService`로부터 받은 결과 객체를 JSON 문자열로 변환하여 MCP 콘텐츠 구조(`{ type: "text", text: "..." }`)로 포맷합니다.
    4.  성공 시 포맷된 콘텐츠를 반환하고, 예외 발생 시 오류를 전파하여 `server.js`의 오류 처리기에서 처리하도록 합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "query": "사용자 검색어",
      "resultText": "Nate 검색 결과 (HTML 태그 포함 또는 제거됨)",
      "retrievedAt": "2024-01-01T12:00:00.000Z",
      "searchEngine": "nate"
    }
    ```

### 3.5. 🛠️ `integratedSearch` 도구 (`src/tools/integratedSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 Naver, Daum, Bing, Nate 웹 검색을 동시에 수행하고, HTML 태그 포함 여부(`includeHtml`)에 따라 처리된 통합 결과를 반환합니다. (내부적으로 `integratedSearchService.integratedSearch` 호출)
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      query: z.string().min(1, { message: "검색어(query)는 필수입니다." }),
      includeHtml: z.boolean().optional().default(false),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 함수 실행 정보, 입력 파라미터, 결과 및 오류를 기록합니다.
    2.  입력으로 받은 `query`와 `includeHtml` 값을 `integratedSearchService.integratedSearch` 함수에 전달하여 호출합니다.
    3.  `integratedSearchService`로부터 받은 결과 객체를 JSON 문자열로 변환하여 MCP 콘텐츠 구조(`{ type: "text", text: "..." }`)로 포맷합니다.
    4.  성공 시 포맷된 콘텐츠를 반환하고, 예외 발생 시 오류를 전파하여 `server.js`의 오류 처리기에서 처리하도록 합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "query": "사용자 검색어",
      "results": [
        { "query": "...", "resultText": "...", "retrievedAt": "...", "searchEngine": "naver" },
        { "query": "...", "resultText": "...", "retrievedAt": "...", "searchEngine": "daum" },
        { "query": "...", "resultText": "...", "retrievedAt": "...", "searchEngine": "bing" },
        { "query": "...", "resultText": "...", "retrievedAt": "...", "searchEngine": "nate" },
        // 또는 실패 정보 포함
        // { "error": "Nate search failed", "details": "...", "searchEngine": "nate" }
      ],
      "retrievedAt": "2024-01-01T12:00:00.000Z"
    }
    ```

### 3.6. 🛠️ `fetchUrl` 도구 (`src/tools/urlFetcherTool.js`)

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

*   **Naver 검색 관련**: `NAVER_SEARCH_BASE_URL`, `NAVER_SEARCH_REFERER`
*   **Daum 검색 관련**: `DAUM_SEARCH_BASE_URL`, `DAUM_SEARCH_REFERER`
*   **Bing 검색 관련**: `BING_SEARCH_BASE_URL`, `BING_SEARCH_REFERER`
*   **Nate 검색 관련**: `NATE_SEARCH_BASE_URL`, `NATE_SEARCH_REFERER`
*   **Google 검색 관련 (`googleSearch`)**:
    *   `GOOGLE_SEARCH_BASE_URL`: Google 검색 페이지 URL (예: `https://www.google.com`).
    *   `GOOGLE_SEARCH_REFERER`: Google 검색 시 사용할 Referer.
    *   `GOOGLE_SEARCH_INPUT_SELECTOR`: Google 검색 페이지 내 검색어 입력창의 CSS 선택자.
    *   `GOOGLE_SEARCH_BUTTON_SELECTOR`: Google 검색 페이지 내 검색 버튼의 CSS 선택자.
*   **크롤러 선택 (일반 검색용)**:
    *   `CRAWLER_TYPE`: Naver, Daum, Bing, Nate 등 일반 검색 시 사용할 크롤러를 지정합니다 (`'puppeteer'` 또는 `'selenium'`). 기본값은 `'puppeteer'`입니다. Google 검색은 `HumanLikeGoogleCrawler` (Puppeteer 기반)를 고정적으로 사용합니다.
*   **Puppeteer 관련 (`crawler.puppeteer`)**:
    *   이 설정은 `PuppeteerCrawler` 및 `HumanLikeGoogleCrawler` 모두에 공통적으로 적용될 수 있는 기본 설정을 포함합니다.
    *   `PUPPETEER_EXECUTABLE_PATH`: Chrome/Chromium 실행 파일 경로.
    *   `PUPPETEER_HEADLESS`: `true` 또는 `false`. 기본값 `true`.
    *   `PUPPETEER_ARGS`: Puppeteer 실행 인자 (쉼표로 구분).
    *   `PUPPETEER_USER_AGENT`: 사용할 User-Agent 문자열.
    *   `PUPPETEER_WAIT_UNTIL`: 페이지 로드 대기 조건 (예: `networkidle2`).
    *   `PUPPETEER_TIMEOUT`: 페이지 로드 타임아웃 (밀리초 단위).
*   **Selenium 관련 (`crawler.selenium`)**:
    *   `SELENIUM_BROWSER`: 사용할 브라우저 (예: `'chrome'`, `'firefox'`). 기본값 `'chrome'`.
    *   `SELENIUM_DRIVER_PATH`: 해당 브라우저의 WebDriver 실행 파일 경로.
    *   `SELENIUM_HEADLESS`: `true` 또는 `false`. 기본값 `true`.
    *   `SELENIUM_ARGS`: Selenium 브라우저 드라이버 추가 인자 (쉼표로 구분).
    *   `SELENIUM_USER_AGENT`: 사용할 User-Agent 문자열.
    *   `SELENIUM_PAGE_LOAD_TIMEOUT`: 페이지 로드 타임아웃 (밀리초 단위).
    *   `SELENIUM_SCRIPT_TIMEOUT`: 스크립트 실행 타임아웃 (밀리초 단위).
*   **실행 환경**: `NODE_ENV` (예: `development`, `production`)

## 5. 💪 SOLID 원칙 적용

서버는 SOLID 원칙을 준수하는 것을 목표로 합니다:

*   🎯 **단일 책임 원칙 (SRP)**: 각 모듈(예: `server.js`, `*SearchTool.js`, `searchService.js`, `integratedSearchService.js`, `puppeteerCrawler.js`, `seleniumCrawler.js`, `humanLikeGoogleCrawler.js`, `crawlerFactory.js`, `htmlParser.js`, `serviceConfig.js`, `logger.cjs`)은 명확히 구분된 책임을 가집니다. 각 크롤러 구현체는 특정 브라우저 자동화 기술 또는 특정 사이트의 검색 방식을 캡슐화합니다.
*   🧩 **개방/폐쇄 원칙 (OCP)**: 새로운 MCP 도구를 추가할 때 기존 도구나 서비스 로직을 크게 수정할 필요 없이 `src/tools/`에 새 파일을 추가하고 `src/tools/index.js`에 등록하는 방식으로 확장이 용이합니다. 새로운 유형의 일반 크롤러를 추가해야 할 경우, `WebCrawlerInterface`를 구현하는 새 클래스를 만들고 `crawlerFactory.js`를 수정하여 확장이 가능합니다. Google 검색과 같이 특수한 크롤러가 필요한 경우, 해당 크롤러를 직접 개발하고 `searchService.js`에서 사용합니다.
*   🔗 **인터페이스 분리 원칙 (ISP)**: 각 MCP 도구는 명확한 입력 스키마와 출력 형식을 정의하여 클라이언트에게 필요한 최소한의 인터페이스만 제공합니다. `WebCrawlerInterface`는 일반 크롤러의 핵심 기능(`getRawHtml`)을 정의하여, `searchService`가 일반 크롤러 구현에 의존하지 않도록 합니다. `HumanLikeGoogleCrawler`는 자체적인 인터페이스(`searchAndGetResults`)를 가집니다.
*   🔌 **의존관계 역전 원칙 (DIP)**: `searchService.js`는 일반 검색 시 구체적인 크롤러(`PuppeteerCrawler` 또는 `SeleniumCrawler`)에 직접 의존하는 대신, `crawlerFactory.js`와 추상적인 `WebCrawlerInterface`에 의존합니다. Google 검색의 경우, `HumanLikeGoogleCrawler`라는 특정 구현에 의존하지만, 이는 Google 검색 방식의 특수성 때문입니다. 만약 다른 "인간처럼 행동하는" 크롤러가 필요하다면 유사한 패턴을 적용할 수 있습니다.

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
    // import { myServiceFunction } from '../services/searchService.js'; // 필요시

    export const myNewTool = {
      name: "myNewToolName",
      description: "새로운 도구에 대한 설명입니다.",
      inputSchema: z.object({
        param1: z.string(),
      }),
      async handler({ param1 }) {
        logger.info(`Executing myNewToolName with param1: ${param1}`);
        try {
          // const result = await myServiceFunction(param1); // 예: searchService의 함수 호출
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
    import { naverSearchTool } from './naverSearchTool.js';
    import { daumSearchTool } from './daumSearchTool.js';
    import { bingSearchTool } from './bingSearchTool.js';
    import { nateSearchTool } from './nateSearchTool.js';
    import { googleSearchTool } from './googleSearchTool.js'; // googleSearchTool 추가
    import { integratedSearchTool } from './integratedSearchTool.js';
    import { urlFetcherTool } from './urlFetcherTool.js';
    import { myNewTool } from "./myNewTool.js"; // 새 도구 가져오기

    export const tools = [
      // naverSearchTool, // 필요에 따라 주석 해제 또는 유지
      daumSearchTool,
      bingSearchTool,
      nateSearchTool,
      googleSearchTool, // googleSearchTool 등록
      integratedSearchTool,
      urlFetcherTool,
      myNewTool, // 배열에 추가
    ];
    ```
4.  서버를 재시작하면 새 도구를 사용할 수 있습니다. (Stdio 방식에서는 재실행)

## 7. 🚀 실행 및 테스트

서버 실행 지침은 [INSTALL.md](INSTALL.md)를 참조하십시오. Stdio 기반이므로, 서버 실행 후 표준 입력을 통해 JSON 형식으로 MCP 요청을 전송하고 표준 출력을 통해 결과를 확인합니다.

**예시: `naverSearch` 도구 호출 (터미널에서 `request_naver.json` 파일 사용)**
1.  `request_naver.json` 파일 생성:
    ```json
    {
      "tool": "naverSearch",
      "inputs": {
        "query": "MCP SDK",
        "includeHtml": true
      },
      "id": "dev-manual-naver-001"
    }
    ```

**예시: `nateSearch` 도구 호출 (터미널에서 `request_nate.json` 파일 사용)**
1.  `request_nate.json` 파일 생성:
    ```json
    {
      "tool": "nateSearch",
      "inputs": {
        "query": "오늘의 운세",
        "includeHtml": false
      },
      "id": "dev-manual-nate-001"
    }
    ```

**예시: `integratedSearch` 도구 호출 (터미널에서 `request_integrated.json` 파일 사용)**
1.  `request_integrated.json` 파일 생성:
    ```json
    {
      "tool": "integratedSearch",
      "inputs": {
        "query": "대한민국 축구 국가대표팀 일정",
        "includeHtml": false
      },
      "id": "dev-manual-integrated-001"
    }
    ```

**예시: `fetchUrl` 도구 호출 (터미널에서 `request_fetch.json` 파일 사용)**
1.  `request_fetch.json` 파일 생성:
    ```json
    {
      "tool": "fetchUrl",
      "inputs": {
        "url": "https://www.daum.net"
      },
      "id": "dev-manual-fetch-001"
    }
    ```
2.  서버 실행 및 요청 전달:
    ```bash
    # naverSearch 예시
    npm start < request_naver.json

    # googleSearch 예시
    npm start < request_google.json

    # nateSearch 예시
    npm start < request_nate.json

    # integratedSearch 예시
    npm start < request_integrated.json

    # fetchUrl 예시
    npm start < request_fetch.json
    ```
    또는 개발 모드:
    ```bash
    # naverSearch 예시
    npm run dev < request_naver.json

    # googleSearch 예시
    npm run dev < request_google.json

    # nateSearch 예시
    npm run dev < request_nate.json

    # integratedSearch 예시
    npm run dev < request_integrated.json

    # fetchUrl 예시
    npm run dev < request_fetch.json
    ```
    서버는 표준 출력으로 MCP 응답을 JSON 형태로 출력합니다.

테스트는 현재 스킵되었지만, 향후 `Jest`를 사용하여 단위 테스트 및 통합 테스트를 추가할 예정입니다.
테스트 실행 명령어 (구현 시): `npm test`

## 8. 💡 일반적인 문제 해결

*   **SDK 관련 오류:** `@modelcontextprotocol/sdk`의 특정 버전과 호환성 문제가 발생하거나, `McpServer`, `StdioServerTransport` 등의 API가 예상과 다를 경우, SDK 문서를 참조하거나 버전을 확인해야 합니다.
*   **JSON 입력 오류:** Stdio로 JSON 요청을 전달할 때, JSON 형식이 정확해야 합니다. 형식이 잘못된 경우 서버에서 파싱 오류가 발생할 수 있습니다.
*   **크롤러 실행 오류**:
    *   **Puppeteer `executablePath` 오류**: Chrome/Chromium 브라우저를 찾을 수 없는 경우 발생합니다. `PUPPETEER_EXECUTABLE_PATH` 환경 변수를 설정하거나 `src/config/serviceConfig.js`의 기본 경로 설정을 확인하고 사용자의 환경에 맞게 수정해야 합니다.
    *   **Selenium `driverPath` 오류**: 지정된 브라우저의 WebDriver(예: chromedriver, geckodriver)를 찾을 수 없는 경우 발생합니다. 시스템 PATH에 WebDriver를 설치하거나 `SELENIUM_DRIVER_PATH` 환경 변수를 통해 정확한 경로를 지정해야 합니다.
*   **웹 페이지 스크래핑 차단**: 일부 웹사이트는 자동화된 접근을 탐지하고 차단할 수 있습니다. `puppeteer-extra-plugin-stealth` (Puppeteer 사용 시)가 이를 완화하는 데 도움이 되지만, 완벽하지 않을 수 있습니다. User-Agent 변경, 요청 간 지연 시간 추가, 프록시 사용 등의 추가 전략이 필요할 수 있습니다. Selenium의 경우에도 유사한 주의가 필요합니다.

## 9. 🌱 향후 개선 사항

*   **테스트 커버리지 확대:** Jest를 사용하여 단위 테스트 및 통합 테스트를 철저히 작성합니다. (현재 ES 모듈 모킹 문제로 일부 보류됨)
*   **`cheerio`를 사용한 HTML 결과 세분화:** `src/utils/htmlParser.js`의 `cleanHtml` 함수에서 `includeHtml=true`일 때, `selector` 옵션을 통해 특정 검색 결과 영역만 추출하는 기능을 더욱 발전시킬 수 있습니다. 특히 Google 검색 결과는 구조가 복잡하므로, 더 정교한 파싱 로직이 필요할 수 있습니다.
*   **검색 API 연동 (선택 사항):** 현재는 웹 페이지를 직접 스크레이핑하는 방식이므로 불안정할 수 있습니다. 안정적인 운영을 위해 Naver/Daum/Bing/Nate/Google 검색 API 또는 유사한 공식 API 사용을 고려할 수 있습니다. 이 경우 `serviceConfig.js`에 API 키 설정 등이 추가될 것입니다.
*   **더 정교한 오류 처리:** 사용자 정의 오류 클래스 및 세분화된 오류 코드를 크롤러 및 서비스 전반에 도입하여 클라이언트에게 더 명확한 오류 정보를 제공할 수 있습니다. `HumanLikeGoogleCrawler`의 경우, Google의 UI 변경에 따른 선택자(selector) 오류 등을 더 구체적으로 보고할 수 있습니다.
*   **크롤러 설정 고도화**: 프록시 설정, 쿠키 관리 (예: `HumanLikeGoogleCrawler`의 `handleCookieConsent` 개선), 요청 인터셉트 등 더 다양한 크롤러 옵션을 `serviceConfig.js` 및 각 크롤러 구현체를 통해 제어할 수 있도록 확장합니다.
*   **크롤러 인스턴스 관리 전략 개선**: 현재 `searchService.js`에서는 각 요청마다 크롤러 인스턴스를 생성하고 종료합니다. 고성능 환경에서는 크롤러 인스턴스 풀(pool)을 관리하거나 싱글톤으로 사용하는 등의 최적화 전략을 고려할 수 있습니다. 특히 `HumanLikeGoogleCrawler`는 초기화 비용이 상대적으로 클 수 있습니다.
*   **`integratedSearchService`에 Google 검색 통합**: 현재 `integratedSearchService.js`는 Google 검색을 포함하지 않습니다. 필요에 따라 여기에 `googleSearch`를 추가하고, 병렬 실행 시 Google 검색의 특수성을 고려해야 합니다.

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

Naver 등에서 자동화 탐지를 우회하기 위해 아래 패키지를 추가로 설치할 수 있습니다. (Puppeteer 사용 시)

### 설치 명령어

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### 사용 목적
- puppeteer-extra: puppeteer를 확장하여 다양한 플러그인 적용 가능
- puppeteer-extra-plugin-stealth: 자동화 탐지(봇 차단) 우회 기능 제공 (Puppeteer용)

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
