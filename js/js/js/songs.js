(function () {
  var t = I18N.t;
  var esc = App.esc;
  var sb = App.sb;

  I18N.add({
    fa: {
      latest_songs: "تازه‌ترین آهنگ‌ها", search_placeholder: "نام آهنگ یا خواننده...",
      play: "پخش", download: "دانلود", open_link: "باز کردن لینک",
      no_download: "دانلود برای این آهنگ مجاز نشده است", songs_count: "{n} آهنگ",
      play_error: "پخش آهنگ ممکن نشد", no_songs_yet: "هنوز آهنگی منتشر نشده است",
      type_to_search: "حداقل دو حرف بنویسید"
    },
    en: {
      latest_songs: "Latest songs", search_placeholder: "Song or artist name...",
      play: "Play", download: "Download", open_link: "Open link",
      no_download: "Download is not enabled for this song", songs_count: "{n} songs",
      play_error: "Could not play this song", no_songs_yet: "No songs have been published yet",
      type_to_search: "Type at least 2 characters"
    },
    ru: {
      latest_songs: "Новые песни", search_placeholder: "Название песни или исполнитель...",
      play: "Играть", download: "Скачать", open_link: "Открыть ссылку",
      no_download: "Скачивание для этой песни недоступно", songs_count: "Песен: {n}",
      play_error: "Не удалось воспроизвести песню", no_songs_yet: "Пока нет опубликованных песен",
      type_to_search: "Введите не менее 2 символов"
    }
  });

  function safeUrl(u) { return /^https?:\/\//i.test(u || ""); }
  function isAudioUrl(u) { return /\.(mp3|m4a|aac|ogg|wav|flac)(\?.*)?$/i.test(u || ""); }
  function clean(q) { return q.replace(/[,()*%\\"]/g, " ").trim(); }
  function loading() { return '<p class="muted">' + esc(t("loading")) + "</p>"; }
  function fail(el, e) { el.innerHTML = App.msg("error", (e && e.message) || String(e)); }

  function songItem(s) {
    return '<a class="song-item" href="#/song/' + esc(s.id) + '" style="color:inherit">' +
      '<div class="thumb">🎵</div><div class="meta"><div class="title">' + esc(s.title) +
      '</div><div class="sub">' + esc(s.artist_name) + "</div></div></a>";
  }

  function artistItem(a) {
    return '<a class="song-item" href="#/artist/' + encodeURIComponent(a.artist_name) + '" style="color:inherit">' +
      '<div class="thumb">🎤</div><div class="meta"><div class="title">' + esc(a.artist_name) +
      '</div><div class="sub">' + esc(t("songs_count", { n: a.songs_count })) + "</div></div></a>";
  }

  async function getFileUrl(path, downloadName) {
    var opts = downloadName ? { download: downloadName } : undefined;
    var r = await sb.storage.from(App.cfg.BUCKET).createSignedUrl(path, 3600, opts);
    if (r.error) throw r.error;
    return r.data.signedUrl;
  }

  App.route("home", async function (el) {
    var h = location.hash;
    el.innerHTML = loading();
    var r = await Promise.all([
      sb.from("songs").select("id,title,artist_name").eq("status", "approved")
        .order("created_at", { ascending: false }).limit(20),
      sb.from("approved_artists").select("*").order("songs_count", { ascending: false }).limit(12)
    ]);
    if (location.hash !== h) return;
    if (r[0].error) { fail(el, r[0].error); return; }
    var html = "<h2>" + esc(t("latest_songs")) + "</h2>";
    html += r[0].data.length ? r[0].data.map(songItem).join("") : '<p class="empty">' + esc(t("no_songs_yet")) + "</p>";
    if (r[1].data && r[1].data.length) {
      html += "<h2>" + esc(t("artists")) + "</h2>" + r[1].data.map(artistItem).join("");
    }
    el.innerHTML = html;
  });

  App.route("search", function (el) {
    el.innerHTML =
      "<h1>" + esc(t("search")) + "</h1>" +
      '<div class="field"><input id="q" type="search" placeholder="' + esc(t("search_placeholder")) + '"></div>' +
      '<div id="results"><p class="muted">' + esc(t("type_to_search")) + "</p></div>";
    var input = document.getElementById("q");
    var timer = null;
    var seq = 0;

    async function run() {
      var my = ++seq;
      var box = document.getElementById("results");
      if (!box) return;
      var q = clean(input.value);
      if (q.length < 2) { box.innerHTML = '<p class="muted">' + esc(t("type_to_search")) + "</p>"; return; }
      var r = await Promise.all([
        sb.from("songs").select("id,title,artist_name").eq("status", "approved")
          .or("title.ilike.*" + q + "*,artist_name.ilike.*" + q + "*").limit(30),
        sb.from("approved_artists").select("*").ilike("artist_name", "*" + q + "*").limit(10)
      ]);
      if (my !== seq || !document.getElementById("results")) return;
      if (r[0].error) { box.innerHTML = App.msg("error", r[0].error.message); return; }
      var html = "";
      if (r[1].data && r[1].data.length) html += "<h2>" + esc(t("artists")) + "</h2>" + r[1].data.map(artistItem).join("");
      if (r[0].data.length) html += "<h2>" + esc(t("songs")) + "</h2>" + r[0].data.map(songItem).join("");
      box.innerHTML = html || '<p class="empty">' + esc(t("no_results")) + "</p>";
    }

    input.oninput = function () { clearTimeout(timer); timer = setTimeout(run, 350); };
  });

  App.route("artist", async function (el, name) {
    var h = location.hash;
    el.innerHTML = loading();
    var r = await sb.from("songs").select("id,title,artist_name").eq("status", "approved")
      .eq("artist_name", name).order("title");
    if (location.hash !== h) return;
    if (r.error) { fail(el, r.error); return; }
    el.innerHTML = "<h1>" + esc(name) + "</h1>" +
      (r.data.length ? r.data.map(songItem).join("") : '<p class="empty">' + esc(t("no_results")) + "</p>");
  });

  App.route("song", async function (el, id) {
    var h = location.hash;
    el.innerHTML = loading();
    var res = await sb.from("songs").select("*").eq("id", id).maybeSingle();
    if (location.hash !== h) return;
    if (res.error) { fail(el, res.error); return; }
    var s = res.data;
    if (!s) { el.innerHTML = '<p class="empty">' + esc(t("no_results")) + "</p>"; return; }

    var isFile = s.source_type === "file";
    var canPlay = isFile || (safeUrl(s.external_url) && isAudioUrl(s.external_url));
    var canOpen = !isFile && safeUrl(s.external_url);
    var canDownload = !!s.allow_download && (s.status === "approved" || App.isAdmin());
    var meta = [s.album, s.year, s.genre].filter(Boolean).map(esc).join(" · ");

    var html =
      '<div class="detail-cover">🎵</div><div class="detail-info"><h1>' + esc(s.title) + "</h1>" +
      '<a href="#/artist/' + encodeURIComponent(s.artist_name) + '">' + esc(s.artist_name) + "</a>" +
      (meta ? '<div class="muted">' + meta + "</div>" : "") +
      (s.status !== "approved" ? '<div><span class="badge ' + s.status + '">' + esc(t("status_" + s.status)) + "</span></div>" : "") +
      "</div>" +
      '<div id="song-msg"></div><div class="row-actions" style="justify-content:center">';
    if (canPlay) html += '<button class="btn" id="btn-play">▶ ' + esc(t("play")) + "</button>";
    if (canOpen && !canPlay) html += '<a class="btn" href="' + esc(s.external_url) + '" target="_blank" rel="noopener noreferrer">🔗 ' + esc(t("open_link")) + "</a>";
    if (canDownload) html += '<button class="btn secondary" id="btn-dl">⬇ ' + esc(t("download")) + "</button>";
    html += "</div>";
    if (!canDownload) html += '<p class="muted" style="text-align:center;margin-top:10px">' + esc(t("no_download")) + "</p>";
    if (s.description) html += '<div class="card" style="margin-top:16px">' + esc(s.description).replace(/\n/g, "<br>") + "</div>";
    if (App.isAdmin()) html += '<div class="row-actions" style="justify-content:center;margin-top:16px"><a class="btn small secondary" href="#/admin/edit/' + esc(s.id) + '">✏️ ' + esc(t("edit")) + "</a></div>";
    el.innerHTML = html;

    function say(type, text) { var m = document.getElementById("song-msg"); if (m) m.innerHTML = App.msg(type, text); }

    var bp = document.getElementById("btn-play");
    if (bp) bp.onclick = async function () {
      try {
        var url = isFile ? await getFileUrl(s.file_path) : s.external_url;
        App.play(s.title + " — " + s.artist_name, url);
      } catch (e) { say("error", t("play_error") + ": " + e.message); }
    };

    var bd = document.getElementById("btn-dl");
    if (bd) bd.onclick = async function () {
      try {
        if (isFile) {
          var ext = (s.file_path.split(".").pop() || "mp3");
          var fname = (s.artist_name + " - " + s.title).replace(/[\\/:*?"<>|]/g, "_") + "." + ext;
          window.location.href = await getFileUrl(s.file_path, fname);
        } else if (canOpen) {
          window.open(s.external_url, "_blank", "noopener");
        }
      } catch (e) { say("error", e.message); }
    };
  });
})();
