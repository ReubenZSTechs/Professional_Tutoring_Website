"""Thin wrapper around the Google Gen AI SDK.

The rest of the backend talks to `GeminiClient` only, so swapping the
provider or the SDK version means editing this one file.
"""

import json
from collections.abc import AsyncIterator
from typing import Any

from core.config import Settings, get_settings
from google import genai
from google.genai import types

# Ask Gemini to refuse harmful content as well. Medium-and-above is the
# strictest setting that does not block ordinary tutoring questions.
SAFETY_SETTINGS = [
    types.SafetySetting(category=category, threshold="BLOCK_MEDIUM_AND_ABOVE")
    for category in (
        "HARM_CATEGORY_HARASSMENT",
        "HARM_CATEGORY_HATE_SPEECH",
        "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "HARM_CATEGORY_DANGEROUS_CONTENT",
    )
]


def _visible_text(chunk: types.GenerateContentResponse) -> str:
    """Text parts of a streamed chunk, never the model's thinking parts."""
    pieces: list[str] = []
    for candidate in chunk.candidates or []:
        content = candidate.content
        for part in (content.parts if content else None) or []:
            if getattr(part, "thought", False):
                continue
            if part.text:
                pieces.append(part.text)
    return "".join(pieces)


def is_quota_error(error: BaseException) -> bool:
    """True for 'too many requests' / quota responses from the API."""
    text = str(error)
    return getattr(error, "code", None) == 429 or "429" in text[:40] or "RESOURCE_EXHAUSTED" in text


class GeminiClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._client: genai.Client | None = None

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            if not self.settings.gemini_ready:
                raise RuntimeError("GEMINI_API_KEY is not set.")
            self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client

    async def generate(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.3,
        max_output_tokens: int = 1024,
    ) -> str:
        response = await self.client.aio.models.generate_content(
            model=model or self.settings.gemini_chat_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                safety_settings=SAFETY_SETTINGS,
            ),
        )
        return (response.text or "").strip()

    async def generate_json(
        self,
        prompt: str,
        *,
        schema: dict[str, Any],
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        """Ask for a JSON object that follows `schema` (a JSON Schema dict)."""
        response = await self.client.aio.models.generate_content(
            model=model or self.settings.gemini_rewrite_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=temperature,
                response_mime_type="application/json",
                response_json_schema=schema,
                safety_settings=SAFETY_SETTINGS,
            ),
        )
        return json.loads(response.text or "{}")

    async def stream(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.4,
        max_output_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        """Yield the answer piece by piece as the model writes it."""
        stream = await self.client.aio.models.generate_content_stream(
            model=model or self.settings.gemini_chat_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                safety_settings=SAFETY_SETTINGS,
                thinking_config=types.ThinkingConfig(include_thoughts=False),
            ),
        )
        async for chunk in stream:
            yield_text = _visible_text(chunk)
            if yield_text:
                yield yield_text

    async def embed(self, texts: list[str], *, task_type: str | None = None) -> list[list[float]]:
        """Embed a batch of texts. `task_type` is only sent to models that accept it."""
        config = types.EmbedContentConfig(
            output_dimensionality=self.settings.embed_dimensions,
            task_type=task_type,
        )
        response = await self.client.aio.models.embed_content(
            model=self.settings.gemini_embed_model,
            contents=texts,
            config=config,
        )
        return [list(e.values or []) for e in response.embeddings or []]
