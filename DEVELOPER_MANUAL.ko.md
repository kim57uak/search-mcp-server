# MCP Search Server 개발자 매뉴얼

이 문서는 MCP Search Server의 아키텍처, 구성 요소 및 개발 가이드라인에 대한 자세한 개요를 제공합니다.

## 1. 📖 프로젝트 개요

MCP Search Server는 모델 컨텍스트 프로토콜(MCP) SDK를 사용하여 구축된 Node.js 애플리케이션입니다. `search_engines.json` 파일을 통해 설정된 다양한 웹 검색 엔진을 지원하며, 다음과 같은 주요 MCP 도구를 노출합니다:
*   **`search`**: 일반적인 웹 검색 및 통합 검색을 수행합니다. 특정 검색 엔진을 지정하거나 언어 코드를 기반으로 여러 엔진에서 검색할 수 있습니다.
*   **`googleSearch`**: CAPTCHA 우회를 시도하는 특수 크롤러를 사용하여 Google 검색을 수행합니다.
*   **`fetchUrl`**: 특정 URL의 콘텐츠를 가져오거나, 사용자가 제공한 URL과 검색어를 조합하여 맞춤 검색을 실행합니다.

이 서버는 웹 크롤링 작업에 Puppeteer 또는 Selenium을 선택적으로 사용할 수 있도록 유연하게 설계되었으며 (`serviceConfig.js`에서 설정), 유지보수성과 확장성을 보장하기 위해 SOLID 원칙을 염두에 두고 개발되었습니다. 검색 엔진 자체의 설정(URL, 쿼리 파라미터 등)은 `search_engines.json` 파일을 통해 관리되며, 이 파일은 `src/utils/searchEngineManager.js`에 의해 로드되고 처리됩니다.

서버는 모델 컨텍스트 프로토콜(MCP) SDK (`@modelcontextprotocol/sdk`)를 사용하여 구축되었습니다. 이 SDK는 프로젝트의 핵심 종속성이며, `package.json` 파일을 통해 관리되고 표준 `npm install` 프로세스의 일부로 설치됩니다. MCP 호환 서비스 및 도구를 만들고 관리하는 데 필요한 도구와 인터페이스를 제공합니다.

## 2. 🧱 프로젝트 구조

프로젝트는 모듈식 구조를 따릅니다:

mcp-search-server/
├── logs/                     # 로그 파일 (gitignored)
├── src/                      # 소스 코드
│   ├── config/               # 설정 파일
│   │   └── serviceConfig.js    # 서비스별 설정 (크롤러, Google UI 선택자 등)
│   ├── crawlers/             # 웹 크롤러 구현체 및 팩토리
│   │   ├── puppeteerCrawler.js # Puppeteer 기반 일반 크롤러
│   │   ├── seleniumCrawler.js  # Selenium 기반 일반 크롤러
│   │   ├── humanLikeGoogleCrawler.js # Google 검색용 Puppeteer 기반 특수 크롤러
│   │   └── crawlerFactory.js   # 일반 크롤러 인스턴스 생성 팩토리
│   ├── interfaces/           # (개념적) 인터페이스 정의 (실제 파일은 없음)
│   │   └── webCrawlerInterface.js # 웹 크롤러 인터페이스 (문서용)
│   ├── server.js             # 주 서버 초기화 및 MCP 요청 처리 (Stdio 기반)
│   ├── tools/                # MCP 도구 정의
│   │   ├── genericSearchTool.js # 'search' (일반/통합 검색) 도구
│   │   ├── googleSearchTool.js  # 'googleSearch' 도구
│   │   ├── urlFetcherTool.js    # 'fetchUrl' (URL 가져오기/커스텀 검색) 도구
│   │   └── index.js          # 모든 도구 내보내기
│   ├── services/             # 비즈니스 로직 모듈
│   │   ├── searchService.js      # 핵심 검색 로직
│   │   └── integratedSearchService.js # (구) 통합 검색 로직 (현재 거의 사용되지 않음, 향후 정리 대상)
│   ├── transports/           # 전송 계층 설정 (stdioTransport.js)
│   └── utils/                # 유틸리티 함수
│       ├── logger.cjs           # 로깅 유틸리티
│       ├── chromePathFinder.js  # Chrome 실행 경로 탐색 유틸리티
│       ├── htmlParser.js        # HTML 파싱 및 정리 유틸리티
│       └── searchEngineManager.js # search_engines.json 로드 및 관리
├── tests/                    # 테스트 코드
├── .gitignore
├── .prettierrc.json          # Prettier 설정
├── DEVELOPER_MANUAL.ko.md    # 이 파일
├── INSTALL.md                # 사용자를 위한 설치 안내서
├── README.md                 # 프로젝트 개요 및 빠른 시작
├── eslint.config.mjs         # ESLint 설정 (flat config)
├── jest.config.js            # Jest 설정
├── nodemon.json              # Nodemon 설정
├── package.json              # 프로젝트 메타데이터 및 종속성
├── package-lock.json         # 종속성의 정확한 버전 기록
└── search_engines.json       # 검색 엔진 URL, 쿼리 파라미터, 지원 언어 등 설정

### 🔑 주요 구성 요소:

*   📄 **`src/server.js`**:
    *   `@modelcontextprotocol/sdk`에서 `McpServer` 인스턴스를 초기화합니다.
    *   `src/tools/index.js`에서 모든 도구 정의(현재 `genericSearchTool`, `googleSearchTool`, `urlFetcherTool`)를 가져옵니다.
    *   가져온 도구들을 MCP 서버에 등록합니다.
    *   `src/transports/stdioTransport.js`에서 생성된 `StdioServerTransport`를 사용하여 MCP 서버를 연결합니다.
    *   서버는 표준 입출력(stdio)을 통해 MCP 요청을 수신하고 응답합니다.
    *   최상위 오류 처리 로직을 포함합니다.

*   🛠️ **`src/tools/`**:
    *   **`genericSearchTool.js`**: `search` MCP 도구를 정의합니다. (상세 설명은 아래 "MCP 도구 구현" 섹션 참조)
    *   **`googleSearchTool.js`**: `googleSearch` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`urlFetcherTool.js`**: `fetchUrl` MCP 도구를 정의합니다. (상세 설명은 아래 섹션 참조)
    *   **`index.js`**: 위 도구 정의들을 집계하고 배열로 내보내 `server.js`가 사용하도록 합니다.

*   ⚙️ **`search_engines.json`**:
    *   각 검색 엔진의 이름(`name`), 기본 URL(`base_url`), 검색어 파라미터(`query_param`), 언어 지정 파라미터(`lang_param`, 선택 사항), 지원 언어 목록(`supported_languages`) 등을 JSON 형식으로 설정합니다.
    *   이 파일을 수정하여 사용 가능한 검색 엔진 및 각 엔진의 동작 방식을 커스터마이징할 수 있습니다.
    *   이 파일은 `src/utils/searchEngineManager.js`에 의해 로드되고 관리됩니다.

*   ⚙️ **`src/config/serviceConfig.js`**:
    *   크롤러(`PuppeteerCrawler`, `SeleniumCrawler`, `HumanLikeGoogleCrawler`)를 위한 설정을 중앙에서 관리합니다.
    *   Google 검색용 CSS 선택자 (`searchInputSelector`, `searchButtonSelector`) 등을 포함합니다.
    *   **크롤러 설정 (`crawler`)**:
        *   `type`: 일반 검색 시 사용할 크롤러 유형 (`'puppeteer'` 또는 `'selenium'`). 환경 변수 `CRAWLER_TYPE`으로 제어. Google 검색은 `HumanLikeGoogleCrawler`를 직접 사용합니다.
        *   `puppeteer`: Puppeteer 관련 설정 (예: `executablePath`, `headless`, `args`, `userAgent`, `timeout` 등). 환경 변수 `PUPPETEER_*` 시리즈로 제어.
        *   `selenium`: Selenium 관련 설정 (예: `browser`, `driverPath`, `headless`, `args`, `userAgent`, `pageLoadTimeout` 등). 환경 변수 `SELENIUM_*` 시리즈로 제어.
    *   애플리케이션 환경(`NODE_ENV`) 정보도 포함합니다.
    *   **주의**: 과거에 있던 개별 검색 엔진의 `baseUrl`, `referer` 등은 `search_engines.json`으로 이전되었습니다.

*   📦 **`src/services/searchService.js`**:
    *   애플리케이션의 핵심 검색 로직을 담당합니다.
    *   `src/utils/searchEngineManager.js`로부터 `SearchEngineManager`를 가져와 `search_engines.json`의 설정을 로드하고 활용합니다.
    *   **`executeGenericSearch(query, engineName, languageCode, includeHtml)`**: `engineName`으로 지정된 단일 검색 엔진에 대해 검색을 수행합니다.
    *   **`performIntegratedSearch(query, languageCode, includeHtml)`**: `languageCode`를 기준으로 (또는 모든) 여러 관련 검색 엔진에 대해 동시에 검색을 수행하고 결과를 취합합니다. `googleSearch`는 이 통합 검색에서 기본적으로 제외됩니다.
    *   **`googleSearch(query, includeHtml)`**: `src/crawlers/humanLikeGoogleCrawler.js`를 사용하여 Google 검색을 수행합니다.
    *   **`fetchUrlContent(url, includeHtml)`**: 지정된 URL의 콘텐츠를 가져옵니다.
    *   일반 검색 시 `src/crawlers/crawlerFactory.js`를 통해 크롤러 인스턴스를 생성하며, `src/utils/htmlParser.js`의 `cleanHtml` 함수로 결과를 처리합니다.
    *   각 함수 실행 후 크롤러 인스턴스의 `close()` 메서드를 호출하여 리소스를 정리합니다.

*   📦 **`src/services/integratedSearchService.js`**:
    *   이 파일은 과거에 여러 검색 엔진의 결과를 통합하는 로직을 담당했으나, 해당 기능은 현재 `src/services/searchService.js`의 `performIntegratedSearch` 함수로 이전되었습니다. 따라서 이 파일은 현재 주요 로직에서 적극적으로 사용되지 않으며, 향후 프로젝트 정리 시 삭제될 수 있습니다.

*   🔩 **`src/crawlers/`**:
    *   **`puppeteerCrawler.js`**: 일반적인 Puppeteer 기반 크롤러.
    *   **`seleniumCrawler.js`**: 일반적인 Selenium WebDriver 기반 크롤러.
    *   **`humanLikeGoogleCrawler.js`**: Google 검색 전용, CAPTCHA 우회 시도.
    *   **`crawlerFactory.js`**: `serviceConfig.crawler.type` 설정에 따라 `PuppeteerCrawler` 또는 `SeleniumCrawler` 인스턴스를 생성.
    *   **`src/interfaces/webCrawlerInterface.js` (개념적)**: 크롤러 공통 인터페이스 정의.

*   🚇 **`src/transports/stdioTransport.js`**:
    *   `@modelcontextprotocol/sdk`의 `StdioServerTransport` 인스턴스를 생성하고 구성하는 팩토리 함수(`createStdioTransport`)를 제공합니다.

*   🪵 **`src/utils/`**:
    *   **`logger.cjs`**: `winston` 라이브러리를 사용하여 설정 가능한 로깅 시스템을 구현합니다. 콘솔 및 파일 로깅을 지원합니다.
    *   **`chromePathFinder.js`**: 시스템에 설치된 Google Chrome의 실행 경로를 찾는 유틸리티 함수를 제공합니다. `serviceConfig.js`에서 Puppeteer의 `executablePath` 기본값을 설정하는 데 사용됩니다.
    *   **`htmlParser.js`**: `cheerio`를 사용하여 HTML 문자열을 파싱하고, 불필요한 태그 제거, 텍스트 콘텐츠 추출 등의 작업을 수행하는 `cleanHtml` 함수를 제공합니다.
    *   **`searchEngineManager.js`**: `search_engines.json` 파일을 읽고 파싱하여 검색 엔진 설정 정보를 관리하는 `SearchEngine` 및 `SearchEngineManager` 클래스를 제공합니다. `searchService.js`에서 이 매니저를 사용하여 검색 엔진 정보를 가져옵니다.

## 3. 🔧 MCP 도구 구현

### 3.1. 🛠️ `search` 도구 (`src/tools/genericSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 웹 검색을 수행합니다. `engineName`을 통해 특정 검색 엔진을 지정하거나, `languageCode`를 통해 특정 언어를 지원하는 여러 엔진에서 통합 검색을 수행할 수 있습니다. `engineName`이 없으면 `languageCode` 기반 (또는 전체) 통합 검색을 시도합니다.
*   📜 **설명**: `웹 검색을 수행합니다. 특정 검색 엔진을 지정하거나, 언어 코드를 제공하여 해당 언어를 지원하는 여러 엔진에서 검색할 수 있습니다. 엔진을 지정하지 않으면 사용 가능한 여러 엔진에서 통합 검색을 시도합니다. 지원되는 검색 엔진 목록은 'search_engines.json' 파일을 참고하세요. 결과에서 HTML 태그를 포함할지 여부를 선택할 수 있습니다.`
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      query: z.string().min(1, { message: "검색어(query)는 필수입니다." }),
      engineName: z.string().optional(), // 예: "Naver", "Bing" 등.
      languageCode: z.string().optional(), // 예: "ko", "en".
      includeHtml: z.boolean().optional().default(false),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 실행 정보를 기록합니다.
    2.  `engineName`이 제공되면 `searchService.executeGenericSearch`를 호출하여 해당 엔진에서 검색합니다.
    3.  `engineName`이 제공되지 않으면 `searchService.performIntegratedSearch`를 호출하여 (선택적 `languageCode` 필터와 함께) 통합 검색을 수행합니다.
    4.  결과를 JSON 문자열로 변환하여 MCP 콘텐츠 형식으로 포맷하여 반환합니다. 오류 발생 시 전파합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    *   특정 엔진 검색 시 (`engineName` 제공):
        ```json
        {
          "query": "검색어",
          "engine": "엔진이름",
          "language": "언어코드", // 제공된 경우
          "resultText": "검색 결과 내용 (HTML 포함 또는 제거됨)",
          "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "searchUrl": "실제요청된검색URL"
        }
        ```
    *   통합 검색 시 (`engineName` 미제공, `performIntegratedSearch` 결과):
        ```json
        [ // 여러 엔진 결과의 배열
          {
            "query": "검색어",
            "searchEngine": "엔진이름1",
            "language": "언어코드", // 제공된 경우
            "resultText": "엔진1 검색 결과...",
            "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
            "searchUrl": "실제요청된검색URL1"
          },
          { // 오류 발생 예시
            "query": "검색어",
            "searchEngine": "엔진이름2",
            "language": "언어코드",
            "error": "엔진2 검색 중 오류 발생 메시지",
            "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
          }
          // ... 추가 결과들
        ]
        ```

### 3.2. 🛠️ `googleSearch` 도구 (`src/tools/googleSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 Google에서 "인간과 유사한" 방식으로 검색을 수행하고, HTML 태그 포함 여부(`includeHtml`)에 따라 처리된 결과를 반환합니다. (내부적으로 `searchService.googleSearch` 및 `HumanLikeGoogleCrawler` 사용)
*   📜 **설명**: `Google 검색을 수행하고 "인간처럼" 검색 페이지와 상호작용하여 결과를 반환합니다. 검색 결과는 주로 Google 설정 및 검색어의 언어에 따라 반환됩니다.`
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      query: z.string().min(1, { message: "검색어(query)는 필수입니다." }),
      includeHtml: z.boolean().optional().default(false),
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 실행 정보를 기록합니다.
    2.  `searchService.googleSearch`를 호출합니다.
    3.  결과를 JSON 문자열로 변환하여 MCP 콘텐츠 형식으로 포맷하여 반환합니다. 오류 발생 시 전파합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "query": "사용자 검색어",
      "resultText": "Google 검색 결과 (HTML 태그 포함 또는 제거됨)",
      "retrievedAt": "2024-01-01T12:00:00.000Z",
      "searchEngine": "google"
    }
    ```

### 3.3. 🛠️ `fetchUrl` 도구 (`src/tools/urlFetcherTool.js`)

*   🎯 **목적**: 사용자가 제공한 URL의 웹 페이지 콘텐츠를 가져오거나, URL과 검색어를 조합하여 사용자 정의 검색을 실행하고 그 결과를 반환합니다.
*   📜 **설명**: `제공된 URL의 웹 페이지 콘텐츠를 가져옵니다. 선택적으로 검색어(query)를 제공하면, 해당 URL에 검색어를 추가하여 요청하고 그 결과를 반환합니다. (예: URL이 검색 엔진의 기본 URL일 경우, query를 추가하여 검색 실행)`
*   📥 **입력 스키마 (`zod`):**
    ```javascript
    z.object({
      url: z.string().url({ message: "유효한 URL을 입력해야 합니다." }),
      query: z.string().optional(), // 검색어 (선택 사항)
      queryParamName: z.string().optional().default('q'), // 검색어를 전달할 URL 파라미터 이름
      includeHtml: z.boolean().optional().default(false), // HTML 태그 포함 여부
    })
    ```
*   🧠 **핸들러 로직:**
    1.  `logger.cjs`를 사용하여 실행 정보를 기록합니다.
    2.  `query`가 제공되면, 입력 `url`에 `queryParamName`을 사용하여 `query`를 추가한 `targetUrl`을 생성합니다.
    3.  `query`가 없으면 입력 `url`을 `targetUrl`로 사용합니다.
    4.  `searchService.fetchUrlContent(targetUrl, includeHtml)`를 호출합니다.
    5.  결과에 `originalUrl`, `queryUsed`, `targetUrl` 정보를 추가하여 JSON 문자열로 변환 후 MCP 콘텐츠 형식으로 포맷하여 반환합니다. 오류 발생 시 전파합니다.
*   ✅ **출력 (성공 시 MCP 응답의 `result.content[0].text` 내부 JSON 구조 예시):**
    ```json
    {
      "url": "실제 요청된 URL", // query 사용 시 query가 포함된 URL
      "textContent": "추출된 웹 페이지 텍스트 내용...",
      "retrievedAt": "2024-01-02T10:00:00.000Z",
      "originalUrl": "사용자가 입력한 초기 url 값", // query 사용 시에만 의미 있음
      "queryUsed": "사용자가 입력한 query 값", // query 사용 시에만 의미 있음
      "targetUrl": "실제 요청된 최종 URL" // url 필드와 동일
    }
    ```

## 4. ⚙️ 설정 관리

애플리케이션 설정은 다음 두 주요 파일을 통해 관리됩니다:

### 4.1. `search_engines.json`

*   **역할**: 검색 엔진별 설정을 중앙에서 관리합니다. 이 파일을 통해 사용 가능한 검색 엔진, 각 엔진의 기본 URL, 검색어 전달 방식 등을 정의합니다. `src/utils/searchEngineManager.js`에 의해 로드됩니다.
*   **구조**: 최상위 `engines` 배열 안에 각 검색 엔진 객체를 포함합니다.
*   **주요 필드 (각 엔진 객체 내부):**
    *   `name` (string, 필수): 검색 엔진의 고유한 이름 (예: "Google", "Naver"). `search` 도구의 `engineName` 파라미터 값으로 사용됩니다.
    *   `base_url` (string, 필수): 검색 쿼리 파라미터를 제외한 기본 URL입니다. (예: `"https://www.google.com/search"`). 만약 URL 자체에 고정 파라미터가 있다면 포함할 수 있습니다 (예: `"https://search.naver.com/search.naver?ie=utf8"`).
    *   `query_param` (string, 필수): 검색어를 전달하는 URL 파라미터의 이름입니다 (예: `"q"`, `"query"`, `"wd"`).
    *   `lang_param` (string, 선택): 검색 결과 언어 설정을 위한 URL 파라미터의 이름입니다 (예: `"hl"`, `"setlang"`). `search` 도구의 `languageCode`와 함께 사용됩니다.
    *   `supported_languages` (array of strings, 선택): 해당 검색 엔진이 주로 지원하거나, `lang_param`을 통해 필터링할 수 있는 언어 코드 목록입니다 (예: `["en", "ko", "ja"]`). `search` 도구의 통합 검색 시 `languageCode` 필터링에 사용됩니다.
*   **커스터마이징**: 이 파일을 직접 수정하여 새로운 검색 엔진을 추가하거나 기존 설정을 변경할 수 있습니다. 서버 재시작 시 변경 사항이 반영됩니다.

### 4.2. `src/config/serviceConfig.js`

*   **역할**: 검색 엔진 자체의 URL 설정 외의 전역 서비스 설정 및 크롤러 관련 상세 설정을 관리합니다. 환경 변수를 통해 다양한 설정을 재정의할 수 있습니다.
*   **주요 설정 항목**:
    *   **Google 검색 관련 (`googleSearch`)**:
        *   `baseUrl`: `HumanLikeGoogleCrawler`가 사용할 Google 검색 페이지 URL (예: `https://www.google.com`). `search_engines.json`의 Google `base_url`과 다를 수 있습니다 (전자는 실제 검색 API URL, 후자는 크롤러 시작 페이지).
        *   `referer`: Google 검색 시 사용할 Referer.
        *   `searchInputSelector`: Google 검색 페이지 내 검색어 입력창의 CSS 선택자.
        *   `searchButtonSelector`: Google 검색 페이지 내 검색 버튼의 CSS 선택자.
        *   `timeout`, `waitUntil`: `HumanLikeGoogleCrawler`의 페이지 로드 관련 옵션.
    *   **크롤러 선택 (일반 검색용, `crawler.type`)**:
        *   `CRAWLER_TYPE` 환경 변수로 제어. `search` 도구가 일반 검색 엔진에 접근 시 사용할 크롤러를 지정합니다 (`'puppeteer'` 또는 `'selenium'`). 기본값은 `'puppeteer'`입니다. `googleSearch` 도구는 `HumanLikeGoogleCrawler` (Puppeteer 기반)를 고정적으로 사용합니다.
    *   **Puppeteer 관련 (`crawler.puppeteer`)**:
        *   `PUPPETEER_EXECUTABLE_PATH`, `PUPPETEER_HEADLESS`, `PUPPETEER_ARGS`, `PUPPETEER_USER_AGENT`, `PUPPETEER_WAIT_UNTIL`, `PUPPETEER_TIMEOUT` 등. 이 설정은 `PuppeteerCrawler`와 `HumanLikeGoogleCrawler`의 기본값으로 활용됩니다.
    *   **Selenium 관련 (`crawler.selenium`)**:
        *   `SELENIUM_BROWSER`, `SELENIUM_DRIVER_PATH`, `SELENIUM_HEADLESS`, `SELENIUM_ARGS`, `SELENIUM_USER_AGENT`, `SELENIUM_PAGE_LOAD_TIMEOUT`, `SELENIUM_SCRIPT_TIMEOUT` 등.
    *   **실행 환경**: `NODE_ENV` (예: `development`, `production`)

## 5. 💪 SOLID 원칙 적용

서버는 SOLID 원칙을 준수하는 것을 목표로 합니다:

*   🎯 **단일 책임 원칙 (SRP)**:
    *   `searchService.js`: 핵심 검색 로직을 담당합니다.
    *   `src/utils/searchEngineManager.js`: `search_engines.json` 로드 및 검색 엔진 정보 관리를 전담합니다.
    *   각 Tool 파일 (`genericSearchTool.js`, `googleSearchTool.js`, `urlFetcherTool.js`): 특정 MCP 도구의 입력 처리, 서비스 호출, 출력 포맷팅을 담당합니다.
    *   각 크롤러 파일 (`puppeteerCrawler.js` 등): 특정 브라우저 자동화 기술을 캡슐화합니다.
    *   `search_engines.json`: 검색 엔진 설정을 분리하여 담당합니다.
    *   `serviceConfig.js`: 크롤러 및 기타 전역 설정을 담당합니다.
*   🧩 **개방/폐쇄 원칙 (OCP)**:
    *   새로운 검색 엔진 추가: `search_engines.json` 파일에 새 엔진 정보를 추가하는 것만으로 대부분 가능합니다. 코드 변경이 최소화됩니다.
    *   새로운 MCP 도구 추가: `src/tools/`에 새 파일을 추가하고 `src/tools/index.js`에 등록하는 방식으로 확장이 용이합니다. 기존 도구나 서비스 로직 수정이 거의 필요 없습니다.
*   🔗 **인터페이스 분리 원칙 (ISP)**: 각 MCP 도구는 `inputSchema`를 통해 명확한 인터페이스를 제공합니다. `WebCrawlerInterface`(개념적)는 일반 크롤러의 공통 기능을 정의합니다.
*   🔌 **의존관계 역전 원칙 (DIP)**:
    *   `searchService.js`는 `src/utils/searchEngineManager.js`에서 제공하는 `SearchEngineManager`에 의존하여 검색 엔진 정보를 가져옵니다. 또한 일반 검색 시 `crawlerFactory.js`를 통해 추상화된 크롤러 인터페이스에 의존합니다.
    *   Tool들은 구체적인 검색 실행 로직보다는 `searchService.js`에 정의된 서비스 함수에 의존합니다.

## 6. ✨ 새로운 MCP 도구 추가 (예시)

1.  **서비스 로직 정의 (선택 사항, 권장):**
    *   복잡한 로직이 필요하면 `src/services/searchService.js`에 새 함수를 추가하거나, 별도의 서비스 파일을 만듭니다. 이 함수는 필요시 `createCrawler`를 사용하거나, `SearchEngineManager`를 활용할 수 있습니다.
2.  **도구 정의 파일 생성:** (`README.md`의 예시와 유사)
    *   `src/tools/`에 새 JavaScript 파일(예: `myCustomFeatureTool.js`)을 만듭니다.
    *   `inputSchema`, `description`, `name`, `async handler`를 정의합니다.
3.  **도구 등록:**
    *   `src/tools/index.js`를 열어 새 도구를 가져오고 `tools` 배열에 추가합니다.
    ```javascript
    // src/tools/index.js
    import { googleSearchTool } from './googleSearchTool.js';
    import { urlFetcherTool } from './urlFetcherTool.js';
    import { genericSearchTool } from './genericSearchTool.js'; // 일반 검색 도구
    import { myCustomFeatureTool } from "./myCustomFeatureTool.js"; // 새 도구 가져오기

    export const tools = [
      googleSearchTool,
      urlFetcherTool,
      genericSearchTool,
      myCustomFeatureTool, // 배열에 추가
    ];
    ```
4.  서버를 재시작(또는 `nodemon` 사용 시 자동 재시작)하면 새 도구를 사용할 수 있습니다.

## 7. 🚀 실행 및 테스트

서버 실행 지침은 [INSTALL.md](INSTALL.md)를 참조하십시오. Stdio 기반이므로, 서버 실행 후 표준 입력을 통해 JSON 형식으로 MCP 요청을 전송하고 표준 출력을 통해 결과를 확인합니다.

**예시: `search` 도구로 Naver 검색 (터미널에서 `request_search_naver.json` 파일 사용)**
1.  `request_search_naver.json` 파일 생성:
    ```json
    {
      "tool": "search",
      "inputs": {
        "query": "MCP SDK",
        "engineName": "Naver",
        "languageCode": "ko",
        "includeHtml": true
      },
      "id": "dev-manual-search-naver-001"
    }
    ```

**예시: `search` 도구로 통합 검색 (터미널에서 `request_search_integrated.json` 파일 사용)**
1.  `request_search_integrated.json` 파일 생성:
    ```json
    {
      "tool": "search",
      "inputs": {
        "query": "오늘의 날씨",
        "languageCode": "ko", // 한국어 지원 엔진 대상
        "includeHtml": false
      },
      "id": "dev-manual-search-integrated-001"
    }
    ```

**예시: `googleSearch` 도구 호출 (터미널에서 `request_google.json` 파일 사용)**
1.  `request_google.json` 파일 생성:
    ```json
    {
      "tool": "googleSearch",
      "inputs": {
        "query": "Jest 테스트 작성법",
        "includeHtml": false
      },
      "id": "dev-manual-google-001"
    }
    ```

**예시: `fetchUrl` 도구로 사용자 정의 검색 (터미널에서 `request_fetch_custom.json` 파일 사용)**
1.  `request_fetch_custom.json` 파일 생성:
    ```json
    {
      "tool": "fetchUrl",
      "inputs": {
        "url": "https://www.bing.com/search", // Bing 검색 URL 템플릿
        "query": "Typescript 장점",
        "queryParamName": "q", // Bing의 검색어 파라미터
        "includeHtml": false
      },
      "id": "dev-manual-fetch-custom-001"
    }
    ```
2.  서버 실행 및 요청 전달:
    ```bash
    # search (Naver) 예시
    npm start < request_search_naver.json

    # search (통합) 예시
    npm start < request_search_integrated.json

    # googleSearch 예시
    npm start < request_google.json

    # fetchUrl (커스텀 검색) 예시
    npm start < request_fetch_custom.json
    ```
    또는 개발 모드:
    ```bash
    npm run dev < request_search_naver.json
    ```
    서버는 표준 출력으로 MCP 응답을 JSON 형태로 출력합니다.

테스트는 `Jest`를 사용하며, `tests/services/searchService.test.js` 등에서 확인할 수 있습니다.
테스트 실행 명령어: `npm test`

## 8. 💡 일반적인 문제 해결

*   **SDK 관련 오류:** (`@modelcontextprotocol/sdk`의 특정 버전과 호환성 문제가 발생하거나, `McpServer`, `StdioServerTransport` 등의 API가 예상과 다를 경우, SDK 문서를 참조하거나 버전을 확인해야 합니다.)
*   **JSON 입력 오류:** (Stdio로 JSON 요청을 전달할 때, JSON 형식이 정확해야 합니다. 형식이 잘못된 경우 서버에서 파싱 오류가 발생할 수 있습니다.)
*   **`search_engines.json` 설정 오류**: 파일 형식이 잘못되었거나, 필수 필드(`name`, `base_url`, `query_param`)가 누락된 경우 `SearchEngineManager` 로드 시 오류가 발생하거나 검색이 제대로 동작하지 않을 수 있습니다. 터미널 로그를 확인하세요.
*   **크롤러 실행 오류**: (Puppeteer `executablePath` 오류, Selenium `driverPath` 오류 등은 이전과 동일)
*   **웹 페이지 스크래핑 차단**: (일부 웹사이트는 자동화된 접근을 탐지하고 차단할 수 있습니다. `puppeteer-extra-plugin-stealth` (Puppeteer 사용 시)가 이를 완화하는 데 도움이 되지만, 완벽하지 않을 수 있습니다. User-Agent 변경, 요청 간 지연 시간 추가, 프록시 사용 등의 추가 전략이 필요할 수 있습니다. Selenium의 경우에도 유사한 주의가 필요합니다.)

## 9. 🌱 향후 개선 사항

*   **`SearchEngineManager` 개선**: `src/utils/searchEngineManager.js`의 `SearchEngineManager` 클래스는 현재 기본적인 JSON 로딩 및 관리 기능을 수행합니다. 필요에 따라 오류 처리, 스키마 검증, 캐싱 등의 고급 기능을 추가할 수 있습니다.
*   **`search_engines.json` 스키마 검증**: 서버 시작 시 `search_engines.json` 파일의 구조와 각 엔진 설정의 유효성을 Zod 등을 사용하여 검사하는 로직을 추가하여 설정 오류를 미리 방지할 수 있습니다.
*   **번역 기능 통합**: `search` 도구 사용 시, 사용자의 원본 `query`와 `languageCode`를 바탕으로 실제 번역 API를 연동하여 대상 검색 엔진에 적합한 언어로 검색어를 번역하는 기능을 추가할 수 있습니다.
*   **테스트 커버리지 확대:** (단위 테스트 및 통합 테스트를 철저히 작성합니다.)
*   **`cheerio`를 사용한 HTML 결과 세분화:** (`src/utils/htmlParser.js`의 `cleanHtml` 함수에서 `includeHtml=true`일 때, `selector` 옵션을 통해 특정 검색 결과 영역만 추출하는 기능을 더욱 발전시킬 수 있습니다.)
*   **검색 API 연동 (선택 사항):** (현재는 웹 페이지를 직접 스크레이핑하는 방식이므로 불안정할 수 있습니다. 안정적인 운영을 위해 공식 API 사용을 고려할 수 있습니다.)
*   **더 정교한 오류 처리:** (사용자 정의 오류 클래스 및 세분화된 오류 코드를 도입하여 클라이언트에게 더 명확한 오류 정보를 제공할 수 있습니다.)
*   **크롤러 설정 고도화**: (프록시 설정, 쿠키 관리, 요청 인터셉트 등 더 다양한 크롤러 옵션을 제어할 수 있도록 확장합니다.)
*   **크롤러 인스턴스 관리 전략 개선**: (고성능 환경에서는 크롤러 인스턴스 풀(pool)을 관리하거나 싱글톤으로 사용하는 등의 최적화 전략을 고려할 수 있습니다.)
*   **`src/services/integratedSearchService.js` 정리**: 이 파일의 기능은 `searchService.js`의 `performIntegratedSearch`로 대체되었으므로, 프로젝트에서 완전히 삭제하여 혼란을 줄이는 것이 좋습니다.

## cheerio 설치 및 사용 목적

(HTML에서 script/style 등 불필요한 태그와 자바스크립트 코드를 완전히 제거하기 위해 cheerio를 사용합니다.)

### 설치 명령어

```bash
npm install cheerio
```

### 사용 목적
- cheerio: HTML 파싱 및 특정 태그(script, style 등) 전체 삭제 가능
- 검색 결과에서 불필요한 코드, 광고, 스크립트 등을 깔끔하게 제거할 수 있음

## puppeteer-extra 및 stealth 플러그인 설치

(Naver 등에서 자동화 탐지를 우회하기 위해 아래 패키지를 추가로 설치할 수 있습니다. (Puppeteer 사용 시))

### 설치 명령어

```bash
npm install puppeteer-extra@latest puppeteer-extra-plugin-stealth@latest
```

### 사용 목적
- puppeteer-extra: puppeteer를 확장하여 다양한 플러그인 적용 가능
- puppeteer-extra-plugin-stealth: 자동화 탐지(봇 차단) 우회 기능 제공 (Puppeteer용)

## Selenium WebDriver 설치

(Selenium을 사용하기 위해서는 `selenium-webdriver` 라이브러리와 각 브라우저에 맞는 WebDriver가 필요합니다.)

### 라이브러리 설치 명령어

```bash
npm install selenium-webdriver
```

### WebDriver 설치
사용하려는 브라우저(Chrome, Firefox 등)에 맞는 WebDriver를 다운로드하여 시스템 PATH에 추가하거나, `SELENIUM_DRIVER_PATH` 환경 변수를 통해 경로를 지정해야 합니다.
*   **ChromeDriver**: [https://chromedriver.chromium.org/downloads](https://chromedriver.chromium.org/downloads)
*   **GeckoDriver (Firefox)**: [https://github.com/mozilla/geckodriver/releases](https://github.com/mozilla/geckodriver/releases)
