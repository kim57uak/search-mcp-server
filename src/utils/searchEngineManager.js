import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.cjs'; // logger.cjs 경로가 맞는지 확인 필요 (현재 위치 기준)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SearchEngine {
    constructor(name, baseUrl, queryParam, langParam, supportedLanguages) {
        this.name = name;
        this.base_url = baseUrl;
        this.query_param = queryParam;
        this.lang_param = langParam;
        this.supported_languages = supportedLanguages;
    }

    build_query_url(query, language = null) {
        const params = new URLSearchParams();
        params.append(this.query_param, query);
        if (language && this.lang_param && this.supported_languages.includes(language)) {
            params.append(this.lang_param, language);
        }
        const separator = this.base_url.includes('?') ? '&' : '?';
        return `${this.base_url}${separator}${params.toString()}`;
    }
}

export class SearchEngineManager {
    constructor(configPath = "search_engines.json") {
        // configPath가 절대 경로가 아닐 경우, 프로젝트 루트를 기준으로 경로를 설정합니다.
        // __dirname은 현재 파일(src/utils)의 디렉토리이므로, 프로젝트 루트로 가려면 '../..'를 사용합니다.
        const resolvedConfigPath = path.isAbsolute(configPath) ? configPath : path.resolve(__dirname, '..', '..', configPath);
        this.configPath = resolvedConfigPath;
        this.engines = [];
        this._load_engines();
    }

    _load_engines() {
        try {
            // logger 사용 전에 logger가 초기화되었는지, 경로가 올바른지 확인해야 합니다.
            // 이 파일은 utils 내에 있으므로, logger.cjs의 상대 경로는 './logger.cjs'가 될 수 있습니다.
            // 또는 절대 경로를 사용하거나, logger 인스턴스를 주입받는 방식을 고려할 수 있습니다.
            // 여기서는 logger가 정상적으로 임포트되었다고 가정합니다.
            if (!fs.existsSync(this.configPath)) {
                logger.error(`[SearchEngineManager] Configuration file not found at '${this.configPath}'. Please ensure 'search_engines.json' exists in the project root.`);
                this.engines = []; // 엔진 로드 실패 시 빈 배열로 유지
                return;
            }
            const rawData = fs.readFileSync(this.configPath, 'utf-8');
            const config_data = JSON.parse(rawData);

            this.engines = (config_data.engines || []).map(engineData => new SearchEngine(
                engineData.name,
                engineData.base_url,
                engineData.query_param,
                engineData.lang_param, // 이 필드는 없을 수 있음
                engineData.supported_languages || []
            ));
            logger.info(`[SearchEngineManager] Successfully loaded ${this.engines.length} search engines from '${this.configPath}'.`);
        } catch (error) {
            logger.error(`[SearchEngineManager] Error loading or parsing '${this.configPath}': ${error.message}`, { stack: error.stack });
            this.engines = []; // 오류 발생 시에도 빈 배열로 초기화
        }
    }

    get_all_engines() {
        return this.engines;
    }

    get_engines_by_language(language) {
        return this.engines.filter(engine => engine.supported_languages.includes(language));
    }

    get_engine_by_name(name) {
        return this.engines.find(engine => engine.name.toLowerCase() === name.toLowerCase()) || null;
    }
}

// 기본 인스턴스를 export 하여 싱글톤처럼 사용 가능 (선택 사항)
// export default new SearchEngineManager();
