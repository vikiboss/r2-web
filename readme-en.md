![93c1205d.png](https://image.viki.moe/github/93c1205d.png)

**[中文](./readme.md) | English**

# R2 Web

📁 A lightweight, elegant, pure-browser Cloudflare R2 file manager. Everything happens right in your browser.

## Live Demo

Follow the [CORS setup guide](#1-configure-r2-bucket-cors) below, then visit **[r2.viki.moe](https://r2.viki.moe)** to start managing your R2 bucket immediately.

## Feedback

- [GitHub Issues](https://github.com/vikiboss/r2-web/issues) — bug reports, feature requests
- [QQ Group](https://qm.qq.com/q/e47kAlbdsc) — real-time discussion (Group ID: 1091212613)

## Why R2 Web?

**Pain points with traditional solutions:**

- The official Cloudflare console is basic and cumbersome to use
- Third-party desktop clients require installation, painful across platforms
- CLI tools have a steep learning curve, not suited for quick ad-hoc tasks
- Other web tools aren't R2-focused, leaving gaps in features and experience

**What R2 Web solves:**

- Open in a browser and start immediately — zero installation, zero platform friction
- Drag & paste upload with image compression — save bandwidth and time
- PWA support — install to your home screen and use like a native app
- Pure client-side — your data never passes through a third-party server

**Where R2 Web falls short:**

- Very large file uploads (>300 MB) — use rclone or similar tools instead
- Complex permission management — use the official Cloudflare console
- Automated scripts — use the official SDK or CLI
- API integration — no backend; use the official SDK or call the R2 API directly

## Use Cases

- **File management**: Browse directories, rename, move, delete — easily handle large collections of files.
- **File browsing**: Built-in image/video/audio/text preview — quickly inspect content without downloading.
- **Private image hosting**: Drag & paste upload, auto compression, one-click copy as Markdown/HTML.

## Design Philosophy

- Zero build — source is the artifact, no compilation needed
- Zero framework — native Web APIs first, no framework dependency
- Zero backend — all logic runs in the browser, direct R2 API access
- Minimal aesthetic — black/white/grey + R2 orange, small radius, flat design
- Performance first — lazy loading, debounce/throttle, request caching
- Detail-oriented — smooth animations, immediate feedback, keyboard navigation

## Screenshots

![9392ee.png](https://image.viki.moe/github/9392ee.png)

![ea7dd6.png](https://image.viki.moe/github/ea7dd6.png)

## Feature Overview

| Category            | Details                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **File Management** | Directory browsing, paginated loading, lazy thumbnail loading<br>Sort by name / date / size<br>Rename, move, copy, delete (recursive)    |
| **File Upload**     | Drag / paste / picker upload<br>Filename templates (hash, date, UUID placeholders)<br>Auto image compression before upload (WebAssembly) |
| **File Preview**    | Image preview (common formats)<br>Inline video / audio player<br>Text file preview with syntax highlighting                              |
| **Link Copy**       | Direct URL, Markdown, HTML, pre-signed URL                                                                                               |
| **Personalization** | Chinese / English / Japanese<br>Dark mode (follows system)<br>Config share link / QR code                                                |
| **PWA**             | Install to desktop, native-like experience                                                                                               |

## Quick Start

### 1. Configure R2 Bucket CORS

In the Cloudflare dashboard, go to R2 → Bucket → Settings → CORS Policy and add:

```json
[
  {
    "AllowedOrigins": ["https://r2.viki.moe"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "AllowedHeaders": ["authorization", "content-type", "x-amz-content-sha256", "x-amz-date", "x-amz-copy-source"],
    "MaxAgeSeconds": 86400
  }
]
```

> [!TIP]
> Self-hosting? Just replace `AllowedOrigins` with your own domain.

### 2. Enter Credentials

Visit [r2.viki.moe](https://r2.viki.moe), enter your R2 credentials, and connect. Credentials are stored only in your browser's localStorage and never uploaded anywhere.

### 3. Start Using

Browse files, drag & drop or press Ctrl+V to upload, right-click any file to rename, copy link, and more.

For image hosting, set a filename template with a hash placeholder, enable image compression for better performance and security.

## Tips & Tricks

### Filename Template Examples

- `[name]_[hash:6].[ext]` — original name + 6-char hash (default)
- `images/[date:YYYY/MM/DD]/[uuid].[ext]` — date-based directory structure
- `backup/[timestamp]-[name].[ext]` — timestamp-prefixed backup

### Config Share Link

Generate a "Config Share Link" or "Config QR Code" to quickly sync your settings across devices.

> [!CAUTION]
> The link contains your R2 access credentials. Do not share it on public platforms.

### Cache Optimization

R2 Web has built-in request caching for common operations like directory listings. For CDN caching, configure cache rules in the Cloudflare dashboard to improve load speeds.

![fca0bf44.png](https://image.viki.moe/github/fca0bf44.png)

## Technical Details

A pure frontend application with no build step — write code and deploy immediately.

**Core technologies:** HTML5/CSS3/ES6+, CSS Layers, native `<dialog>`, native Fetch, Import Maps, WebAssembly

**Dependencies:**

- `aws4fetch` — AWS4 request signing for R2 S3 API
- `dayjs` — date formatting
- `@jsquash/*` — WebAssembly image compression (MozJPEG, OxiPNG, libwebp, libavif)
- `qrcode` — QR code generation

**Not required:** Node.js, Webpack, Vite, React, Vue or any other build tool or framework — keeping the project lightweight and dependency-free.

## Local Development

```bash
git clone https://github.com/vikiboss/r2-web.git
cd r2-web

# Install dependencies (for type hints only)
pnpm install

# Start local dev server
npx serve src
# or
python3 -m http.server 5500 --directory src
```

See [CLAUDE.md](./CLAUDE.md) for the full development guide.

## FAQ

**Q: Are my credentials safe?**

A: Credentials are stored only in your browser's localStorage and are never sent to any server. It is recommended to use API tokens with permissions limited to the specific bucket and non-admin read/write access.

**Q: Which browsers are supported?**

A: Modern browsers (latest Chrome/Edge/Firefox/Safari). No IE support.

**Q: Where does image compression happen?**

A: Local compression uses WebAssembly and runs entirely in your browser — no files are sent to any third-party server. If you use cloud compression (Tinify), images are sent to Tinify's servers.

**Q: Can I self-host?**

A: Yes — fork the repo, update `AllowedOrigins` in the CORS config to your domain, then deploy to any static hosting service (Cloudflare Pages, Vercel, Netlify, etc.).

**Q: What does the config share link contain?**

A: It includes your Access Key ID, Secret Access Key, bucket name, and other sensitive information. Do not share it publicly.

**Q: Why is my upload failing?**

A: Check that your CORS policy is correct, your credentials are valid, and that the file is under 300 MB (use rclone for large files).

## Roadmap

- Continuous UI/UX improvements and more shortcut actions

## Development Story

This project was built with Claude Opus 4.6 via vibe coding — entirely prompt-driven from requirements to implementation. See [plan.md](./plan.md) for the initial architecture and design prompts.

## License

MIT License
