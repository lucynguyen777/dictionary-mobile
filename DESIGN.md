# Dictionary Mobile Design System

Dictionary Mobile uses a minimal, expressive futuristic interface for fast lookup, reading, saving, and review. The UI should feel calm enough for long reading sessions, but responsive and alive around controls, feedback, loading states, and high-value actions.

## Principles

- **Content first**: every screen should foreground the word, document, folder, flashcard, or setting the user came to handle. Decorative UI must not compete with reading or lookup content.
- **Hick's law**: reduce choices at each decision point. Use progressive disclosure for language menus, import settings, folder actions, Reader settings, and provider-gated features.
- **Fitts's law**: primary touch targets should be easy to hit. Icon buttons should be at least 40px square, high-frequency actions should sit close to their supporting content, and destructive/secondary actions should not be visually stronger than the main action.
- **Familiarity**: use standard icons and patterns for search, settings, save, import, export, play, audio, table of contents, and navigation. Prefer lucide/Ionicons-style simple symbols already used in the app.
- **Proximity**: related controls should be grouped together. Use tighter spacing inside controls, moderate spacing between groups, and larger spacing between sections.
- **Similarity**: elements with the same role must look alike. Badges, disabled future features, cards, list rows, icon buttons, and primary CTAs should share consistent shape/color/spacing.
- **Progressive disclosure**: advanced controls belong in menus/sheets. Reader appearance/audio settings, folder actions, provider-gated actions, and language lists should not overwhelm the first view.

## Layout And Spacing Laws

- Use a **4px grid**. Token values should be multiples of 4.
- Minimum gap between visible elements is **6px**; prefer **8px** for grouped controls. Avoid group gaps above **10px** unless the group is becoming a new section.
- Atomic spacing order:
  - wrappers: 20-30px, with 20px as the usual mobile default;
  - sections: 16-24px;
  - groups: 8-12px;
  - elements: 4-8px.
- Page sections should be full-width bands or unframed layouts. Avoid cards inside cards.
- Fixed-format controls, boards, tab bars, toolbars, counters, and tiles must have stable dimensions so hover/press/loading states do not shift layout.

## Buttons And Controls

- Each section should have **one primary CTA per section**. Other actions should be secondary, ghost, icon-only, or placed in a menu.
- Button padding must be at least **12px horizontal / 8px vertical**. When space is tight, horizontal padding should still be roughly double vertical padding.
- Use less rounding for standard buttons: 6-12px. Full pills are for badges, avatars, small segmented controls, and circular icon buttons.
- Radius law: when nesting rounded surfaces, `inner radius + wrapper padding = outer radius`; radius should be smaller than padding.
- Buttons should sit near supporting content but have a little more margin than normal item gaps.
- Disabled/future-version controls use muted opacity, muted border/background, and explicit copy like `Cập nhật trong phiên bản sau`.

## Color And Dark Mode

- Use `constants/theme.ts` tokens, not hard-coded screen colors, for app chrome and shared surfaces.
- Backgrounds should be light/soft in light mode and layered but quiet in dark mode. Use subtle canvas/elevated differences rather than harsh black/white jumps.
- Primary accent is controlled futuristic purple; secondary signal is cyan. Use these for CTA, active state, focus, selected tabs, and small energetic highlights only.
- Do not let dark mode contain white cards, black-on-dark text, or light-mode borders. Every touched surface must use theme-aware canvas, text, border, status, and shadow tokens.
- Status colors must remain semantic: success, warning, error, info. Do not use accent purple for error or destructive states.

## Typography

- Use simple system typefaces through `Fonts`. Do not introduce decorative fonts for app UI.
- Do not scale font size with viewport width. Keep letter spacing at `0` unless an existing caption token explicitly needs uppercase tracking.
- Reader content may use user-selected reading fonts; app chrome around Reader still follows the design system.
- Reserve large display text for true hero moments. Compact panels, cards, and tool surfaces use smaller, tighter headings.

## Style Guide

- Colors, typography, icons, logo usage, illustrations, and brand voice should be documented here before a pattern becomes reusable.
- Icons should be simple, consistent, memorable, and recognizable. Prefer the existing Ionicons set before introducing another icon language.
- Illustrations and decorative imagery should support comprehension or mood without reducing scan speed.
- Brand tone is calm, capable, local-first, and learning-focused; avoid marketing copy inside functional app screens.

## Shadow And Depth

- No inner shadows.
- Shadows mimic real-world light. Elements closer to the user may have stronger and more defined shadows.
- If blur increases, opacity must decrease. Keep shadows neutral, never saturated purple/blue as the main depth cue.
- Default cards are mostly border-based. Use stronger elevation for dropdowns, sheets, modals, FABs, and temporary overlays.

## Motion And Microinteraction

- Motion is expressive futuristic, but functional. It should communicate state, hierarchy, completion, loading, or direct manipulation.
- Response feedback should feel instant. Press/hover microinteractions should run around 96-160ms. Screen/section entrance should stay under 240ms. Functional UI motion must stay under 400ms.
- Always support reduced motion: decorative background motion and entrance staggering must disable or become a simple fade.
- Hover is for Expo web only and must not change layout. Use border glow, slight lift, opacity, or scale.
- Press feedback may use scale/opacity. Do not create custom cursors.
- Loading rules:
  - under 300-400ms: subtle inline feedback is enough;
  - longer than that: use skeleton/pulse/progress;
  - long imports, backend, sync, OCR, or AI calls need explicit progress/error copy.
- Background animation can exist on Home/Word hero chrome only. Never animate behind Reader text or dense settings content.

## Pattern Library

- **Screen wrapper**: `Screen` provides theme-aware canvas and safe-area behavior.
- **Surface**: use for cards, panels, dropdowns, sheets, modals, and elevated app chrome.
- **AppButton**: use for primary/secondary/ghost/icon actions with consistent target size and press/hover behavior.
- **MotionPressable**: use for cards, icon buttons, FABs, and chips that need consistent microinteraction.
- **SkeletonBlock / LoadingPulse**: use for lookup/profile/library loading states where content shape is known.
- **Templates**:
  - Lookup: search surface, language disclosure, word header, sticky tabs, content pager.
  - Reader: calm content surface, bottom progress/control dock, settings/TOC sheets.
  - Library: search/filter toolbar, folder grid/list, single fixed add action, action sheet.
  - Profile: guest/signed-in hero, local stats, settings drawer, privacy/support sections.
  - Training: tool list to detail flow, one active tool surface at a time.

## Process

- Before UI work, check `docs/product-progress.md` and this file.
- For each touched screen, verify light and dark mode, mobile and desktop web, no overlap, no text overflow, reachable handlers, and no fake-production provider controls.
- Prefer token/primitives changes over one-off styling.
- Use CodeGraph as optional local audit tooling: `npx --yes @colbymchenry/codegraph status .`, `query`, `impact`, and `affected`. Keep `.codegraph/` ignored and out of commits.
- Before release, run the verification ladder from `docs/testing-and-build-guide.md`, commit, push, deploy, and smoke test production.
