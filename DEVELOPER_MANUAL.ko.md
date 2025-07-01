# MCP Google Search Server 개발자 매뉴얼

이 문서는 MCP Google Search Server의 아키텍처, 구성 요소 및 개발 가이드라인에 대한 자세한 개요를 제공합니다.

## 1. 📖 프로젝트 개요

MCP Google Search Server는 모델 컨텍스트 프로토콜(MCP) SDK를 사용하여 구축된 Node.js 애플리케이션입니다. Google 웹 검색 기능을 수행하는 단일 MCP 도구(`googleSearch`)를 노출합니다. 서버는 유지보수성과 확장성을 보장하기 위해 SOLID 원칙을 염두에 두고 설계되었습니다.

서버는 모델 컨텍스트 프로토콜(MCP) SDK (`@modelcontextprotocol/sdk`)를 사용하여 구축되었습니다. 이 SDK는 프로젝트의 핵심 종속성이며, `package.json` 파일을 통해 관리되고 표준 `npm install` 프로세스의 일부로 설치됩니다. MCP 호환 서비스 및 도구를 만들고 관리하는 데 필요한 도구와 인터페이스를 제공합니다.

## 2. 🧱 프로젝트 구조

프로젝트는 모듈식 구조를 따릅니다:

mcp-google-search-server/
├── logs/              # 로그 파일 (gitignored)
├── src/               # 소스 코드
│   ├── config/        # 설정 파일
│   │   └── serviceConfig.js # 서비스별 설정 (Google 검색 URL 등)
│   ├── server.js      # 주 서버 초기화 및 MCP 요청 처리 (Stdio 기반)
│   ├── tools/         # MCP 도구 정의
│   │   ├── googleSearchTool.js # Google 검색 도구
│   │   └── index.js   # 모든 도구 내보내기
│   ├── services/      # 비즈니스 로직 모듈
│   │   └── searchService.js   # Google 검색 API 연동 로직
│   ├── transports/    # 전송 계층 설정 (stdioTransport.js)
│   └── utils/         # 유틸리티 함수
│       └── logger.cjs    # 로깅 유틸리티
├── tests/             # 테스트 코드 (현재 스킵됨)
├── .gitignore
├── .prettierrc.json   # Prettier 설정
├── DEVELOPER_MANUAL.ko.md # 이 파일
├── INSTALL.md         # 사용자를 위한 설치 안내서
├── eslint.config.mjs  # ESLint 설정 (flat config)
├── jest.config.js     # Jest 설정
├── nodemon.json       # Nodemon 설정
├── package.json       # 프로젝트 메타데이터 및 종속성
└── package-lock.json  # 종속성의 정확한 버전 기록

### 🔑 주요 구성 요소:

*   📄 **`src/server.js`**:
    *   `@modelcontextprotocol/sdk`에서 `McpServer` 인스턴스를 초기화합니다.
    *   `src/tools/index.js`에서 도구 정의(`googleSearchTool`)를 가져옵니다.
    *   가져온 도구를 MCP 서버에 등록합니다.
    *   `src/transports/stdioTransport.js`에서 생성된 `StdioServerTransport`를 사용하여 MCP 서버를 연결합니다.
    *   서버는 표준 입출력(stdio)을 통해 MCP 요청을 수신하고 응답합니다.
    *   최상위 오류 처리 로직을 포함합니다.

*   🛠️ **`src/tools/`**:
    *   **`googleSearchTool.js`**: `googleSearch` MCP 도구를 정의합니다.
        *   도구 정의는 `name`, `description`, `inputSchema` (`zod`를 사용한 유효성 검사) 및 `async handler` 함수를 가진 객체입니다.
        *   핸들러는 유효성이 검사된 입력(`query`, `includeHtml`)을 받아 `src/services/searchService.js`의 `googleSearch` 함수를 호출하여 비즈니스 로직을 수행합니다.
        *   결과를 MCP 클라이언트를 위해 표준 콘텐츠 형식(`{ type: "text", text: JSON.stringify(result) }`)으로 포맷하여 반환합니다.
        *   오류 발생 시 로깅하고 오류를 전파합니다.
    *   **`index.js`**: 모든 도구 정의(`googleSearchTool`)를 집계하고 배열로 내보내 `server.js`가 사용하도록 합니다.

*   ⚙️ **`src/config/serviceConfig.js`**:
    *   `searchService.js`를 위한 설정을 중앙에서 관리합니다.
    *   Google 검색을 위한 `baseUrl` (`GOOGLE_SEARCH_BASE_URL` 환경 변수로 재정의 가능) 등을 포함합니다.
    *   애플리케이션 환경(`NODE_ENV`) 정보도 포함합니다.

*   📦 **`src/services/searchService.js`**:
    *   Google 검색 수행과 관련된 비즈니스 로직을 담당합니다.
    *   `axios`를 사용하여 Google 검색 URL에 HTTP GET 요청을 보냅니다.
    *   `striptags` (또는 향후 `cheerio`)를 사용하여 검색 결과 HTML에서 태그를 제거하거나 원본을 유지하는 `cleanHtml` 유틸리티 함수를 포함합니다.
    *   `googleSearch(query, includeHtml)` 함수는 검색 결과를 가져와 처리하고, `{ query, resultText, retrievedAt }` 형태의 객체를 반환합니다.

*   🚇 **`src/transports/stdioTransport.js`**:
    *   `@modelcontextprotocol/sdk`의 `StdioServerTransport` 인스턴스를 생성하고 구성하는 팩토리 함수(`createStdioTransport`)를 제공합니다.

*   🪵 **`src/utils/logger.cjs`**:
    *   `winston` 라이브러리를 사용하여 설정 가능한 로깅 시스템을 구현합니다.
    *   콘솔과 순환 파일(`logs/app.log`, `exceptions.log`, `rejections.log`) 모두에 로깅을 지원합니다.

## 3. 🔧 MCP 도구 구현 (`googleSearchTool`)

### 3.1. 🛠️ `googleSearch` 도구 (`src/tools/googleSearchTool.js`)

*   🎯 **목적**: 사용자가 제공한 검색어(`query`)로 Google 웹 검색을 수행하고, HTML 태그 포함 여부(`includeHtml`)에 따라 처리된 결과를 반환합니다.
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
      "retrievedAt": "2024-01-01T12:00:00.000Z"
    }
    ```

## 4. ⚙️ 설정 관리

애플리케이션 설정은 `src/config/serviceConfig.js`에서 중앙 관리됩니다.
주요 설정은 `GOOGLE_SEARCH_BASE_URL`이며, 환경 변수를 통해 재정의할 수 있습니다.
실행 환경(`NODE_ENV`)도 환경 변수를 통해 설정 가능합니다. (자세한 내용은 [INSTALL.md](INSTALL.md) 참조)

## 5. 💪 SOLID 원칙 적용

서버는 SOLID 원칙을 준수하는 것을 목표로 합니다:

*   🎯 **단일 책임 원칙 (SRP)**: 각 모듈(`server.js`, `googleSearchTool.js`, `searchService.js`, `serviceConfig.js`, `logger.cjs`, `stdioTransport.js`)은 명확히 구분된 책임을 가집니다.
*   🧩 **개방/폐쇄 원칙 (OCP)**: 새로운 MCP 도구를 추가할 때 기존 `googleSearchTool.js`나 `server.js`의 핵심 로직을 크게 수정할 필요 없이 `src/tools/`에 새 파일을 추가하고 `src/tools/index.js`에 등록하는 방식으로 확장이 용이합니다.
*   🔗 **인터페이스 분리 원칙 (ISP)**: `googleSearch` 도구는 명확한 입력 스키마와 출력 형식을 정의하여 클라이언트에게 필요한 최소한의 인터페이스만 제공합니다.
*   🔌 **의존관계 역전 원칙 (DIP)**: `googleSearchTool.js`는 구체적인 `axios` 호출 대신 추상화된 `searchService.js`에 의존합니다. `logger.cjs`도 추상화된 로깅 인터페이스를 제공합니다.

## 6. ✨ 새로운 MCP 도구 추가 (예시)

1.  **서비스 로직 정의 (선택 사항, 권장):**
    *   새로운 비즈니스 로직이 필요하면 `src/services/`에 새 서비스 파일(예: `newFeatureService.js`)을 만들거나 기존 서비스에 함수를 추가합니다.
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
    import { googleSearchTool } from './googleSearchTool.js';
    import { myNewTool } from "./myNewTool.js"; // 새 도구 가져오기

    export const tools = [
      googleSearchTool,
      myNewTool, // 배열에 추가
    ];
    ```
4.  서버를 재시작하면 새 도구를 사용할 수 있습니다. (Stdio 방식에서는 재실행)

## 7. 🚀 실행 및 테스트

서버 실행 지침은 [INSTALL.md](INSTALL.md)를 참조하십시오. Stdio 기반이므로, 서버 실행 후 표준 입력을 통해 JSON 형식으로 MCP 요청을 전송하고 표준 출력을 통해 결과를 확인합니다.

**예시: `googleSearch` 도구 호출 (터미널에서 `request.json` 파일 사용)**

1.  `request.json` 파일 생성:
    ```json
    {
      "tool": "googleSearch",
      "inputs": {
        "query": "MCP SDK",
        "includeHtml": true
      },
      "id": "dev-manual-example-001"
    }
    ```
2.  서버 실행 및 요청 전달:
    ```bash
    npm start < request.json
    ```
    또는 개발 모드:
    ```bash
    npm run dev < request.json
    ```
    서버는 표준 출력으로 MCP 응답을 JSON 형태로 출력합니다.

테스트는 현재 스킵되었지만, 향후 `Jest`를 사용하여 단위 테스트 및 통합 테스트를 추가할 예정입니다.
테스트 실행 명령어 (구현 시): `npm test`

## 8. 💡 일반적인 문제 해결

*   **SDK 관련 오류:** `@modelcontextprotocol/sdk`의 특정 버전과 호환성 문제가 발생하거나, `McpServer`, `StdioServerTransport` 등의 API가 예상과 다를 경우, SDK 문서를 참조하거나 버전을 확인해야 합니다.
*   **JSON 입력 오류:** Stdio로 JSON 요청을 전달할 때, JSON 형식이 정확해야 합니다. 형식이 잘못된 경우 서버에서 파싱 오류가 발생할 수 있습니다.

## 9. 🌱 향후 개선 사항

*   **테스트 커버리지 확대:** Jest를 사용하여 단위 테스트 및 통합 테스트를 철저히 작성합니다.
*   **`cheerio`를 사용한 HTML 결과 세분화:** `searchService.js`의 `cleanHtml` 함수에서 `includeHtml=true`일 때, 전체 HTML 대신 특정 검색 결과 영역만 추출하는 로직을 `cheerio`를 사용하여 구현할 수 있습니다.
*   **Google Custom Search API 연동:** 현재는 Google 웹 페이지를 직접 스크레이핑하는 방식이므로 불안정할 수 있습니다. 안정적인 운영을 위해 Google Custom Search JSON API 또는 유사한 공식 API 사용을 고려할 수 있습니다. 이 경우 `serviceConfig.js`에 API 키 설정 등이 추가될 것입니다.
*   **더 정교한 오류 처리:** 사용자 정의 오류 클래스 및 세분화된 오류 코드를 도입하여 클라이언트에게 더 명확한 오류 정보를 제공할 수 있습니다.
*   **SDK API 호환성 보장:** `@modelcontextprotocol/sdk`의 공식 문서 및 버전에 맞춰 `McpServer` 초기화, 도구 등록, Transport 연결 등의 로직을 검증하고 필요시 수정합니다.

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

구글 등에서 자동화 탐지를 우회하기 위해 아래 패키지를 추가로 설치할 수 있습니다.

### 설치 명령어

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### 사용 목적
- puppeteer-extra: puppeteer를 확장하여 다양한 플러그인 적용 가능
- puppeteer-extra-plugin-stealth: 자동화 탐지(봇 차단) 우회 기능 제공
