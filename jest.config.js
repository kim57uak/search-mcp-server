// jest.config.js
export default {
  transform: {}, // ES 모듈을 위해 기본 babel-jest 변환 비활성화
  testEnvironment: 'node',
  // moduleFileExtensions: ['js', 'json', 'node', 'cjs'], // 필요시 확장자 명시
  // collectCoverage: true, // 커버리지 리포트 생성 여부
  // coverageDirectory: "coverage",
  // coverageReporters: ["json", "lcov", "text", "clover"],
  // setupFilesAfterEnv: ['./jest.setup.js'], // 테스트 환경 설정 파일 (필요시)
  testPathIgnorePatterns: [
    "/node_modules/",
    "tests/tools/googleSearchTool.test.js",
    "tests/services/searchService.test.js"
  ]
};
