def s1_prompt(text: str) -> str:
    return f"""
You are compressing a privacy policy into key points.

Return ONLY valid JSON in this exact format:

{{
  "main_points": ["point 1", "point 2"]
}}

IMPORTANT:
- Do NOT return any other fields
- Do NOT rename keys
- ONLY "main_points" is allowed

IGNORE:
- legal boilerplate
- definitions
- repeated text

FOCUS:
- data collection
- tracking
- data sharing
- retention
- user rights
- feature-specific rules

RULES:
- Return bullet points only
- Each point max 20 words
- No explanations
- No grouping
- No repetition
- Only explicit facts

Text:
{text}
"""


def s2_prompt(points: list[str]) -> str:
    return f"""
You are generating user-facing privacy insights for OpenFlag.

Input: key points extracted from a privacy policy.

Your job:
Convert them into structured insights for users.

------------------------

Return ONLY valid JSON:

{{
  "quick_take": "...",
  "what_matters": [],
  "flags": [],
  "verdict": "...",
  "data_flow": [],
  "feature_policies": []
}}

------------------------

Definitions:

1. quick_take:
- 1-2 lines
- must mention data collection + sharing

2. what_matters:
- 4-6 most important insights
- simple and clear

3. flags:
- potential risks (neutral phrasing)
- short phrases

4. verdict:
Choose ONE:
- "Safe"
- "Use with caution"
- "High risk"

5. data_flow:
- where data goes (internal, partners, ads)

6. feature_policies:
- feature-specific differences if mentioned

------------------------

RULES:

- Only use given points
- Do NOT invent new facts
- Keep everything concise
- No repetition

------------------------

Points:
{points}
"""


def s3_prompt(stage2: dict) -> str:
    return f"""
You are evaluating privacy risk for a software product.

Input contains structured privacy insights.

Your job:
Classify risks and identify practices.

------------------------

Return ONLY JSON:

{{
  "red_flags": [],
  "yellow_flags": [],
  "green_flags": [],
  "best_practices": [],
  "bad_practices": [],
  "risk_score": 0
}}

------------------------

Definitions:

RED FLAGS (high risk):
- shares data with advertisers
- collects sensitive data (location, financial, contacts)
- unclear or excessive tracking

YELLOW FLAGS (concerns):
- vague retention
- broad data collection
- unclear wording

GREEN FLAGS (good):
- allows deletion
- allows opt-out
- transparent usage

------------------------

BEST PRACTICES:
- user control
- minimal data collection
- transparency

BAD PRACTICES:
- excessive tracking
- sharing without clarity
- vague retention

------------------------

RULES:

- Use ONLY provided data
- Do NOT invent
- Keep phrases short
- Max 5 items per category
- risk_score must be 0-10 integer

------------------------

Input:
{stage2}
"""
