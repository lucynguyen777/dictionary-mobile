# UI UX Guidelines

## General
The app should feel clean, local-first, and learning-focused.

## Copy
Use consistent Vietnamese UI copy.

Avoid mixing English and Vietnamese unless the English term is a product label, language name, file format, or technical term.

## Layout
Must work on:
- mobile
- Expo web

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