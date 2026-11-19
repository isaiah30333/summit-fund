/* Market page: fund holdings on a TradingView ticker tape, Macro / Sector chart buttons,
   and the S&P 500 heat map (clicking a stock charts it here). Symbols live in content.js. */
(function () {
  var M = window.CONTENT && window.CONTENT.pages.market;
  if (!M) return;
  var esc = window.SiteUtil.esc;
  var root = document.documentElement;
  var current = M.symbols.Macro[0];                 // [TradingView symbol, short name, label]
  var view = "overview";                            // overview: clean candles · technicals: indicators
  try { if (localStorage.getItem("sf-chart-view") === "technicals") view = "technicals"; } catch (e) {}

  // Technicals: volume, VWAP, 50-day EMA and 50-day SMA (TradingView built-in studies)
  var STUDIES = [
    { id: "VWAP@tv-basicstudies" },
    { id: "MAExp@tv-basicstudies", inputs: { length: 50 } },
    { id: "MASimple@tv-basicstudies", inputs: { length: 50 } }
  ];

  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function tvEmbed(host, script, config) {
    if (!host) return;
    host.innerHTML = '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';
    var s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/" + script;
    s.async = true;
    s.text = JSON.stringify(config);
    host.firstChild.appendChild(s);
  }

  function renderGroups() {
    var html = Object.keys(M.symbols).map(function (g) {
      return '<div class="sym-group" role="group" aria-label="' + esc(g) + '"><span class="sym-label">' + esc(g) + "</span>" +
        M.symbols[g].map(function (s) {
          return '<button type="button" class="sym-btn" data-sym="' + esc(s[0]) + '" title="' + esc(s[2]) + '" aria-pressed="' + (s[0] === current[0]) + '">' + esc(s[1]) + "</button>";
        }).join("") + "</div>";
    }).join("");
    document.getElementById("sym-groups").innerHTML = html;
  }

  function renderChart() {
    var theme = isDark() ? "dark" : "light";
    document.getElementById("chart-sym").textContent = current[1];
    document.getElementById("chart-name").textContent = current[2];
    document.getElementById("chart-tv").href = "https://www.tradingview.com/chart/?symbol=" + encodeURIComponent(current[0]);
    tvEmbed(document.getElementById("tv-chart"), "embed-widget-advanced-chart.js", {
      autosize: true, symbol: current[0], interval: "D", timezone: "America/New_York",
      theme: theme, style: "1", locale: "en",
      backgroundColor: theme === "dark" ? "rgba(22,21,17,1)" : "rgba(255,255,255,1)",
      hide_side_toolbar: true, allow_symbol_change: true, support_host: "https://www.tradingview.com",
      hide_volume: view !== "technicals",
      studies: view === "technicals" ? STUDIES : []
    });
    document.querySelectorAll("#view-seg [data-view]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-view") === view ? "true" : "false");
    });
  }


  document.getElementById("sym-groups").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sym]");
    if (!b) return;
    var sym = b.getAttribute("data-sym");
    Object.keys(M.symbols).forEach(function (g) { M.symbols[g].forEach(function (s) { if (s[0] === sym) current = s; }); });
    renderGroups(); renderChart();
  });

  var seg = document.getElementById("view-seg");
  if (seg) seg.addEventListener("click", function (e) {
    var b = e.target.closest("[data-view]");
    if (!b || b.getAttribute("data-view") === view) return;
    view = b.getAttribute("data-view");
    try { localStorage.setItem("sf-chart-view", view); } catch (err) {}
    renderChart();
  });

  // the heat map calls this when a stock is clicked: chart it here
  window.MarketsSelect = function (sym) {
    current = [sym.replace("-", "."), sym, "S&P 500 stock"];
    renderGroups(); renderChart();
    document.querySelector(".chart-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  };

  function onTheme() { renderChart(); }
  new MutationObserver(onTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onTheme);

  renderGroups(); renderChart();
})();
