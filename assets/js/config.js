/* =====================================================================
   SITE CONFIG (Summit Fund mockup): settings only. The words live in content.js.
   ===================================================================== */
window.SITE = {
  name: "Summit Fund",
  tagline: "CSU College of Business · Since 1999",
  monogram: "SF",

  email: "Hilla.Skiba@colostate.edu",
  linkedin: "https://www.linkedin.com/company/summit-fund-csu-college-of-business/",

  nav: [
    { label: "Overview",          href: "index.html" },
    { label: "Market",            href: "market.html" },
    { label: "Investment Policy", href: "policy.html" },
    { label: "Competitions",      href: "competitions.html" },
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

  footerNote: ""
};
