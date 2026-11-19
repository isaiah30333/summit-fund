# Summit Fund site (draft)

A redesign of the CSU Summit / Pioneer Fund site, built on Isaiah Cordova's site template.
Content (text, links, photos, PDFs) comes from the current RAMS Finance site.

**Status: private draft.** Don't make this repo public or turn on GitHub Pages until the
current site's maintainer and the fund's faculty advisor have approved it. Photos and PDFs
still load from `ramsfinance.weebly.com`.

## How it's organized

```
index.html, market.html, policy.html, competitions.html, join.html   page layouts (no text)
assets/js/config.js     settings: name, menu, colors, heading photo, links
assets/js/content.js    ALL the words on every page, as a list of sections per page
assets/js/sections.js   turns each content section into cards (cards, photos, videos, names,
                        donors, table, tiles, steps, links, cta)
assets/js/site.js       shared header, footer, light/dark toggle, animations
assets/js/fund-market.js   Market page: holdings tape + Macro/Sector chart buttons
assets/js/heatmap.js    S&P 500 heat map (data read live from config.heatmapUrl)
assets/css/             base design system, page styles, rising-drawer sheet, section styles
```

To change wording, edit `content.js`. To change colors, name or menu, edit `config.js`.

## Preview locally

Any static server works, e.g. from this folder:

```
python -m http.server 8768
```

then open http://127.0.0.1:8768 (the Market page's charts and heat map need a server, not a double-click).

## Publishing (after approval)

1. Repo **Settings → General → Danger Zone → Change visibility → Public**.
2. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main` / root.
3. It goes live at `https://<account>.github.io/summit-fund/`.

Before going public, copy the photos and PDFs into the repo (with permission) instead of
loading them from the Weebly site, so the new site doesn't depend on the old one.

The heat map reads `https://isaiah30333.github.io/data/heatmap.json`. If the fund wants its own
data, copy `scripts/fetch_expected_moves.py` and the publish workflow from the personal site repo.
