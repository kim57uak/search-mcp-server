import json
from typing import List, Dict, Optional, Any

class SearchEngine:
    def __init__(self, name: str, base_url: str, query_param: str, lang_param: Optional[str], supported_languages: List[str]):
        self.name = name
        self.base_url = base_url
        self.query_param = query_param
        self.lang_param = lang_param
        self.supported_languages = supported_languages

    def build_query_url(self, query: str, language: Optional[str] = None) -> str:
        """
        Builds the full query URL for this search engine.
        """
        params = {self.query_param: query}
        if language and self.lang_param and language in self.supported_languages:
            params[self.lang_param] = language

        # Basic URL encoding for query parameters (can be enhanced)
        import urllib.parse
        query_string = urllib.parse.urlencode(params)
        return f"{self.base_url}?{query_string}"

class SearchEngineManager:
    def __init__(self, config_path: str = "search_engines.json"):
        self.config_path = config_path
        self.engines: List[SearchEngine] = []
        self._load_engines()

    def _load_engines(self):
        """
        Loads search engine configurations from the JSON file.
        """
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)

            for engine_data in config_data.get("engines", []):
                engine = SearchEngine(
                    name=engine_data["name"],
                    base_url=engine_data["base_url"],
                    query_param=engine_data["query_param"],
                    lang_param=engine_data.get("lang_param"), # Optional
                    supported_languages=engine_data.get("supported_languages", [])
                )
                self.engines.append(engine)
        except FileNotFoundError:
            print(f"Error: Configuration file '{self.config_path}' not found.")
            # Potentially raise an exception or handle this more gracefully
        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from '{self.config_path}'.")
        except KeyError as e:
            print(f"Error: Missing expected key {e} in an engine configuration in '{self.config_path}'.")


    def get_all_engines(self) -> List[SearchEngine]:
        """
        Returns a list of all loaded search engines.
        """
        return self.engines

    def get_engines_by_language(self, language: str) -> List[SearchEngine]:
        """
        Returns a list of search engines that support the given language.
        """
        return [engine for engine in self.engines if language in engine.supported_languages]

    def get_engine_by_name(self, name: str) -> Optional[SearchEngine]:
        """
        Returns a search engine by its name.
        """
        for engine in self.engines:
            if engine.name.lower() == name.lower():
                return engine
        return None

if __name__ == '__main__':
    # Example Usage:
    manager = SearchEngineManager()

    print("All loaded engines:")
    for eng in manager.get_all_engines():
        print(f"- {eng.name} (Supports: {', '.join(eng.supported_languages)})")
        print(f"  Example query for 'hello world' in English: {eng.build_query_url('hello world', 'en')}")
        if 'ko' in eng.supported_languages:
            print(f"  Example query for '안녕하세요' in Korean: {eng.build_query_url('안녕하세요', 'ko')}")

    print("\nEngines supporting 'ko':")
    for eng in manager.get_engines_by_language('ko'):
        print(f"- {eng.name}")

    google_engine = manager.get_engine_by_name("Google")
    if google_engine:
        print(f"\nGoogle engine found. Example query for 'test': {google_engine.build_query_url('test')}")

    # Test with a non-existent file
    # manager_ne = SearchEngineManager(config_path="non_existent_config.json")
    # print(f"Number of engines loaded (non-existent config): {len(manager_ne.get_all_engines())}")

    # Test with a malformed json (manual test needed or mock file)
    # Create a dummy malformed_search_engines.json for testing:
    # with open("malformed_search_engines.json", "w") as f:
    #     f.write("{engines: [}") # Invalid JSON
    # manager_malformed = SearchEngineManager(config_path="malformed_search_engines.json")
    # print(f"Number of engines loaded (malformed config): {len(manager_malformed.get_all_engines())}")
    # import os
    # os.remove("malformed_search_engines.json") # Clean up

    # Test with missing key in config (manual test needed or mock file)
    # Create a dummy missingkey_search_engines.json for testing:
    # with open("missingkey_search_engines.json", "w") as f:
    #    f.write("""
    #    {
    #      "engines": [
    #        {
    #          "base_url": "https://www.google.com/search",
    #          "query_param": "q"
    #        }
    #      ]
    #    }
    #    """) # Missing "name"
    # manager_missingkey = SearchEngineManager(config_path="missingkey_search_engines.json")
    # print(f"Number of engines loaded (missing key config): {len(manager_missingkey.get_all_engines())}")
    # import os
    # os.remove("missingkey_search_engines.json") # Clean up
