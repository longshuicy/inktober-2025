# InkTober 2025

A static flip-book for [InkTober 2025](https://inktober.com/) — 31 days of ink drawings paired with short prose. No build step: HTML, CSS, and vanilla JavaScript, deployable to GitHub Pages or any static host.

**Live site:** [https://longshuicy.github.io/inktober-2025/](https://longshuicy.github.io/inktober-2025/)

## Features

- **Book layout** — artwork on the left, writing on the right (stacked on mobile)
- **Page-turn animation** — CSS 3D rotation hinged at the spine
- **Per-page URLs** — shareable hash routes keyed by prompt word (`#cover`, `#mustache`, `#firefly`, …)
- **Themes** — black or white full-page background per spread
- **Typing animation** — word-by-word reveal on the text panel (respects `prefers-reduced-motion`)
- **Jump menu** — hover or tap the page indicator to skip to any day

## Navigation

| Action | Control |
|--------|---------|
| Next page | Right half of the page, **›** button, or **→** key |
| Previous page | Left half, **‹** button, or **←** key |
| Jump to a day | Page indicator menu (e.g. "3 / 31") |
| Direct link | `#cover` or `#<prompt>` — e.g. `#deer`, `#puzzling`, `#award` |

Browser back and forward walk through page history.

## Local preview

From the repo root:

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Content

All pages live in [`data/pages.json`](data/pages.json). Each entry has:

| Field | Purpose |
|-------|---------|
| `id` | URL slug — cover uses `"cover"`, days use the lowercased prompt (`"mustache"`, `"firefly"`, …) |
| `day` | Day number (1–31); omitted on the cover |
| `prompt` | InkTober prompt word |
| `theme` | `"black"` or `"white"` — background and text color |
| `left` | Image panel (`type: "image"`) or cover title (`type: "text"`) |
| `right` | Story text (`type: "text"`) or cover prompt list (`type: "image"`) |

Images go in `public/images/`. Reference them as `"src": "public/images/yourfile.jpg"`.

To edit a day's story, change `right.content`. HTML tags like `<i>`, `<em>`, and `<br>` are supported.

## Project structure

```
├── index.html          # Shell and navigation chrome
├── css/book.css        # Layout, themes, flip animation
├── js/book.js          # Page loading, routing, flip logic, typing
├── data/pages.json     # All spreads (cover + 31 days)
└── public/
    ├── inktoboerprompt_54952332528_l.jpg   # Cover prompt list
    └── images/         # Day artwork (*.jpg)
```

## GitHub Pages

1. Push to `main` on [longshuicy/inktober-2025](https://github.com/longshuicy/inktober-2025).
2. **Settings → Pages →** Deploy from branch **`main`**, folder **`/ (root)`**.
3. Site URL: `https://longshuicy.github.io/inktober-2025/`

## License

© 2026 [Chen Wang](https://www.instagram.com/chenniferwang/) (@chenniferwang). All rights reserved.

No permission is granted to copy, modify, or distribute this work.
