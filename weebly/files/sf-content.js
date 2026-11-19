/* =====================================================================
   PAGE CONTENT (Summit Fund mockup). Content from the RAMS Finance site.
   Every page is a list of sections; each section has a "type" that picks its layout:
     facts · cards · photos · videos · names · donors · table · tiles · steps · links · cta
   Wrap words in **double asterisks** to make them bold.
   ===================================================================== */
(function () {
  var W = "";
  var LINKS = {
    apply: "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=Aoi1r3r_sUurITZ_8uz8i01x0i-QokBEvQXfnCEY7nZUM1cyWDYxMkdJTzBQUTNaRTNONUQ1OE5MUy4u",
    annualReport: W + "/uploads/5/9/1/6/59163295/summit_fund_annual_report_spring_2025.pdf",
    prospectus: W + "/files/theme/summit-prospectus.pdf",
    recruitmentDeck: W + "/uploads/5/9/1/6/59163295/pioneer-summit_fund_recruitment_deck.pdf",
    constitution: W + "/uploads/5/9/1/6/59163295/finance_club_constitution_2024-2025.pdf",
    valuationLab: "https://coleschomer.com/summitforge/",
    linkedinPosts: "https://www.linkedin.com/company/summit-fund-csu-college-of-business/posts/?feedView=all",
    advisor: "https://biz.colostate.edu/about/directory/hskiba"
  };

  window.CONTENT = {
    links: LINKS,
    pages: {
      /* ------------------------------------------------------------ Overview */
      overview: {
        hero: {
          lead: "Colorado State University's student-run investment fund since 1999. Students research, pitch and vote on real positions across three portfolios.",
          buttons: [
            { label: "Apply to the fund", href: "summit-join.html", primary: true },
            { label: "Annual report", href: LINKS.annualReport, external: true }
          ]
        },
        facts: [
          { k: "Founded", v: "1999" },
          { k: "Summit Fund", v: "$1M+ · 54 stocks" },
          { k: "Pioneer Fund", v: "$634K+ · 35 holdings" },
          { k: "Veterans Fund", v: "Graduate · since 2013" }
        ],
        sections: [
          { type: "photos", eyebrow: "The funds", title: "Three student-run portfolios", cards: [
            { title: "Summit Fund", meta: "Est. 1999 · $1M+", img: W + "/files/theme/apply-lab.jpg", pos: "center 40%",
              text: "Flagship fund founded in 1999, $1M+ across 54 individual stocks.", href: "summit-join.html", link: "Join the fund" },
            { title: "Pioneer Fund", meta: "Sector ETFs · $634K+", img: W + "/files/theme/lab-presentation.jpg", pos: "center 22%",
              text: "Focused on sector ETFs and select stocks, $634K+ across 35 holdings.", href: "summit-join.html", link: "Join the fund" },
            { title: "Veterans Fund", meta: "Graduate · Est. 2013", img: W + "/files/theme/veterans-lab.jpg", pos: "center 30%",
              text: "Graduate equity portfolio supporting military veterans since 2013.",
              href: "https://biz.source.colostate.edu/a-true-return-on-investment-csu-fund-supports-veterans-while-training-future-financial-leaders/", link: "Read the story", external: true }
          ]},
          { type: "cards", eyebrow: "The class", title: "How the fund works", cards: [
            { title: "People", items: ["Managing Directors", "Functional roles", "Sector roles"] },
            { title: "Process", items: ["Market and sector research", "Original equity pitches", "Full fund debate and vote"] },
            { title: "Practice", items: ["Bloomberg Certification", { label: "Equity valuation (Summit Forge app)", url: LINKS.valuationLab }, "Excel financial modeling"] }
          ]},
          { type: "videos", eyebrow: "Watch", title: "The fund on camera", videos: [
            { id: "6Xf0WaYcUMU", title: "Welcome to the Summit Fund", sub: "College of Business" },
            { id: "5pX8zMqVhzs", title: "CSU Veterans Fund Feature", sub: "9NEWS, Dr. Hilla Skiba" },
            { id: "OZHuCXPuYwU", title: "Students invest in their future", sub: "MYCSU" },
            { id: "wJEgRjxtRz4", title: "Short Summit Fund Clip", sub: "Summit Fund" }
          ]},
          { type: "names", logos: true, eyebrow: "Alumni", title: "Where Summit alumni work", items: [
            { name: "Apollo", logo: W + "/files/theme/apollo.svg", note: "Private credit" },
            { name: "Morgan Stanley", logo: W + "/files/theme/morgan-stanley.svg", note: "Equity sales" },
            { name: "Goldman Sachs", logo: W + "/files/theme/goldman-sachs.svg", square: true, note: "Asset advisory" },
            { name: "J.P. Morgan", logo: W + "/files/theme/jp-morgan.svg", note: "Private banking" },
            { name: "S&P Global", logo: W + "/files/theme/sp-global.svg", note: "Credit ratings" },
            { name: "NEPC", logo: W + "/files/theme/nepc.png", square: true, note: "Portfolio consulting" },
            { name: "CNA", logo: W + "/files/theme/cna.svg", note: "Underwriting" },
            { name: "TIAA", logo: W + "/files/theme/tiaa.svg", note: "Retirement assets" },
            { name: "RBC", logo: W + "/files/theme/rbc.svg", square: true, note: "Investment banking" },
            { name: "Mariner", logo: W + "/files/theme/mariner.png", note: "Wealth advisory" },
            { name: "Sompo", logo: W + "/files/theme/sompo.svg", note: "Reinsurance" },
            { name: "Zander Advisory", note: "Deal advisory" }
          ]},
          { type: "donors", eyebrow: "Donors", title: "Thank you to our donors",
            text: "The Summit Fund managers thank the donors who made this program possible and gave students the chance to learn portfolio management first-hand.",
            corporate: [
              { name: "Hewlett-Packard", logo: W + "/files/theme/hp-1999.svg", square: true, note: "Founding 1999 supporter" },
              { name: "First National Bank", logo: W + "/files/theme/first-national-bank.png", square: true, note: "Northern Colorado bank partner" },
              { name: "Burke Cleaners", logo: W + "/files/theme/burke-cleaners.png", square: true, note: "Fort Collins community sponsor" },
              { name: "Everitt Companies", logo: W + "/files/theme/everitt-companies.png", square: true, note: "1999 founding endowment" }
            ],
            individual: [
              { name: "Robert & Joyce Everitt", note: "Everitt Companies, 1999 founding endowment" },
              { name: "Gary Halley", note: "Namesake of the Halley Finance Data Lab" },
              { name: "Clayton & Kandy Hartman", note: "IFAM Capital co-founder, Fort Collins" },
              { name: "Mark Burke", note: "Burke Cleaners, Fort Collins" },
              { name: "Michael & Glory Burns", note: "College of Business supporters" },
              { name: "Thomas Byington", note: "Former First Interstate Bank executive" },
              { name: "Ross Carpenter", note: "Summit Fund donor and program supporter" },
              { name: "Jerome Carr", note: "1st State Bank director, Fort Collins" },
              { name: "Michael Dellenbach", note: "Dellenbach Motors, Fort Collins" },
              { name: "Frederick Gardner", note: "Summit Fund donor and program supporter" },
              { name: "Stephen Joyce", note: "Summit Fund donor and program supporter" },
              { name: "Elizabeth Murray", note: "Summit Fund donor and program supporter" },
              { name: "Dennis Sinnett", note: "Sinnett Builders, Fort Collins" },
              { name: "James Smith", note: "Summit Fund donor and program supporter" },
              { name: "Christopher Webster", note: "Summit Fund donor and program supporter" }
            ]
          }
        ]
      },

      /* ------------------------------------------------------------ Market */
      market: {
        head: { eyebrow: "Market", title: "Markets & holdings", text: "Fund holdings on the tape, macro and sector charts, and today's S&P 500." },
        symbols: {
          Macro: [["AMEX:SPY", "SPY", "S&P 500 ETF"], ["NASDAQ:QQQ", "QQQ", "Nasdaq 100 ETF"], ["CAPITALCOM:SPX500", "SPX", "S&P 500"],
                  ["CAPITALCOM:US30", "DJI", "Dow 30"], ["CAPITALCOM:RTY", "RUT", "Russell 2000"], ["CAPITALCOM:VIX", "VIX", "Volatility"],
                  ["PYTH:US10Y", "US10Y", "10Y Yield"], ["OANDA:WTICOUSD", "WTI", "Crude Oil"], ["CAPITALCOM:XAUUSD", "GOLD", "Gold"],
                  ["CAPITALCOM:DXY", "DXY", "US Dollar"], ["BITSTAMP:BTCUSD", "BTC", "Bitcoin"], ["CAPITALCOM:J225", "NI225", "Nikkei 225"],
                  ["CAPITALCOM:GER40", "DAX", "Germany 40"], ["CAPITALCOM:UK100", "UK100", "FTSE 100"], ["CAPITALCOM:HK50", "HK50", "Hang Seng"]],
          Sectors: [["AMEX:XLK", "XLK", "Technology"], ["AMEX:XLC", "XLC", "Communication Services"], ["AMEX:XLY", "XLY", "Consumer Discretionary"],
                    ["AMEX:XLP", "XLP", "Consumer Staples"], ["AMEX:XLF", "XLF", "Financials"], ["AMEX:XLV", "XLV", "Health Care"],
                    ["AMEX:XLI", "XLI", "Industrials"], ["AMEX:XLE", "XLE", "Energy"], ["AMEX:XLU", "XLU", "Utilities"],
                    ["AMEX:XLRE", "XLRE", "Real Estate"], ["AMEX:XLB", "XLB", "Materials"]]
        }
      },

      /* ------------------------------------------------------------ Investment Policy */
      policy: {
        head: { eyebrow: "IPS · Investment Policy Statement", title: "How we pick stocks", text: "Every position starts with the same screens, fits inside the same limits, and goes through the same vote." },
        sections: [
          { type: "table", eyebrow: "Screens", title: "What a stock has to pass", intro: "Medians are sector medians. Two screens can be waived by a fund vote.", columns: ["Criterion", "Threshold", "What it means"], rows: [
            ["Market Cap", "$200M+", "No illiquid micro-caps"],
            ["ROIC & ROE", "> Median", "Above the sector median"],
            ["Analyst Ratings", "25%+ Buy", "≤25% Sell, 8+ analysts"],
            ["5Y EPS Growth", "> Median", "Consensus, above the median"],
            ["5Y Fwd PEG", "≤ Median", "At or below the median"]
          ]},
          { type: "tiles", eyebrow: "Constraints", title: "Portfolio limits", items: [
            { k: "Target Beta", v: "≤ 1.3", note: "Versus the S&P 500" },
            { k: "Position Cap", v: "≤ 5.0%", note: "Per stock, at purchase" },
            { k: "Allocation", v: "95% / 5%", note: "Equities / cash, ±10 pp" },
            { k: "Time Horizon", v: "5+ Years", note: "S&P 500 + T-bill benchmark" }
          ]},
          { type: "steps", eyebrow: "Process", title: "From idea to trade", items: [
            "Screen + MSCI ESG check",
            "MD & advisor review",
            "Full fund votes",
            "Foundation executes"
          ]},
          { type: "cta", eyebrow: "Documents", title: "Read the full policy", text: "The full policy and how it played out.", buttons: [
            { label: "Prospectus (PDF)", href: LINKS.prospectus, primary: true, external: true },
            { label: "Annual report (PDF)", href: LINKS.annualReport, external: true }
          ]}
        ]
      },

      /* ------------------------------------------------------------ Competitions */
      competitions: {
        head: { eyebrow: "Info", title: "Beyond the classroom", text: "Pitch competitions, trading challenges, summits, and the clubs that connect them." },
        sections: [
          { type: "links", eyebrow: "Featured", title: "Featured this year", cards: [
            { name: "Rams on Wall Street", tag: "New York", img: "/files/theme/favicon.png",
              url: "https://biz.colostate.edu/academics/undergraduate-programs/bsba/concentrations/finance", linkLabel: "Finance at CSU",
              detail: "A selective program from the Department of Finance & Real Estate that takes top CSU finance students to New York to see institutional finance firsthand. Led by **Dr. Hilla Skiba**." },
            { name: "Rocky Mountain Investment Challenge", tag: "Competition", img: W + "/files/theme/rmic.png", url: "https://rockymountaininvestmentchallenge.com/",
              detail: "Founded by CSU, CU Boulder, and the University of Denver, with a $10,000 first prize." }
          ]},
          { type: "cards", cols: 2, eyebrow: "Rams on Wall Street", title: "Inside the program", cards: [
            { title: "Site visits", items: ["Tours of investment banks, private equity firms, hedge funds, asset managers and trading desks across Manhattan"] },
            { title: "Networking", items: ["Roundtables, pitch critiques and Q&A panels with senior Wall Street leaders, portfolio managers and CSU alumni in New York"] },
            { title: "Career exploration", items: ["Connects FIN 300, 310 and 355 to front-office roles: investment banking, sales & trading, equity research and asset management"] },
            { title: "Recruiting", items: ["A direct bridge to competitive New York summer analyst internships and full-time analyst roles"] }
          ]},
          { type: "cards", cols: 2, eyebrow: "Together", title: "How it connects to the Summit Fund", cards: [
            { title: "Summit Fund: the skills", items: ["DCF valuation and comps modeling", "Pitch presentations to the full fund", "Bloomberg portfolio management in the Halley Finance Data Lab"] },
            { title: "Rams on Wall Street: the network", items: ["Industry exposure on the Street", "Direct connections with institutional investors", "A pipeline into New York analyst roles"] }
          ]},
          { type: "links", eyebrow: "Compete", title: "Competitions", cards: [
            { name: "CFA Global Research Challenge", tag: "Equity research", url: "https://www.cfasociety.org/colorado/about/research-challenge",
              detail: "Pitch a stock to CIOs. CSU placed 2nd in Denver.",
              aux: [["LinkedIn", "https://www.linkedin.com/company/cfa-colorado/"], ["Instagram", "https://www.instagram.com/cfasocietycolorado/"]] },
            { name: "JA Stock Market Challenge", tag: "Live trading", url: "https://www.jarockymountain.org/ja-stock-market-challenge/",
              detail: "Northern Colorado live trading fundraiser.",
              aux: [["LinkedIn", "https://www.linkedin.com/company/jarockymountain"], ["Instagram", "https://www.instagram.com/jarockymountain/"]] },
            { name: "Rotman Trading Competition", tag: "International", url: "https://ritc.rotman.utoronto.ca/",
              detail: "International trading competition in Toronto." }
          ]},
          { type: "links", eyebrow: "Network", title: "Summits", cards: [
            { name: "CSU Finance and Real Estate Summit", tag: "Denver", url: "https://biz.colostate.edu/centers-institutes/everitt-real-estate-center",
              detail: "Denver summit with the Everitt Real Estate Center." },
            { name: "Quinnipiac G.A.M.E. Forum", tag: "New York", url: "https://qgame.qu.edu/",
              detail: "New York forum for student-run funds." }
          ]},
          { type: "links", eyebrow: "On campus", title: "Clubs & resources", cards: [
            { name: "CSU Finance Club", tag: "Club", url: "/finance-club.html",
              detail: "Open to every major interested in markets.",
              aux: [["LinkedIn", "https://www.linkedin.com/in/finance-club-at-colorado-state-university-b0438877/"], ["Instagram", "https://www.instagram.com/financeclub_csu/"], ["Constitution", LINKS.constitution]] },
            { name: "Ram Street", tag: "Publication", url: "https://www.ramstreet.org/",
              detail: "Student-run finance publication and newsletter.",
              aux: [["LinkedIn", "https://www.linkedin.com/company/ram-street-csu/"], ["Instagram", "https://www.instagram.com/ramstreet_csu/"]] },
            { name: "Professional Clothing Fund", tag: "Resource", url: "https://bizcareers.colostate.edu/resources/college-of-business-professional-clothing-fund/",
              detail: "Up to $325 for interview and career fair attire." }
          ]}
        ]
      },

      /* ------------------------------------------------------------ Join */
      join: {
        head: { eyebrow: "Join", title: "Apply to the fund", text: "Recruiting opens in October and March. Bring a resume and a few short answers." },
        sections: [
          { type: "tiles", eyebrow: "Requirements", title: "Before you apply", items: [
            { k: "Course", v: "FIN 486", note: "Practicum, 3 credits" },
            { k: "Prerequisite", v: "FIN 355", note: "Investments, with an A or B" },
            { k: "GPA", v: "3.2+", note: "Preferred, not required" },
            { k: "Application", v: "Resume", note: "Plus a short-answer form" }
          ]},
          { type: "cta", eyebrow: "Apply", title: "Ready to manage real money?", text: "Questions first? Reach out to the faculty advisor, **Dr. Hilla Skiba**.", buttons: [
            { label: "Open the application", href: LINKS.apply, primary: true, external: true },
            { label: "Recruitment deck (PDF)", href: LINKS.recruitmentDeck, external: true },
            { label: "Faculty advisor", href: LINKS.advisor, external: true }
          ]},
          { type: "photos", eyebrow: "Inside the lab", title: "Where the fund meets", cards: [
            { title: "Pioneers & Veterans Finance Lab", meta: "Rockwell Hall", img: W + "/files/theme/apply-lab.jpg", pos: "center 45%",
              text: "Bloomberg-equipped lab in Rockwell Hall." },
            { title: "Recruitment deck", meta: "Spring 2027", img: W + "/files/theme/apply-deck.png", pos: "center 30%",
              text: "Roles, class and timeline in one deck.", href: LINKS.recruitmentDeck, link: "Open the deck", external: true }
          ]}
        ]
      }
    }
  };
})();
