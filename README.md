# MCP Search Server (Node.js)

다양한 웹 검색 기능을 제공하는 모델 컨텍스트 프로토콜(MCP)을 구현한 Node.js 서버입니다. 이 프로젝트는 `@modelcontextprotocol/sdk`를 사용하여 MCP 호환 도구를 노출합니다.

## ✨ 주요 기능

*   **다중 검색 엔진 지원:** Naver, Daum, Bing, Nate, Google, Baidu, Yahoo Japan, Yahoo, Yandex 검색을 지원합니다.
*   **웹 검색 도구:**
    *   주어진 검색어에 대한 웹 검색을 수행합니다.
    *   검색 결과에서 HTML 태그를 포함하거나 제거하는 옵션을 제공합니다.
*   **URL 콘텐츠 가져오기:** 지정된 URL의 웹 페이지 콘텐츠를 가져옵니다.
*   **통합 검색:** 여러 검색 엔진에서 동시에 검색하고 결과를 통합합니다.
*   **MCP 호환:** `@modelcontextprotocol/sdk`를 사용하여 MCP 표준을 따르는 도구를 제공합니다.
*   **설정 가능:** `src/config/serviceConfig.js`를 통해 서비스 설정을 관리합니다.
*   **구조화된 로깅:** `winston`을 활용하여 상세한 로그를 제공합니다.
*   **SOLID 설계 원칙:** 유지보수성과 확장성을 고려하여 개발되었습니다.

## ⚙️ 모델 컨텍스트 프로토콜(MCP)에 대하여

모델 컨텍스트 프로토콜(MCP) SDK (`@modelcontextprotocol/sdk`)는 이 서버의 핵심 구성 요소입니다. 이 서버가 노출하는 도구를 정의하고 관리하기 위한 프레임워크와 유틸리티를 제공합니다.

MCP SDK는 `package.json` 파일에 프로젝트 종속성으로 나열되어 있으며, `npm install` 명령을 실행하면 자동으로 설치됩니다.

## 🚀 시작하기

서버 설정 및 실행을 시작하려면 **[INSTALL.md](INSTALL.md)**를 참조하십시오.

## 📄 개발자 문서

개발, 기여 가이드라인 및 프로젝트 아키텍처에 대한 자세한 정보는 **[DEVELOPER_MANUAL.ko.md](DEVELOPER_MANUAL.ko.md)**를 참조하십시오.

## 🛠️ 사용 가능한 MCP 도구

### 1. `naverSearch`

*   **설명:** Naver 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다. (공백만으로는 안됨)
    *   `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "검색어",
      "resultText": "Naver 검색 결과 내용 (HTML 포함 또는 제거됨)",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
    }
    ```
*   **호출 예시 (Stdio - 서버의 표준 입력으로 JSON 전송):**
    서버 실행 후, 다음 JSON 요청을 표준 입력으로 전달합니다.
    ```json
    {
      "tool": "naverSearch",
      "inputs": {
        "query": "Node.js MCP",
        "includeHtml": false
      },
      "id": "readme-example-01"
    }
    ```
    서버는 표준 출력으로 MCP 응답을 반환합니다. 자세한 요청/응답 방법은 [INSTALL.md](INSTALL.md)를 참조하십시오.

### 2. `daumSearch`

*   **설명:** Daum 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다. (공백만으로는 안됨)
    *   `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "검색어",
      "resultText": "Daum 검색 결과 내용 (HTML 포함 또는 제거됨)",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "daum"
    }
    ```

### 3. `bingSearch`

*   **설명:** Bing 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다. (공백만으로는 안됨)
    *   `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "검색어",
      "resultText": "Bing 검색 결과 내용 (HTML 포함 또는 제거됨)",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "bing"
    }
    ```

### 2. `baiduSearch`

*   **설명:** Baidu 웹 검색을 수행하고 결과를 반환합니다. 중국어로 번역된 검색어 사용이 권장됩니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다.
    *   `includeHtml` (boolean, 선택, 기본값: `false`): HTML 태그 포함 여부.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "번역된 중국어 검색어",
      "originalQuery": "원본 검색어",
      "resultText": "Baidu 검색 결과 내용...",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "baidu"
    }
    ```

### 3. `yahooJapanSearch`

*   **설명:** Yahoo! JAPAN 웹 검색을 수행하고 결과를 반환합니다. 일본어 또는 영어로 번역된 검색어 사용이 권장됩니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다.
    *   `includeHtml` (boolean, 선택, 기본값: `false`): HTML 태그 포함 여부.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "번역된 일본어/영어 검색어",
      "originalQuery": "원본 검색어",
      "resultText": "Yahoo! JAPAN 검색 결과 내용...",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "yahoo_japan"
    }
    ```

### 4. `yahooSearch`

*   **설명:** Yahoo.com (영어권) 웹 검색을 수행하고 결과를 반환합니다. 영어로 번역된 검색어 사용이 권장됩니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다.
    *   `includeHtml` (boolean, 선택, 기본값: `false`): HTML 태그 포함 여부.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "번역된 영어 검색어",
      "originalQuery": "원본 검색어",
      "resultText": "Yahoo.com 검색 결과 내용...",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "yahoo"
    }
    ```

### 5. `yandexSearch`

*   **설명:** Yandex 웹 검색을 수행하고 결과를 반환합니다. 러시아어로 번역된 검색어 사용이 권장됩니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다.
    *   `includeHtml` (boolean, 선택, 기본값: `false`): HTML 태그 포함 여부.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "번역된 러시아어 검색어",
      "originalQuery": "원본 검색어",
      "resultText": "Yandex 검색 결과 내용...",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "yandex"
    }
    ```

### (기존) 2. `daumSearch`

*   **설명:** Nate 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다. (공백만으로는 안됨)
    *   `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "검색어",
      "resultText": "Nate 검색 결과 내용 (HTML 포함 또는 제거됨)",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "nate"
    }
    ```

### 5. `integratedSearch`

*   **설명:** Naver, Daum, Bing, Nate 검색 엔진에서 동시에 검색을 수행하고 통합된 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다. (공백만으로는 안됨)
    *   `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "검색어",
      "resultText": "Bing 검색 결과 내용 (HTML 포함 또는 제거됨)",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "bing"
    }
    ```

### 4. `integratedSearch`

*   **설명:** Naver, Daum, Bing 검색 엔진에서 동시에 검색을 수행하고 통합된 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다. (공백만으로는 안됨)
    *   `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "검색어",
      "results": [
        {
          "query": "검색어",
          "resultText": "Naver 검색 결과 내용...",
          "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "searchEngine": "naver" // searchService에서 추가됨
        },
        {
          "query": "검색어",
          "resultText": "Daum 검색 결과 내용...",
          "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "searchEngine": "daum" // searchService에서 추가됨
        },
        {
          "query": "검색어",
          "resultText": "Bing 검색 결과 내용...",
          "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "searchEngine": "bing" // searchService에서 추가됨
        },
        {
          "query": "검색어",
          "resultText": "Nate 검색 결과 내용...",
          "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "searchEngine": "nate" // searchService에서 추가됨
        }
        // 또는 검색 실패 시
        // {
        //   "error": "Nate search failed",
        //   "details": "오류 상세 메시지",
        //   "searchEngine": "nate"
        // }
      ],
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
    }
    ```
*   **호출 예시 (Stdio - 서버의 표준 입력으로 JSON 전송):**
    ```json
    {
      "tool": "integratedSearch",
      "inputs": {
        "query": "오늘의 날씨",
        "includeHtml": false
      },
      "id": "readme-example-02"
    }
    ```

### 6. `googleSearch`

*   **설명:** Google 검색을 수행하고 "인간처럼" 검색 페이지와 상호작용하여 결과를 가져옵니다. HTML 태그 포함 여부를 선택할 수 있습니다.
*   **입력 (`inputs`):**
    *   `query` (string, 필수): 검색할 단어나 문장입니다. (공백만으로는 안됨)
    *   `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "query": "검색어",
      "resultText": "Google 검색 결과 내용 (HTML 포함 또는 제거됨)",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "searchEngine": "google"
    }
    ```
*   **호출 예시 (Stdio - 서버의 표준 입력으로 JSON 전송):**
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

### 7. `fetchUrl` (기존 `urlFetcherTool`에 해당)

*   **설명:** 주어진 URL의 웹 페이지 내용을 가져와 텍스트 콘텐츠를 반환합니다.
*   **입력 (`inputs`):**
    *   `url` (string, 필수): 내용을 가져올 웹 페이지의 전체 URL입니다. (유효한 URL 형식이어야 함, 예: `http://example.com`)
*   **예상 출력 (MCP 응답의 `result.content[0].text` 내부 JSON 문자열):**
    ```json
    {
      "url": "가져온 URL",
      "textContent": "추출된 텍스트 내용...",
      "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
    }
    ```

## 📦 프로젝트 구조

mcp-naver-search-server/
├── logs/              # 로그 파일 (gitignored)
├── src/               # 소스 코드
│   ├── config/        # 설정 파일 (serviceConfig.js)
│   ├── server.js      # 주 서버 초기화 및 MCP 요청 처리 (Stdio 기반)
│   ├── tools/         # MCP 도구 정의 (naverSearchTool.js, urlFetcherTool.js, index.js)
│   ├── services/      # 비즈니스 로직 모듈 (searchService.js)
│   ├── transports/    # 전송 계층 설정 (stdioTransport.js)
│   └── utils/         # 유틸리티 함수 (logger.cjs, puppeteerHelper.js, htmlParser.js)
├── tests/             # 테스트 코드 (현재 스킵됨)
├── .eslintignore      # (삭제됨, eslint.config.mjs의 ignores로 대체 가능)
├── .eslintrc.json     # (삭제됨, eslint.config.mjs로 대체됨)
├── .gitignore
├── .prettierrc.json   # Prettier 설정
├── DEVELOPER_MANUAL.ko.md
├── INSTALL.md
├── eslint.config.mjs  # ESLint 설정 (flat config)
├── jest.config.js     # Jest 설정
├── nodemon.json       # Nodemon 설정
├── package.json
└── package-lock.json

## 🌐 크롤러 상세: Google 검색 및 CAPTCHA 우회

이 프로젝트의 Google 검색 기능은 `src/crawlers/humanLikeGoogleCrawler.js`에 구현된 특수 크롤러를 사용합니다. 이 크롤러는 Google의 CAPTCHA 및 봇 탐지 메커니즘을 우회하기 위해 다양한 전략을 사용합니다.

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
