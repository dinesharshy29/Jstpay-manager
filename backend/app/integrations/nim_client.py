import json
import os
from collections.abc import Iterator
from urllib import error, request


class NIMError(RuntimeError):
    pass


class NVIDIAProvider:
    def __init__(self) -> None:
        self.api_key = os.getenv("NVIDIA_NIM_API_KEY", "")
        self.base_url = os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
        self.model = os.getenv("NVIDIA_NIM_MODEL", "")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.model)

    def stream(self, messages: list[dict[str, str]]) -> Iterator[str]:
        if not self.is_configured():
            raise NIMError("NVIDIA NIM is not configured. Set NVIDIA_NIM_API_KEY and NVIDIA_NIM_MODEL on the backend.")
        payload = json.dumps({
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "top_p": 0.95,
            "max_tokens": 1200,
            "stream": True,
        }).encode()
        http_request = request.Request(
            f"{self.base_url}/chat/completions",
            data=payload,
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(http_request, timeout=60) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8").strip()
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        delta = json.loads(data).get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content")
                        if content:
                            yield str(content)
                    except (ValueError, IndexError, TypeError, AttributeError):
                        continue
        except error.HTTPError as exc:
            if exc.code == 401:
                raise NIMError("NVIDIA NIM rejected the backend credentials.") from exc
            if exc.code == 404:
                raise NIMError("The configured NVIDIA NIM model was not found.") from exc
            if exc.code == 429:
                raise NIMError("NVIDIA NIM rate limit reached. Please try again shortly.") from exc
            raise NIMError("NVIDIA NIM is temporarily unavailable.") from exc
        except (error.URLError, TimeoutError) as exc:
            raise NIMError("NVIDIA NIM could not be reached before the timeout.") from exc

    def health(self) -> dict[str, object]:
        if not self.is_configured():
            return {"status": "offline", "configured": False}
        http_request = request.Request(f"{self.base_url}/models", headers={"Authorization": f"Bearer {self.api_key}"})
        try:
            with request.urlopen(http_request, timeout=8) as response:
                payload = json.loads(response.read())
            model_ids = [item.get("id") for item in payload.get("data", [])]
            return {"status": "ready" if self.model in model_ids else "degraded", "configured": True, "model_available": self.model in model_ids}
        except Exception:
            return {"status": "degraded", "configured": True, "model_available": None}
