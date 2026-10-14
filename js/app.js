(function () {
  if (!window.supabase) {
    document.body.innerHTML = '<p style="padding:24px;color:#fff">Error: cannot load the Supabase library. Check your internet connection or VPN.</p>';
    return;
  }
  var cfg = window.APP_CONFIG;
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
  var lastUserId = null;

  I18N.add({
    fa: { account: "حساب من" },
    en: { account: "My account" },
    ru: { account: "Мой аккаунт" }
  });

  var App = {
    sb: sb,
    cfg: cfg,
    session: null,
    profile: null,
    routes: {},
    route: function (name, fn) { App.routes[name] = fn; },
    isAdmin: function () { return !!(App.profile && App.profile.role === "admin"); },
    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    msg: function (type, text) {
      return '<div class="msg ' + type + '">' + App.esc(text) + "</div>";
    },
    go: function (path) { location.hash = "#/" + path; },
    render: function () { render(); },
    reloadAuth: function () { return loadAuth(); },
    play: function (title, url) {
      var box = document.getElementById("player");
      var audio = document.getElementById("audio");
      document.getElementById("player-title").textContent = title;
      audio.src = url;
      box.classList.remove("hidden");
      audio.play().catch(function () {});
    }
  };
  window.App = App;

  async function loadAuth() {
    var res = await sb.auth.getSession();
    App.session = res.data.session;
    App.profile = null;
    if (App.session) {
      var p = await sb.from("profiles").select("*").eq("id", App.session.user.id).single();
      App.profile = p.data;
    }
  }

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("/");
    return {
      name: parts[0] || "home",
      arg: parts.length > 1 ? decodeURIComponent(parts.slice(1).join("/")) : ""
    };
  }

  function buildLangSelect() {
    var sel = document.getElementById("lang-select");
    sel.innerHTML = Object.keys(I18N.LANGS).map(function (l) {
      return '<option value="' + l + '"' + (l === I18N.lang ? " selected" : "") + ">" + I18N.LANGS[l].name + "</option>";
    }).join("");
    sel.onchange = function () { I18N.set(sel.value); };
  }

  function buildNav() {
    var r = parseHash().name;
    var items = [
      { id: "home", ico: "🏠", label: I18N.t("home") },
      { id: "search", ico: "🔍", label: I18N.t("search") },
      { id: "submit", ico: "⬆️", label: I18N.t("submit") },
      App.session
        ? { id: "account", ico: "👤", label: I18N.t("account") }
        : { id: "login", ico: "👤", label: I18N.t("login") }
    ];
    if (App.isAdmin()) items.push({ id: "admin", ico: "🛠️", label: I18N.t("admin") });
    var active = r;
    if (r === "song" || r === "artist") active = "home";
    if (r === "signup") active = "login";
    document.getElementById("nav").innerHTML = items.map(function (i) {
      return '<a href="#/' + i.id + '" class="' + (i.id === active ? "active" : "") + '"><span class="ico">' + i.ico + "</span>" + App.esc(i.label) + "</a>";
    }).join("");
  }

  function showLangScreen() {
    var el = document.getElementById("lang-screen");
    document.getElementById("shell").classList.add("hidden");
    el.classList.remove("hidden");
    el.innerHTML =
      '<div class="logo">Kakelek</div>' +
      '<div class="muted">زبان را انتخاب کنید · Choose your language · Выберите язык</div>' +
      Object.keys(I18N.LANGS).map(function (l) {
        return '<button class="lang-btn" data-lang="' + l + '">' + I18N.LANGS[l].name + "</button>";
      }).join("");
    el.querySelectorAll("[data-lang]").forEach(function (b) {
      b.onclick = function () { I18N.set(b.getAttribute("data-lang")); };
    });
  }

  function showError(e) {
    document.getElementById("app").innerHTML = App.msg("error", I18N.t("error") + ": " + ((e && e.message) || e));
  }

  function render() {
    if (!I18N.lang) { showLangScreen(); return; }
    document.getElementById("lang-screen").classList.add("hidden");
    document.getElementById("shell").classList.remove("hidden");
    I18N.apply();
    buildLangSelect();
    buildNav();
    var r = parseHash();
    var el = document.getElementById("app");
    var fn = App.routes[r.name] || App.routes.home || function (box) {
      box.innerHTML = '<p class="empty">...</p>';
    };
    el.innerHTML = "";
    window.scrollTo(0, 0);
    try {
      var res = fn(el, r.arg);
      if (res && res.catch) res.catch(showError);
    } catch (e) {
      showError(e);
    }
  }

  async function init() {
    await loadAuth();
    lastUserId = App.session ? App.session.user.id : null;
    sb.auth.onAuthStateChange(function (event, session) {
      var uid = session ? session.user.id : null;
      if (uid === lastUserId) return;
      lastUserId = uid;
      setTimeout(async function () {
        await loadAuth();
        render();
      }, 0);
    });
    window.addEventListener("hashchange", render);
    window.addEventListener("langchange", render);
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
