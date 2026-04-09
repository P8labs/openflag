## UI Refactor Rules

When changing UI in this repository, follow the design system below.

- Use only semantic tokens from `src/app/globals.css` or HeroUI theme tokens.
- Do not hardcode hex, RGB, oklch, or arbitrary Tailwind values inside components.
- Do not use arbitrary Tailwind classes for radius, color, shadow, spacing, or blur.
- Keep the radius system strict and small. Prefer `rounded-xs` everywhere.
- Keep surfaces flat. Prefer no shadow or only the lightest standard shadow.
- Use the neutral background, muted secondary text, and one restrained accent only.
- Prefer tokenized utility classes such as `ui-panel`, `ui-input`, `ui-button-primary`, and `ui-button-ghost` over ad hoc styling.
- If a visual treatment cannot be expressed with existing tokens, add a token first and then consume it everywhere.

The goal is calm, minimal, and consistent UI. Decoration that does not improve focus or action should be removed.
