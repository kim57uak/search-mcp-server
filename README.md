# MCP Google Search Server (Node.js)

Google 웹 검색 기능을 제공하는 모델 컨텍스트 프로토콜(MCP)을 구현한 Node.js 서버입니다. 이 프로젝트는 `@modelcontextprotocol/sdk`를 사용하여 MCP 호환 도구를 노출합니다.

## ✨ 주요 기능

- **Google 웹 검색 도구:**
  - 주어진 검색어에 대한 Google 검색을 수행합니다.
  - 검색 결과에서 HTML 태그를 포함하거나 제거하는 옵션을 제공합니다.
- **MCP 호환:** `@modelcontextprotocol/sdk`를 사용하여 MCP 표준을 따르는 도구를 제공합니다.
- **설정 가능:** `src/config/serviceConfig.js`를 통해 서비스 설정을 관리합니다.
- **구조화된 로깅:** `winston`을 활용하여 상세한 로그를 제공합니다.
- **SOLID 설계 원칙:** 유지보수성과 확장성을 고려하여 개발되었습니다.

## ⚙️ 모델 컨텍스트 프로토콜(MCP)에 대하여

모델 컨텍스트 프로토콜(MCP) SDK (`@modelcontextprotocol/sdk`)는 이 서버의 핵심 구성 요소입니다. 이 서버가 노출하는 도구를 정의하고 관리하기 위한 프레임워크와 유틸리티를 제공합니다.

MCP SDK는 `package.json` 파일에 프로젝트 종속성으로 나열되어 있으며, `npm install` 명령을 실행하면 자동으로 설치됩니다.

## 🚀 시작하기

서버 설정 및 실행을 시작하려면 **[INSTALL.md](INSTALL.md)**를 참조하십시오.

## 📄 개발자 문서

개발, 기여 가이드라인 및 프로젝트 아키텍처에 대한 자세한 정보는 **[DEVELOPER_MANUAL.ko.md](DEVELOPER_MANUAL.ko.md)**를 참조하십시오.

## 🛠️ 사용 가능한 MCP 도구

### 1. `googleSearch`

- **설명:** Google 웹 검색을 수행하고 결과를 반환합니다. HTML 태그 포함 여부를 선택할 수 있습니다.
- **입력 스키마 (`inputSchema`):**
  - `query` (string, 필수): 검색할 단어나 문장입니다.
  - `includeHtml` (boolean, 선택, 기본값: `false`): `true`로 설정하면 결과에 HTML 태그를 포함하고, `false`이면 제거된 텍스트만 반환합니다.
- **예상 출력 (`content` 필드 내 JSON 문자열):**
  ```json
  {
    "query": "검색어",
    "resultText": "검색 결과 내용 (HTML 포함 또는 제거됨)",
    "retrievedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
  }
  ```
- **호출 예시 (HTTP POST `/mcp`):**
  ```json
  {
    "tool": "googleSearch",
    "inputs": {
      "query": "Node.js MCP",
      "includeHtml": false
    }
  }
  ```

## 📦 프로젝트 구조

mcp-google-search-server/
├── logs/ # 로그 파일 (gitignored)
├── src/ # 소스 코드
│ ├── config/ # 설정 파일 (serviceConfig.js)
│ ├── server.js # 주 서버 초기화 및 HTTP 인터페이스
│ ├── tools/ # MCP 도구 정의 (googleSearchTool.js, index.js)
│ ├── services/ # 비즈니스 로직 모듈 (searchService.js)
│ └── utils/ # 유틸리티 함수 (logger.cjs)
├── tests/ # 테스트 코드 (현재 스킵됨)
├── .eslintrc.json # ESLint 설정
├── .gitignore
├── .prettierrc.json # Prettier 설정
├── DEVELOPER_MANUAL.ko.md
├── INSTALL.md
├── jest.config.js # Jest 설정
├── nodemon.json # Nodemon 설정
├── package.json
└── package-lock.json

```

```
