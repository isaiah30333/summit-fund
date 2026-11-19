/* Builds a page from window.CONTENT.pages[<page>] (content.js).
   Loaded at the end of <body> with data-page="overview|market|policy|competitions|join",
   so everything exists before site.js starts the reveal animations. */
(function () {
  var page = (document.currentScript && document.currentScript.getAttribute("data-page")) || "overview";
  var P = window.CONTENT && window.CONTENT.pages && window.CONTENT.pages[page];
  if (!P) return;
  var esc = window.SiteUtil.esc;

  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }
  function ext(x) { return x && x.external ? ' target="_blank" rel="noopener"' : ""; }
  function d(i) { return i % 4 ? ' style="--d:' + (i % 4) * 0.05 + 's"' : ""; }
  function set(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  function btns(list) {
    return (list || []).map(function (b) {
      return '<a class="btn' + (b.primary ? "" : " btn-ghost") + '" href="' + esc(b.href) + '"' + ext(b) + ">" + esc(b.label) + "</a>";
    }).join("");
  }
  function head(s) {
    return '<div class="section-head reveal"><p class="eyebrow">' + esc(s.eyebrow) + "</p><h2>" + esc(s.title) + "</h2>" +
      (s.intro ? '<p class="muted">' + fmt(s.intro) + "</p>" : "") + "</div>";
  }
  function wrap(s, body) { return '<section class="section"><div class="container">' + head(s) + body + "</div></section>"; }

  // Split cards for organizations (alumni firms, corporate donors): name + note on the left,
  // the logo on the right, always in full color on a white plate. No logo file → text wordmark.
  function firmGrid(items, extra) {
    return '<div class="firm-grid' + (extra ? " " + extra : "") + '">' + items.map(function (n, i) {
      var mark = n.logo
        ? '<img src="' + esc(n.logo) + '" alt="' + esc(n.name) + ' logo" loading="lazy">'
        : '<span class="firm-word">' + esc(n.name) + "</span>";
      return '<div class="card project firm-card reveal"' + d(i) + ">" +
        '<div class="firm-text"><h3>' + esc(n.name) + '</h3><p class="muted">' + esc(n.note) + "</p></div>" +
        '<div class="firm-logo' + (n.square ? " firm-logo--square" : "") + '">' + mark + "</div></div>";
    }).join("") + "</div>";
  }

  /* ---------- section types ---------- */
  var R = {
    cards: function (s) {
      return wrap(s, '<div class="about-grid">' + s.cards.map(function (c, i) {
        var cls = "about-card reveal" + (c.wide ? " about-wide" : "") + (c.full ? " about-full" : "");
        var items = c.items.map(function (x) {
          return "<li>" + (typeof x === "string" ? fmt(x) : '<a class="inline-link" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.label) + " ↗</a>") + "</li>";
        }).join("");
        return '<article class="' + cls + '"' + d(i) + '><h3 class="about-k">' + esc(c.title) + '</h3><ul class="about-list">' + items + "</ul></article>";
      }).join("") + "</div>");
    },

    photos: function (s) {
      return wrap(s, '<div class="photo-grid">' + s.cards.map(function (c, i) {
        var tag = c.href ? "a" : "div", href = c.href ? ' href="' + esc(c.href) + '"' + ext(c) : "";
        return "<" + tag + ' class="card project photo-card reveal"' + href + d(i) + ">" +
          '<div class="photo" role="img" aria-label="' + esc(c.title) + '" style="background-image:url(\'' + esc(c.img) + "');background-position:" + esc(c.pos || "center") + '"></div>' +
          '<div class="photo-body"><span class="tag">' + esc(c.meta) + "</span><h3>" + esc(c.title) + '</h3><p class="muted">' + fmt(c.text) + "</p>" +
          (c.link ? '<span class="card-link">' + esc(c.link) + (c.external ? " ↗" : " →") + "</span>" : "") + "</div></" + tag + ">";
      }).join("") + "</div>");
    },

    videos: function (s) {
      return wrap(s, '<div class="video-grid">' + s.videos.map(function (v, i) {
        return '<a class="card project video-card reveal" href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener"' + d(i) + ">" +
          '<div class="thumb" style="background-image:url(\'https://i.ytimg.com/vi/' + esc(v.id) + "/hqdefault.jpg')\"><span class=\"play\" aria-hidden=\"true\"></span></div>" +
          '<div class="photo-body"><h3>' + esc(v.title) + '</h3><p class="muted">' + esc(v.sub) + "</p></div></a>";
      }).join("") + "</div>");
    },

    names: function (s) {
      // logos: true → split cards (see firmGrid)
      if (s.logos) return wrap(s, firmGrid(s.items));
      return wrap(s, '<div class="name-grid">' + s.items.map(function (n, i) {
        return '<div class="card project name-card reveal"' + d(i) + "><h3>" + esc(n.name) + '</h3><p class="muted">' + esc(n.note) + "</p></div>";
      }).join("") + "</div>");
    },

    donors: function (s) {
      return wrap(s,
        '<p class="donor-thanks reveal">' + fmt(s.text) + "</p>" +
        firmGrid(s.corporate, "firm-grid--pair") +   // 4 donors: even 2 × 2
        '<ul class="donor-list reveal">' + s.individual.map(function (n) {
          return "<li><strong>" + esc(n.name) + "</strong><span>" + esc(n.note) + "</span></li>";
        }).join("") + "</ul>");
    },

    table: function (s) {
      return wrap(s, '<div class="card table-card reveal"><div class="table-scroll"><table class="ruled"><thead><tr>' +
        s.columns.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        s.rows.map(function (r) {
          return '<tr><td class="ruled-k">' + esc(r[0]) + '</td><td class="ruled-v mono">' + esc(r[1]) + '</td><td class="muted">' + esc(r[2]) + "</td></tr>";
        }).join("") + "</tbody></table></div></div>");
    },

    tiles: function (s) {
      return wrap(s, '<div class="facts facts--notes reveal">' + s.items.map(function (t) {
        return '<div><span class="fact-k">' + esc(t.k) + '</span><span class="fact-v tile-v">' + esc(t.v) + '</span><span class="tile-note">' + fmt(t.note) + "</span></div>";
      }).join("") + "</div>");
    },

    steps: function (s) {   // numbered: the order is the process
      return wrap(s, '<ol class="steps">' + s.items.map(function (t, i) {
        return '<li class="card project reveal"' + d(i) + '><span class="step-n mono">' + (i + 1) + '</span><p>' + fmt(t) + "</p></li>";
      }).join("") + "</ol>");
    },

    links: function (s) {
      return wrap(s, '<div class="grid grid-2">' + s.cards.map(function (c, i) {
        var aux = (c.aux || []).map(function (a) { return '<a class="aux-link" href="' + esc(a[1]) + '" target="_blank" rel="noopener">' + esc(a[0]) + " ↗</a>"; }).join("");
        return '<div class="card project link-card reveal' + (c.full ? " span-full" : "") + '"' + d(i) + ">" +
          (c.img ? '<img class="link-logo" src="' + esc(c.img) + '" alt="" loading="lazy">' : "") +
          '<span class="tag">' + esc(c.tag) + "</span><h3>" + esc(c.name) + '</h3><p class="muted">' + fmt(c.detail) + "</p>" +
          '<div class="link-row"><a class="card-link" href="' + esc(c.url) + '" target="_blank" rel="noopener">Visit site ↗</a>' + aux + "</div></div>";
      }).join("") + "</div>");
    },

    cta: function (s) {
      return '<section class="section"><div class="container"><div class="contact-card reveal"><div><p class="eyebrow">' + esc(s.eyebrow) +
        "</p><h2>" + esc(s.title) + '</h2><p class="muted">' + fmt(s.text) + '</p></div><div class="cta-row cta-stack">' + btns(s.buttons) + "</div></div></div></section>";
    }
  };

  /* ---------- page head / hero ---------- */
  if (P.hero) {
    set("hero-lead", fmt(P.hero.lead));
    set("hero-cta", btns(P.hero.buttons));
  }
  if (P.facts) {
    set("facts", P.facts.map(function (f) { return '<div><span class="fact-k">' + esc(f.k) + '</span><span class="fact-v">' + esc(f.v) + "</span></div>"; }).join(""));
  }
  if (P.head) {
    set("page-head", '<p class="eyebrow">' + esc(P.head.eyebrow) + '</p><h1 class="h-page">' + esc(P.head.title) + '</h1><p class="muted">' + fmt(P.head.text) + "</p>");
    if (P.head.title) document.title = P.head.eyebrow + " · " + (window.SITE && window.SITE.name || "");
  }
  set("sections", (P.sections || []).map(function (s) { return R[s.type] ? R[s.type](s) : ""; }).join(""));
})();
