# MCP Search Server (Node.js)

다양한 웹 검색 기능을 제공하는 모델 컨텍스트 프로토콜(MCP)을 구현한 Node.js 서버입니다. 이 프로젝트는 `@modelcontextprotocol/sdk`를 사용하여 MCP 호환 도구를 노출합니다.

## ✨ 주요 기능

*   **유연한 검색 엔진 지원:** `search_engines.json` 파일을 통해 다양한 검색 엔진 설정을 지원하며, 특정 엔진 검색 및 여러 엔진 통합 검색이 가능합니다.
*   **일반 웹 검색 도구 (`search`):**
    *   주어진 검색어에 대해 특정 검색 엔진 또는 여러 엔진에서 웹 검색을 수행합니다.
    *   검색 결과에서 HTML 태그를 포함하거나 제거하는 옵션을 제공합니다.
    *   언어 코드를 지정하여 해당 언어를 지원하는 엔진을 대상으로 검색할 수 있습니다.
*   **특수 Google 검색 도구 (`googleSearch`):**
    *   CAPTCHA 우회를 시도하는 `HumanLikeGoogleCrawler`를 사용하여 Google 검색을 수행합니다.
*   **URL 콘텐츠 가져오기 및 사용자 정의 URL 검색 (`fetchUrl`):**
    *   지정된 URL의 웹 페이지 콘텐츠를 가져옵니다.
    *   URL과 함께 검색어 및 검색 파라미터 이름을 제공하여, 해당 URL 기반으로 사용자 정의 검색을 실행할 수 있습니다.
*   **MCP 호환:** `@modelcontextprotocol/sdk`를 사용하여 MCP 표준을 따르는 도구를 제공합니다.
*   **설정 가능:**
    *   검색 엔진 관련 설정: `search_engines.json` (엔진별 URL, 쿼리 파라미터 등)
    *   서비스 및 크롤러 설정: `src/config/serviceConfig.js` (크롤러 타입, 상세 옵션, Google UI 선택자 등)
*   **구조화된 로깅:** `winston`을 활용하여 상세한 로그를 제공합니다.
*   **SOLID 설계 원칙:** 유지보수성과 확장성을 고려하여 개발되었습니다.

## ⚙️ 모델 컨텍스트 프로토콜(MCP)에 대하여

모델 컨텍스트 프로토콜(MCP) SDK (`@modelcontextprotocol/sdk`)는 이 서버의 핵심 구성 요소입니다. 이 서버가 노출하는 도구를 정의하고 관리하기 위한 프레임워크와 유틸리티를 제공합니다.

MCP SDK는 `package.json` 파일에 프로젝트 종속성으로 나열되어 있으며, `npm install` 명령을 실행하면 자동으로 설치됩니다.

## 🚀 시작하기

### 1. NPX를 이용한 직접 실행 (권장, 설치 불필요)

이 도구는 `npx`를 사용하여 GitHub 저장소에서 직접 실행할 수 있습니다. 별도의 설치 과정이 필요 없습니다.

```bash
npx github:kim57uak/search-mcp-server
```

위 명령을 실행하면 자동으로 최신 버전의 도구를 GitHub에서 내려받아 실행합니다. MCP 서버가 시작되고 표준 입출력을 통해 통신할 준비가 됩니다.

### 2. 로컬 개발 및 테스트를 위한 설정

로컬 환경에서 개발하거나 테스트하려면 다음 단계를 따르세요.

1.  **저장소 복제:**
    ```bash
    git clone https://github.com/kim57uak/search-mcp-server.git
    cd search-mcp-server
    ```
2.  **종속성 설치:**
    ```bash
    npm install
    ```
3.  **서버 실행:**
    ```bash
    npm start
    ```
    또는 개발 모드(nodemon 사용):
    ```bash
    npm run dev
    ```

서버가 시작되면 표준 입력(stdin)을 통해 MCP 요청을 수신하고 표준 출력(stdout)을 통해 응답합니다.

`search_engines.json` 파일을 통해 사용할 검색 엔진을 설정할 수 있습니다.

## 📄 개발자 문서

개발, 기여 가이드라인 및 프로젝트 아키텍처에 대한 자세한 정보는 **[DEVELOPER_MANUAL.ko.md](DEVELOPER_MANUAL.ko.md)**를 참조하십시오.

## 🛠️ 사용 가능한 MCP 도구

### 1. `search` (일반 검색)

*   **설명:** 웹 검색을 수행합니다. `engineName`으로 특정 검색 엔진을 지정하거나, `languageCode`를 제공하여 해당 언어를 지원하는 여러 엔진에서 검색할 수 있습니다. `engineName`이 지정되지 않으면 `languageCode`를 기반으로 (또는 모든) 사용 가능한 여러 엔진에서 통합 검색을 시도합니다. (`search_engines.json`에 정의된 엔진 사용)
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다.
    *   `engineName` (string, 선택): 검색을 수행할 특정 엔진의 이름입니다 (예: "Naver", "Bing". `search_engines.json` 파일 참고).
    *   `languageCode` (string, 선택): 검색 결과의 언어를 지정하거나, 통합 검색 시 해당 언어를 지원하는 엔진을 필터링하는 데 사용됩니다 (예: "ko", "en").
    *   `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
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
    *   통합 검색 시 (`engineName` 미제공):
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
          {
            "query": "검색어",
            "searchEngine": "엔진이름2",
            // ... (오류 발생 시 error 필드 포함)
            "error": "엔진2 검색 실패 메시지",
            "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
          }
        ]
        ```
*   **호출 예시 (Stdio):**
    *   Naver에서 "Node.js" 검색:
        ```json
        {
          "tool": "search",
          "inputs": {
            "query": "Node.js",
            "engineName": "Naver",
            "languageCode": "ko",
            "includeHtml": false
          },
          "id": "readme-generic-naver"
        }
        ```
    *   한국어를 지원하는 엔진들에서 "날씨" 통합 검색:
        ```json
        {
          "tool": "search",
          "inputs": {
            "query": "날씨",
            "languageCode": "ko",
            "includeHtml": false
          },
          "id": "readme-integrated-ko"
        }
        ```

### 2. `googleSearch` (Google 특화 검색)

*   **설명:** Google 검색을 "인간처럼" 수행하여 결과를 반환합니다. CAPTCHA 우회를 시도하는 특수 크롤러(`HumanLikeGoogleCrawler`)를 사용합니다. 검색 결과는 주로 Google 설정 및 검색어의 언어에 따라 반환됩니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다.
    *   `includeHtml` (boolean, 선택, 기본값: `false`): HTML 태그 포함 여부.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "검색어",
      "resultText": "Google 검색 결과 내용 (HTML 포함 또는 제거됨)",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "google"
    }
    ```
*   **호출 예시 (Stdio):**
    ```json
    {
      "tool": "googleSearch",
      "inputs": {
        "query": "오늘의 구글 검색",
        "includeHtml": false
      },
      "id": "readme-example-google"
    }
    ```

### 3. `fetchUrl` (URL 콘텐츠 가져오기 및 사용자 정의 URL 검색)

*   **설명:** 제공된 URL의 웹 페이지 콘텐츠를 가져옵니다. 선택적으로 검색어(`query`)와 검색어 파라미터명(`queryParamName`)을 제공하여, 해당 URL에 검색어를 추가하여 요청하고 그 결과를 반환할 수 있습니다 (예: 특정 검색 엔진의 URL 템플릿에 검색어 삽입).
*   **입력 (`inputs`):**
    *   `url` (string, 필수): 내용을 가져올 웹 페이지의 전체 URL 또는 검색을 위한 기본 URL입니다.
    *   `query` (string, 선택): `url`에 추가할 검색어입니다. 이 값이 제공되면 사용자 정의 URL 검색으로 동작합니다.
    *   `queryParamName` (string, 선택, 기본값: `q`): `query`를 전달할 URL 파라미터의 이름입니다.
    *   `includeHtml` (boolean, 선택, 기본값: `false`): 결과에 HTML 태그 포함 여부.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "url": "요청된 최종 URL", // query가 사용된 경우 변경된 URL
      "textContent": "추출된 텍스트 내용...",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "originalUrl": "사용자가 입력한 초기 URL", // query 사용 시에만 포함될 수 있음
      "queryUsed": "사용된 검색어", // query 사용 시에만 포함될 수 있음
      "targetUrl": "실제 요청된 최종 URL" // query 사용 시 변경된 URL과 동일
    }
    ```
*   **호출 예시 (Stdio):**
    *   단순 URL 내용 가져오기:
        ```json
        {
          "tool": "fetchUrl",
          "inputs": {
            "url": "https://developer.mozilla.org/ko/docs/Web/JavaScript",
            "includeHtml": false
          },
          "id": "readme-fetch-simple"
        }
        ```
    *   사용자 정의 URL로 검색 (DuckDuckGo URL 템플릿 사용):
        ```json
        {
          "tool": "fetchUrl",
          "inputs": {
            "url": "https://duckduckgo.com/",
            "query": "Node.js MCP",
            "queryParamName": "q",
            "includeHtml": true
          },
          "id": "readme-fetch-custom-search"
        }
        ```

## 📦 프로젝트 구조

mcp-search-server/
├── logs/                     # 로그 파일 (gitignored)
├── src/                      # 소스 코드
│   ├── config/               # 설정 파일 (serviceConfig.js)
│   ├── crawlers/             # 크롤러 구현 (humanLikeGoogleCrawler.js 등)
│   ├── services/             # 비즈니스 로직 (searchService.js)
│   ├── tools/                # MCP 도구 정의 (genericSearchTool.js, googleSearchTool.js, urlFetcherTool.js, index.js)
│   ├── transports/           # 전송 계층 설정 (stdioTransport.js)
│   └── utils/                # 유틸리티 함수 (logger.cjs, htmlParser.js, searchEngineManager.js 등)
├── tests/                    # 테스트 코드
├── .gitignore
├── .prettierrc.json          # Prettier 설정
├── DEVELOPER_MANUAL.ko.md
├── INSTALL.md
├── README.md                 # 현재 파일
├── eslint.config.mjs         # ESLint 설정 (flat config)
├── jest.config.js            # Jest 설정
├── nodemon.json              # Nodemon 설정
├── package.json
├── package-lock.json
└── search_engines.json       # 검색 엔진 URL 및 파라미터 설정


## 🌐 크롤러 상세: Google 검색 및 CAPTCHA 우회

이 프로젝트의 `googleSearch` 도구는 `src/crawlers/humanLikeGoogleCrawler.js`에 구현된 특수 크롤러를 사용합니다. 이 크롤러는 Google의 CAPTCHA 및 봇 탐지 메커니즘을 우회하기 위해 다양한 전략을 사용합니다.

### Google 검색 크롤러 (`HumanLikeGoogleCrawler`)

*   **Puppeteer 기반:** 실제 Chrome 브라우저를 제어하는 Puppeteer 라이브러리를 사용하여 웹 페이지와 상호작용합니다. 이를 통해 JavaScript 실행, 사용자 입력 시뮬레이션 등 실제 사용자와 유사한 환경을 구성합니다.
*   **Stealth 기능:** `puppeteer-extra-plugin-stealth` 플러그인을 사용하여 Puppeteer가 자동화된 브라우저임을 나타내는 다양한 지표(예: `navigator.webdriver` 플래그)를 숨깁니다. 또한 User-Agent, 브라우저 플러그인 정보, 언어 설정 등을 실제 사용자와 유사하게 위장합니다.

### CAPTCHA 우회 및 탐지 회피 전략

Google의 정교한 봇 탐지 시스템에 대응하기 위해 다음과 같은 기법들이 적용되었습니다:

*   **다양한 User-Agent 랜덤 사용:** 미리 정의된 최신 브라우저 User-Agent 목록에서 무작위로 선택하여 사용합니다.
*   **Viewport 설정:** 일반적인 데스크톱 해상도(예: 1920x1080)로 브라우저 Viewport를 설정하여 일관성을 높입니다.
*   **인간과 유사한 행동 시뮬레이션:**
    *   마우스 커서의 자연스러운 이동 및 클릭 위치의 미세한 랜덤 변화.
    *   검색어 입력 시 실제 타이핑과 유사한 랜덤 딜레이 적용.
    *   페이지 로드 후 랜덤 스크롤 및 마우스 이동.
*   **요청 간 랜덤 딜레이:** 페이지 이동, 클릭, 입력 등 주요 작업 전후에 예측 불가능한 랜덤 딜레이를 추가하여 자동화된 패턴을 깨뜨립니다.
*   **CAPTCHA 감지 시 재시도 로직:**
    *   "로봇이 아닙니다", "비정상 트래픽" 등의 키워드로 CAPTCHA 페이지를 감지합니다.
    *   감지 시, 최대 2회까지 재시도를 수행합니다. (총 3회 시도)
    *   재시도 사이에는 5~10초의 비교적 긴 랜덤 대기 시간을 가집니다.

### 최근 개선 사항

*   **Viewport 설정 추가:** 모든 Google 검색 시 동일한 Viewport(1920x1080)를 사용하도록 설정했습니다.
*   **딜레이 강화:** 크롤링 과정 전반의 랜덤 딜레이 값을 조정하고 다양성을 높였습니다.
*   **재시도 로직 개선:** CAPTCHA 발생 시 재시도 횟수를 늘리고, 재시도 간 대기 시간을 증가시켰습니다.

### 한계점 및 주의사항

*   **완벽한 우회는 어려움:** Google의 봇 탐지 알고리즘은 지속적으로 업데이트되므로, 현재 적용된 방법으로도 CAPTCHA가 간헐적으로 발생하거나 향후 다시 문제가 될 수 있습니다.
*   **IP 주소 평판:** 사용되는 서버의 IP 주소가 과거에 스팸이나 어뷰징에 사용된 적이 있다면 CAPTCHA 발생 빈도가 높아질 수 있습니다. 깨끗한 IP를 사용하는 것이 중요합니다.
*   **과도한 요청:** 짧은 시간에 너무 많은 요청을 보내면 IP가 차단되거나 CAPTCHA가 더 자주 발생할 수 있습니다. 적절한 요청 간격을 유지해야 합니다.

### 추가 고려 사항 (향후 개선 방향)

*   **프록시 서버 또는 IP 로테이션:** 다양한 IP 주소를 사용하여 요청을 분산시키면 탐지 가능성을 낮출 수 있습니다.
*   **요청 빈도 제어:** 애플리케이션 레벨에서 전역적인 요청 빈도를 제어하여 특정 시간 동안 보낼 수 있는 요청 수를 제한합니다.
*   **헤더 및 브라우저 핑거프린트 정교화:** User-Agent 외의 HTTP 헤더(Accept-Language, Accept-Encoding 등)와 브라우저 핑거프린트 요소들을 더욱 실제 사용자와 유사하게 설정합니다.
```
