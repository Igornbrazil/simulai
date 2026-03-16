from typing import Optional
import httpx
import json


class LLMProvider:
    def __init__(self, provider: str, model: str, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.provider = provider
        self.model = model
        self.api_key = api_key
        self.base_url = base_url or "http://host.docker.internal:11434"

    async def complete(self, system: str, user: str) -> str:
        if self.provider == "ollama":
            return await self._ollama(system, user)
        elif self.provider == "openai":
            return await self._openai(system, user)
        elif self.provider == "anthropic":
            return await self._anthropic(system, user)
        elif self.provider == "gemini":
            return await self._gemini(system, user)
        else:
            raise ValueError(f"Provider '{self.provider}' not supported")

    async def _ollama(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "stream": False,
                }
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    async def _openai(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                }
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def _anthropic(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": 1024,
                    "system": system,
                    "messages": [{"role": "user", "content": user}],
                }
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]

    async def _gemini(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}",
                json={
                    "contents": [{"parts": [{"text": f"{system}\n\n{user}"}]}]
                }
            )
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
