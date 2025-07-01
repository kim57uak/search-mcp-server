// src/utils/logger.cjs
const winston = require('winston');
const path = require('path');

// 로그 파일이 저장될 디렉토리 (프로젝트 루트의 logs 폴더)
const logDir = path.join(__dirname, '../../logs');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  let log = `${timestamp} ${level}: ${message}`;
  if (stack) {
    log = `${log}\n${stack}`;
  }
  return log;
});

const logger = winston.createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // 오류 발생 시 스택 트레이스 포함
    logFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
      level: 'info', // 콘솔에는 info 레벨 이상만 출력 (개발 시 debug로 변경 가능)
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: 'debug', // 파일에는 debug 레벨 이상 모두 기록
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      zippedArchive: true,
    }),
  ],
  exceptionHandlers: [
    // 처리되지 않은 예외 로깅
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    // 처리되지 않은 프로미스 거부 로깅
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
    }),
  ],
});

// 애플리케이션 종료 시 로거 스트림 닫기
process.on('exit', () => {
  logger.info('Logger is shutting down...');
  logger.end();
});

module.exports = logger;
