# G-MoRE · identity preview

Static preview of the G-MoRE site with every candidate identity. Plain HTML, CSS and JS,
no build step: publish the repo root with GitHub Pages.

- `index.html?theme=3b` opens a given identity (ids: 1, 2, 3, 3b, 3c, 4, 5, 6). The last
  choice is remembered; with neither, identity 1 is shown.
- On a desktop, the switcher's "Mobile" view (or `&view=mobile`) shows the page in a 390 px
  phone frame. On phones and narrow windows it is hidden: the page is simply responsive.
- `brand/` is the brand handoff package, used as is. Read `brand/BRAND.md` before changing anything.
- `css/site.css` is the shared page (tokens from `brand/tokens.css`), `css/overrides.css` the
  per-identity overrides from `brand/identities.json`, `css/switcher.css` the floating selector.
- `fonts/` holds self-hosted copies of the Google Fonts in `identities.json`
  (regenerate with `node tools/fetch-fonts.mjs`).

Local preview needs an HTTP server (the page fetches `brand/identities.json`):

    node tools/serve.mjs        # http://127.0.0.1:8080/

Visual check against `brand/reference/*.html` (dev only):

    cd tools && npm install && npx playwright install chromium
    node compare.mjs            # writes tools/shots/report.md and diff images

Known, intentional differences from the references: the open-call band of 3b
(background #012732 as in `identities.json`, not the reference's #E0A93B) and the band
H2 of 3c (#012732 as in the override, not #1E8A5A). Both references fail contrast.
Under 900 px the header collapses into a hamburger menu (the references wrap the links), and
the header is sticky: it hides while scrolling down and returns when scrolling up.
