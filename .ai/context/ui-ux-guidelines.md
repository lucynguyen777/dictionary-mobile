# UI UX Guidelines

## Product Feel
The app should feel clean, local-first, study-focused, and practical. It is a working learning tool, not a marketing site.

## Copy
- Use consistent Vietnamese UI copy.
- Keep English when it is a language name, file format, technical term, or established product label.
- Keep blocked feature copy honest, for example `Sắp có`, `Cần chọn backend`, or `Cần kết nối Google Sheets`.

## Layout
Must work on:
- portrait mobile
- Expo web

For changed user-facing screens, verify the layout with app testing from `.ai/skills/app-feature-testing.md`. Browser-based Expo web checks and temporary screenshots under `tmp/app-testing/` are allowed when they help compare mobile and desktop states.

Avoid:
- toolbar/menu/FAB overlap
- text overflow
- unreachable actions
- cramped destructive actions
- hidden disabled states

## States
Major screens and panels should consider:
- empty state
- loading state
- error state
- success state
- disabled or coming-soon state
- destructive confirmation state

## Existing UI Building Blocks
- `components/app/Screen.tsx`
- `components/app/SectionTitle.tsx`
- `components/themed-text.tsx`
- `components/themed-view.tsx`
- `components/ui/*`
- `components/word/*`
- `constants/theme.ts`

## Blocked Features
Blocked features should be visibly disabled or framed as placeholders. Do not make them look functional.

## Destructive Actions
Use clear confirmation for:
- delete folder
- reset local data
- delete account placeholder
- remove saved words

## Import Export UX
Import should show:
- source choice
- preview before final import
- field mapping
- validation summary
- destination folder
- flashcard generation options

Export should show:
- available formats
- disabled formats
- success/failure/cancellation status
- unsupported platform feedback
