# UI UX Guidelines

## General
The app should feel clean, local-first, and learning-focused.

Use `DESIGN.md` as the visual reference source, but adapt it to Dictionary Mobile's app surfaces. Do not copy marketing-page hero layouts, decorative mesh/wire motifs, pricing tables, or homepage composition into functional app screens.

## Design Reference Adaptation
- Prefer warm neutral backgrounds and surfaces: canvas white, soft off-white, warm hairline borders, and readable charcoal/slate text.
- Use purple as the dominant primary action color. Do not use purple for body text, large background surfaces, or every secondary action.
- Use link-blue only for inline links or quiet secondary text actions; keep it distinct from primary purple.
- Use 8px radius for buttons, inputs, compact controls, and action rows.
- Use 12px radius for cards, panels, and larger grouped sections.
- Use fully rounded shapes only for badges, status pills, small icon wells, avatars, and segmented/pill tabs.
- Use pastel tints for feature, summary, or status cards when they clarify category or priority; avoid one-note palettes.
- Keep shadows subtle on normal app cards; reserve heavy shadows for modals/sheets only when needed.
- Typography should feel editorial and readable: system/Inter-like fonts, moderate weights, no negative letter spacing in app UI.

## Copy
Use consistent Vietnamese UI copy.

Avoid mixing English and Vietnamese unless the English term is a product label, language name, file format, or technical term.

## Layout
Must work on:
- mobile
- Expo web

Functional screens should prioritize scanability and repeated use over marketing drama. Keep controls close to the content they affect, and avoid turning settings or data-management screens into landing pages.

Avoid:
- overlapping toolbar/menu/FAB
- text overflow
- hidden destructive actions
- unclear disabled states

## States
Every major screen or panel should consider:
- empty state
- loading state
- error state
- success state
- disabled/coming soon state

## UI Refactor Safety
When changing UI only, do not remove or hide already-built behavior.

Before marking a UI refactor done:
- list the previous actions on the touched screen
- confirm every previous action is still reachable
- confirm drawer/modal sections still open
- confirm destructive actions still have confirmations
- confirm blocked features remain visibly blocked, not fake-functional
- smoke on narrow mobile and Expo web
- run static verification

## Blocked Features
Blocked features should be clearly marked.

Examples:
- "Sắp có"
- "Cần đăng nhập"
- "Cần kết nối Google Sheets"
- "Cần chọn backend trước"

Do not make blocked features look functional.

## Destructive Actions
Use clear confirmation for:
- delete folder
- reset local data
- delete account placeholder
- remove saved words

## Import/Export UX
Import should show preview before final action.

Export should show:
- available formats
- disabled formats
- success/failure status
