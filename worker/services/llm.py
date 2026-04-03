import time
from typing import Type, TypeVar, Optional

from openai import OpenAI
from pydantic import BaseModel

from config import config
from utils.logger import get_logger


T = TypeVar("T", bound=BaseModel)


DEFAULT_SYSTEM_PROMPT = """
You are a strict data extraction engine.

Your job:
- Extract structured information from legal/privacy text.
- Be precise and factual.
- Do NOT hallucinate or assume.
- If information is missing, return empty values.

Rules:
- Return ONLY valid JSON.
- No explanations, no markdown, no extra text.
- Follow the schema exactly.
- Keep answers concise and clear.

Return ALL fields as arrays of short bullet points.
Even if only one item exists, return it as a list.
"""


class LLMClient:
    def __init__(self):
        self.client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url="https://openrouter.ai/api/v1",
        )
        self.model = config.MODEL
        self.logger = get_logger()

    def structured_completion(
        self,
        prompt: str,
        schema: Type[T],
        use_schema: bool = config.SUPPORT_JSON,
        system_prompt: Optional[str] = None,
        max_retries: int = 3,
    ) -> T:
        system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT

        last_error = None

        for attempt in range(max_retries):
            try:
                self.logger.info(f"[LLM] Attempt {attempt + 1} | schema={use_schema}")

                if use_schema:
                    return self._structured_call(prompt, schema, system_prompt)

                return self._fallback_call(prompt, schema, system_prompt)

            except Exception as e:
                last_error = e

                self.logger.warning(f"[LLM] Attempt {attempt + 1} failed: {e}")

                time.sleep(1 * (attempt + 1))

                # fallback after first failure
                if attempt == 0:
                    use_schema = False

        raise RuntimeError(f"[LLM] All retries failed: {last_error}")

    def _structured_call(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: str,
    ) -> T:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "response_schema",
                    "strict": True,
                    "schema": schema.model_json_schema(),
                },
            },
            temperature=0,
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Empty response (structured)")

        return schema.model_validate_json(content)

    def _fallback_call(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: str,
    ) -> T:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"""
{prompt}

Return JSON strictly matching this schema:
{schema.model_json_schema()}
""",
                },
            ],
            temperature=0,
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Empty response (fallback)")

        content = content.strip()

        return self._safe_parse(schema, content)

    def _safe_parse(self, schema: Type[T], content: str) -> T:
        try:
            return schema.model_validate_json(content)
        except Exception:
            self.logger.warning("[LLM] Direct parse failed, attempting cleanup")

            start = content.find("{")
            end = content.rfind("}") + 1

            if start == -1 or end == -1:
                raise ValueError("No valid JSON found in response")

            cleaned = content[start:end]

            return schema.model_validate_json(cleaned)
