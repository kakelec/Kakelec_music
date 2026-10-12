(function () {
  const LANGS = {
    fa: { name: "فارسی", dir: "rtl" },
    en: { name: "English", dir: "ltr" },
    ru: { name: "Русский", dir: "ltr" }
  };
  const dict = { fa: {}, en: {}, ru: {} };
  let current = localStorage.getItem("lang");
  if (!LANGS[current]) current = null;

  function apply() {
    if (!current) return;
    document.documentElement.lang = current;
    document.documentElement.dir = LANGS[current].dir;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
  }

  function t(key, vars) {
    let s = (dict[current] && dict[current][key]) || dict.en[key] || key;
    if (vars) {
      for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
    }
    return s;
  }

  window.I18N = {
    LANGS: LANGS,
    t: t,
    apply: apply,
    get lang() { return current; },
    add: function (tr) {
      for (const l in tr) Object.assign(dict[l], tr[l]);
    },
    set: function (l) {
      if (!LANGS[l]) return;
      current = l;
      localStorage.setItem("lang", l);
      apply();
      window.dispatchEvent(new Event("langchange"));
    }
  };

  I18N.add({
    fa: {
      app_name: "کاکلک", choose_language: "زبان را انتخاب کنید",
      home: "خانه", search: "جست‌وجو", songs: "آهنگ‌ها", artists: "خواننده‌ها",
      submit: "ارسال آهنگ", admin: "مدیریت", login: "ورود", signup: "ثبت‌نام",
      logout: "خروج", language: "زبان", loading: "در حال بارگذاری...",
      error: "خطایی رخ داد", save: "ذخیره", cancel: "انصراف", delete: "حذف",
      edit: "ویرایش", back: "بازگشت", confirm: "تأیید", no_results: "نتیجه‌ای یافت نشد"
    },
    en: {
      app_name: "Kakelek", choose_language: "Choose your language",
      home: "Home", search: "Search", songs: "Songs", artists: "Artists",
      submit: "Submit a song", admin: "Admin", login: "Log in", signup: "Sign up",
      logout: "Log out", language: "Language", loading: "Loading...",
      error: "Something went wrong", save: "Save", cancel: "Cancel", delete: "Delete",
      edit: "Edit", back: "Back", confirm: "Confirm", no_results: "No results found"
    },
    ru: {
      app_name: "Kakelek", choose_language: "Выберите язык",
      home: "Главная", search: "Поиск", songs: "Песни", artists: "Исполнители",
      submit: "Отправить песню", admin: "Администрирование", login: "Войти", signup: "Регистрация",
      logout: "Выйти", language: "Язык", loading: "Загрузка...",
      error: "Произошла ошибка", save: "Сохранить", cancel: "Отмена", delete: "Удалить",
      edit: "Редактировать", back: "Назад", confirm: "Подтвердить", no_results: "Ничего не найдено"
    }
  });
})();
