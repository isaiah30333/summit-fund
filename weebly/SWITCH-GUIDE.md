# Switching the Summit Fund page on ramsfinance.weebly.com

This package puts the new Summit Fund site (Home, Market, IPS, Info, Join) on the RAMS Finance
Weebly site. It's set up the same way as the current Summit Fund page: custom page layouts in
the theme editor, with the page files uploaded as theme files.

Nothing here touches the other RAMS Finance pages (Finance Club, Officers, Schedule and the rest).
The current Summit Fund layout stays in the theme, so switching back takes one setting.

Weebly's menu names below are close but may not match exactly.

## What's in the folder

| Folder | What it is | Where it goes |
|---|---|---|
| `files/` | 12 files: `sf-*.css` and `sf-*.js` | Uploaded to the theme. They're served from `/files/theme/`. |
| `layouts/` | 5 page layouts, one per page | Pasted into the theme as new page layouts. |

Every file name starts with `sf-`, so none of them can overwrite a file the theme already has.

The pages also use these theme files, which are already uploaded, so keep them:
- `favicon.png` (the ram)
- `class-photo.png`
- The firm and donor logos (`apollo.svg`, `hp-1999.svg` and the rest)
- The lab photos (`apply-lab.jpg`, `lab-presentation.jpg`, `veterans-lab.jpg`, `apply-deck.png`)
- `rmic.png`

## Steps

1. **Back up first.** In **Theme → Edit HTML / CSS**, open the current Summit Fund page layout. Copy everything into a text file and keep it.
2. **Upload the files.** Still in the theme editor, use **Add → Upload File** (into the assets area, where `summit.css` and `app.js` live) and upload all 12 files from `files/`.
3. **Add the layouts.** For each file in `layouts/`, use **Add → New Page Layout**. Name it after the file without `.html` (for example `summit-market`), then paste the file's whole contents.
4. **Create the four new pages** in the **Pages** tab, with these exact names so their addresses match the links:

   | Page name | Address it gets | Layout to choose |
   |---|---|---|
   | Summit Market | summit-market.html | summit-market |
   | Summit IPS | summit-ips.html | summit-ips |
   | Summit Info | summit-info.html | summit-info |
   | Summit Join | summit-join.html | summit-join |

   You can hide these four from the RAMS Finance menu, because the Summit pages have their own menu. If Weebly gives a page a different address, send it over and the links can be rebuilt.
5. **Switch the existing Summit Fund page** (`summit-fund.html`) to the **summit-fund** layout. Do this last: it's the actual switch.
6. **Publish**, then open `/summit-fund.html` and click through all five pages.

**To undo:** set the Summit Fund page back to its old layout and publish.

## How it stays up to date

These update on their own:
- **Live prices:** the ticker tape and charts (TradingView).
- **Expected moves and chart candles:** for all 26 Macro and Sector symbols, rebuilt every 30 minutes during market hours (from options prices).
- **S&P 500 heat map:** rebuilt on the same schedule from S&P 500 weights and daily prices.

All of that market data comes from `isaiah30333.github.io`. Nothing needs re-uploading when the market moves.

**Text changes** (fund size, alumni, donors, IPS, competitions) live in `sf-content.js`, the same job `data.js` does on the current page. To change wording:
1. Edit `assets/js/content.js` in the GitHub repo (github.com/isaiah30333/summit-fund).
2. Run `python scripts/build_weebly.py`.
3. Re-upload `weebly/files/sf-content.js`.

## Technical notes

- **Stylesheets** load at the top of `<body>`, after the CSS Weebly adds to `<head>`. That way the theme's `main_style.css` can't override them.
- **`sf-weebly.css`** undoes the few theme rules that would break the layout:
  - `body { height: 100% }` stops the sticky header from staying put.
  - The `.nav` rules would rearrange the menu.
  - `p a` would underline links.
- **Weebly's `{content}` area** is kept in each layout but hidden, the same as the current layout.
- **Testing:** the package was tested against this theme's real `main_style.css` and Weebly's `sites.css`.
