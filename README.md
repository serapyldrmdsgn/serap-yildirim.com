# Serap Yıldırım Portfolio V3

Independent static portfolio built with HTML, CSS and vanilla JavaScript. V3 is a copy of V2 (`../serap-portfolio-v2`, left unchanged) with the same grid, typography, colours and transition, plus one gesture per project.

## Open

Double-click `index.html`, or open the folder with a local static server:

```
py -m http.server 5511 --bind 127.0.0.1
```

Main pages:

- `index.html` — Home
- `work.html` — all projects, with the persona lens ("View through")
- `lab.html` — LAB index with curator labels
- `about.html` — extended manifesto, signature and avatar collage
- `project.html?slug=03-french-elegance` — dynamic project detail

## Content

All editable content is centralized in `js/data.js`. The comment at the top of the file lists the optional project fields (`documents`, `viewpoints`, `reference`, `chapters`, `materials`, `book`, `reduction`, `summary`, `tone`, `gesture`, `pace`, `personas`).

- Project order in `projects` is the order on every page; numbers (01 / 07) follow it.
- French Elegance camera positions are in `viewpoints.cameras` (plan pixels of `PLAN OA.png`; `angle` 0 = right, 90 = down).
- LAB curator labels are the `note` of each LAB item.

Source media copied into:

- `Intro/Intro_yazılı.mp4` — Home intro video
- `Intro/Intro.mp4` — fullscreen menu background and HOME text-mask video
- `assets/projects`
- `assets/lab`
- `assets/avatar`
- `assets/about` — includes `signature.png`
- `assets/masks` — leaf silhouettes for the Light Paints gallery
- `assets/hero`
- `assets/fonts` — local Inter Tight webfont and OFL license
- `source/` — Diefenthal book HTML and the signature scan, used only by the tools below

## Web media

The site loads lightweight copies from `assets/web/` (WebP images at 2000 px / 800 px, compressed videos, and the 2-second transition clip that holds the four colour videos at 500 ms each). Originals stay untouched and are used as a fallback if a copy is missing.

After adding or replacing any project, LAB, avatar or video file, regenerate the copies and `js/media-manifest.js` (the pixel size of every project image, used by the gallery layout):

```
py -m pip install --user pillow imageio-ffmpeg
py tools/build-web-media.py
```

New videos that should get a web copy must be listed in `VIDEOS` in `tools/build-web-media.py` and in `WEB_VIDEO_SOURCES` in `js/app.js`.

Other tools:

- `py tools/export-diefenthal-book.py` — renders the 57 book pages, the featured spreads and the two emblems from `source/diefenthal-book/` (needs `playwright`; `--skip-pages` re-exports only spreads and emblems).
- `py tools/prepare-signature.py` — turns `source/signature.jpg` into the transparent `assets/about/signature.png`.

## Notes

- `assets/projects/01-light-paints-the-room/3.ARW` is preserved as a source file but browsers cannot display RAW `.ARW` images.
- LAB items marked "Collected reference" are images kept as research; "Own work" marks Serap's own pieces.
