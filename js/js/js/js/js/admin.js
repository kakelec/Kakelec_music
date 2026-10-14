(function () {
  var t = I18N.t;
  var esc = App.esc;
  var sb = App.sb;

  I18N.add({
    fa: {
      no_access: "شما دسترسی مدیر ندارید", users: "کاربران", submitted_by: "ارسال‌کننده",
      license_info: "مجوز / منبع", approve: "تأیید", reject: "رد",
      reject_prompt: "دلیل رد را بنویسید (اختیاری):", confirm_delete: "این آهنگ برای همیشه حذف شود؟",
      allow_download_opt: "اجازه‌ی دانلود این آهنگ", saved: "ذخیره شد", status_label: "وضعیت"
    },
    en: {
      no_access: "You do not have admin access", users: "Users", submitted_by: "Submitted by",
      license_info: "License / source", approve: "Approve", reject: "Reject",
      reject_prompt: "Enter the reason for rejection (optional):", confirm_delete: "Delete this song permanently?",
      allow_download_opt: "Allow downloading this song", saved: "Saved", status_label: "Status"
    },
    ru: {
      no_access: "У вас нет прав администратора", users: "Пользователи", submitted_by: "Отправил",
      license_info: "Лицензия / источник", approve: "Одобрить", reject: "Отклонить",
      reject_prompt: "Укажите причину отказа (необязательно):", confirm_delete: "Удалить эту песню навсегда?",
      allow_download_opt: "Разрешить скачивание этой песни", saved: "Сохранено", status_label: "Статус"
    }
  });

  function safeUrl(u) { return /^https?:\/\//i.test(u || ""); }
  function loading() { return '<p class="muted">' + esc(t("loading")) + "</p>"; }

  function denied(el) {
    el.innerHTML = "<h1>" + esc(t("admin")) + "</h1>" + App.msg("error", t("no_access"));
  }

  function reviewFields() {
    return { reviewed_by: App.session.user.id, reviewed_at: new Date().toISOString() };
  }

  async function updateSong(id, fields) {
    var r = await sb.from("songs").update(fields).eq("id", id).select("id");
    if (r.error) throw r.error;
    if (!r.data || !r.data.length) throw new Error(t("no_access"));
  }

  function card(s, names) {
    var src = s.source_type === "file" ? t("source_file") : t("source_link");
    var h = '<div class="card" data-id="' + esc(s.id) + '">' +
      '<a href="#/song/' + esc(s.id) + '"><b>' + esc(s.title) + "</b></a>" +
      '<div class="muted">' + esc(s.artist_name) + " · " + esc(src) + "</div>" +
      '<div class="muted">' + esc(t("submitted_by")) + ": " + esc(names[s.submitted_by] || "-") + "</div>";
    if (s.external_url) {
      h += '<div class="muted" dir="ltr" style="word-break:break-all">' +
        (safeUrl(s.external_url)
          ? '<a href="' + esc(s.external_url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.external_url) + "</a>"
          : esc(s.external_url)) + "</div>";
    }
    if (s.license_note) h += '<div class="muted">' + esc(t("license_info")) + ": " + esc(s.license_note) + "</div>";
    if (s.status === "rejected" && s.reject_reason) h += '<div class="muted">' + esc(t("reject_reason")) + ": " + esc(s.reject_reason) + "</div>";
    if (s.status !== "approved") {
      h += '<label class="check" style="margin-top:8px"><input type="checkbox" class="dl"' + (s.allow_download ? " checked" : "") + "><span>" + esc(t("allow_download_opt")) + "</span></label>";
    }
    h += '<div class="row-actions">';
    if (s.status !== "approved") h += '<button class="btn small ok" data-act="approve">' + esc(t("approve")) + "</button>";
    if (s.status !== "rejected") h += '<button class="btn small danger" data-act="reject">' + esc(t("reject")) + "</button>";
    h += '<button class="btn small secondary" data-act="edit">' + esc(t("edit")) + "</button>";
    h += '<button class="btn small secondary" data-act="delete">' + esc(t("delete")) + "</button>";
    h += "</div></div>";
    return h;
  }

  async function queuePage(el, tab) {
    var h = location.hash;
    var tabs = ["pending", "approved", "rejected", "users"];
    if (tabs.indexOf(tab) < 0) tab = "pending";

    el.innerHTML =
      "<h1>" + esc(t("admin")) + "</h1>" +
      '<div class="tabs">' + tabs.map(function (k) {
        var label = k === "users" ? t("users") : t("status_" + k);
        return '<button data-tab="' + k + '" class="' + (k === tab ? "active" : "") + '">' + esc(label) + "</button>";
      }).join("") + "</div>" +
      '<div id="admin-msg"></div><div id="admin-list">' + loading() + "</div>";

    el.querySelectorAll("[data-tab]").forEach(function (b) {
      b.onclick = function () { App.go("admin/" + b.getAttribute("data-tab")); };
    });

    var list = document.getElementById("admin-list");
    function say(type, text) { var m = document.getElementById("admin-msg"); if (m) m.innerHTML = App.msg(type, text); }

    if (tab === "users") {
      var u = await sb.from("profiles").select("id,display_name,role,created_at").order("created_at", { ascending: false });
      if (location.hash !== h) return;
      if (u.error) { list.innerHTML = App.msg("error", u.error.message); return; }
      list.innerHTML = u.data.map(function (p) {
        return '<div class="card"><b>' + esc(p.display_name || "-") + "</b> " +
          (p.role === "admin" ? '<span class="badge approved">' + esc(t("role_admin")) + "</span>" : '<span class="muted">' + esc(t("role_user")) + "</span>") +
          '<div class="muted">' + esc(new Date(p.created_at).toLocaleDateString(I18N.lang)) + "</div></div>";
      }).join("");
      return;
    }

    var r = await sb.from("songs").select("*").eq("status", tab).order("created_at", { ascending: false });
    if (location.hash !== h) return;
    if (r.error) { list.innerHTML = App.msg("error", r.error.message); return; }
    if (!r.data.length) { list.innerHTML = '<p class="empty">' + esc(t("no_results")) + "</p>"; return; }

    var ids = [];
    r.data.forEach(function (s) { if (ids.indexOf(s.submitted_by) < 0) ids.push(s.submitted_by); });
    var names = {};
    var pr = await sb.from("profiles").select("id,display_name").in("id", ids);
    if (pr.data) pr.data.forEach(function (p) { names[p.id] = p.display_name; });
    if (location.hash !== h) return;

    var byId = {};
    r.data.forEach(function (s) { byId[s.id] = s; });
    list.innerHTML = r.data.map(function (s) { return card(s, names); }).join("");

    list.onclick = async function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      var box = btn.closest("[data-id]");
      var id = box.getAttribute("data-id");
      var act = btn.getAttribute("data-act");
      var s = byId[id];
      try {
        if (act === "edit") { App.go("admin/edit/" + id); return; }
        btn.disabled = true;
        if (act === "approve") {
          var dl = box.querySelector(".dl");
          await updateSong(id, Object.assign({
            status: "approved",
            allow_download: dl ? dl.checked : !!s.allow_download,
            reject_reason: null
          }, reviewFields()));
        } else if (act === "reject") {
          var reason = window.prompt(t("reject_prompt"), "");
          if (reason === null) { btn.disabled = false; return; }
          await updateSong(id, Object.assign({
            status: "rejected",
            allow_download: false,
            reject_reason: reason.trim() || null
          }, reviewFields()));
        } else if (act === "delete") {
          if (!window.confirm(t("confirm_delete"))) { btn.disabled = false; return; }
          if (s.file_path) {
            var rm = await sb.storage.from(App.cfg.BUCKET).remove([s.file_path]);
            if (rm.error) throw rm.error;
          }
          var d = await sb.from("songs").delete().eq("id", id).select("id");
          if (d.error) throw d.error;
          if (!d.data || !d.data.length) throw new Error(t("no_access"));
        }
        App.render();
      } catch (err) {
        btn.disabled = false;
        say("error", err.message || String(err));
      }
    };
  }

  async function editPage(el, id) {
    var h = location.hash;
    el.innerHTML = loading();
    var r = await sb.from("songs").select("*").eq("id", id).maybeSingle();
    if (location.hash !== h) return;
    if (r.error) { el.innerHTML = App.msg("error", r.error.message); return; }
    var s = r.data;
    if (!s) { el.innerHTML = '<p class="empty">' + esc(t("no_results")) + "</p>"; return; }

    function inp(fid, label, value, extra) {
      return '<div class="field"><label>' + esc(label) + '</label><input id="' + fid + '" type="text" value="' + esc(value == null ? "" : value) + '" ' + (extra || "") + "></div>";
    }
    function area(fid, label, value) {
      return '<div class="field"><label>' + esc(label) + '</label><textarea id="' + fid + '">' + esc(value || "") + "</textarea></div>";
    }
    function opt(v) {
      return '<option value="' + v + '"' + (s.status === v ? " selected" : "") + ">" + esc(t("status_" + v)) + "</option>";
    }

    el.innerHTML =
      "<h1>" + esc(t("edit")) + "</h1><div id=\"ed-msg\"></div>" +
      inp("e-title", t("song_title"), s.title) +
      inp("e-artist", t("artist"), s.artist_name) +
      inp("e-album", t("album"), s.album) +
      inp("e-year", t("year"), s.year, 'inputmode="numeric" maxlength="4"') +
      inp("e-genre", t("genre"), s.genre) +
      area("e-desc", t("description"), s.description) +
      (s.source_type === "link" ? inp("e-url", t("link_url"), s.external_url, 'dir="ltr"') : "") +
      '<div class="field"><label>' + esc(t("status_label")) + '</label><select id="e-status">' + opt("pending") + opt("approved") + opt("rejected") + "</select></div>" +
      '<label class="check"><input type="checkbox" id="e-dl"' + (s.allow_download ? " checked" : "") + "><span>" + esc(t("allow_download_opt")) + "</span></label>" +
      area("e-reason", t("reject_reason"), s.reject_reason) +
      '<button class="btn block" id="e-save">' + esc(t("save")) + "</button>" +
      '<a class="btn secondary block" style="margin-top:10px" href="#/admin">' + esc(t("cancel")) + "</a>";

    function val(x) { return document.getElementById(x).value.trim(); }
    function say(type, text) { document.getElementById("ed-msg").innerHTML = App.msg(type, text); }

    var btn = document.getElementById("e-save");
    btn.onclick = async function () {
      var title = val("e-title");
      var artist = val("e-artist");
      var year = val("e-year");
      var status = val("e-status");
      if (!title || !artist) { say("error", t("err_required")); return; }
      if (year && (!/^\d{4}$/.test(year) || +year < 1800 || +year > 2100)) { say("error", t("err_year")); return; }

      var fields = {
        title: title,
        artist_name: artist,
        album: val("e-album") || null,
        year: year ? +year : null,
        genre: val("e-genre") || null,
        description: val("e-desc") || null,
        status: status,
        allow_download: status === "approved" && document.getElementById("e-dl").checked,
        reject_reason: status === "rejected" ? (val("e-reason") || null) : null
      };
      if (s.source_type === "link") {
        var url = val("e-url");
        if (!/^https?:\/\/\S+$/i.test(url)) { say("error", t("err_url")); return; }
        fields.external_url = url;
      }
      if (status !== "pending") Object.assign(fields, reviewFields());

      btn.disabled = true;
      try {
        await updateSong(id, fields);
        App.go("admin");
      } catch (err) {
        btn.disabled = false;
        say("error", err.message || String(err));
      }
    };
  }

  App.route("admin", function (el, arg) {
    if (!App.isAdmin()) { denied(el); return; }
    if (arg && arg.indexOf("edit/") === 0) return editPage(el, arg.slice(5));
    return queuePage(el, arg || "pending");
  });
})();
