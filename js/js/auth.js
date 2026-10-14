(function () {
  var t = I18N.t;
  var esc = App.esc;

  I18N.add({
    fa: {
      email: "ایمیل", password: "رمز عبور", password_confirm: "تکرار رمز عبور",
      display_name: "نام نمایشی", no_account: "حساب ندارید؟", have_account: "حساب دارید؟",
      fill_all: "همه‌ی فیلدها را پر کنید", pw_short: "رمز عبور باید حداقل ۶ حرف باشد",
      pw_mismatch: "رمزها یکسان نیستند",
      check_email: "ایمیل تأیید برای شما ارسال شد. آن را تأیید کنید و سپس وارد شوید.",
      my_submissions: "آهنگ‌های ارسالی من", no_submissions: "هنوز آهنگی ارسال نکرده‌اید",
      status_pending: "در انتظار بررسی", status_approved: "تأییدشده", status_rejected: "ردشده",
      reject_reason: "دلیل رد", role: "نقش", role_admin: "مدیر", role_user: "کاربر"
    },
    en: {
      email: "Email", password: "Password", password_confirm: "Repeat password",
      display_name: "Display name", no_account: "No account yet?", have_account: "Already have an account?",
      fill_all: "Please fill in all fields", pw_short: "Password must be at least 6 characters",
      pw_mismatch: "Passwords do not match",
      check_email: "A confirmation email was sent. Confirm it, then log in.",
      my_submissions: "My submitted songs", no_submissions: "You have not submitted any songs yet",
      status_pending: "Pending review", status_approved: "Approved", status_rejected: "Rejected",
      reject_reason: "Reason for rejection", role: "Role", role_admin: "Admin", role_user: "User"
    },
    ru: {
      email: "Эл. почта", password: "Пароль", password_confirm: "Повторите пароль",
      display_name: "Отображаемое имя", no_account: "Нет аккаунта?", have_account: "Уже есть аккаунт?",
      fill_all: "Заполните все поля", pw_short: "Пароль должен содержать не менее 6 символов",
      pw_mismatch: "Пароли не совпадают",
      check_email: "Письмо для подтверждения отправлено. Подтвердите его и войдите.",
      my_submissions: "Мои отправленные песни", no_submissions: "Вы ещё не отправляли песни",
      status_pending: "На проверке", status_approved: "Одобрено", status_rejected: "Отклонено",
      reject_reason: "Причина отказа", role: "Роль", role_admin: "Администратор", role_user: "Пользователь"
    }
  });

  App.route("login", function (el) {
    if (App.session) { App.go("account"); return; }
    el.innerHTML =
      "<h1>" + esc(t("login")) + "</h1>" +
      '<div id="auth-msg"></div>' +
      '<div class="field"><label>' + esc(t("email")) + '</label><input id="email" type="email" dir="ltr" autocomplete="email"></div>' +
      '<div class="field"><label>' + esc(t("password")) + '</label><input id="password" type="password" dir="ltr" autocomplete="current-password"></div>' +
      '<button class="btn block" id="go">' + esc(t("login")) + "</button>" +
      '<p class="muted" style="margin-top:16px">' + esc(t("no_account")) + ' <a href="#/signup">' + esc(t("signup")) + "</a></p>";

    var btn = document.getElementById("go");
    btn.onclick = async function () {
      var email = document.getElementById("email").value.trim();
      var pw = document.getElementById("password").value;
      var box = document.getElementById("auth-msg");
      if (!email || !pw) { box.innerHTML = App.msg("error", t("fill_all")); return; }
      btn.disabled = true;
      var res = await App.sb.auth.signInWithPassword({ email: email, password: pw });
      btn.disabled = false;
      if (res.error) { box.innerHTML = App.msg("error", res.error.message); return; }
      await App.reloadAuth();
      App.go("home");
    };
  });

  App.route("signup", function (el) {
    if (App.session) { App.go("account"); return; }
    el.innerHTML =
      "<h1>" + esc(t("signup")) + "</h1>" +
      '<div id="auth-msg"></div>' +
      '<div class="field"><label>' + esc(t("display_name")) + '</label><input id="dname" type="text"></div>' +
      '<div class="field"><label>' + esc(t("email")) + '</label><input id="email" type="email" dir="ltr" autocomplete="email"></div>' +
      '<div class="field"><label>' + esc(t("password")) + '</label><input id="password" type="password" dir="ltr" autocomplete="new-password"></div>' +
      '<div class="field"><label>' + esc(t("password_confirm")) + '</label><input id="password2" type="password" dir="ltr" autocomplete="new-password"></div>' +
      '<button class="btn block" id="go">' + esc(t("signup")) + "</button>" +
      '<p class="muted" style="margin-top:16px">' + esc(t("have_account")) + ' <a href="#/login">' + esc(t("login")) + "</a></p>";

    var btn = document.getElementById("go");
    btn.onclick = async function () {
      var dname = document.getElementById("dname").value.trim();
      var email = document.getElementById("email").value.trim();
      var pw = document.getElementById("password").value;
      var pw2 = document.getElementById("password2").value;
      var box = document.getElementById("auth-msg");
      if (!dname || !email || !pw || !pw2) { box.innerHTML = App.msg("error", t("fill_all")); return; }
      if (pw.length < 6) { box.innerHTML = App.msg("error", t("pw_short")); return; }
      if (pw !== pw2) { box.innerHTML = App.msg("error", t("pw_mismatch")); return; }
      btn.disabled = true;
      var res = await App.sb.auth.signUp({
        email: email,
        password: pw,
        options: { data: { display_name: dname } }
      });
      btn.disabled = false;
      if (res.error) { box.innerHTML = App.msg("error", res.error.message); return; }
      if (res.data.session) {
        await App.reloadAuth();
        App.go("home");
      } else {
        box.innerHTML = App.msg("success", t("check_email"));
      }
    };
  });

  App.route("account", async function (el) {
    if (!App.session) { App.go("login"); return; }
    var p = App.profile || {};
    var roleText = p.role === "admin" ? t("role_admin") : t("role_user");
    el.innerHTML =
      "<h1>" + esc(t("account")) + "</h1>" +
      '<div class="card">' +
        "<div><b>" + esc(p.display_name || "") + "</b></div>" +
        '<div class="muted" dir="ltr">' + esc(App.session.user.email) + "</div>" +
        '<div class="muted">' + esc(t("role")) + ": " + esc(roleText) + "</div>" +
      "</div>" +
      "<h2>" + esc(t("my_submissions")) + "</h2>" +
      '<div id="mine"><p class="muted">' + esc(t("loading")) + "</p></div>" +
      '<button class="btn secondary block" id="logout" style="margin-top:20px">' + esc(t("logout")) + "</button>";

    document.getElementById("logout").onclick = async function () {
      await App.sb.auth.signOut();
      await App.reloadAuth();
      App.go("home");
    };

    var res = await App.sb.from("songs")
      .select("id,title,artist_name,status,reject_reason,created_at")
      .eq("submitted_by", App.session.user.id)
      .order("created_at", { ascending: false });
    var box = document.getElementById("mine");
    if (!box) return;
    if (res.error) { box.innerHTML = App.msg("error", res.error.message); return; }
    if (!res.data.length) { box.innerHTML = '<p class="empty">' + esc(t("no_submissions")) + "</p>"; return; }
    box.innerHTML = res.data.map(function (s) {
      var extra = s.status === "rejected" && s.reject_reason
        ? '<div class="muted">' + esc(t("reject_reason")) + ": " + esc(s.reject_reason) + "</div>" : "";
      return '<div class="card"><a href="#/song/' + s.id + '"><b>' + esc(s.title) + "</b></a>" +
        '<div class="muted">' + esc(s.artist_name) + "</div>" +
        '<span class="badge ' + s.status + '">' + esc(t("status_" + s.status)) + "</span>" + extra + "</div>";
    }).join("");
  });
})();
