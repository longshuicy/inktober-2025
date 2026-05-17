# InkTober 2025

A static flip-book website for [InkTober 2025](https://inktober.com/) artwork and writing. No build step — HTML, CSS, and vanilla JavaScript, hosted on GitHub Pages.

**Live site:** [https://longshuicy.github.io/inktober-2025/](https://longshuicy.github.io/inktober-2025/) *(enable GitHub Pages after first push)*

## Features

- Book-style layout: artwork on the left, story text on the right
- Page-turn animation hinged at the center spine
- Black or white full-page theme per spread (set in `pages.json`)
- Word-by-word typing animation on the text panel
- Cover spread with official prompt list

## Local preview

From the repo root:

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Edit content

All pages are defined in [`data/pages.json`](data/pages.json):

| Field | Purpose |
|-------|---------|
| `theme` | `"black"` or `"white"` — background and text color |
| `left` | Image, placeholder, or title text |
| `right` | Story text or prompt-list image (cover) |

**Add missing artwork** (days 16, 29, 30): set `left` to `{ "type": "image", "src": "public/images/...", "alt": "..." }` and set `theme` to `"black"` or `"white"`.

**Change story text:** edit `right.content` for each day.

## Project structure

```
├── index.html
├── css/book.css
├── js/book.js
├── data/pages.json
└── public/
    ├── inktoboerprompt_54952332528_l.jpg
    └── images/
        └── *.jpg
```

## GitHub Pages

1. Push to `main` on [longshuicy/inktober-2025](https://github.com/longshuicy/inktober-2025).
2. **Settings → Pages →** Deploy from branch **`main`**, folder **`/ (root)`**.
3. Site URL: `https://longshuicy.github.io/inktober-2025/`

## Navigation

- **Next:** right half of the page, **›** button, or **→** key
- **Previous:** left half, **‹** button, or **←** key

## License

© 2026 Chen Wang. All rights reserved.

No permission is granted to copy, modify, or distribute this work. Contact [chenwang.carrie@gmail.com](mailto:chenwang.carrie@gmail.com) for more information.
