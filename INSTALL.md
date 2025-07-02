# 설치 안내서 (MCP Naver Search Server)

이 안내서는 MCP Naver Search Server를 로컬 환경에 설치하고 실행하는 방법을 설명합니다.

## 사전 요구 사항

*   [Node.js](https://nodejs.org/) (버전 18.x 이상 권장)
*   [npm](https://www.npmjs.com/) (Node.js 설치 시 함께 설치됨)

## 설치 단계

1.  **프로젝트 클론 또는 다운로드:**

    만약 Git을 사용한다면, 다음 명령어로 프로젝트를 클론합니다:
    ```bash
    git clone <저장소_URL>
    cd mcp-naver-search-server
    ```
    또는 프로젝트 소스 코드를 다운로드하고 압축을 해제합니다.

2.  **의존성 설치:**

    프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 필요한 모든 의존성을 설치합니다:
    ```bash
    npm install
    ```
    이 과정에서 `@modelcontextprotocol/sdk`를 포함한 모든 패키지가 `node_modules` 디렉토리에 설치됩니다.

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

서버가 성공적으로 실행되면, 다음과 같은 로그 메시지가 콘솔에 출력됩니다:
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
```json
{
  "id": "request-123",
  "tool": "naverSearch",
  "status": "error",
  "error": { "message": "오류 메시지", "code": "오류_코드" }
}
```

자세한 도구 사용법 및 요청/응답 형식은 [DEVELOPER_MANUAL.ko.md](DEVELOPER_MANUAL.ko.md)를 참조하십시오.

## 환경 변수 (선택 사항)

다음과 같은 환경 변수를 사용하여 서버 설정을 변경할 수 있습니다:

*   `NODE_ENV`: 애플리케이션 환경 (`development` 또는 `production`, 기본값: `development`)
*   `NAVER_SEARCH_BASE_URL`: Naver 검색에 사용될 기본 URL (기본값: `https://search.naver.com/search.naver?query=`) // 실제 값은 serviceConfig.js 참조

환경 변수는 `.env` 파일을 프로젝트 루트에 생성하여 설정하거나, 서버 실행 시 직접 주입할 수 있습니다. (예: `NODE_ENV=production npm start`)
`.env` 파일은 `.gitignore`에 의해 버전 관리에서 제외됩니다.
```
# .env 예시
NODE_ENV=production
NAVER_SEARCH_BASE_URL=https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=
```

# Puppeteer 설치 방법 추가

Naver 검색 결과를 실제 브라우저 환경에서 받아오기 위해 puppeteer를 사용합니다.

## 설치 명령어

```bash
npm install puppeteer
```

## 참고 사항
- puppeteer는 크롬 브라우저를 자동으로 다운로드하므로, 설치 시 다소 시간이 걸릴 수 있습니다.
- 설치 후에는 코드에서 `import puppeteer from 'puppeteer'` 또는 `const puppeteer = require('puppeteer')`로 사용할 수 있습니다.
- 서버 환경에 따라 headless 모드로 실행하는 것이 권장됩니다.

## puppeteer-core 사용 시 주의사항

- puppeteer-core는 크롬 브라우저를 자동 설치하지 않습니다.
- 반드시 로컬에 크롬(Chrome) 브라우저가 설치되어 있어야 하며, 실행 경로를 직접 지정해야 합니다.
- Mac 예시: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Windows 예시: `C:/Program Files/Google/Chrome/Application/chrome.exe`
- launch 옵션 예시:

```js
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac
  headless: true
});
```

## puppeteer-extra 및 stealth 플러그인 설치

Naver 등에서 자동화 탐지를 우회하기 위해 아래 패키지를 추가로 설치할 수 있습니다.

### 설치 명령어

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### 사용 목적
- puppeteer-extra: puppeteer를 확장하여 다양한 플러그인 적용 가능
- puppeteer-extra-plugin-stealth: 자동화 탐지(봇 차단) 우회 기능 제공

## cheerio 설치 및 사용 목적

HTML에서 script/style 등 불필요한 태그와 자바스크립트 코드를 완전히 제거하기 위해 cheerio를 사용합니다.

### 설치 명령어

```bash
npm install cheerio
```

### 사용 목적
- cheerio: HTML 파싱 및 특정 태그(script, style 등) 전체 삭제 가능
- 검색 결과에서 불필요한 코드, 광고, 스크립트 등을 깔끔하게 제거할 수 있음
