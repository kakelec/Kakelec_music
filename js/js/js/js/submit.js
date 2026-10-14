(function () {
  var t = I18N.t;
  var esc = App.esc;
  var sb = App.sb;

  I18N.add({
    fa: {
      submit_title: "ارسال آهنگ", need_login: "برای ارسال آهنگ ابتدا وارد شوید.",
      song_title: "نام آهنگ", artist: "خواننده", album: "آلبوم (اختیاری)",
      year: "سال (اختیاری)", genre: "سبک (اختیاری)", description: "توضیحات (اختیاری)",
      source: "روش ارسال", source_file: "آپلود فایل صوتی", source_link: "لینک آهنگ",
      choose_file: "فایل صوتی (mp3, m4a, aac, ogg, wav, flac - حداکثر ۲۰ مگابایت)",
      link_url: "آدرس لینک (با https شروع شود)", license_note: "توضیح درباره‌ی مجوز یا منبع (اختیاری)",
      license_confirm: "تأیید می‌کنم که مالک این اثر هستم یا مجوز انتشار و دانلود آن را دارم.",
      submit_btn: "ارسال برای بررسی", uploading: "در حال ارسال... لطفاً صبر کنید",
      submit_ok: "آهنگ ارسال شد و پس از بررسی مدیر منتشر می‌شود.",
      send_another: "ارسال آهنگ دیگر", err_required: "نام آهنگ و خواننده الزامی است",
      err_year: "سال نامعتبر است", err_file: "یک فایل صوتی انتخاب کنید",
      err_file_type: "فرمت فایل مجاز نیست", err_file_big: "حجم فایل بیشتر از ۲۰ مگابایت است",
      err_url: "آدرس لینک معتبر نیست", err_license: "باید مالکیت یا مجوز را تأیید کنید"
    },
    en: {
      submit_title: "Submit a song", need_login: "Please log in to submit a song.",
      song_title: "Song title", artist: "Artist", album: "Album (optional)",
      year: "Year (optional)", genre: "Genre (optional)", description: "Description (optional)",
      source: "Submission method", source_file: "Upload an audio file", source_link: "Link to the song",
      choose_file: "Audio file (mp3, m4a, aac, ogg, wav, flac - max 20 MB)",
      link_url: "Link address (starting with https)", license_note: "License or source details (optional)",
      license_confirm: "I confirm that I own this work or have permission to publish and distribute it.",
      submit_btn: "Submit for review", uploading: "Submitting... please wait",
      submit_ok: "Song submitted. It will be published after admin review.",
      send_another: "Submit another song", err_required: "Song title and artist are required",
      err_year: "Invalid year", err_file: "Choose an audio file",
      err_file_type: "This file format is not allowed", err_file_big: "File is larger than 20 MB",
      err_url: "Invalid link address", err_license: "You must confirm ownership or permission"
    },
    ru: {
      submit_title: "Отправить песню", need_login: "Войдите, чтобы отправить песню.",
      song_title: "Название песни", artist: "Исполнитель", album: "Альбом (необязательно)",
      year: "Год (необязательно)", genre: "Жанр (необязательно)", description: "Описание (необязательно)",
      source: "Способ отправки", source_file: "Загрузить аудиофайл", source_link: "Ссылка на песню",
      choose_file: "Аудиофайл (mp3, m4a, aac, ogg, wav, flac - до 20 МБ)",
      link_url: "Адрес ссылки (начинается с https)", license_note: "Сведения о лицензии или источнике (необязательно)",
      license_confirm: "Подтверждаю, что я владелец этого произведения или имею разрешение на его публикацию и распространение.",
      submit_btn: "Отправить на проверку", uploading: "Отправка... пожалуйста, подождите",
      submit_ok: "Песня отправлена. Она будет опубликована после проверки администратором.",
      send_another: "Отправить ещё одну песню", err_required: "Название песни и исполнитель обязательны",
      err_year: "Неверный год", err_file: "Выберите аудиофайл",
      err_file_type: "Этот формат файла не разрешён", err_file_big: "Файл больше 20 МБ",
      err_url: "Неверный адрес ссылки", err_license: "Нужно подтвердить права или разрешение"
    }
  });

  var MIME = { mp3: "audio/mpeg", m4a: "audio/x-m4a", aac: "audio/aac", ogg: "audio/ogg", wav: "audio/wav", flac: "audio/flac" };
  var MAX = 20 * 1024 * 1024;

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function field(id, label, extra) {
    return '<div class="field"><label>' + esc(label) + '</label><input id="' + id + '" type="text" ' + (extra || "") + "></div>";
  }

  App.route("submit", function (el) {
    if (!App.session) {
      el.innerHTML = "<h1>" + esc(t("submit_title")) + "</h1>" +
        App.msg("error", t("need_login")) +
        '<a class="btn block" href="#/login">' + esc(t("login")) + "</a>";
      return;
    }

    el.innerHTML =
      "<h1>" + esc(t("submit_title")) + "</h1>" +
      '<div id="sub-msg"></div><div id="sub-form">' +
      field("f-title", t("song_title")) +
      field("f-artist", t("artist")) +
      field("f-album", t("album")) +
      field("f-year", t("year"), 'inputmode="numeric" maxlength="4"') +
      field("f-genre", t("genre")) +
      '<div class="field"><label>' + esc(t("description")) + '</label><textarea id="f-desc"></textarea></div>' +
      '<div class="field"><label>' + esc(t("source")) + '</label><select id="f-type">' +
        '<option value="file">' + esc(t("source_file")) + "</option>" +
        '<option value="link">' + esc(t("source_link")) + "</option></select></div>" +
      '<div class="field" id="box-file"><label>' + esc(t("choose_file")) + '</label>' +
        '<input id="f-file" type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav,.flac"></div>' +
      '<div class="field hidden" id="box-link"><label>' + esc(t("link_url")) + '</label>' +
        '<input id="f-url" type="url" dir="ltr" placeholder="https://"></div>' +
      '<div class="field"><label>' + esc(t("license_note")) + '</label><textarea id="f-lic"></textarea></div>' +
      '<label class="check"><input type="checkbox" id="f-ok"><span>' + esc(t("license_confirm")) + "</span></label>" +
      '<button class="btn block" id="f-go">' + esc(t("submit_btn")) + "</button></div>";

    var typeSel = document.getElementById("f-type");
    typeSel.onchange = function () {
      var isFile = typeSel.value === "file";
      document.getElementById("box-file").classList.toggle("hidden", !isFile);
      document.getElementById("box-link").classList.toggle("hidden", isFile);
    };

    function val(id) { return document.getElementById(id).value.trim(); }
    function say(type, text) { document.getElementById("sub-msg").innerHTML = App.msg(type, text); }

    var btn = document.getElementById("f-go");
    btn.onclick = async function () {
      var title = val("f-title");
      var artist = val("f-artist");
      var year = val("f-year");
      var type = typeSel.value;
      var file = null, ext = "", url = "";

      if (!title || !artist) { say("error", t("err_required")); return; }
      if (year && (!/^\d{4}$/.test(year) || +year < 1800 || +year > 2100)) { say("error", t("err_year")); return; }

      if (type === "file") {
        file = document.getElementById("f-file").files[0];
        if (!file) { say("error", t("err_file")); return; }
        ext = (file.name.split(".").pop() || "").toLowerCase();
        if (!MIME[ext]) { say("error", t("err_file_type")); return; }
        if (file.size > MAX) { say("error", t("err_file_big")); return; }
      } else {
        url = val("f-url");
        if (!/^https?:\/\/\S+$/i.test(url)) { say("error", t("err_url")); return; }
      }
      if (!document.getElementById("f-ok").checked) { say("error", t("err_license")); return; }

      btn.disabled = true;
      say("success", t("uploading"));

      var path = null;
      if (file) {
        path = App.session.user.id + "/" + uid() + "." + ext;
        var up = await sb.storage.from(App.cfg.BUCKET).upload(path, file, { contentType: MIME[ext], upsert: false });
        if (up.error) { btn.disabled = false; say("error", up.error.message); return; }
      }

      var ins = await sb.from("songs").insert({
        title: title,
        artist_name: artist,
        album: val("f-album") || null,
        year: year ? +year : null,
        genre: val("f-genre") || null,
        description: val("f-desc") || null,
        source_type: type,
        file_path: path,
        external_url: type === "link" ? url : null,
        license_confirmed: true,
        license_note: val("f-lic") || null
      });

      if (ins.error) { btn.disabled = false; say("error", ins.error.message); return; }

      el.innerHTML =
        "<h1>" + esc(t("submit_title")) + "</h1>" +
        App.msg("success", t("submit_ok")) +
        '<button class="btn block" id="again">' + esc(t("send_another")) + "</button>" +
        '<a class="btn secondary block" style="margin-top:10px" href="#/account">' + esc(t("my_submissions")) + "</a>";
      document.getElementById("again").onclick = function () { App.render(); };
    };
  });
})();
