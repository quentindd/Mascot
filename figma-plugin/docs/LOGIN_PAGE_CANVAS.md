# Login page – canvas size for visual design

Use these dimensions when creating a visual to integrate later on the login screen.

## Plugin window (full frame)

| | |
|---|---|
| **Width** | **500 px** |
| **Height** | **700 px** |

- The plugin UI is opened with `figma.showUI(..., { width: 500, height: 700 })`.
- The login view uses the full window: `height: 100vh` (700px), with `padding: 24px` on the container.

## Safe area (content zone)

- **Horizontal padding**: 24px on each side → content width **452 px** (500 − 48).
- **Vertical**: same 24px top/bottom → content height **652 px** (700 − 48).

## Auth card (centered white card)

- **Max width**: 360px (from `.auth-card` in `App.css`).
- **Padding**: 32px inside the card.
- Card is centered in the 500×700 window.

## Recommended canvas for your visual

- **Size**: **500 × 700 px** (same as the plugin window).
- **Format**: PNG or Figma frame 500×700.
- You can design at 1x; the plugin is not scaled.

## File reference

- UI size: `figma-plugin/src/code.ts` → `figma.showUI(__html__, { width: 500, height: 700 })`
- Login layout: `figma-plugin/src/ui/AuthScreen.tsx` + `App.css` (`.auth-container`, `.auth-card`)
