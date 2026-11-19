/* Market page: Macro / Sector chart buttons, the S&P 500 heat map (clicking a stock charts it
   here), and the chart itself.

   The chart draws candles with options-implied expected moves (dashed high/low lines around a
   center) for Daily / Weekly / Monthly, plus a Technicals view: volume, VWAP, EMA 50, SMA 50
   and Bollinger Bands (20, 2). Candles and expected moves come from a data job that runs every
   30 minutes in market hours (config.emDataUrl): <url>/expected-moves.json and
   <url>/bars/<SYMBOL>.json. Symbols with no data there (a stock clicked on the heat map) fall
   back to TradingView's chart. Symbols live in content.js. */
(function () {
  var M = window.CONTENT && window.CONTENT.pages.market;
  if (!M) return;
  var esc = window.SiteUtil.esc;
  var root = document.documentElement;
  var LW = window.LightweightCharts;
  var BASE = ((window.SITE && window.SITE.emDataUrl) || "data/summit/").replace(/\/?$/, "/");

  var current = M.symbols.Macro[0];                 // [TradingView symbol, short name, label]
  var st = { view: "overview", tf: "daily", iv: "1D" };
  var emData = null, emBySym = {}, barCache = {};

  // interval key -> source candles in the data file, bucket rule, how many candles to show at first
  var IV = {
    "1m":  { src: "1m",  secs: 60,    show: 300 },
    "3m":  { src: "1m",  secs: 180,   show: 180, agg: true },
    "5m":  { src: "5m",  secs: 300,   show: 180 },
    "15m": { src: "15m", secs: 900,   show: 140 },
    "1h":  { src: "1h",  secs: 3600,  show: 140 },
    "4h":  { src: "1h",  secs: 14400, show: 100, agg: true, session: true },
    "1D":  { src: "1d",  day: true,   show: 130 },
    "1W":  { src: "1w",  week: true,  show: 104 }
  };
  var TV_IV = { "1m": "1", "3m": "3", "5m": "5", "15m": "15", "1h": "60", "4h": "240", "1D": "D", "1W": "W" };
  var HORIZON = { daily: "Day", weekly: "Week", monthly: "Month" };
  var TA_COLORS = { vwap: "#7c5cd6", ema: "#2f80ed", sma: "#e08a1e", bb: "#0d9488" };
  var STUDIES = [                                   // the same set on TradingView's chart (fallback)
    { id: "VWAP@tv-basicstudies" },
    { id: "MAExp@tv-basicstudies", inputs: { length: 50 } },
    { id: "MASimple@tv-basicstudies", inputs: { length: 50 } },
    { id: "BB@tv-basicstudies" }
  ];

  try {
    if (localStorage.getItem("sf-chart-view") === "technicals") st.view = "technicals";
    var t0 = localStorage.getItem("sf-tf"); if (HORIZON[t0]) st.tf = t0;
    var i0 = localStorage.getItem("sf-iv"); if (IV[i0]) st.iv = i0;
  } catch (e) {}

  /* ---------- helpers ---------- */
  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function cssVar(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function num(v) {                                  // indexes, yields and ETFs: plain numbers, no $
    if (v == null) return "–";
    var d = Math.abs(v) < 10 ? 2 : Math.abs(v) < 1000 ? 2 : 0;
    return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtDate(iso) {
    var d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function alpha(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return hex;
    var n = parseInt(m[1], 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function tvEmbed(host, script, config) {
    host.innerHTML = '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';
    var s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/" + script;
    s.async = true;
    s.text = JSON.stringify(config);
    host.firstChild.appendChild(s);
  }

  /* ---------- data ---------- */
  function fetchJSON(url) {
    if (location.protocol.indexOf("http") !== 0) return Promise.resolve(null);
    return fetch(url + "?t=" + Math.floor(Date.now() / 300000))      // refresh at most every 5 min
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function loadEM() {
    return fetchJSON(BASE + "expected-moves.json").then(function (d) {
      if (!d || !d.tickers) return false;
      var changed = !emData || d.generatedAt !== emData.generatedAt;
      emData = d; emBySym = {};
      d.tickers.forEach(function (t) { if (!t.error) emBySym[t.symbol] = t; });
      if (changed) barCache = {};
      return changed;
    });
  }
  function loadBars(sym) {
    if (sym in barCache) return Promise.resolve(barCache[sym]);
    return fetchJSON(BASE + "bars/" + encodeURIComponent(sym) + ".json")
      .then(function (d) { barCache[sym] = d && d.bars ? d.bars : null; return barCache[sym]; });
  }

  /* ---------- candles ---------- */
  function bucketStart(t, key) {                     // t: New York wall-clock time as UTC seconds
    var c = IV[key], day = Math.floor(t / 86400) * 86400;
    if (c.day) return day;
    if (c.week) return day - ((new Date(day * 1000).getUTCDay() + 6) % 7) * 86400;
    if (c.session) {
      var open = day + 570 * 60;
      return open + Math.max(0, Math.floor((t - open) / c.secs)) * c.secs;
    }
    return Math.floor(t / c.secs) * c.secs;
  }
  function toCandles(rows, key) {
    var agg = IV[key].agg, out = [], cur = null;
    rows.forEach(function (r) {
      var t = agg ? bucketStart(r[0], key) : r[0];
      if (cur && cur.time === t) {
        cur.high = Math.max(cur.high, r[2]); cur.low = Math.min(cur.low, r[3]);
        cur.close = r[4]; cur.volume += r[5] || 0;
      } else {
        cur = { time: t, open: r[1], high: r[2], low: r[3], close: r[4], volume: r[5] || 0 };
        out.push(cur);
      }
    });
    return out;
  }

  /* ---------- technicals ---------- */
  function sma(data, n) {
    var out = [], sum = 0;
    for (var i = 0; i < data.length; i++) {
      sum += data[i].close;
      if (i >= n) sum -= data[i - n].close;
      if (i >= n - 1) out.push({ time: data[i].time, value: sum / n });
    }
    return out;
  }
  function ema(data, n) {                            // seeded with the first n-bar average
    var out = [], k = 2 / (n + 1), e = 0;
    for (var i = 0; i < data.length; i++) {
      if (i < n) { e += data[i].close / n; if (i === n - 1) out.push({ time: data[i].time, value: e }); continue; }
      e = data[i].close * k + e * (1 - k);
      out.push({ time: data[i].time, value: e });
    }
    return out;
  }
  function bollinger(data, n, k) {                   // SMA ± k population standard deviations
    var mid = [], up = [], lo = [];
    for (var i = n - 1; i < data.length; i++) {
      var sum = 0, sq = 0;
      for (var j = i - n + 1; j <= i; j++) { sum += data[j].close; sq += data[j].close * data[j].close; }
      var m = sum / n, sd = Math.sqrt(Math.max(0, sq / n - m * m)), t = data[i].time;
      mid.push({ time: t, value: m }); up.push({ time: t, value: m + k * sd }); lo.push({ time: t, value: m - k * sd });
    }
    return { mid: mid, up: up, lo: lo };
  }
  // VWAP the way TradingView draws it by default (anchor "Session", source hlc3): it restarts
  // every trading day. On daily / weekly candles each candle is its own anchor period.
  function vwap(data, intraday) {
    var out = [], pv = 0, vv = 0, day = null;
    data.forEach(function (b) {
      var tp = (b.high + b.low + b.close) / 3, v = b.volume || 0;
      var d = intraday ? Math.floor(b.time / 86400) : b.time;
      if (d !== day) { day = d; pv = 0; vv = 0; }
      pv += tp * v; vv += v;
      if (vv > 0) out.push({ time: b.time, value: pv / vv });
    });
    return out;
  }

  /* ---------- the chart (Lightweight Charts) ---------- */
  var chart = null, candles = null, ta = null, emLines = [], em = { lo: null, hi: null }, mode = "", req = 0;
  var liveFull = null, liveInfo = null;             // the charted candles, extended by live trades

  function theme(intraday) {
    return {
      layout: { background: { type: "solid", color: cssVar("--surface") }, textColor: cssVar("--text-muted"),
                fontFamily: cssVar("--font-body") || "Inter, system-ui, sans-serif" },
      grid: { vertLines: { color: cssVar("--border") }, horzLines: { color: cssVar("--border") } },
      rightPriceScale: { borderColor: cssVar("--border") },
      timeScale: { borderColor: cssVar("--border"), timeVisible: intraday, secondsVisible: false }
    };
  }
  function dropLW() {
    if (chart) chart.remove();
    chart = candles = ta = null; emLines = [];
  }
  function ensureLW(host) {
    if (mode === "lw" && chart) return;
    host.innerHTML = "";
    chart = LW.createChart(host, Object.assign({ autoSize: true, crosshair: { mode: LW.CrosshairMode.Normal } }, theme(true)));
    candles = chart.addCandlestickSeries({
      borderVisible: false,
      autoscaleInfoProvider: function (orig) {       // keep the expected-move lines on screen
        var r = orig();
        if (r && r.priceRange && em.lo != null) {
          r.priceRange.minValue = Math.min(r.priceRange.minValue, em.lo);
          r.priceRange.maxValue = Math.max(r.priceRange.maxValue, em.hi);
        }
        return r;
      }
    });
    mode = "lw";
  }
  function line(color, title, width, style) {
    return chart.addLineSeries({ color: color, lineWidth: width || 2, lineStyle: style || 0, title: title,
      priceLineVisible: false, lastValueVisible: !!title, crosshairMarkerVisible: false });
  }
  function ensureTA() {
    if (ta) return;
    var bb = alpha(TA_COLORS.bb, 0.75);
    ta = {
      vol: chart.addHistogramSeries({ priceScaleId: "vol", priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }),
      vwap: line(TA_COLORS.vwap, "VWAP"),
      ema: line(TA_COLORS.ema, "EMA 50"),
      sma: line(TA_COLORS.sma, "SMA 50"),
      bbUp: line(bb, "BB upper", 1, LW.LineStyle.Solid),
      bbMid: line(bb, "", 1, LW.LineStyle.Dashed),
      bbLo: line(bb, "BB lower", 1, LW.LineStyle.Solid)
    };
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
  }
  function drawTA(data, intraday, hasVol) {
    var on = st.view === "technicals";
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: on && hasVol ? 0.24 : 0.08 } });
    if (!on) { if (ta) Object.keys(ta).forEach(function (k) { ta[k].setData([]); }); return; }
    ensureTA();
    var up = alpha(cssVar("--up"), 0.45), down = alpha(cssVar("--down"), 0.45);
    ta.vol.setData(hasVol ? data.map(function (b) { return { time: b.time, value: b.volume, color: b.close >= b.open ? up : down }; }) : []);
    ta.vwap.setData(hasVol ? vwap(data, intraday) : []);
    ta.ema.setData(ema(data, 50));
    ta.sma.setData(sma(data, 50));
    var b = bollinger(data, 20, 2);
    ta.bbUp.setData(b.up); ta.bbMid.setData(b.mid); ta.bbLo.setData(b.lo);
  }
  function legend(intraday, hasVol, hasEM) {
    var el = document.getElementById("chart-legend");
    if (!el) return;
    if (st.view === "technicals") {
      el.innerHTML = (hasVol ? '<span class="lg ta-vol">▮ Volume</span> <span class="lg ta-vwap">— ' + "VWAP</span> " : "") +
        '<span class="lg ta-ema">— EMA 50</span> <span class="lg ta-sma">— SMA 50</span> <span class="lg ta-bb">— BB 20, 2</span>';
    } else if (!hasEM) {
      el.innerHTML = "";
    } else {
      el.innerHTML = '<span class="lg up">- - EM high</span> <span class="lg down">- - EM low</span> <span class="lg">··· center</span>';
    }
  }

  function drawLW(t, rows) {
    var host = document.getElementById("tv-chart");
    ensureLW(host);
    var c = IV[st.iv], intraday = !c.day && !c.week;
    chart.applyOptions(theme(intraday));
    var up = cssVar("--up"), down = cssVar("--down");
    candles.applyOptions({ upColor: up, downColor: down, wickUpColor: up, wickDownColor: down });

    var full = toCandles(rows, st.iv);
    var data = full.map(function (b) { return { time: b.time, open: b.open, high: b.high, low: b.low, close: b.close }; });
    var hasVol = full.some(function (b) { return b.volume > 0; });
    var b = (t && t[st.tf]) || {};
    emLines.forEach(function (l) { candles.removePriceLine(l); });
    emLines = [];
    em.lo = b.high != null ? b.low : null;
    em.hi = b.high != null ? b.high : null;
    candles.setData(data);
    drawTA(full, intraday, hasVol);
    legend(intraday, hasVol, b.high != null);
    liveFull = full; liveInfo = { sym: t.symbol, intraday: intraday, hasVol: hasVol };
    Live.watch(t.symbol);

    if (b.high != null) {
      var h = HORIZON[st.tf];
      emLines.push(candles.createPriceLine({ price: b.high, color: up, lineWidth: 2, lineStyle: LW.LineStyle.Dashed, axisLabelVisible: true, title: h + " EM high" }));
      emLines.push(candles.createPriceLine({ price: b.low, color: down, lineWidth: 2, lineStyle: LW.LineStyle.Dashed, axisLabelVisible: true, title: h + " EM low" }));
      emLines.push(candles.createPriceLine({ price: b.anchor != null ? b.anchor : t.price, color: cssVar("--text-faint"),
        lineWidth: 1, lineStyle: LW.LineStyle.Dotted, axisLabelVisible: true, title: "center" }));
    }
    if (data.length > c.show) chart.timeScale().setVisibleLogicalRange({ from: data.length - c.show, to: data.length + 2 });
    else chart.timeScale().fitContent();
  }

  /* ---------- live trades (Finnhub websocket), for the charted symbol ----------
     The data job refreshes every 30 minutes; between runs the newest candle, its volume and the
     indicators follow live trades. The free feed carries US stocks/ETFs and crypto, so indexes,
     futures and foreign markets update with the data job only. */
  var FH = { SPY: "SPY", QQQ: "QQQ", BTC: "BINANCE:BTCUSDT", XLK: "XLK", XLC: "XLC", XLY: "XLY", XLP: "XLP",
             XLF: "XLF", XLV: "XLV", XLI: "XLI", XLE: "XLE", XLU: "XLU", XLRE: "XLRE", XLB: "XLB" };
  var etFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  function etSeconds(ms) {                           // New York wall-clock time as UTC seconds (like the candle files)
    var p = {};
    etFmt.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second) / 1000;
  }
  function marketOpen(sym) {
    if (sym === "BTC") return true;                  // trades around the clock
    var p = {};
    etFmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var wd = new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay(), m = (+p.hour % 24) * 60 + (+p.minute);
    return wd >= 1 && wd <= 5 && m >= 570 && m < 960;
  }
  var Live = (function () {
    var KEY = (window.SITE && window.SITE.finnhubKey) || "", ws = null, sub = null, retry = 0, pend = null, timer = 0;
    function send(type, s) { if (ws && ws.readyState === 1 && s) ws.send(JSON.stringify({ type: type, symbol: s })); }
    function connect() {
      if (!KEY || !("WebSocket" in window) || ws) return;
      try { ws = new WebSocket("wss://ws.finnhub.io?token=" + encodeURIComponent(KEY)); } catch (e) { return; }
      ws.onopen = function () { retry = 0; send("subscribe", sub); };
      ws.onmessage = function (ev) {
        var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.type !== "trade" || !m.data) return;
        m.data.forEach(function (tr) {
          if (tr.s !== sub || !(tr.p > 0)) return;
          pend = pend || { vol: 0 };
          pend.price = tr.p; pend.ts = tr.t; pend.vol += tr.v || 0;
        });
        if (pend && !timer) timer = setTimeout(apply, 500);   // batch trades: at most two redraws a second
      };
      ws.onclose = function () { ws = null; setTimeout(connect, Math.min(30000, 1000 * Math.pow(2, retry++))); };
      ws.onerror = function () { try { ws.close(); } catch (e) {} };
    }
    function apply() {
      timer = 0;
      var P = pend; pend = null;
      if (!P || !liveFull || !liveFull.length || !candles || mode !== "lw" || !liveInfo || !marketOpen(liveInfo.sym)) return;
      var t = bucketStart(etSeconds(P.ts), st.iv), last = liveFull[liveFull.length - 1];
      if (t < last.time) return;
      if (t > last.time) { last = { time: t, open: P.price, high: P.price, low: P.price, close: P.price, volume: 0 }; liveFull.push(last); }
      last.high = Math.max(last.high, P.price); last.low = Math.min(last.low, P.price); last.close = P.price;
      last.volume += P.vol;
      candles.update({ time: last.time, open: last.open, high: last.high, low: last.low, close: last.close });
      if (st.view === "technicals") drawTA(liveFull, liveInfo.intraday, liveInfo.hasVol);
    }
    return {
      watch: function (sym) {                        // follow only the charted symbol
        var s = FH[sym] || null;
        if (s === sub) return;
        send("unsubscribe", sub);
        sub = s; pend = null;
        if (s) { connect(); send("subscribe", s); }
      }
    };
  })();

  function drawTV() {                                // TradingView's own chart (no data file for this symbol)
    Live.watch(null);
    dropLW();
    mode = "tv";
    var th = isDark() ? "dark" : "light";
    var el = document.getElementById("chart-legend");
    if (el) el.innerHTML = "";
    tvEmbed(document.getElementById("tv-chart"), "embed-widget-advanced-chart.js", {
      autosize: true, symbol: current[0], interval: TV_IV[st.iv] || "D", timezone: "America/New_York",
      theme: th, style: "1", locale: "en",
      backgroundColor: th === "dark" ? "rgba(22,21,17,1)" : "rgba(255,255,255,1)",
      hide_side_toolbar: true, allow_symbol_change: true, support_host: "https://www.tradingview.com",
      hide_volume: st.view !== "technicals",
      studies: st.view === "technicals" ? STUDIES : []
    });
  }

  // the expected-move readout in the chart header
  function readout(t) {
    var el = document.getElementById("chart-em");
    if (!t) { el.innerHTML = '<span class="muted">No expected move for this symbol</span>'; return; }
    if (t.noOptions) { el.innerHTML = '<span class="muted">No listed options · chart only</span>'; return; }
    var b = t[st.tf];
    if (!b) { el.innerHTML = ""; return; }
    var label = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" }[st.tf];
    el.innerHTML = '<span class="muted">' + label + " EM</span> ±" + num(b.move) +
      ' <span class="muted">(' + b.movePct.toFixed(2) + '%)</span> · <span class="down">' + num(b.low) +
      '</span> – <span class="up">' + num(b.high) + '</span> <span class="muted">· exp ' + esc(fmtDate(b.expiry)) +
      (t.emVia ? " · via " + esc(t.emVia.replace("^", "")) + " options" : "") + "</span>";
  }

  function marks() {
    [["#iv-seg [data-iv]", "data-iv", st.iv], ["#hz-seg [data-tf]", "data-tf", st.tf], ["#view-seg [data-view]", "data-view", st.view]]
      .forEach(function (g) {
        document.querySelectorAll(g[0]).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute(g[1]) === g[2] ? "true" : "false"); });
      });
  }

  function renderChart() {
    marks();
    document.getElementById("chart-sym").textContent = current[1];
    document.getElementById("chart-name").textContent = current[2];
    document.getElementById("chart-tv").href = "https://www.tradingview.com/chart/?symbol=" + encodeURIComponent(current[0]);
    var t = emBySym[current[1]] || null;
    readout(t);
    var my = ++req;
    if (!LW || !t) { drawTV(); return; }
    loadBars(current[1]).then(function (bars) {
      if (my !== req) return;                        // the user already picked something else
      var rows = bars && bars[IV[st.iv].src];
      if (rows && rows.length) drawLW(t, rows); else drawTV();
    });
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

  /* ---------- controls ---------- */
  document.getElementById("sym-groups").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sym]");
    if (!b) return;
    var sym = b.getAttribute("data-sym");
    Object.keys(M.symbols).forEach(function (g) { M.symbols[g].forEach(function (s) { if (s[0] === sym) current = s; }); });
    renderGroups(); renderChart();
  });
  function onSeg(id, attr, key, store) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("click", function (e) {
      var b = e.target.closest("[" + attr + "]");
      if (!b || b.getAttribute(attr) === st[key]) return;
      st[key] = b.getAttribute(attr);
      try { localStorage.setItem(store, st[key]); } catch (err) {}
      renderChart();
    });
  }
  onSeg("iv-seg", "data-iv", "iv", "sf-iv");
  onSeg("hz-seg", "data-tf", "tf", "sf-tf");
  onSeg("view-seg", "data-view", "view", "sf-chart-view");

  // the heat map calls this when a stock is clicked: chart it here
  window.MarketsSelect = function (sym) {
    current = [sym.replace("-", "."), sym, "S&P 500 stock"];
    renderGroups(); renderChart();
    document.querySelector(".chart-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  };

  function onTheme() { if (mode === "tv") drawTV(); else renderChart(); }
  new MutationObserver(onTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onTheme);

  renderGroups(); marks();
  loadEM().then(renderChart);
  setInterval(function () { loadEM().then(function (changed) { if (changed) renderChart(); }); }, 5 * 60000);
})();
