# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

R2 Web Manager — a pure client-side Cloudflare R2 bucket file manager built with vanilla HTML5, CSS3, and ES6+ JavaScript. No build tools, no frameworks, no backend. Deployed at https://r2.viki.moe.

## Project Structure

```
├── plan.md          — Original requirements/spec document
├── readme.md        - Readme with project overview, usage instructions
└── src              - All source code (no build step, so this is also the deploy directory)
     ├── index.html  — App shell, dialogs, import map (esm.sh CDN for aws4fetch & dayjs)
     ├── script.js   — CSS layers: reset, tokens, base, layout, components, utilities, animations
     └── style.css   — All application logic in class-based architecture
```

## Development

No build step. Serve files with any static server:

```sh
# e.g. using VS Code Live Server, or:
npx serve .
# or:
python3 -m http.server 5500
```

No test framework or linter is configured. Manual testing against an R2 bucket with CORS enabled.

## Architecture

All JS lives in `script.js` as ES6 modules imported via `<script type="importmap">` in `index.html`.

**Key classes (in dependency order):**

| Class            | Purpose                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `ConfigManager`  | localStorage persistence for credentials, preferences, Base64 config sharing via URL                  |
| `R2Client`       | S3-compatible API client using `aws4fetch` (ListObjectsV2, PUT, DELETE, HEAD, COPY)                   |
| `UIManager`      | Theme toggle (ViewTransition API), toasts, dialogs, context menus, skeleton states                    |
| `FileExplorer`   | Directory navigation, breadcrumbs, sorting, pagination, lazy thumbnail loading (IntersectionObserver) |
| `UploadManager`  | Drag-drop, clipboard paste, file picker uploads; filename template processing                         |
| `FilePreview`    | Preview images/video/audio/text via pre-signed URLs                                                   |
| `FileOperations` | Rename, copy, move, delete (recursive for folders), link copying                                      |
| `App`            | Main orchestrator — wires all managers together, handles i18n and event binding                       |

**External dependencies (CDN via esm.sh):**
- `aws4fetch@1.0.20` — AWS4 request signing for R2 API
- `dayjs@1.11.13` — Date formatting for filename templates

## CSS Conventions

- CSS layers: `@layer reset, tokens, base, layout, components, utilities, animations`
- Design tokens via CSS custom properties (`--sp-*` spacing, `--fs-*` font sizes, `--c-*` colors)
- Light/dark theme using `light-dark()` function and `color-scheme` property
- Accent color: `#F6821F` (Cloudflare R2 orange)
- Modern CSS: nesting, `color-mix()`, `@starting-style`, popover API
- Responsive breakpoints: `640px` (mobile), `480px` (small)

## JS Conventions

- ES6+ only: arrow functions, async/await, optional chaining, nullish coalescing
- No build transpilation — code must run directly in modern browsers
- File type detection via regex constants: `IMAGE_RE`, `TEXT_RE`, `AUDIO_RE`, `VIDEO_RE`
- i18n: inline dictionary (`I18N` object) with keys for zh/en/ja; `t()` helper function
- Filename template placeholders: `[name]`, `[ext]`, `[hash:N]`, `[date:FORMAT]`, `[timestamp]`, `[uuid]`

## R2 CORS Requirement

The target R2 bucket must have CORS configured to allow the serving origin with methods GET/POST/PUT/DELETE/HEAD and headers `authorization`, `content-type`, `x-amz-content-sha256`, `x-amz-date`.
