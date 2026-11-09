const enabledToggle = document.getElementById("enabled");
const delaySlider = document.getElementById("hoverDelay");
const delayValue = document.getElementById("delayValue");
const delayRow = document.getElementById("delayRow");
const cardHover = document.getElementById("card-hover");
const cardSelect = document.getElementById("card-select");
const cardContext = document.getElementById("card-contextmenu");
const langSelect = document.getElementById("lang");
const themeSelect = document.getElementById("theme");
const vocabCount = document.getElementById("vocabCount");
const vocabList = document.getElementById("vocabList");
const vocabSearch = document.getElementById("vocabSearch");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const chatStop = document.getElementById("chatStop");
const openChatBtn = document.getElementById("openChatBtn");
const backBtn = document.getElementById("backBtn");
const chatBadge = document.getElementById("chatBadge");
const speakStopBtn = document.getElementById("speakStopBtn");
const newChatBtn = document.getElementById("newChatBtn");
const favBtn = document.getElementById("favBtn");
const favoritesPanel = document.getElementById("favoritesPanel");
const favList = document.getElementById("favList");
const sidebarToggle = document.getElementById("sidebarToggle");
const chatSidebar = document.getElementById("chatSidebar");
const sidebarList = document.getElementById("sidebarList");
const viewingBanner = document.getElementById("viewingBanner");
const exitViewBtn = document.getElementById("exitViewBtn");
const screenChat = document.getElementById("screen-chat");

// ===== Inject Lucide icons into navigation buttons =====
sidebarToggle.innerHTML = ICONS.bars3;
backBtn.innerHTML = ICONS.chevronLeft;
speakStopBtn.innerHTML = ICONS.speakerXMark;
favBtn.innerHTML = ICONS.star;
document.getElementById("chatThemeBtn").innerHTML = ICONS.moon;
newChatBtn.innerHTML = ICONS.plus;
document.getElementById("favCloseBtn").innerHTML = ICONS.xMark;
document.getElementById("favSelectBtn").innerHTML = ICONS.checkCircle;
document.getElementById("favClearAllBtn").innerHTML = ICONS.trash;
document.getElementById("scrollTopBtn").innerHTML = ICONS.arrowUp;
document.getElementById("scrollBotBtn").innerHTML = ICONS.arrowDown;
document.getElementById("chatSend").innerHTML = ICONS.arrowUp;
document.getElementById("chatStop").innerHTML = ICONS.squareStop;
document.getElementById("chatAttachBtn").innerHTML = ICONS.paperclip;
document.getElementById("chatThinkBtn").innerHTML = ICONS.lightbulb;

// ===== Screen navigation =====
function showScreen(name) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
  if (name === "chat") {
    if (!chatMessages.querySelector(".chat-msg, .chat-empty")) {
      if (chatHistory.length > 0) renderChatHistory();
      else renderChatEmpty();
    }
    renderSidebar();
    requestAnimationFrame(() => {
      chatAutoScroll = true;
      scrollToBottom(true);
    });
  }
}

openChatBtn.addEventListener("click", () => showScreen("chat"));
backBtn.addEventListener("click", () => {
  stopChatSpeak();
  showScreen("settings");
});

function updateChatBadge() {
  const count = chatSessions.length;
  if (count > 0) {
    chatBadge.textContent = `${count} ${t(lang, "countSuffix")}`;
    chatBadge.style.display = "";
  } else {
    chatBadge.style.display = "none";
  }
}

const DEFAULTS = {
  enabled: true,
  triggerMode: "hover",
  hoverDelay: 600,
  lang: "ja",
  theme: "dark",
  aiProvider: "builtin",
  apiEndpoint: "",
  apiKey: "",
  modelName: "",
  apiPreset: "custom",
  speechRate: 1.0,
  speechLang: "auto",
};
let lang = "ja";
let aiProvider = "builtin";
let apiEndpoint = "";
let apiKey = "";
let modelName = "";
let apiPreset = "custom";
let speechRate = 1.0;
let speechLang = "auto";

const API_PRESETS = {
  ollama: {
    endpoint: "http://localhost:11434/v1",
    model: "llama3.2",
    needsKey: false,
    reasoning: false,
  },
  lmstudio: {
    endpoint: "http://localhost:1234/v1",
    model: "local-model",
    needsKey: false,
    reasoning: false,
  },
  jan: {
    endpoint: "http://localhost:1337/v1",
    model: "local-model",
    needsKey: false,
    reasoning: false,
  },
  openai: {
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    needsKey: true,
    reasoning: false,
  },
  "openai-o4mini": {
    endpoint: "https://api.openai.com/v1",
    model: "o4-mini",
    needsKey: true,
    reasoning: true,
  },
  "openai-o3": {
    endpoint: "https://api.openai.com/v1",
    model: "o3",
    needsKey: true,
    reasoning: true,
  },
  groq: {
    endpoint: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
    needsKey: true,
    reasoning: false,
  },
  custom: null,
};

// Detect o-series models (native reasoning models)
function isOSeriesModel(model) {
  return /^o\d/.test(model || "");
}

// --- Apply theme (auto / dark / light) ---
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

// Set an element's text by id/i18n key, skipping missing elements
function setText(id, key) {
  const el = document.getElementById(id);
  if (el) el.textContent = t(lang, key);
}

// --- Render UI in the selected language ---
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(lang, el.dataset.i18n);
  });
  document.getElementById("newChatBtn").title = t(lang, "newChat");
  document.getElementById("speakStopBtn").title = t(lang, "speakStopTitle");
  document.getElementById("exportBtn").innerHTML =
    `${ICONS.download} ${t(lang, "exportCsv")}`;
  document.getElementById("clearBtn").innerHTML =
    `${ICONS.trash} ${t(lang, "clearAll")}`;
  // Labels with icons (no emoji)
  document.getElementById("appHeading").innerHTML =
    `${ICONS.globe} ${t(lang, "appHeading")}`;
  document.getElementById("labelReadAloud").innerHTML =
    `${ICONS.speakerWave} ${t(lang, "readAloudSection")}`;
  document.getElementById("labelAiProvider").innerHTML =
    `${ICONS.bot} ${t(lang, "aiProviderLabel")}`;
  document.getElementById("labelVocabulary").innerHTML =
    `${ICONS.star} ${t(lang, "vocabulary")}`;
  document.getElementById("tabBtnAnnotation").innerHTML =
    `${ICONS.fileText} ${t(lang, "tabAnnotation")}`;
  document.getElementById("tabBtnChat").innerHTML =
    `${ICONS.messageSquare} ${t(lang, "tabChat")}`;
  document.getElementById("openChatIcon").innerHTML = ICONS.messageSquare;
  document.getElementById("chatNavTitle").innerHTML =
    `${ICONS.messageSquare} ${t(lang, "chatLabel")}`;
  document.getElementById("favTitle").innerHTML =
    `${ICONS.star} ${t(lang, "favoritesTitle")}`;
  vocabSearch.placeholder = t(lang, "searchPlaceholder");
  chatInput.placeholder = t(lang, "chatPlaceholder");
  if (chatThinkBtn)
    chatThinkBtn.title = t(
      lang,
      deepThinkMode ? "deepThinkTitleOn" : "deepThinkTitle",
    );
  setDelayLabel(Number(delaySlider.value));
  renderVocab();
  // Re-render the empty chat prompt only when the chat is empty
  if (chatMessages.querySelector(".chat-empty")) renderChatEmpty();
  updateChatBadge();

  // Chrome AI setup section
  setText("chromeAiSetupTitle", "chromeAiSetupTitle");
  const chromeAiStatusEl = document.getElementById("chromeAiStatus");
  if (chromeAiStatusEl) {
    if (
      chromeAiStatusEl.classList.contains("available") &&
      !chromeAiStatusEl.classList.contains("unavailable")
    ) {
      chromeAiStatusEl.textContent = t(lang, "chromeAiStatusAvailable");
    } else if (chromeAiStatusEl.classList.contains("unavailable")) {
      chromeAiStatusEl.textContent = t(lang, "chromeAiStatusUnavailable");
    } else {
      chromeAiStatusEl.textContent = t(lang, "chromeAiStatusChecking");
    }
  }
  setText("chromeAiStep1Desc", "chromeAiStep1");
  setText("chromeAiStep2Desc", "chromeAiStep2");
  setText("chromeAiStep3Desc", "chromeAiStep3");
  setText("chromeAiRestart", "chromeAiRestart");
  document.querySelectorAll(".step-open-btn").forEach((btn) => {
    btn.textContent = t(lang, "chromeAiStepOpen");
  });

  // Guide overlay
  setText("guideTitleEl", "guideTitle");
  setText("guideTabOverview", "guideTabOverview");
  setText("guideTabAnnotation", "guideTabAnnotation");
  setText("guideTabChat", "guideTabChat");
  setText("guideTabChromeAI", "guideTabChromeAI");
  setText("guideOverviewDesc", "guideOverviewDesc");
  setText("guideAnnotationDesc", "guideAnnotationDesc");
  setText("guideChatDesc", "guideChatDesc");
  setText("guideChromeAIDesc", "guideChromeAIDesc");
  setText("guideStep1Desc", "chromeAiStep1");
  setText("guideStep2Desc", "chromeAiStep2");
  setText("guideStep3Desc", "chromeAiStep3");
  setText("guideRestart", "chromeAiRestart");
  document.querySelectorAll(".guide-step-open-btn").forEach((btn) => {
    btn.textContent = t(lang, "chromeAiStepOpen");
  });
}

function applyPreset(preset) {
  const p = API_PRESETS[preset];
  if (!p) return; // custom: leave fields as-is
  const epEl = document.getElementById("apiEndpoint");
  const akEl = document.getElementById("apiKey");
  const mnEl = document.getElementById("modelName");
  if (epEl) {
    epEl.value = p.endpoint;
    apiEndpoint = p.endpoint;
  }
  if (mnEl) {
    mnEl.value = p.model;
    modelName = p.model;
  }
  if (akEl && !p.needsKey) {
    akEl.value = "";
    apiKey = "";
  }
  chrome.storage.sync.set({ apiEndpoint, apiKey, modelName });
}

// --- Load settings ---
chrome.storage.sync.get(DEFAULTS, async (s) => {
  await localeReady;
  lang = s.lang;
  aiProvider = s.aiProvider;
  apiEndpoint = s.apiEndpoint;
  apiKey = s.apiKey;
  modelName = s.modelName;
  apiPreset = s.apiPreset;
  speechRate = s.speechRate;
  speechLang = s.speechLang;

  enabledToggle.checked = s.enabled;
  delaySlider.value = s.hoverDelay;
  langSelect.value = s.lang;
  themeSelect.value = s.theme;
  applyTheme(s.theme);
  setTriggerUI(s.triggerMode);
  setProviderUI(s.aiProvider);
  setDelayLabel(s.hoverDelay);

  // Restore saved values to form fields
  const epEl = document.getElementById("apiEndpoint");
  const akEl = document.getElementById("apiKey");
  const mnEl = document.getElementById("modelName");
  const prEl = document.getElementById("apiPreset");
  if (epEl) epEl.value = s.apiEndpoint;
  if (akEl) akEl.value = s.apiKey;
  if (mnEl) mnEl.value = s.modelName;
  if (prEl) prEl.value = s.apiPreset;

  const srEl = document.getElementById("speechRate");
  const slEl = document.getElementById("speechLang");
  if (srEl) {
    srEl.value = s.speechRate;
    updateSpeechRateLabel(s.speechRate);
  }
  if (slEl) slEl.value = s.speechLang;

  updateThemeBtn();
  applyLang();
});

// --- Language change (switches UI, tooltips, and AI output language together) ---
langSelect.addEventListener("change", () => {
  lang = langSelect.value;
  chrome.storage.sync.set({ lang });
  applyLang();
});

// --- Theme change ---
themeSelect.addEventListener("change", () => {
  chrome.storage.sync.set({ theme: themeSelect.value });
  applyTheme(themeSelect.value);
  updateThemeBtn();
});

const THEME_CYCLE = ["dark", "light", "auto"];
const THEME_ICONS = { dark: "🌙", light: "☀️", auto: "🌓" };

function updateThemeBtn() {
  const btn = document.getElementById("chatThemeBtn");
  if (btn) btn.textContent = THEME_ICONS[themeSelect.value] || "🌓";
}

document.getElementById("chatThemeBtn").addEventListener("click", () => {
  const cur = themeSelect.value;
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(cur) + 1) % THEME_CYCLE.length];
  themeSelect.value = next;
  chrome.storage.sync.set({ theme: next });
  applyTheme(next);
  updateThemeBtn();
});

// --- Read-aloud settings ---
function getSpeechLangCode(text = "") {
  if (speechLang !== "auto") return speechLang;
  // Infer language from character type in the text
  if (text) {
    const hasKana = /[぀-ゟ゠-ヿ]/.test(text); // Hiragana / Katakana
    const hasCJK = /[一-鿿㐀-䶿]/.test(text); // CJK ideographs
    if (hasKana) return "ja-JP";
    if (hasCJK) return "zh-CN";
    if (/[A-Za-z]/.test(text)) return "en-US";
  }
  // Fall back to the UI language when text is unknown
  const UI_LANG = { ja: "ja-JP", en: "en-US", zh: "zh-CN" };
  return UI_LANG[lang] || "en-US";
}

function updateSpeechRateLabel(val) {
  const el = document.getElementById("speechRateValue");
  if (el)
    el.textContent =
      Number(val)
        .toFixed(2)
        .replace(/\.?0+$/, "") + "×";
}

document.getElementById("speechRate").addEventListener("input", (e) => {
  speechRate = Number(e.target.value);
  updateSpeechRateLabel(speechRate);
  chrome.storage.sync.set({ speechRate });
});

document.getElementById("speechLang").addEventListener("change", (e) => {
  speechLang = e.target.value;
  chrome.storage.sync.set({ speechLang });
});

// --- Enable / Disable ---
enabledToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledToggle.checked });
});

// --- Trigger mode ---
document.querySelectorAll('input[name="trigger"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    chrome.storage.sync.set({ triggerMode: radio.value });
    setTriggerUI(radio.value);
  });
});

function setTriggerUI(mode) {
  cardHover.classList.toggle("active", mode === "hover");
  cardSelect.classList.toggle("active", mode === "select");
  cardContext.classList.toggle("active", mode === "contextmenu");
  cardHover.querySelector("input").checked = mode === "hover";
  cardSelect.querySelector("input").checked = mode === "select";
  cardContext.querySelector("input").checked = mode === "contextmenu";
  delayRow.style.display = mode === "hover" ? "block" : "none";
}

// --- AI provider ---
const cardBuiltin = document.getElementById("card-builtin");
const cardExternal = document.getElementById("card-external");
const externalSettings = document.getElementById("externalSettings");
const chromeAiSetup = document.getElementById("chromeAiSetup");

function setProviderUI(provider) {
  cardBuiltin.classList.toggle("active", provider === "builtin");
  cardExternal.classList.toggle("active", provider === "external");
  cardBuiltin.querySelector("input").checked = provider === "builtin";
  cardExternal.querySelector("input").checked = provider === "external";
  externalSettings.style.display = provider === "external" ? "block" : "none";
  chromeAiSetup.style.display = provider === "builtin" ? "block" : "none";
  if (provider === "builtin") checkChromeAiAvailability();
}

async function checkChromeAiAvailability() {
  const badge = document.getElementById("chromeAiStatus");
  if (!badge) return;
  badge.className = "ai-status-badge checking";
  badge.textContent = t(lang, "chromeAiStatusChecking");
  try {
    const api = getLanguageModelAPI();
    if (!api) {
      badge.className = "ai-status-badge unavailable";
      badge.textContent = t(lang, "chromeAiStatusUnavailable");
      return;
    }
    if (typeof api.availability === "function") {
      const avail = await api.availability({
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      });
      if (avail === "no") {
        badge.className = "ai-status-badge unavailable";
        badge.textContent = t(lang, "chromeAiStatusUnavailable");
      } else {
        badge.className = "ai-status-badge available";
        badge.textContent = t(lang, "chromeAiStatusAvailable");
      }
    } else if (typeof api.capabilities === "function") {
      const cap = await api.capabilities();
      if (cap?.available === "no") {
        badge.className = "ai-status-badge unavailable";
        badge.textContent = t(lang, "chromeAiStatusUnavailable");
      } else {
        badge.className = "ai-status-badge available";
        badge.textContent = t(lang, "chromeAiStatusAvailable");
      }
    } else {
      badge.className = "ai-status-badge available";
      badge.textContent = t(lang, "chromeAiStatusAvailable");
    }
  } catch {
    badge.className = "ai-status-badge unavailable";
    badge.textContent = t(lang, "chromeAiStatusUnavailable");
  }
}

// "Open" buttons for Chrome flags/components
document
  .querySelectorAll(".step-open-btn, .guide-step-open-btn")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        chrome.tabs.create({ url: btn.dataset.url });
      } catch (e) {
        console.warn("[ChromeAI] tabs.create failed:", e);
      }
    });
  });

document.querySelectorAll('input[name="aiProvider"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    aiProvider = radio.value;
    chrome.storage.sync.set({ aiProvider });
    setProviderUI(aiProvider);
  });
});

// Preset change: auto-fill endpoint and model name
document.getElementById("apiPreset").addEventListener("change", (e) => {
  apiPreset = e.target.value;
  chrome.storage.sync.set({ apiPreset });
  applyPreset(apiPreset);
});

// Save text fields on blur, not on every keystroke
function setPresetCustomIfChanged() {
  const prEl = document.getElementById("apiPreset");
  if (prEl && prEl.value !== "custom") {
    prEl.value = "custom";
    apiPreset = "custom";
    chrome.storage.sync.set({ apiPreset });
  }
}

document.getElementById("apiEndpoint").addEventListener("blur", (e) => {
  apiEndpoint = e.target.value.trim();
  chrome.storage.sync.set({ apiEndpoint });
  setPresetCustomIfChanged();
});
document.getElementById("apiKey").addEventListener("blur", (e) => {
  apiKey = e.target.value.trim();
  chrome.storage.sync.set({ apiKey });
  setPresetCustomIfChanged();
});
document.getElementById("modelName").addEventListener("blur", (e) => {
  modelName = e.target.value.trim();
  chrome.storage.sync.set({ modelName });
  setPresetCustomIfChanged();
});

// --- Hover-delay slider ---
delaySlider.addEventListener("input", () => {
  const v = Number(delaySlider.value);
  setDelayLabel(v);
  chrome.storage.sync.set({ hoverDelay: v });
});

function setDelayLabel(ms) {
  delayValue.textContent = (ms / 1000).toFixed(1) + t(lang, "secondsUnit");
}

// --- Vocabulary list ---
function renderVocab() {
  chrome.storage.local.get({ vocabulary: [] }, (data) => {
    const all = data.vocabulary;
    vocabCount.textContent = `${all.length} ${t(lang, "countSuffix")}`;

    if (all.length === 0) {
      vocabList.innerHTML = `<div class="vocab-empty">${t(lang, "vocabEmpty")}</div>`;
      return;
    }

    // Search filter targeting both word and annotation
    const q = vocabSearch.value.trim().toLowerCase();
    const list = q
      ? all.filter(
          (v) =>
            v.word.toLowerCase().includes(q) ||
            v.annotation.toLowerCase().includes(q),
        )
      : all;

    // Preserve original array indices so deletion works correctly
    vocabList.innerHTML = list
      .map(
        (v) => `
      <div class="vocab-item">
        <button class="vdel" data-index="${all.indexOf(v)}" title="${t(lang, "confirmDeleteBtn")}">${ICONS.trash}</button>
        <div class="vw">${escapeHtml(v.word)}</div>
        <div class="va">${escapeHtml(v.annotation)}</div>
      </div>
    `,
      )
      .join("");
  });
}

vocabSearch.addEventListener("input", renderVocab);

// Individual item deletion
vocabList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".vdel");
  if (!btn) return;
  const ok = await showConfirm(t(lang, "confirmDeleteVocab"));
  if (!ok) return;
  const index = Number(btn.dataset.index);
  chrome.storage.local.get({ vocabulary: [] }, (data) => {
    data.vocabulary.splice(index, 1);
    chrome.storage.local.set({ vocabulary: data.vocabulary }, renderVocab);
  });
});

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

// --- Export CSV ---
document.getElementById("exportBtn").addEventListener("click", () => {
  chrome.storage.local.get({ vocabulary: [] }, (data) => {
    if (data.vocabulary.length === 0) return;
    const rows = [["word", "annotation", "url", "date"]];
    data.vocabulary.forEach((v) => {
      rows.push([v.word, v.annotation, v.url, v.date]);
    });
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocabulary.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
});

// --- Clear all ---
document.getElementById("clearBtn").addEventListener("click", async () => {
  const ok = await showConfirm(t(lang, "confirmClear"));
  if (!ok) return;
  chrome.storage.local.set({ vocabulary: [] }, renderVocab);
});

// Watch for vocabulary changes and re-render automatically
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.vocabulary) renderVocab();
});

// ===== Chat (general conversation via Prompt API) =====
let chatBusy = false;
let chatAbort = null;
let activeBubbleWrap = null;
let wasManuallyStopped = false;
let chatHistory = []; // [{ role: 'user'|'assistant', text: string }]

const CHAT_SESSIONS_KEY = "chatSessions";
const MAX_SESSIONS = 50;

let chatSessions = []; // All sessions array
let activeSessionId = null; // ID of the currently open session (null = new, unsaved)

// ===== Markdown → HTML (line-by-line parser) =====
function markdownToHtml(text) {
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // 1. Extract fenced code blocks before any other processing
  const codeBlocks = [];
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, c) => {
    codeBlocks.push(c.replace(/\n$/, ""));
    return `\x00CB${codeBlocks.length - 1}\x00`;
  });

  // 2. Extract inline code
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (_, c) => {
    inlineCodes.push(c);
    return `\x00IC${inlineCodes.length - 1}\x00`;
  });

  // 3. Inline formatter (called per line, operates on raw text)
  function fmt(s) {
    s = esc(s);
    s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
    s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
    s = s.replace(/_([^_\n]+?)_/g, "<em>$1</em>");
    // Images: ![alt](url) — process before links (data:, blob:, https URLs supported)
    s = s.replace(
      /!\[([^\]]*)\]\(((?:https?:\/\/|data:|blob:)[^)]+)\)/g,
      (_, alt, url) => `<img src="${url}" alt="${alt}" class="md-img">`,
    );
    // Links: [text](url)
    s = s.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      (_, label, url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="md-link">${label}</a>`,
    );
    // Bare URLs: auto-link https://...
    s = s.replace(
      /(?<![="'])https?:\/\/[^\s<>"]+/g,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="md-link">${url}</a>`,
    );
    s = s.replace(
      /\x00IC(\d+)\x00/g,
      (_, i) => `<code>${esc(inlineCodes[+i])}</code>`,
    );
    return s;
  }

  // 4. Line-by-line processing
  const lines = text.split("\n");
  const parts = [];
  let i = 0;

  const isBlockTag = (s) =>
    /^<(h[1-6]|ul|ol|pre|blockquote|hr|table|div)/.test(s);

  while (i < lines.length) {
    const raw = lines[i];

    // Code block placeholder (whole line)
    const cbm = raw.trim().match(/^\x00CB(\d+)\x00$/);
    if (cbm) {
      const code = esc(codeBlocks[+cbm[1]]);
      parts.push(
        `<div class="code-block"><button class="code-copy-btn" title="${t(lang, "codeCopyTitle")}">${ICONS.clipboard}</button><pre><code>${code}</code></pre></div>`,
      );
      i++;
      continue;
    }

    // Heading h1–h3
    const hm = raw.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      const lvl = hm[1].length;
      parts.push(`<h${lvl}>${fmt(hm[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(raw.trim())) {
      parts.push("<hr>");
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s/.test(raw)) {
      parts.push(`<blockquote>${fmt(raw.replace(/^>\s*/, ""))}</blockquote>`);
      i++;
      continue;
    }

    // Table: lines starting with |
    if (/^\|/.test(raw.trim())) {
      const tlines = [];
      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        tlines.push(lines[i]);
        i++;
      }
      const isSep = (l) => /^\|[\s|:-]+\|?\s*$/.test(l.trim()) && /---/.test(l);
      if (tlines.length >= 2 && isSep(tlines[1])) {
        const parseRow = (l) =>
          l
            .trim()
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((c) => c.trim());
        const headers = parseRow(tlines[0]);
        const dataRows = tlines.slice(2).map(parseRow);
        const thead = `<thead><tr>${headers.map((h) => `<th>${fmt(h)}</th>`).join("")}</tr></thead>`;
        const tbody = dataRows
          .map((r) => `<tr>${r.map((c) => `<td>${fmt(c)}</td>`).join("")}</tr>`)
          .join("");
        parts.push(`<table>${thead}<tbody>${tbody}</tbody></table>`);
      } else {
        for (const tl of tlines) {
          const prev = parts[parts.length - 1] ?? "";
          if (prev && !isBlockTag(prev) && prev !== "<br>") parts.push("<br>");
          parts.push(fmt(tl));
        }
      }
      continue;
    }

    // Unordered list (consume consecutive items)
    if (/^[-*+]\s/.test(raw)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(`<li>${fmt(lines[i].replace(/^[-*+]\s+/, ""))}</li>`);
        i++;
      }
      parts.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list (consume consecutive items)
    if (/^\d+\.\s/.test(raw)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${fmt(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      parts.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Empty line: add <br> only between inline text runs (not after block elements)
    if (raw.trim() === "") {
      const last = parts[parts.length - 1] ?? "";
      if (last && !isBlockTag(last) && last !== "<br>") parts.push("<br>");
      i++;
      continue;
    }

    // Regular inline text: separate from previous inline line with <br>
    const last = parts[parts.length - 1] ?? "";
    if (last && !isBlockTag(last) && last !== "<br>") parts.push("<br>");
    parts.push(fmt(raw));
    i++;
  }

  // Remove leading / trailing <br>
  while (parts.length && parts[0] === "<br>") parts.shift();
  while (parts.length && parts[parts.length - 1] === "<br>") parts.pop();

  return parts.join("");
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

// Persist current messages to storage (call after every send/receive)
function saveChatHistory() {
  const title =
    chatHistory.find((m) => m.role === "user")?.text?.slice(0, 50) ||
    "(Untitled)";
  const now = new Date().toISOString();

  if (!activeSessionId) {
    // First save: create a new session
    const id = Date.now();
    activeSessionId = id;
    chatSessions = [
      { id, title, updatedAt: now, messages: [...chatHistory] },
      ...chatSessions,
    ];
  } else {
    const idx = chatSessions.findIndex((s) => s.id === activeSessionId);
    if (idx >= 0) {
      const updated = {
        ...chatSessions[idx],
        title,
        updatedAt: now,
        messages: [...chatHistory],
      };
      chatSessions.splice(idx, 1);
      chatSessions.unshift(updated); // Move updated session to the front
    }
  }
  chatSessions = chatSessions.slice(0, MAX_SESSIONS);
  chrome.storage.local.set({ [CHAT_SESSIONS_KEY]: chatSessions });
  updateChatBadge();
  if (chatSidebar.classList.contains("open")) renderSidebar();
}

function clearChatHistory() {
  chatHistory = [];
  updateChatBadge();
}

// For Chrome built-in AI: create a fresh session each time with full context
// (Explicit context management equivalent to external API, not relying on session accumulation)
async function createBuiltinSession() {
  const api = getLanguageModelAPI();
  if (!api) return null;

  // Check model availability upfront
  if (typeof api.availability === "function") {
    try {
      const avail = await api.availability();
      if (avail === "no") return null;
      if (avail === "after-download") return "downloading";
    } catch {
      /* Ignore versions that do not support availability */
    }
  } else if (typeof api.capabilities === "function") {
    try {
      const cap = await api.capabilities();
      if (cap?.available === "no") return null;
      if (cap?.available === "after-download") return "downloading";
    } catch {
      /* Same as above */
    }
  }

  // chatHistory already has the current user message appended at the end, so exclude it
  const contextMsgs = chatHistory.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.text,
  }));

  const tryCreate = (prompts) =>
    createAISession(lang, { contextPrompts: prompts });

  try {
    return await tryCreate(contextMsgs);
  } catch {
    // If context is too large, retry with only the last 20 messages
    try {
      return await tryCreate(contextMsgs.slice(-20));
    } catch (e) {
      console.warn("[chat] Failed to create AI session:", e);
      return null;
    }
  }
}

function newConversation() {
  stopChatSpeak();
  clearChatHistory();
  activeSessionId = null; // A new session will be created automatically on the next send
  renderChatEmpty();
  favoritesPanel.hidden = true;
  if (chatSidebar.classList.contains("open")) renderSidebar();
}

async function retryLastMessage(aiBubbleWrap) {
  if (chatBusy) return;
  // Find the last AI bubble and the user message just before it
  const allMsgEls = [...chatMessages.children].filter(
    (el) =>
      el.classList.contains("chat-bubble-wrap") ||
      el.classList.contains("chat-msg-outer"),
  );
  const aiIdx = allMsgEls.indexOf(aiBubbleWrap);
  if (aiIdx < 0) return;

  // Remove AI bubble from DOM and history
  aiBubbleWrap.remove();
  if (
    chatHistory.length &&
    chatHistory[chatHistory.length - 1].role !== "user"
  ) {
    chatHistory.pop();
  }

  // Remove preceding user bubble and restore its content to input
  const userEl = allMsgEls[aiIdx - 1];
  if (userEl) {
    const histEntry = chatHistory[chatHistory.length - 1];
    if (histEntry?.role === "user") {
      // Restore text to input
      chatInput.value = histEntry.text || "";
      autoGrowChat();

      // Reconstruct attachedFiles from serialized attachments
      if (histEntry.attachments?.length) {
        attachedFiles = await Promise.all(
          histEntry.attachments.map(async (a) => {
            if (a.type === "image" && a.dataUrl) {
              const res = await fetch(a.dataUrl);
              const blob = await res.blob();
              const previewUrl = URL.createObjectURL(blob);
              return { name: a.name, type: "image", content: blob, previewUrl };
            }
            if (a.type === "text" && a.content !== undefined) {
              return { name: a.name, type: "text", content: a.content };
            }
            return null;
          }),
        );
        attachedFiles = attachedFiles.filter(Boolean);
        renderAttachPreview();
      }

      // Remove user message from DOM and history
      userEl.remove();
      chatHistory.pop();
    }
  }

  sendChat();
}

function branchFromMessage(msgIdx) {
  const branchHistory = chatHistory.slice(0, msgIdx + 1);
  if (!branchHistory.length) return;
  stopChatSpeak();
  activeSessionId = null;
  chatHistory = branchHistory;
  renderChatHistory();
  saveChatHistory(); // Save as a new session
  chatAutoScroll = true;
  scrollToBottom(true);
  if (chatSidebar.classList.contains("open")) renderSidebar();
}

function switchToSession(id) {
  const session = chatSessions.find((s) => s.id === id);
  if (!session || id === activeSessionId) return;
  stopChatSpeak();
  activeSessionId = session.id;
  chatHistory = [...session.messages];
  if (chatHistory.length > 0) renderChatHistory();
  else renderChatEmpty();
  renderSidebar();
  chatAutoScroll = true;
  scrollToBottom(true);
}

function deleteSession(id) {
  chatSessions = chatSessions.filter((s) => s.id !== id);
  chrome.storage.local.set({ [CHAT_SESSIONS_KEY]: chatSessions });
  if (activeSessionId === id) {
    // If the deleted session is the currently open one, start a new conversation
    activeSessionId = chatSessions[0]?.id ?? null;
    chatHistory = activeSessionId ? [...(chatSessions[0]?.messages ?? [])] : [];
    if (chatHistory.length > 0) renderChatHistory();
    else renderChatEmpty();
  }
  updateChatBadge();
  renderSidebar();
}

function renderChatEmpty() {
  chatMessages.innerHTML = `<div class="chat-empty">${t(lang, "chatEmpty")}</div>`;
}

function renderChatHistory() {
  chatMessages.innerHTML = "";
  chatHistory.forEach((m) =>
    addBubble(m.role === "user" ? "user" : "ai", m.text, m.attachments),
  );
}

function getAiAvatarIcon() {
  if (aiProvider === "builtin") return ICONS.cpu;
  const cloudPresets = ["openai", "groq"];
  return cloudPresets.includes(apiPreset) ? ICONS.bot : ICONS.cpu;
}

// Build the attachment section for a user bubble (images with preview+download,
// text/audio files with a download button). Returns the element, or null when empty.
function renderAttachmentSection(role, attachments) {
  if (role !== "user" || !attachments?.length) return null;
  const section = document.createElement("div");
  section.className = "msg-attachments";
  for (const a of attachments) {
    const imgSrc = a.dataUrl ?? a.url ?? null;
    if (a.type === "image") {
      if (imgSrc) {
        const wrap = document.createElement("div");
        wrap.className = "attach-img-wrap";
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = a.name;
        img.className = "md-img";
        wrap.appendChild(img);
        const dlBtn = document.createElement("button");
        dlBtn.className = "attach-img-dl";
        dlBtn.title = "Download";
        dlBtn.innerHTML = ICONS.download;
        dlBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const link = document.createElement("a");
          link.href = imgSrc;
          link.download = a.name;
          link.click();
        });
        wrap.appendChild(dlBtn);
        section.appendChild(wrap);
      } else {
        const chip = document.createElement("span");
        chip.className = "attach-chip-ro";
        chip.textContent = `🖼️ ${a.name}`;
        section.appendChild(chip);
      }
    } else if (
      (a.type === "text" || a.type === "audio") &&
      a.content !== undefined
    ) {
      const btn = document.createElement("button");
      btn.className = "attach-dl-btn";
      btn.innerHTML = `${ICONS.fileText} <span>${escapeHtml(a.name)}</span>`;
      btn.title = "Download";
      btn.addEventListener("click", () => {
        const blob =
          a.content instanceof Blob
            ? a.content
            : new Blob([a.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = a.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      section.appendChild(btn);
    }
  }
  return section.children.length ? section : null;
}

// Build the action-button row shown under an AI bubble (speak/copy/like/branch/retry)
function buildAIBubbleActions() {
  const actions = document.createElement("div");
  actions.className = "chat-msg-actions";
  actions.innerHTML =
    `<button class="msg-btn" data-action="speak"  title="${t(lang, "speakTitle")}">${ICONS.speakerWave}</button>` +
    `<button class="msg-btn" data-action="copy"   title="${t(lang, "copyMsgTitle")}">${ICONS.clipboard}</button>` +
    `<button class="msg-btn" data-action="like"   title="${t(lang, "likeTitle")}">${ICONS.star}</button>` +
    `<button class="msg-btn branch-btn" data-action="branch" title="${t(lang, "branchTitle")}">${ICONS.gitBranch}</button>` +
    `<button class="msg-btn" data-action="retry"  title="Retry">${ICONS.rotateCcw}</button>`;
  return actions;
}

function addBubble(role, text, attachments) {
  const empty = chatMessages.querySelector(".chat-empty");
  if (empty) empty.remove();

  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg ${role}`;

  let thinkContent = null;
  if (role === "ai") {
    const parsed = parseThinking(text);
    thinkContent = parsed.think;
    msgDiv.innerHTML = markdownToHtml(parsed.answer);
    msgDiv.dataset.md = parsed.answer;
  } else {
    msgDiv.innerHTML = markdownToHtml(text);
  }

  // Render attachments (user bubbles only)
  const attachSection = renderAttachmentSection(role, attachments);
  if (attachSection) msgDiv.appendChild(attachSection);

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.innerHTML = role === "ai" ? getAiAvatarIcon() : ICONS.user;

  const outer = document.createElement("div");
  outer.className = `chat-msg-outer ${role}`;
  if (role === "ai") {
    outer.appendChild(avatar);
    outer.appendChild(msgDiv);
  } else {
    outer.appendChild(msgDiv);
    outer.appendChild(avatar);
  }

  if (role === "ai") {
    const wrap = document.createElement("div");
    wrap.className = "chat-bubble-wrap";

    if (thinkContent !== null) {
      const thinkSection = document.createElement("div");
      thinkSection.className = "chat-think-section finalized";
      buildThinkToggle(thinkSection, thinkContent);
      wrap.appendChild(thinkSection);

      const answerTag = document.createElement("div");
      answerTag.className = "answer-section-tag";
      answerTag.innerHTML = `${ICONS.messageSquare}<span>${t(lang, "answerTab")}</span>`;
      wrap.appendChild(answerTag);
    }

    const actions = buildAIBubbleActions();

    wrap.appendChild(outer);
    wrap.appendChild(actions);
    chatMessages.appendChild(wrap);
  } else {
    chatMessages.appendChild(outer);
  }

  scrollToBottom();
  return msgDiv;
}

// ===== Deep thinking (<think> blocks) =====

// Fallback: strip orphaned <answer> tags when model doesn't use the structured format
function stripAnswerTags(text) {
  return text
    .replace(/<answer>/gi, "")
    .replace(/<\/answer>/gi, "")
    .trim();
}

function parseThinking(text) {
  const thinkStart = text.search(/<think(?:ing)?>/i);

  // No <think> tag — check for a bare <answer> block
  if (thinkStart === -1) {
    const answerOnly = text.match(/<answer>([\s\S]*?)<\/answer>/i);
    if (answerOnly)
      return { think: null, answer: answerOnly[1].trim(), partial: false };
    return { think: null, answer: stripAnswerTags(text), partial: false };
  }

  // Strip any <answer>...</answer> block that appeared *before* <think> (model output misordering)
  const before = stripAnswerTags(text.slice(0, thinkStart).trim());
  const rest = text.slice(thinkStart);

  // Complete <think>...</think> found
  const thinkComplete = rest.match(
    /<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>([\s\S]*)/i,
  );
  if (thinkComplete) {
    const thinkContent = thinkComplete[1].trim();
    const afterThink = thinkComplete[2];

    // Preferred format: <answer>...</answer> present
    const answerComplete = afterThink.match(/<answer>([\s\S]*?)<\/answer>/i);
    if (answerComplete) {
      const rawAnswer = [before, answerComplete[1].trim()]
        .filter(Boolean)
        .join("\n\n");
      return { think: thinkContent, answer: rawAnswer, partial: false };
    }

    // <answer> opened but not yet closed (still streaming answer)
    const answerPartial = afterThink.match(/<answer>([\s\S]*)/i);
    if (answerPartial) {
      const rawAnswer = [before, answerPartial[1]].filter(Boolean).join("\n\n");
      return { think: thinkContent, answer: rawAnswer, partial: false };
    }

    // No <answer> tags — use text after </think> as fallback
    const rawAnswer = [before, afterThink.trim()].filter(Boolean).join("\n\n");
    return {
      think: thinkContent,
      answer: stripAnswerTags(rawAnswer),
      partial: false,
    };
  }

  // <think> is still streaming — suppress preamble from answer area until thinking is done
  const partial = rest.match(/<think(?:ing)?>([\s\S]*)/i);
  if (partial) return { think: partial[1], answer: "", partial: true };
  return { think: null, answer: stripAnswerTags(text), partial: false };
}

function buildThinkToggle(sectionEl, thinkText) {
  sectionEl.innerHTML = "";

  const toggle = document.createElement("button");
  toggle.className = "think-section-tag think-toggle-btn";
  toggle.setAttribute("aria-expanded", "true");
  toggle.innerHTML = `${ICONS.lightbulb}<span>${t(lang, "thinkHideProcess")}</span>${ICONS.chevronDown}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "chat-think-content";
  contentDiv.innerHTML = markdownToHtml(thinkText);
  contentDiv.hidden = false;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    const next = !expanded;
    toggle.setAttribute("aria-expanded", String(next));
    contentDiv.hidden = !next;
    toggle.querySelector("span").textContent = next
      ? t(lang, "thinkHideProcess")
      : t(lang, "thinkSeeProcess");
  });

  sectionEl.appendChild(toggle);
  sectionEl.appendChild(contentDiv);
}

function renderAIBubbleContent(aiBubble, bubbleWrap, fullText) {
  if (!fullText?.trim()) return; // Ignore empty chunks (e.g., Gemini Nano's final empty flush)
  const { think, answer, partial } = parseThinking(fullText);

  if (think !== null) {
    let section = bubbleWrap.querySelector(".chat-think-section");
    if (!section) {
      section = document.createElement("div");
      section.className = "chat-think-section";
      bubbleWrap.prepend(section); // Always place at the top (above the answer)
    }

    if (partial) {
      section.className = "chat-think-section streaming";
      section.innerHTML = `
        <div class="think-streaming-header">${ICONS.lightbulb}<span>${t(lang, "thinkThinking")}</span></div>
        <div class="think-streaming-body">${escapeHtml(think)}</div>`;
      aiBubble.innerHTML = answer ? markdownToHtml(answer) : "";
    } else if (!section.classList.contains("finalized")) {
      section.className = "chat-think-section finalized";
      buildThinkToggle(section, think);
      // Insert the answer section tag just before .chat-msg-outer
      const outer = bubbleWrap.querySelector(".chat-msg-outer");
      if (outer && !bubbleWrap.querySelector(".answer-section-tag")) {
        const answerTag = document.createElement("div");
        answerTag.className = "answer-section-tag";
        answerTag.innerHTML = `${ICONS.messageSquare}<span>${t(lang, "answerTab")}</span>`;
        bubbleWrap.insertBefore(answerTag, outer);
      }
      aiBubble.innerHTML = markdownToHtml(answer);
      aiBubble.dataset.md = answer;
    } else {
      // Already finalized (o-series: answer arrives after thinking is complete)
      if (answer !== aiBubble.dataset.md) {
        aiBubble.innerHTML = markdownToHtml(answer);
        aiBubble.dataset.md = answer;
      }
    }
  } else {
    bubbleWrap.querySelector(".chat-think-section")?.remove();
    bubbleWrap.querySelector(".answer-section-tag")?.remove();
    aiBubble.innerHTML = markdownToHtml(answer);
    aiBubble.dataset.md = answer;
  }
}

// ===== Chat read-aloud =====
let activeSpeakBtn = null;

function speakMessage(text, btn) {
  if (!window.speechSynthesis) return;

  // If a different button is already speaking, reset it
  if (activeSpeakBtn && activeSpeakBtn !== btn) {
    activeSpeakBtn.innerHTML = ICONS.speakerWave;
    activeSpeakBtn.removeAttribute("data-speaking");
    activeSpeakBtn = null;
  }

  // Same button clicked again → toggle off
  if (btn.dataset.speaking) {
    stopChatSpeak();
    return;
  }

  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = getSpeechLangCode(text);
  u.rate = speechRate;

  btn.innerHTML = ICONS.speakerXMark;
  btn.dataset.speaking = "1";
  activeSpeakBtn = btn;
  speakStopBtn.style.display = "inline-flex";

  const onDone = () => {
    btn.innerHTML = ICONS.speakerWave;
    btn.removeAttribute("data-speaking");
    activeSpeakBtn = null;
    speakStopBtn.style.display = "none";
  };
  u.onend = onDone;
  u.onerror = onDone;

  speechSynthesis.speak(u);
}

function stopChatSpeak() {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  if (activeSpeakBtn) {
    activeSpeakBtn.innerHTML = ICONS.speakerWave;
    activeSpeakBtn.removeAttribute("data-speaking");
    activeSpeakBtn = null;
  }
  speakStopBtn.style.display = "none";
}

speakStopBtn.addEventListener("click", stopChatSpeak);

// ===== Chat favorites =====
function likeChatMessage(text, btn) {
  if (!text) return;
  chrome.storage.local.get({ chatFavorites: [] }, (data) => {
    const favs = data.chatFavorites;
    const already = favs.findIndex((f) => f.text === text);
    if (already >= 0) {
      // Already saved → remove (toggle off)
      favs.splice(already, 1);
      btn.classList.remove("liked");
      btn.innerHTML = ICONS.star;
    } else {
      favs.unshift({ text, date: new Date().toISOString(), lang });
      btn.classList.add("liked");
      btn.innerHTML = ICONS.check;
      setTimeout(() => {
        btn.innerHTML = ICONS.star;
      }, 1200);
    }
    chrome.storage.local.set({ chatFavorites: favs });
  });
}

// Delegate clicks on the message area (speak / like)
chatMessages.addEventListener("click", async (e) => {
  // Copy button inside a code block
  const copyCodeBtn = e.target.closest(".code-copy-btn");
  if (copyCodeBtn) {
    const code = copyCodeBtn.closest(".code-block")?.querySelector("code");
    if (code) {
      await navigator.clipboard.writeText(code.textContent);
      const orig = copyCodeBtn.innerHTML;
      copyCodeBtn.innerHTML = ICONS.check;
      setTimeout(() => {
        copyCodeBtn.innerHTML = orig;
      }, 1500);
    }
    return;
  }

  const btn = e.target.closest(".msg-btn[data-action]");
  if (!btn) return;
  const wrap = btn.closest(".chat-bubble-wrap");
  const msgEl = wrap?.querySelector(".chat-msg.ai");
  if (!msgEl) return;

  const text = msgEl.textContent;
  if (btn.dataset.action === "speak") speakMessage(text, btn);
  if (btn.dataset.action === "like")
    likeChatMessage(msgEl.dataset.md ?? text, btn);
  if (btn.dataset.action === "copy") {
    const copyText = msgEl.dataset.md ?? text;
    await navigator.clipboard.writeText(copyText);
    const orig = btn.innerHTML;
    btn.innerHTML = ICONS.check;
    setTimeout(() => {
      btn.innerHTML = orig;
    }, 1500);
  }
  if (btn.dataset.action === "branch") {
    // Determine the chatHistory index from DOM order
    const allMsgEls = [...chatMessages.children].filter(
      (el) =>
        el.classList.contains("chat-bubble-wrap") ||
        el.classList.contains("chat-msg-outer"),
    );
    const msgIdx = allMsgEls.indexOf(wrap);
    if (msgIdx >= 0) branchFromMessage(msgIdx);
  }
  if (btn.dataset.action === "retry") retryLastMessage(wrap);
});

// ===== Scroll control (ChatGPT-style: no auto-follow while the user scrolls up) =====
let chatAutoScroll = true;

const scrollTopBtn = document.getElementById("scrollTopBtn");
const scrollBotBtn = document.getElementById("scrollBotBtn");

chatMessages.addEventListener("scroll", () => {
  const distFromBottom =
    chatMessages.scrollHeight -
    chatMessages.scrollTop -
    chatMessages.clientHeight;
  chatAutoScroll = distFromBottom < 60;
  scrollTopBtn.classList.toggle("visible", chatMessages.scrollTop > 60);
  scrollBotBtn.classList.toggle("visible", distFromBottom > 60);
});

scrollTopBtn.addEventListener("click", () => {
  chatMessages.scrollTo({ top: 0, behavior: "smooth" });
});

scrollBotBtn.addEventListener("click", () => {
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
});

function scrollToBottom(force = false) {
  if (force || chatAutoScroll) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function setChatUIBusy(busy) {
  chatBusy = busy;
  chatSend.style.display = busy ? "none" : "";
  chatStop.style.display = busy ? "flex" : "none";
  if (!busy) scrollToBottom(true);
}

// ===== File attachments =====
// image/audio: { name, type:'image'|'audio', content: Blob, previewUrl: string }
// text:        { name, type:'text',           content: string }
let attachedFiles = [];

const chatAttachBtn = document.getElementById("chatAttachBtn");
const chatFileInput = document.getElementById("chatFileInput");
const chatAttachPrev = document.getElementById("chatAttachPreview");

chatAttachBtn?.addEventListener("click", () => chatFileInput?.click());

chatFileInput?.addEventListener("change", async () => {
  for (const file of chatFileInput.files) {
    if (attachedFiles.length >= 4) break; // Maximum 4 files
    if (file.type.startsWith("image/") || file.type.startsWith("audio/")) {
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;
      attachedFiles.push({
        name: file.name,
        type: file.type.startsWith("audio/") ? "audio" : "image",
        content: file,
        previewUrl,
      });
    } else {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      attachedFiles.push({ name: file.name, type: "text", content: text });
    }
  }
  chatFileInput.value = "";
  renderAttachPreview();
});

function revokeAttachUrl(f) {
  if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
}

function renderAttachPreview() {
  if (!attachedFiles.length) {
    chatAttachPrev.style.display = "none";
    return;
  }
  chatAttachPrev.style.display = "flex";
  chatAttachPrev.innerHTML = attachedFiles
    .map(
      (f, i) => `
    <div class="attach-chip" data-i="${i}">
      ${
        f.type === "image"
          ? `<img src="${f.previewUrl}" class="attach-thumb" alt="${escapeHtml(f.name)}">`
          : `${ICONS.fileText}<span class="attach-name">${escapeHtml(f.name)}</span>`
      }
      <button class="attach-rm" data-i="${i}">${ICONS.xMark}</button>
    </div>`,
    )
    .join("");
  chatAttachPrev.querySelectorAll(".attach-rm").forEach((btn) => {
    btn.addEventListener("click", () => {
      revokeAttachUrl(attachedFiles[Number(btn.dataset.i)]);
      attachedFiles.splice(Number(btn.dataset.i), 1);
      renderAttachPreview();
    });
  });
}

const TEXT_FILE_MAX_CHARS = 12000; // ~3000 tokens for external API
const TEXT_FILE_MAX_CHARS_BUILTIN = 2000; // ~500 tokens for built-in AI (Gemini Nano limit)

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function buildUserContentWithAttachments(
  text,
  files = attachedFiles,
  forBuiltin = false,
) {
  if (!files.length) return text || "";
  const effectiveText = text || "Please describe the attached file.";

  if (forBuiltin) {
    // Chrome AI multipart format: [{ role, content: [{type, value}] }]
    const contentParts = [{ type: "text", value: effectiveText }];
    for (const f of files) {
      if (f.type === "text") {
        const body =
          f.content.length > TEXT_FILE_MAX_CHARS_BUILTIN
            ? f.content.slice(0, TEXT_FILE_MAX_CHARS_BUILTIN) +
              `\n...(truncated, ${f.content.length - TEXT_FILE_MAX_CHARS_BUILTIN} chars omitted)`
            : f.content;
        contentParts[0].value += `\n\n---\n📄 ${f.name}:\n${body}`;
      } else {
        // f.content is already a Blob (File) — pass directly
        contentParts.push({ type: f.type, value: f.content });
      }
    }
    const hasMedia = contentParts.some((p) => p.type !== "text");
    return hasMedia
      ? [{ role: "user", content: contentParts }]
      : contentParts[0].value;
  }

  // External API format (OpenAI-compatible)
  const parts = [{ type: "text", text: effectiveText }];
  for (const f of files) {
    if (f.type === "image") {
      const dataUrl = await blobToDataUrl(f.content);
      parts.push({ type: "image_url", image_url: { url: dataUrl } });
    } else if (f.type !== "audio") {
      const body =
        f.content.length > TEXT_FILE_MAX_CHARS
          ? f.content.slice(0, TEXT_FILE_MAX_CHARS) +
            `\n...(truncated, ${f.content.length - TEXT_FILE_MAX_CHARS} chars omitted)`
          : f.content;
      parts[0].text += `\n\n---\n📄 ${f.name}:\n${body}`;
    }
  }
  return parts.length === 1 ? parts[0].text : parts;
}

// Stream a reply from the external OpenAI-compatible API into the AI bubble.
// Returns the full response text.
async function handleExternalChat({
  aiBubble,
  bubbleWrap,
  signal,
  pendingAttachments,
  userContent,
}) {
  if (!apiEndpoint || !modelName)
    throw new Error("Please configure the endpoint URL and model name.");
  const oSeries = isOSeriesModel(modelName);
  // When attachments exist, convert the last message to multipart content
  const historyMessages = chatHistory.map((m, idx) => {
    const isLast = idx === chatHistory.length - 1;
    let content = isLast && pendingAttachments.length ? userContent : m.text;
    // Deep-think mode ON and last user message → append thinking instruction
    // (o-series use native reasoning, so not needed)
    if (isLast && m.role === "user" && deepThinkMode && !oSeries) {
      const thinkInstruction = "\n\n[" + t(lang, "deepThinkInstruction") + "]";
      if (Array.isArray(content)) {
        content = content.map((p) =>
          p.type === "text" ? { ...p, text: p.text + thinkInstruction } : p,
        );
      } else {
        content = (content || "") + thinkInstruction;
      }
    }
    return {
      role: m.role === "assistant" ? "assistant" : oSeries ? "user" : m.role,
      content,
    };
  });
  // o-series has no system role (convert to developer role)
  const systemMsg = oSeries
    ? { role: "developer", content: buildSystemPrompt(lang) }
    : { role: "system", content: buildSystemPrompt(lang) };
  const messages = [systemMsg, ...historyMessages];
  // Additional parameters for o-series
  const extraOpts = oSeries ? { reasoning_effort: "medium" } : {};
  const aiText = await fetchLLMStream(
    apiEndpoint,
    apiKey,
    modelName,
    messages,
    (full) => {
      if (signal.aborted) return;
      renderAIBubbleContent(aiBubble, bubbleWrap, full);
      scrollToBottom();
    },
    signal,
    extraOpts,
  );
  if (!aiText) aiBubble.innerHTML = markdownToHtml(t(lang, "chatThinking"));
  return aiText;
}

// Stream a reply from Chrome's built-in AI (Gemini Nano) into the AI bubble.
// Returns the full response text ('' when the model is unavailable/downloading).
async function handleBuiltinChat({
  aiBubble,
  bubbleWrap,
  signal,
  text,
  pendingAttachments,
}) {
  const session = await createBuiltinSession();
  if (!session) {
    aiBubble.textContent = t(lang, "chatUnavailable");
    return "";
  }
  if (session === "downloading") {
    aiBubble.textContent = t(lang, "downloading");
    return "";
  }

  // Build prompt — string for text-only, multipart array when images/audio are attached
  let builtinPrompt = await buildUserContentWithAttachments(
    text,
    pendingAttachments,
    true,
  );
  if (deepThinkMode) {
    const instruction = "\n\n[" + t(lang, "deepThinkInstruction") + "]";
    if (Array.isArray(builtinPrompt)) {
      builtinPrompt = builtinPrompt.map((msg) => ({
        ...msg,
        content: msg.content.map((p) =>
          p.type === "text" ? { ...p, value: p.value + instruction } : p,
        ),
      }));
    } else {
      builtinPrompt += instruction;
    }
  }

  const outLang = CHROME_AI_OUTPUT_LANGS.has(lang) ? lang : "en";
  const promptOpts = { signal, outputLanguage: outLang };

  let aiText = "";
  try {
    if (typeof session.promptStreaming === "function") {
      const stream = session.promptStreaming(builtinPrompt, promptOpts);
      let full = "";
      for await (const chunk of stream) {
        if (signal.aborted) break;
        full += chunk;
        renderAIBubbleContent(aiBubble, bubbleWrap, full);
        scrollToBottom();
      }
      aiText = full;
    } else {
      aiText = await session.prompt(builtinPrompt, promptOpts);
      if (!signal.aborted) renderAIBubbleContent(aiBubble, bubbleWrap, aiText);
    }
  } finally {
    session.destroy?.();
  }
  return aiText;
}

async function sendChat() {
  const text = chatInput.value.trim();
  if ((!text && !attachedFiles.length) || chatBusy) return;

  stopChatSpeak(); // Stop read-aloud from the previous message
  chatAutoScroll = true; // Re-enable auto-scroll when the user sends a message
  // Show attached files in the user bubble (pendingAttachments are finalized right after this)
  const pendingAttachments = [...attachedFiles];
  const userContent = await buildUserContentWithAttachments(
    text,
    pendingAttachments,
  );
  // Build display attachments: { name, type, url (previewUrl for images), content (Blob/string) }
  const displayAttachments = pendingAttachments.map((f) => ({
    name: f.name,
    type: f.type,
    url: f.previewUrl ?? null,
    content: f.content,
  }));
  addBubble(
    "user",
    text,
    displayAttachments.length ? displayAttachments : undefined,
  );
  attachedFiles = [];
  renderAttachPreview();
  chatInput.value = "";
  autoGrowChat();

  // Serialize attachments for persistent history storage
  const IMAGE_STORE_LIMIT = 2 * 1024 * 1024; // skip images > 2 MB
  const serializedAttachments = await Promise.all(
    pendingAttachments.map(async (f) => {
      if (f.type === "image") {
        if (f.content.size <= IMAGE_STORE_LIMIT) {
          try {
            return {
              name: f.name,
              type: "image",
              dataUrl: await blobToDataUrl(f.content),
            };
          } catch {}
        }
        return { name: f.name, type: "image" };
      }
      if (f.type === "text")
        return { name: f.name, type: "text", content: f.content };
      return { name: f.name, type: f.type };
    }),
  );

  // Save user message to history (text only; files go in attachments array)
  chatHistory.push({
    role: "user",
    text: text || "",
    attachments: serializedAttachments.length
      ? serializedAttachments
      : undefined,
  });
  saveChatHistory();

  setChatUIBusy(true);
  wasManuallyStopped = false;
  const aiBubble = addBubble("ai", t(lang, "chatThinking"));
  const bubbleWrap = aiBubble.closest(".chat-bubble-wrap");
  activeBubbleWrap = bubbleWrap;
  if (bubbleWrap) bubbleWrap.classList.add("streaming");

  chatAbort = new AbortController();
  const signal = chatAbort.signal;
  let aiText = "";
  try {
    const params = {
      aiBubble,
      bubbleWrap,
      signal,
      text,
      pendingAttachments,
      userContent,
    };
    aiText =
      aiProvider === "external"
        ? await handleExternalChat(params)
        : await handleBuiltinChat(params);
  } catch (e) {
    if (e.name !== "AbortError") {
      const msg = e.message || "";
      let friendlyMsg;
      if (
        msg.includes("kErrorUnknown") ||
        msg.includes("kErrorInvalidRequest")
      ) {
        friendlyMsg =
          "⚠️ Input is too long. Please reduce the attachment size or use an external API.";
      } else if (msg.includes("kNotSupported") || msg.includes("unavailable")) {
        friendlyMsg =
          "⚠️ Chrome built-in AI is unavailable. Please switch to an external API in settings.";
      } else {
        friendlyMsg = "⚠️ " + msg;
      }
      aiBubble.textContent = friendlyMsg;
    }
    // Retrieve the partial text (excluding the think section)
    const msgEl = bubbleWrap?.querySelector(".chat-msg.ai");
    aiText = msgEl
      ? msgEl.dataset.md || msgEl.textContent
      : aiBubble.dataset.md || aiBubble.textContent;
  } finally {
    if (!wasManuallyStopped) {
      // Normal completion: save history and release UI
      if (aiText && aiText !== t(lang, "chatThinking")) {
        chatHistory.push({ role: "assistant", text: aiText });
        saveChatHistory();
      }
      if (bubbleWrap) bubbleWrap.classList.remove("streaming");
      activeBubbleWrap = null;
      chatAbort = null;
      setChatUIBusy(false);
    } else {
      // Manual stop: history already saved by the stop-button handler, UI already released
      chatAbort = null;
      const msgEl = bubbleWrap?.querySelector(".chat-msg.ai");
      const savedText = msgEl
        ? (msgEl.dataset.md || msgEl.textContent || "").trim()
        : "";
      if (savedText && savedText !== t(lang, "chatThinking") && bubbleWrap) {
        addContinueBtn(bubbleWrap, savedText);
      }
    }
    wasManuallyStopped = false;
  }
}

function addContinueBtn(bubbleWrap, _partialText) {
  const btn = document.createElement("button");
  btn.className = "msg-btn continue-btn";
  btn.innerHTML = `${ICONS.arrowDown} ${t(lang, "continueGenerate")}`;
  btn.addEventListener("click", () => {
    btn.remove();
    chatInput.value = t(lang, "continuePrompt");
    sendChat();
  });
  const actions = bubbleWrap.querySelector(".chat-msg-actions");
  if (actions) actions.prepend(btn);
}

function autoGrowChat() {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 96) + "px";
}

chatStop.addEventListener("click", () => {
  wasManuallyStopped = true;

  // Save chat history immediately (before calling setChatUIBusy to release)
  if (activeBubbleWrap) {
    const msgEl = activeBubbleWrap.querySelector(".chat-msg.ai");
    const partialText = msgEl
      ? (msgEl.dataset.md || msgEl.textContent || "").trim()
      : "";
    if (partialText && partialText !== t(lang, "chatThinking")) {
      chatHistory.push({ role: "assistant", text: partialText });
      saveChatHistory();
    }
    activeBubbleWrap.classList.remove("streaming");
  }
  activeBubbleWrap = null;
  setChatUIBusy(false);
  try {
    chatAbort?.abort();
  } catch {}
});

// ===== Deep Think mode =====
let deepThinkMode = false;
const chatThinkBtn = document.getElementById("chatThinkBtn");

chatThinkBtn?.addEventListener("click", () => {
  deepThinkMode = !deepThinkMode;
  chatThinkBtn.classList.toggle("active", deepThinkMode);
  chatThinkBtn.title = t(
    lang,
    deepThinkMode ? "deepThinkTitleOn" : "deepThinkTitle",
  );
});

chatSend.addEventListener("click", sendChat);
chatInput.addEventListener("input", autoGrowChat);

// Screenshot paste (Ctrl+V)
chatInput.addEventListener("paste", (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (!item.type.startsWith("image/")) continue;
    e.preventDefault();
    if (attachedFiles.length >= 4) return;
    const blob = item.getAsFile();
    if (!blob) continue;
    const name = `screenshot_${Date.now()}.png`;
    const previewUrl = URL.createObjectURL(blob);
    attachedFiles.push({ name, type: "image", content: blob, previewUrl });
    renderAttachPreview();
    return; // Process one image at a time
  }
});

chatInput.addEventListener("keydown", (e) => {
  // Ctrl+Enter or Cmd+Enter to send; plain Enter inserts a newline
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    sendChat();
  }
});

// Image lightbox — click .md-img to enlarge
chatMessages.addEventListener("click", (e) => {
  const img = e.target.closest(".md-img");
  if (!img) return;
  const overlay = document.createElement("div");
  overlay.className = "img-lightbox";
  const enlarged = document.createElement("img");
  enlarged.src = img.src;
  enlarged.alt = img.alt;
  overlay.appendChild(enlarged);
  const dlLink = document.createElement("a");
  dlLink.href = img.src;
  dlLink.download = img.alt || "image";
  dlLink.className = "lightbox-dl-btn";
  dlLink.innerHTML = ICONS.download;
  dlLink.title = "Download";
  dlLink.addEventListener("click", (ev) => ev.stopPropagation());
  overlay.appendChild(dlLink);
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (ke) => {
    if (ke.key === "Escape") close();
  };
  overlay.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
});

// ===== Guide Overlay =====
const helpBtn = document.getElementById("helpBtn");
const screenGuide = document.getElementById("screen-guide");
const guideCloseBtn = document.getElementById("guideCloseBtn");

helpBtn.addEventListener("click", () => {
  screenGuide.hidden = false;
});

guideCloseBtn.addEventListener("click", () => {
  screenGuide.hidden = true;
});

document.querySelectorAll(".guide-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".guide-tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".guide-panel")
      .forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document
      .getElementById(`guide-panel-${btn.dataset.tab}`)
      .classList.add("active");
  });
});

// ===== Sidebar (folder and multi-select support) =====
const CHAT_FOLDERS_KEY = "chatFolders";
let chatFolders = [];
let sidebarSelectMode = false;
let selectedSessionIds = new Set();
let collapsedFolders = new Set();
let folderPickerTargetId = null;

function saveFolders() {
  chrome.storage.local.set({ [CHAT_FOLDERS_KEY]: chatFolders });
}

sidebarToggle.addEventListener("click", () => {
  const isOpen = chatSidebar.classList.toggle("open");
  sidebarToggle.innerHTML = isOpen ? ICONS.xMark : ICONS.bars3;
  if (isOpen) renderSidebar();
});

function renderSidebarItem(s) {
  const isActive = s.id === activeSessionId;
  const isSelected = selectedSessionIds.has(s.id);
  if (sidebarSelectMode) {
    return `<div class="sidebar-item${isActive ? " active" : ""}${isSelected ? " selected" : ""}" data-id="${s.id}">
      <span class="sidebar-item-check">${isSelected ? ICONS.checkCircle : ICONS.circle}</span>
      <div class="sidebar-title">${escapeHtml(s.title)}</div>
    </div>`;
  }
  return `<div class="sidebar-item${isActive ? " active" : ""}" data-id="${s.id}" draggable="true">
    <div class="sidebar-title">${escapeHtml(s.title)}</div>
    <button class="sidebar-menu-btn" data-id="${s.id}" title="Menu">${ICONS.ellipsisVertical}</button>
  </div>`;
}

function renderSidebar() {
  const selActive = sidebarSelectMode ? " active" : "";
  let html = `<div class="sidebar-toolbar">
    <button class="sidebar-new-btn" id="sidebarNewBtn">${ICONS.plus} ${escapeHtml(t(lang, "newChat"))}</button>
    <button class="sidebar-select-btn${selActive}" id="sidebarSelectBtn" title="${escapeHtml(t(lang, "selectMode"))}">${ICONS.checkCircle}</button>
    <button class="sidebar-add-folder-btn" id="sidebarAddFolderBtn" title="${escapeHtml(t(lang, "newFolder"))}">${ICONS.folderPlus}</button>
  </div>`;

  if (sidebarSelectMode && selectedSessionIds.size > 0) {
    const label = t(lang, "deleteSelected").replace(
      "%d",
      selectedSessionIds.size,
    );
    html += `<button class="sidebar-delete-sel-btn" id="sidebarDeleteSelBtn">${escapeHtml(label)}</button>`;
  }

  if (chatSessions.length === 0) {
    html += `<p class="sidebar-empty-msg">${escapeHtml(t(lang, "historyEmpty"))}</p>`;
  } else {
    for (const folder of chatFolders) {
      const folderSessions = chatSessions.filter(
        (s) => s.folderId === folder.id,
      );
      const isCollapsed = collapsedFolders.has(folder.id);
      html += `<div class="sidebar-folder-header" data-folder-id="${folder.id}">
        <span class="folder-toggle">${isCollapsed ? ICONS.chevronRight : ICONS.chevronDown}</span>
        <span class="folder-name">${escapeHtml(folder.name)}</span>
        <span class="folder-count">${folderSessions.length}</span>
        <button class="folder-menu-btn" data-folder-id="${folder.id}" title="Menu">${ICONS.ellipsisVertical}</button>
      </div>`;
      if (!isCollapsed) {
        if (folderSessions.length === 0) {
          html += `<div class="sidebar-folder-empty">—</div>`;
        } else {
          folderSessions.forEach((s) => {
            html += renderSidebarItem(s);
          });
        }
      }
    }

    const uncatSessions = chatSessions.filter(
      (s) => !s.folderId || !chatFolders.find((f) => f.id === s.folderId),
    );
    if (chatFolders.length > 0) {
      html += `<div class="sidebar-group-label sidebar-uncat-drop">${escapeHtml(t(lang, "uncategorized"))}</div>`;
    }
    if (uncatSessions.length === 0 && chatFolders.length === 0) {
      html += `<p class="sidebar-empty-msg">${escapeHtml(t(lang, "historyEmpty"))}</p>`;
    }
    uncatSessions.forEach((s) => {
      html += renderSidebarItem(s);
    });
  }

  sidebarList.innerHTML = html;
  document
    .getElementById("sidebarNewBtn")
    ?.addEventListener("click", newConversation);
  document.getElementById("sidebarSelectBtn")?.addEventListener("click", () => {
    sidebarSelectMode = !sidebarSelectMode;
    selectedSessionIds.clear();
    renderSidebar();
  });
  document
    .getElementById("sidebarAddFolderBtn")
    ?.addEventListener("click", startCreateFolder);
  document
    .getElementById("sidebarDeleteSelBtn")
    ?.addEventListener("click", deleteSelectedSessions);
}

function startCreateFolder() {
  const toolbar = sidebarList.querySelector(".sidebar-toolbar");
  if (sidebarList.querySelector(".sidebar-folder-create")) return;
  const row = document.createElement("div");
  row.className = "sidebar-folder-create";
  row.innerHTML = `<input type="text" class="sidebar-folder-input" maxlength="20" placeholder="${escapeHtml(t(lang, "folderNamePlaceholder"))}">
    <button class="sidebar-folder-ok" title="OK">${ICONS.check}</button>
    <button class="sidebar-folder-cancel" title="Cancel">${ICONS.xMark}</button>`;
  toolbar.after(row);
  const inp = row.querySelector("input");
  inp.focus();
  const confirm = () => {
    const name = inp.value.trim();
    if (name) {
      chatFolders.push({ id: "f_" + Date.now(), name });
      saveFolders();
    }
    renderSidebar();
  };
  row.querySelector(".sidebar-folder-ok").addEventListener("click", confirm);
  row
    .querySelector(".sidebar-folder-cancel")
    .addEventListener("click", () => renderSidebar());
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") renderSidebar();
  });
}

function startFolderRename(folderId, headerEl) {
  const folder = chatFolders.find((f) => f.id === folderId);
  if (!folder || !headerEl) return;

  // Replace the folder header with an inline input
  headerEl.innerHTML = `
    <input type="text" class="sidebar-folder-input" value="${escapeHtml(folder.name)}" maxlength="20">
    <button class="sidebar-folder-ok" title="OK">${ICONS.check}</button>
    <button class="sidebar-folder-cancel" title="Cancel">${ICONS.xMark}</button>`;
  const inp = headerEl.querySelector("input");
  inp.focus();
  inp.select();

  const confirm = () => {
    const name = inp.value.trim();
    if (name && name !== folder.name) {
      folder.name = name;
      saveFolders();
    }
    renderSidebar();
  };
  headerEl
    .querySelector(".sidebar-folder-ok")
    .addEventListener("click", confirm);
  headerEl
    .querySelector(".sidebar-folder-cancel")
    .addEventListener("click", () => renderSidebar());
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") renderSidebar();
    e.stopPropagation();
  });
}

async function deleteSelectedSessions() {
  if (!selectedSessionIds.size) return;
  const msg = t(lang, "confirmDeleteSelected").replace(
    "%d",
    String(selectedSessionIds.size),
  );
  const ok = await showConfirm(msg);
  if (!ok) return;
  const hadActive = selectedSessionIds.has(activeSessionId);
  chatSessions = chatSessions.filter((s) => !selectedSessionIds.has(s.id));
  selectedSessionIds.clear();
  sidebarSelectMode = false;
  chrome.storage.local.set({ [CHAT_SESSIONS_KEY]: chatSessions });
  updateChatBadge();
  if (hadActive) {
    activeSessionId = null;
    clearChatHistory();
    renderChatEmpty();
  }
  renderSidebar();
}

function showFolderPicker(sessionId) {
  folderPickerTargetId = sessionId;
  const picker = document.getElementById("folderPicker");
  const list = document.getElementById("folderPickerList");
  list.innerHTML = chatFolders
    .map(
      (f) =>
        `<button class="folder-picker-item" data-folder-id="${f.id}">${escapeHtml(f.name)}</button>`,
    )
    .join("");
  picker.hidden = false;
}

function moveSessionToFolder(sessionId, folderId) {
  const idx = chatSessions.findIndex((s) => s.id === sessionId);
  if (idx >= 0) {
    chatSessions[idx] = { ...chatSessions[idx], folderId: folderId || null };
    chrome.storage.local.set({ [CHAT_SESSIONS_KEY]: chatSessions });
    renderSidebar();
  }
}

document.getElementById("folderPicker").addEventListener("click", (e) => {
  const item = e.target.closest(".folder-picker-item");
  if (item && folderPickerTargetId !== null) {
    moveSessionToFolder(folderPickerTargetId, item.dataset.folderId);
    document.getElementById("folderPicker").hidden = true;
    folderPickerTargetId = null;
  }
});

document.getElementById("folderPickerNone").addEventListener("click", () => {
  if (folderPickerTargetId !== null) {
    moveSessionToFolder(folderPickerTargetId, null);
  }
  document.getElementById("folderPicker").hidden = true;
  folderPickerTargetId = null;
});

// ===== Sidebar context menu =====
let sidebarMenuTargetId = null;

function getSidebarMenu() {
  let menu = document.getElementById("sidebarContextMenu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "sidebarContextMenu";
    menu.className = "sidebar-context-menu";
    menu.hidden = true;
    document.body.appendChild(menu);

    menu.addEventListener("click", async (e) => {
      const item = e.target.closest(".sidebar-menu-item");
      if (!item || sidebarMenuTargetId === null) return;
      menu.hidden = true;
      const id = sidebarMenuTargetId;
      sidebarMenuTargetId = null;
      if (item.dataset.action === "delete") {
        const ok = await showConfirm(t(lang, "confirmDeleteSession"));
        if (ok) deleteSession(id);
      } else if (item.dataset.action === "move") {
        moveSessionToFolder(id, item.dataset.folderId || null);
      }
    });
  }
  return menu;
}

function showSidebarMenu(sessionId, anchorEl) {
  const menu = getSidebarMenu();
  let folderSection = "";
  if (chatFolders.length > 0) {
    folderSection = chatFolders
      .map(
        (f) =>
          `<button class="sidebar-menu-item" data-action="move" data-folder-id="${f.id}">${ICONS.folder} ${escapeHtml(f.name)}</button>`,
      )
      .join("");
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session?.folderId) {
      folderSection += `<button class="sidebar-menu-item muted-item" data-action="move" data-folder-id="">${ICONS.folderArrowRight} ${escapeHtml(t(lang, "noFolder"))}</button>`;
    }
    folderSection += `<div class="sidebar-menu-divider"></div>`;
  }
  menu.innerHTML = `${folderSection}<button class="sidebar-menu-item danger" data-action="delete">${ICONS.trash} ${escapeHtml(t(lang, "confirmDeleteBtn"))}</button>`;

  sidebarMenuTargetId = sessionId;
  const rect = anchorEl.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 2}px`;
  menu.style.left = `${rect.left}px`;
  menu.hidden = false;

  const close = (e) => {
    if (!menu.contains(e.target)) {
      menu.hidden = true;
      sidebarMenuTargetId = null;
      document.removeEventListener("click", close, true);
      document.removeEventListener("keydown", closeKey);
    }
  };
  const closeKey = (e) => {
    if (e.key === "Escape") {
      menu.hidden = true;
      sidebarMenuTargetId = null;
      document.removeEventListener("click", close, true);
      document.removeEventListener("keydown", closeKey);
    }
  };
  setTimeout(() => {
    document.addEventListener("click", close, true);
    document.addEventListener("keydown", closeKey);
  }, 0);
}

let folderMenuTargetId = null;

function showFolderMenu(folderId, anchorEl) {
  let menu = document.getElementById("folderContextMenu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "folderContextMenu";
    menu.className = "sidebar-context-menu";
    menu.hidden = true;
    document.body.appendChild(menu);
    menu.addEventListener("click", async (e) => {
      const item = e.target.closest(".sidebar-menu-item");
      if (!item || folderMenuTargetId === null) return;
      menu.hidden = true;
      const fid = folderMenuTargetId;
      folderMenuTargetId = null;
      if (item.dataset.action === "rename") {
        const headerEl = sidebarList.querySelector(
          `.sidebar-folder-header[data-folder-id="${fid}"]`,
        );
        startFolderRename(fid, headerEl);
      } else if (item.dataset.action === "delete") {
        const ok = await showConfirm(t(lang, "confirmDeleteFolder"));
        if (!ok) return;
        chatFolders = chatFolders.filter((f) => f.id !== fid);
        chatSessions = chatSessions.map((s) =>
          s.folderId === fid ? { ...s, folderId: null } : s,
        );
        chrome.storage.local.set({ [CHAT_SESSIONS_KEY]: chatSessions });
        saveFolders();
        renderSidebar();
      }
    });
  }
  menu.innerHTML = `<button class="sidebar-menu-item" data-action="rename">${ICONS.pencil} Rename</button>
    <div class="sidebar-menu-divider"></div>
    <button class="sidebar-menu-item danger" data-action="delete">${ICONS.trash} ${escapeHtml(t(lang, "confirmDeleteBtn"))}</button>`;
  folderMenuTargetId = folderId;
  const rect = anchorEl.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 2}px`;
  menu.style.left = `${rect.left}px`;
  menu.hidden = false;
  const close = (e) => {
    if (!menu.contains(e.target)) {
      menu.hidden = true;
      folderMenuTargetId = null;
      document.removeEventListener("click", close, true);
      document.removeEventListener("keydown", closeKey);
    }
  };
  const closeKey = (e) => {
    if (e.key === "Escape") {
      menu.hidden = true;
      folderMenuTargetId = null;
      document.removeEventListener("click", close, true);
      document.removeEventListener("keydown", closeKey);
    }
  };
  setTimeout(() => {
    document.addEventListener("click", close, true);
    document.addEventListener("keydown", closeKey);
  }, 0);
}

sidebarList.addEventListener("contextmenu", (e) => {
  const item = e.target.closest(".sidebar-item");
  if (!item) return;
  e.preventDefault();
  const menuBtn = item.querySelector(".sidebar-menu-btn") ?? item;
  showSidebarMenu(Number(item.dataset.id), menuBtn);
});

// ===== Sidebar drag and drop =====
let draggedSessionId = null;

sidebarList.addEventListener("dragstart", (e) => {
  const item = e.target.closest(".sidebar-item[draggable]");
  if (!item) return;
  draggedSessionId = Number(item.dataset.id);
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => item.classList.add("dragging"), 0);
});

sidebarList.addEventListener("dragend", (e) => {
  e.target.closest(".sidebar-item")?.classList.remove("dragging");
  sidebarList
    .querySelectorAll(".drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  draggedSessionId = null;
});

sidebarList.addEventListener("dragover", (e) => {
  if (draggedSessionId === null) return;
  const target = e.target.closest(
    ".sidebar-folder-header, .sidebar-uncat-drop",
  );
  if (!target) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  sidebarList
    .querySelectorAll(".drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  target.classList.add("drag-over");
});

sidebarList.addEventListener("dragleave", (e) => {
  if (!e.relatedTarget || !sidebarList.contains(e.relatedTarget)) {
    sidebarList
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  }
});

sidebarList.addEventListener("drop", (e) => {
  if (draggedSessionId === null) return;
  const folderHeader = e.target.closest(".sidebar-folder-header");
  const uncatLabel = e.target.closest(".sidebar-uncat-drop");
  if (folderHeader) {
    e.preventDefault();
    moveSessionToFolder(draggedSessionId, folderHeader.dataset.folderId);
    folderHeader.classList.remove("drag-over");
  } else if (uncatLabel) {
    e.preventDefault();
    moveSessionToFolder(draggedSessionId, null);
    uncatLabel.classList.remove("drag-over");
  }
  draggedSessionId = null;
});

sidebarList.addEventListener("click", async (e) => {
  const folderMenuBtn = e.target.closest(".folder-menu-btn");
  if (folderMenuBtn) {
    e.stopPropagation();
    showFolderMenu(folderMenuBtn.dataset.folderId, folderMenuBtn);
    return;
  }
  const folderHeader = e.target.closest(".sidebar-folder-header");
  if (folderHeader) {
    const fid = folderHeader.dataset.folderId;
    if (collapsedFolders.has(fid)) collapsedFolders.delete(fid);
    else collapsedFolders.add(fid);
    renderSidebar();
    return;
  }
  const menuBtn = e.target.closest(".sidebar-menu-btn");
  if (menuBtn) {
    e.stopPropagation();
    showSidebarMenu(Number(menuBtn.dataset.id), menuBtn);
    return;
  }
  const item = e.target.closest(".sidebar-item");
  if (item) {
    const id = Number(item.dataset.id);
    if (sidebarSelectMode) {
      if (selectedSessionIds.has(id)) selectedSessionIds.delete(id);
      else selectedSessionIds.add(id);
      renderSidebar();
    } else {
      switchToSession(id);
    }
  }
});

// ===== Confirmation dialog =====
const confirmModal = document.getElementById("confirmModal");
const confirmMsg = document.getElementById("confirmMsg");
const confirmOk = document.getElementById("confirmOk");
const confirmCancel = document.getElementById("confirmCancel");
let confirmResolve = null;

function showConfirm(message) {
  confirmMsg.textContent = message;
  confirmOk.textContent = t(lang, "confirmDeleteBtn");
  confirmCancel.textContent = t(lang, "cancelBtn");
  confirmModal.hidden = false;
  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

confirmOk.addEventListener("click", () => {
  confirmModal.hidden = true;
  confirmResolve?.(true);
  confirmResolve = null;
});
confirmCancel.addEventListener("click", () => {
  confirmModal.hidden = true;
  confirmResolve?.(false);
  confirmResolve = null;
});
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) {
    confirmModal.hidden = true;
    confirmResolve?.(false);
    confirmResolve = null;
  }
});

// ===== Favorites panel =====
let favSelectMode = false;
const favSelectedIdxs = new Set();

function renderFavorites() {
  chrome.storage.local.get({ chatFavorites: [] }, (data) => {
    const favs = data.chatFavorites;
    const selectBtn = document.getElementById("favSelectBtn");

    if (!favs.length) {
      favList.innerHTML = `<div class="fav-empty">${t(lang, "favoritesEmpty")}</div>`;
      if (favSelectMode) {
        favSelectMode = false;
        favSelectedIdxs.clear();
        selectBtn?.classList.remove("active");
      }
      return;
    }

    const selBar = favSelectMode
      ? `
      <div class="fav-select-bar">
        <span class="fav-sel-count">${
          favSelectedIdxs.size > 0
            ? `${favSelectedIdxs.size} selected`
            : t(lang, "selectMode")
        }</span>
        <button class="fav-del-sel-btn" id="favDeleteSelectedBtn"
          ${favSelectedIdxs.size === 0 ? "disabled" : ""}>
          ${ICONS.trash} ${favSelectedIdxs.size > 0 ? favSelectedIdxs.size + t(lang, "countSuffix") + t(lang, "confirmDeleteBtn") : t(lang, "confirmDeleteBtn")}
        </button>
      </div>`
      : "";

    favList.innerHTML =
      selBar +
      favs
        .map((f, idx) => {
          const date = new Date(f.date);
          const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
          const selected = favSelectedIdxs.has(idx);
          const bubble = `
        <div class="chat-msg-outer ai">
          <div class="msg-avatar">${getAiAvatarIcon()}</div>
          <div class="chat-msg ai">${markdownToHtml(f.text)}</div>
        </div>`;
          if (favSelectMode) {
            return `
          <div class="fav-item selectable${selected ? " selected" : ""}" data-idx="${idx}">
            <div class="fav-item-check">${selected ? ICONS.checkCircle : ICONS.circle}</div>
            <div class="fav-item-body">
              ${bubble}
              <span class="fav-item-date">${dateStr}</span>
            </div>
          </div>`;
          }
          return `
        <div class="fav-item" data-idx="${idx}">
          <div class="chat-bubble-wrap">
            ${bubble}
            <div class="chat-msg-actions">
              <span class="fav-item-date">${dateStr}</span>
              <button class="msg-btn fav-copy-btn" data-idx="${idx}" title="${t(lang, "favCopyTitle")}">${ICONS.clipboard}</button>
              <button class="msg-btn fav-del-btn" data-idx="${idx}" title="${t(lang, "favDeleteTitle")}">${ICONS.trash}</button>
            </div>
          </div>
        </div>`;
        })
        .join("");

    document
      .getElementById("favDeleteSelectedBtn")
      ?.addEventListener("click", async () => {
        if (favSelectedIdxs.size === 0) return;
        const ok = await showConfirm(
          t(lang, "favConfirmDeleteSelected").replace(
            "%d",
            favSelectedIdxs.size,
          ),
        );
        if (!ok) return;
        chrome.storage.local.get({ chatFavorites: [] }, (d) => {
          const remaining = d.chatFavorites.filter(
            (_, i) => !favSelectedIdxs.has(i),
          );
          favSelectedIdxs.clear();
          chrome.storage.local.set(
            { chatFavorites: remaining },
            renderFavorites,
          );
        });
      });
  });
}

favBtn.addEventListener("click", () => {
  // Show favorites and conversation history side by side
  if (!chatSidebar.classList.contains("open")) {
    chatSidebar.classList.add("open");
    sidebarToggle.innerHTML = ICONS.xMark;
    renderSidebar();
  }
  favoritesPanel.hidden = false;
  renderFavorites();
});

document.getElementById("favCloseBtn").addEventListener("click", () => {
  favoritesPanel.hidden = true;
  favSelectMode = false;
  favSelectedIdxs.clear();
  document.getElementById("favSelectBtn").classList.remove("active");
});

document.getElementById("favSelectBtn").addEventListener("click", () => {
  favSelectMode = !favSelectMode;
  favSelectedIdxs.clear();
  document
    .getElementById("favSelectBtn")
    .classList.toggle("active", favSelectMode);
  renderFavorites();
});

document
  .getElementById("favClearAllBtn")
  .addEventListener("click", async () => {
    const ok = await showConfirm(t(lang, "favConfirmClearAll"));
    if (!ok) return;
    favSelectMode = false;
    favSelectedIdxs.clear();
    document.getElementById("favSelectBtn").classList.remove("active");
    chrome.storage.local.set({ chatFavorites: [] }, renderFavorites);
  });

favList.addEventListener("click", async (e) => {
  // Select mode: click an item to toggle selection
  if (favSelectMode) {
    const item = e.target.closest(".fav-item.selectable");
    if (item) {
      const idx = Number(item.dataset.idx);
      if (favSelectedIdxs.has(idx)) favSelectedIdxs.delete(idx);
      else favSelectedIdxs.add(idx);
      renderFavorites();
      return;
    }
  }

  const copyBtn = e.target.closest(".fav-copy-btn");
  if (copyBtn) {
    const idx = Number(copyBtn.dataset.idx);
    chrome.storage.local.get({ chatFavorites: [] }, async (data) => {
      const f = data.chatFavorites[idx];
      if (!f) return;
      try {
        await navigator.clipboard.writeText(f.text);
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = ICONS.check;
        setTimeout(() => {
          copyBtn.innerHTML = orig;
        }, 1500);
      } catch {}
    });
    return;
  }
  const delBtn = e.target.closest(".fav-del-btn");
  if (!delBtn) return;
  const ok = await showConfirm(
    t(lang, "favConfirmDeleteSelected").replace("%d", 1),
  );
  if (!ok) return;
  const idx = Number(delBtn.dataset.idx);
  chrome.storage.local.get({ chatFavorites: [] }, (data) => {
    const favs = data.chatFavorites;
    favs.splice(idx, 1);
    chrome.storage.local.set({ chatFavorites: favs }, renderFavorites);
  });
});

// ===== Settings tab switching =====
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${tab}`).classList.add("active");
  });
});

// ===== New conversation button =====
newChatBtn.addEventListener("click", newConversation);

// On startup: load saved sessions and folders
chrome.storage.local.get(
  { [CHAT_SESSIONS_KEY]: [], [CHAT_FOLDERS_KEY]: [] },
  (data) => {
    chatSessions = data[CHAT_SESSIONS_KEY];
    chatFolders = data[CHAT_FOLDERS_KEY];
    // Always start with a new chat (past conversations are available from the sidebar)
    activeSessionId = null;
    chatHistory = [];
    renderChatEmpty();
    updateChatBadge();
    if (chatSidebar.classList.contains("open")) renderSidebar();
  },
);
