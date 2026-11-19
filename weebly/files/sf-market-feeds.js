/* Top stories + economic calendar (TradingView widgets), side by side under the heat map.
   Follows the site's light/dark theme. Markup: #feeds with #feed-news and #feed-cal inside. */
(function () {
  var news = document.getElementById("feed-news");
  var cal = document.getElementById("feed-cal");
  if (!news && !cal) return;
  var root = document.documentElement;

  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function embed(host, script, config) {
    if (!host) return;
    host.innerHTML = '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';
    var s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/" + script;
    s.async = true;
    s.text = JSON.stringify(config);
    host.firstChild.appendChild(s);
  }

  var shown = null;
  function render() {
    var theme = isDark() ? "dark" : "light";
    if (theme === shown) return;
    shown = theme;
    embed(news, "embed-widget-timeline.js", {
      feedMode: "market", market: "stock", displayMode: "regular",
      isTransparent: true, colorTheme: theme, width: "100%", height: "100%", locale: "en"
    });
    embed(cal, "embed-widget-events.js", {
      isTransparent: true, colorTheme: theme, width: "100%", height: "100%", locale: "en",
      importanceFilter: "0,1", countryFilter: "us"
    });
  }

  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
  render();
})();
