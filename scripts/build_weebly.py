"""
Build the Weebly version of this site into weebly/ (run: python scripts/build_weebly.py).

The RAMS Finance site (ramsfinance.weebly.com) runs custom page layouts in Weebly's theme
editor, with the page's files uploaded as theme files (served from /files/theme/). This
script turns the five pages here into that shape:

  weebly/files/     upload each file to the theme (Theme > Edit HTML/CSS > Add > Upload File)
  weebly/layouts/   one page layout per page (Add > New Page Layout, paste the file's contents)

Changes from the GitHub version:
  * assets/... paths become /files/theme/sf-... (prefixed "sf-" so they can't collide with
    files already in the theme)
  * page links become the Weebly page addresses in PAGES below
  * images that live on the Weebly site are linked relative (/files/theme/...) instead of by
    full address, and the header uses the theme's existing favicon.png for the ram
  * stylesheets load at the top of <body>, after the CSS Weebly adds to <head>, so ours win
  * Weebly's required {content} area is kept, hidden, like the current Summit Fund layout
  * sf-weebly.css undoes the theme rules that would break the layout (see that file)

Market data (expected moves, candles, heat map) still comes from isaiah30333.github.io.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "weebly"
WEEBLY = "https://ramsfinance.weebly.com"

# GitHub page -> Weebly page address (Weebly makes the address from the page name)
PAGES = {
    "index.html":        "summit-fund.html",     # the existing Summit Fund page
    "market.html":       "summit-market.html",
    "policy.html":       "summit-ips.html",
    "competitions.html": "summit-info.html",
    "join.html":         "summit-join.html",
}
CSS = ["base.css", "pages.css", "drawer.css", "sections.css"]
JS = ["config.js", "site.js", "content.js", "sections.js", "fund-market.js", "heatmap.js", "market-feeds.js"]

WEEBLY_CSS = """/* Weebly only: the RAMS Finance theme (main_style.css) styles bare html / body / .nav / h2 / p a.
   These put our layout back. Loaded last. */
html, body { height: auto !important; }      /* theme sets 100%: the sticky header would scroll away after one screen */
body { font-weight: 400; }                    /* theme sets 500 */
.site-header .nav { display: flex; vertical-align: baseline; }
.site-header .nav ul { float: none; max-width: none; overflow: visible; }
.site-header .nav li { display: block; margin: 0; }
p a { font-weight: inherit; text-decoration: inherit; }
.brand-mark--img img { transform: none; }    /* favicon.png is already cropped to the circle */
#wsite-hidden { display: none !important; }
"""


def page_links(text: str) -> str:
    for src, dst in PAGES.items():
        text = re.sub(r'(["\'])' + re.escape(src) + r'(["\'#?])', r"\g<1>" + dst + r"\g<2>", text)
    return text


def main() -> None:
    for sub in ("files", "layouts"):               # rebuilt every time; SWITCH-GUIDE.md is kept
        if (OUT / sub).exists():
            shutil.rmtree(OUT / sub)
        (OUT / sub).mkdir(parents=True)

    for f in CSS:
        (OUT / "files" / ("sf-" + f)).write_text((ROOT / "assets/css" / f).read_text(encoding="utf-8"), encoding="utf-8")
    (OUT / "files" / "sf-weebly.css").write_text(WEEBLY_CSS, encoding="utf-8")

    for f in JS:
        t = (ROOT / "assets/js" / f).read_text(encoding="utf-8")
        t = page_links(t)
        t = t.replace(WEEBLY + "/files/", "/files/")          # same site now: relative image paths
        t = t.replace('var W = "' + WEEBLY + '";', 'var W = "";')
        t = t.replace(WEEBLY + "/", "/")                      # any other link to a RAMS Finance page
        t = t.replace('"assets/img/csu-ram.webp"', '"/files/theme/favicon.png"')
        if f == "config.js":
            t = t.replace('monogramImage: "/files/theme/favicon.png",',
                          'monogramImage: "/files/theme/favicon.png",\n  monogramZoom: 1,                // favicon.png is already cropped')
            t = t.replace('url: "' + WEEBLY + '/summit-fund.html"', 'url: "summit-fund.html"')
        (OUT / "files" / ("sf-" + f)).write_text(t, encoding="utf-8")

    for src, dst in PAGES.items():
        h = (ROOT / src).read_text(encoding="utf-8")
        # stylesheets: out of <head>, into the top of <body> (after Weebly's own CSS)
        links = re.findall(r'\s*<link rel="stylesheet" href="assets/css/[^"]+">', h)
        for l in links:
            h = h.replace(l, "")
        css = "".join("\n  " + l.strip() for l in links)
        css = re.sub(r'href="assets/css/([^"?]+)', r'href="/files/theme/sf-\1', css)
        css += '\n  <link rel="stylesheet" href="/files/theme/sf-weebly.css">'
        h = re.sub(r"(<body[^>]*>)", r"\1\n  <!-- our styles load after the ones Weebly adds to <head>, so ours win -->" + css, h, count=1)
        h = re.sub(r'src="assets/js/([^"?]+)', r'src="/files/theme/sf-\1', h)
        h = page_links(h)
        # Weebly needs {content} somewhere in every layout; keep it hidden like the current Summit layout
        h = h.replace("</body>", '  <div id="wsite-hidden" aria-hidden="true">{content}</div>\n</body>', 1)
        assert "assets/" not in h, src
        (OUT / "layouts" / dst).write_text(h, encoding="utf-8")

    print("built", OUT)
    for p in sorted(OUT.rglob("*")):
        if p.is_file():
            print("  ", p.relative_to(OUT))


if __name__ == "__main__":
    main()
