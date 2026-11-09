// Dynamic i18n loader — fetches locale strings from _locales at runtime
// I18N is populated by the fetch promises; access strings only after localeReady resolves.
const LOCALE_FOLDER_MAP = { ja: "ja", en: "en", zh: "zh_CN" };
const I18N = {};

const _localePromises = Object.entries(LOCALE_FOLDER_MAP).map(
  async ([lang, folder]) => {
    const url = chrome.runtime.getURL(`_locales/${folder}/messages.json`);
    const r = await fetch(url);
    const data = await r.json();
    I18N[lang] = {};
    for (const [key, val] of Object.entries(data)) {
      I18N[lang][key] = val.message;
    }
  },
);

// Resolves when all locale files have been fetched and cached into I18N.
// Use const (not window.*) so this works in both page scripts and service workers.
const localeReady = Promise.all(_localePromises);

// Look up a string by lang + key; falls back to Japanese, then the key itself
function t(lang, key) {
  const dict = I18N[lang] || I18N.ja;
  return (dict && dict[key]) ?? (I18N.ja && I18N.ja[key]) ?? key;
}
