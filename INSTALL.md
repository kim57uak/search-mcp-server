# 설치 안내서 (MCP Google Search Server)

이 안내서는 MCP Google Search Server를 로컬 환경에 설치하고 실행하는 방법을 설명합니다.

## 사전 요구 사항

- [Node.js](https://nodejs.org/) (버전 18.x 이상 권장)
- [npm](https://www.npmjs.com/) (Node.js 설치 시 함께 설치됨)

## 설치 단계

1.  **프로젝트 클론 또는 다운로드:**

    만약 Git을 사용한다면, 다음 명령어로 프로젝트를 클론합니다:

    ```bash
    git clone <저장소_URL>
    cd mcp-google-search-server
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

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다. (포트 번호는 `PORT` 환경 변수로 변경 가능)

### 2. 프로덕션 모드로 실행

프로덕션 환경에서는 다음 명령어로 서버를 시작합니다:

```bash
npm start
```

## 서버 확인

서버가 성공적으로 실행되면, 웹 브라우저나 `curl`과 같은 도구를 사용하여 기본 엔드포인트에 접속하여 확인할 수 있습니다:

```bash
curl http://localhost:3000
```

응답으로 "MCP Google Search Server is running in development mode." (또는 production mode) 메시지가 표시되어야 합니다.

## MCP 도구 호출

서버의 MCP 도구는 HTTP POST 요청을 통해 `/mcp` 엔드포인트로 호출할 수 있습니다.

**예시: `googleSearch` 도구 호출 (`curl` 사용)**

```bash
curl -X POST -H "Content-Type: application/json" \
-d '{
  "tool": "googleSearch",
  "inputs": {
    "query": "날씨",
    "includeHtml": false
  }
}' \
http://localhost:3000/mcp
```

자세한 도구 사용법 및 요청/응답 형식은 [DEVELOPER_MANUAL.ko.md](DEVELOPER_MANUAL.ko.md)를 참조하십시오.

## 환경 변수 (선택 사항)

다음과 같은 환경 변수를 사용하여 서버 설정을 변경할 수 있습니다:

- `PORT`: 서버가 리슨할 포트 번호 (기본값: `3000`)
- `NODE_ENV`: 애플리케이션 환경 (`development` 또는 `production`, 기본값: `development`)
- `GOOGLE_SEARCH_BASE_URL`: Google 검색에 사용될 기본 URL (기본값: `https://www.google.com/search`)

환경 변수는 `.env` 파일을 프로젝트 루트에 생성하여 설정하거나, 서버 실행 시 직접 주입할 수 있습니다. (예: `PORT=4000 npm start`)
`.env` 파일은 `.gitignore`에 의해 버전 관리에서 제외됩니다.

```
# .env 예시
PORT=3001
NODE_ENV=development
```
