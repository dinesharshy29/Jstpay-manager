import json
import os
from typing import Any
from urllib import error, request


class OpenRouterError(RuntimeError):
    pass


class OpenRouterProvider:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.model = os.getenv("OPENROUTER_MODEL", "")
        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.model)

    def chat(self, *, messages: list[dict[str, str]]) -> str:
        if not self.is_configured():
            raise OpenRouterError("OpenRouter is not configured. Set OPENROUTER_API_KEY and OPENROUTER_MODEL.")
        payload = json.dumps({"model": self.model, "messages": messages, "max_tokens": 700, "temperature": 0.2}).encode()
        http_request = request.Request(
            f"{self.base_url}/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "http://localhost:3000"),
                "X-Title": "AI Risk Manager",
            },
            method="POST",
        )
        try:
            with request.urlopen(http_request, timeout=30) as response:
                result: dict[str, Any] = json.loads(response.read())
        except error.HTTPError as exc:
            raise OpenRouterError("OpenRouter rejected the assistant request.") from exc
        except (error.URLError, TimeoutError) as exc:
            raise OpenRouterError("OpenRouter is unavailable right now.") from exc
        try:
            return str(result["choices"][0]["message"]["content"])
        except (KeyError, IndexError, TypeError) as exc:
            raise OpenRouterError("OpenRouter returned an invalid assistant response.") from exc
