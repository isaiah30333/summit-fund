/* =====================================================================
   SITE CONFIG (Summit Fund mockup): settings only. The words live in content.js.
   ===================================================================== */
window.SITE = {
  name: "Summit Fund",
  tagline: "CSU College of Business · Since 1999",
  monogram: "SF",
  monogramImage: "assets/img/csu-ram.webp",   // CSU Ram in the header icon and browser tab

  email: "Hilla.Skiba@colostate.edu",
  linkedin: "https://www.linkedin.com/company/summit-fund-csu-college-of-business/",

  nav: [
    { label: "Home",              href: "index.html" },
    { label: "Market",            href: "market.html" },
    { label: "IPS",               href: "policy.html" },
    { label: "Info",              href: "competitions.html" },
    { label: "Join",              href: "join.html" }
  ],
  headerCta: { label: "Apply", href: "join.html" },

  theme: {
    accent: "#8A6A1F",          // bronze (swap to CSU green "#1E4D2B" / "#7BC88F" for a school look)
    accentDark: "#E0C27A",
    radius: "12px",
    defaultMode: "system"
  },

  // heading photo: the Fall 2026 Summit / Pioneer class
  heroImage: "https://ramsfinance.weebly.com/files/theme/class-photo.png",
  heroCredit: { text: "Photo: Summit / Pioneer Fund, Fall 2026", url: "https://ramsfinance.weebly.com/summit-fund.html" },

  fonts: { heading: "Inter Tight", body: "Inter", mono: "JetBrains Mono" },
  // S&P 500 heat map data: read live from Isaiah's site (updated every 30 min in market hours)
  heatmapUrl: "https://isaiah30333.github.io/data/heatmap.json",
  // candles + options-implied expected moves for the Market chart, built by the same data job
  emDataUrl: "https://isaiah30333.github.io/data/summit/",

  // Live price band under the header on every page: the fund's holdings (TradingView symbols).
  tickerTape: [
    "NASDAQ:MSFT", "NYSE:TSM", "NASDAQ:NVDA", "NASDAQ:GOOGL", "NYSE:ANET", "NASDAQ:ASML", "NYSE:JPM",
    "NYSE:NU", "NASDAQ:MU", "NYSE:RDDT", "NASDAQ:NTES", "NYSE:UBER", "NYSE:LLY", "NASDAQ:ARGX",
    "NASDAQ:KNSA", "NYSE:V", "NYSE:FLS", "AMEX:CECO", "NASDAQ:META", "NYSE:EVR", "NYSE:MLI",
    "NASDAQ:UAL", "AMEX:XLK", "AMEX:XLF", "AMEX:VHT"
  ],

  footerNote: ""
};
