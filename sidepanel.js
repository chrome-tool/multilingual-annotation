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

// ===== ナビゲーションボタンに Lucide アイコンを注入 =====
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
document.getElementById("chatMicBtn").innerHTML = ICONS.mic;
document.getElementById("chatAttachBtn").innerHTML = ICONS.paperclip;
document.getElementById("chatThinkBtn").innerHTML = ICONS.lightbulb;

// ===== 画面ナビゲーション =====
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

// o-series モデルかどうか判定（ネイティブ推論モデル）
function isOSeriesModel(model) {
  return /^o\d/.test(model || "");
}

// --- テーマ適用（auto / dark / light） ---
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

// --- UIを選択言語で描画 ---
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
  // アイコン付きラベル（絵文字なし）
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
  // チャットが空のときだけ案内文を今の言語で描き直す
  if (chatMessages.querySelector(".chat-empty")) renderChatEmpty();
  updateChatBadge();
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

// --- 設定の読み込み ---
chrome.storage.sync.get(DEFAULTS, (s) => {
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

  // フィールドに保存済みの値を反映
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

// --- 言語変更（UI・ツールチップ・AI出力をまとめて切替） ---
langSelect.addEventListener("change", () => {
  lang = langSelect.value;
  chrome.storage.sync.set({ lang });
  resetChatSession(); // 新しい言語でチャットを再開
  applyLang();
});

// --- テーマ変更 ---
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

// --- ReadAloud 設定 ---
function getSpeechLangCode(text = "") {
  if (speechLang !== "auto") return speechLang;
  // テキストの文字種から言語を推定
  if (text) {
    const hasKana = /[぀-ゟ゠-ヿ]/.test(text); // ひらがな・カタカナ
    const hasCJK = /[一-鿿㐀-䶿]/.test(text); // 漢字
    if (hasKana) return "ja-JP";
    if (hasCJK) return "zh-CN";
    if (/[A-Za-z]/.test(text)) return "en-US";
  }
  // テキスト不明の場合は UI 言語にフォールバック
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

// --- 有効/無効 ---
enabledToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledToggle.checked });
});

// --- トリガーモード ---
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

// --- AIプロバイダー ---
const cardBuiltin = document.getElementById("card-builtin");
const cardExternal = document.getElementById("card-external");
const externalSettings = document.getElementById("externalSettings");

function setProviderUI(provider) {
  cardBuiltin.classList.toggle("active", provider === "builtin");
  cardExternal.classList.toggle("active", provider === "external");
  cardBuiltin.querySelector("input").checked = provider === "builtin";
  cardExternal.querySelector("input").checked = provider === "external";
  externalSettings.style.display = provider === "external" ? "block" : "none";
}

document.querySelectorAll('input[name="aiProvider"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    aiProvider = radio.value;
    chrome.storage.sync.set({ aiProvider });
    setProviderUI(aiProvider);
    resetChatSession(); // プロバイダー変更でセッションリセット
  });
});

// プリセット変更: エンドポイント・モデルを自動入力
document.getElementById("apiPreset").addEventListener("change", (e) => {
  apiPreset = e.target.value;
  chrome.storage.sync.set({ apiPreset });
  applyPreset(apiPreset);
});

// テキストフィールドはフォーカスを外したときに保存（毎キー押下は避ける）
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

// --- 反応速度スライダー ---
delaySlider.addEventListener("input", () => {
  const v = Number(delaySlider.value);
  setDelayLabel(v);
  chrome.storage.sync.set({ hoverDelay: v });
});

function setDelayLabel(ms) {
  delayValue.textContent = (ms / 1000).toFixed(1) + t(lang, "secondsUnit");
}

// --- 単語帳 ---
function renderVocab() {
  chrome.storage.local.get({ vocabulary: [] }, (data) => {
    const all = data.vocabulary;
    vocabCount.textContent = `${all.length} ${t(lang, "countSuffix")}`;

    if (all.length === 0) {
      vocabList.innerHTML = `<div class="vocab-empty">${t(lang, "vocabEmpty")}</div>`;
      return;
    }

    // 検索フィルタ（単語・注釈の両方を対象）
    const q = vocabSearch.value.trim().toLowerCase();
    const list = q
      ? all.filter(
          (v) =>
            v.word.toLowerCase().includes(q) ||
            v.annotation.toLowerCase().includes(q),
        )
      : all;

    // 元配列でのインデックスを保持して削除が正しく効くようにする
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

// 個別削除
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

// --- CSV 書き出し ---
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

// --- 全消去 ---
document.getElementById("clearBtn").addEventListener("click", async () => {
  const ok = await showConfirm(t(lang, "confirmClear"));
  if (!ok) return;
  chrome.storage.local.set({ vocabulary: [] }, renderVocab);
});

// 単語帳の変更を監視して自動更新
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.vocabulary) renderVocab();
});

// ===== チャット（Prompt API で何でも会話） =====
let chatSession = null;
let chatSessionPromise = null;
let chatBusy = false;
let chatAbort = null;
let activeBubbleWrap = null;
let wasManuallyStopped = false;
let chatHistory = []; // [{ role: 'user'|'assistant', text: string }]

const CHAT_SESSIONS_KEY = "chatSessions";
const CHAT_CONTEXT_LIMIT = Infinity;
const MAX_SESSIONS = 50;

let chatSessions = []; // 全セッション配列
let activeSessionId = null; // 現在開いているセッションのID（null=新規未保存）

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
    // 画像: ![alt](url) — リンクより先に処理（data: URL も対応）
    s = s.replace(
      /!\[([^\]]*)\]\(((?:https?:\/\/|data:)[^)]+)\)/g,
      (_, alt, url) => `<img src="${url}" alt="${alt}" class="md-img">`,
    );
    // リンク: [text](url)
    s = s.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      (_, label, url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="md-link">${label}</a>`,
    );
    // 裸URL: https://... をそのままリンク化
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

function chatSystemPrompt() {
  return `You are a helpful, friendly assistant. Reply in ${t(lang, "aiLangName")} unless the user clearly writes in another language. Always format your response using Markdown: use **bold** for key terms, *italic* for emphasis, - bullet lists for multiple items, 1. numbered lists for steps, # headings for sections, and \`code\` for technical terms. Be concise and clear.`;
}

// 現在のメッセージをセッションに保存（メッセージ送受信のたびに呼ぶ）
function saveChatHistory() {
  const title =
    chatHistory.find((m) => m.role === "user")?.text?.slice(0, 50) || "(無題)";
  const now = new Date().toISOString();

  if (!activeSessionId) {
    // 初回: 新規セッション作成
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
      chatSessions.unshift(updated); // 最新を先頭へ
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

// Chrome内蔵AI用: 毎回フルコンテキストでセッションを新規作成する
// （セッション内部蓄積に頼らず外部APIと同等の明示的コンテキスト管理）
async function createBuiltinSession() {
  const api =
    self.LanguageModel ?? self.ai?.languageModel ?? self.ai?.assistant;
  if (!api) return null;

  const systemPrompt = chatSystemPrompt();
  // chatHistory には現在のユーザーメッセージが末尾に push 済みなので除外
  const contextMsgs = chatHistory.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.text,
  }));

  const SUPPORTED_OUT_LANGS = ["de", "en", "es", "fr", "ja"];
  const outLang = SUPPORTED_OUT_LANGS.includes(lang) ? lang : "en";
  const tryCreate = (prompts) =>
    api.create({
      initialPrompts: prompts,
      systemPrompt,
      expectedOutputLanguages: [outLang],
    });

  try {
    return await tryCreate(contextMsgs);
  } catch {
    // コンテキスト過多の場合は直近20件に絞って再試行
    try {
      return await tryCreate(contextMsgs.slice(-20));
    } catch (e) {
      console.warn("[チャット] セッション作成失敗:", e);
      return null;
    }
  }
}

function resetChatSession() {
  // セッションはリクエストごとに破棄するようになったので何もしない
  // （言語・プロバイダー変更時も履歴は保持）
}

function newConversation() {
  stopChatSpeak();
  resetChatSession();
  clearChatHistory();
  activeSessionId = null; // 次の送信で自動的に新セッション作成
  renderChatEmpty();
  favoritesPanel.hidden = true;
  if (chatSidebar.classList.contains("open")) renderSidebar();
}

function branchFromMessage(msgIdx) {
  const branchHistory = chatHistory.slice(0, msgIdx + 1);
  if (!branchHistory.length) return;
  stopChatSpeak();
  resetChatSession();
  activeSessionId = null;
  chatHistory = branchHistory;
  renderChatHistory();
  saveChatHistory(); // 新セッションとして保存
  chatAutoScroll = true;
  scrollToBottom(true);
  if (chatSidebar.classList.contains("open")) renderSidebar();
}

function switchToSession(id) {
  const session = chatSessions.find((s) => s.id === id);
  if (!session || id === activeSessionId) return;
  stopChatSpeak();
  resetChatSession();
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
    // 削除対象が現在開いているセッションなら新規へ
    activeSessionId = chatSessions[0]?.id ?? null;
    chatHistory = activeSessionId ? [...(chatSessions[0]?.messages ?? [])] : [];
    resetChatSession();
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
    addBubble(m.role === "user" ? "user" : "ai", m.text),
  );
}

function getAiAvatarIcon() {
  if (aiProvider === "builtin") return ICONS.cpu;
  const cloudPresets = ["openai", "groq"];
  return cloudPresets.includes(apiPreset) ? ICONS.bot : ICONS.cpu;
}

function addBubble(role, text) {
  const empty = chatMessages.querySelector(".chat-empty");
  if (empty) empty.remove();

  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg ${role}`;

  let thinkContent = null;
  if (role === "ai") {
    const parsed = parseThinking(text);
    thinkContent = parsed.think;
    const answer = parsed.think !== null ? parsed.answer : text;
    msgDiv.innerHTML = markdownToHtml(answer);
    msgDiv.dataset.md = answer;
  } else {
    msgDiv.innerHTML = markdownToHtml(text);
  }

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
    }

    const actions = document.createElement("div");
    actions.className = "chat-msg-actions";
    actions.innerHTML =
      `<button class="msg-btn" data-action="speak"  title="${t(lang, "speakTitle")}">${ICONS.speakerWave}</button>` +
      `<button class="msg-btn" data-action="copy"   title="${t(lang, "copyMsgTitle")}">${ICONS.clipboard}</button>` +
      `<button class="msg-btn" data-action="like"   title="${t(lang, "likeTitle")}">${ICONS.star}</button>` +
      `<button class="msg-btn branch-btn" data-action="branch" title="${t(lang, "branchTitle")}">${ICONS.gitBranch}</button>`;

    wrap.appendChild(outer);
    wrap.appendChild(actions);
    chatMessages.appendChild(wrap);
  } else {
    chatMessages.appendChild(outer);
  }

  scrollToBottom();
  return msgDiv;
}

// ===== DEEP思考（<think> ブロック）=====

function parseThinking(text) {
  // <think> が先頭以外でも対応（モデルが前置きを出す場合）
  const startIdx = text.search(/<think(?:ing)?>/i);
  if (startIdx === -1) return { think: null, answer: text, partial: false };

  const before = text.slice(0, startIdx).trim();
  const rest = text.slice(startIdx);
  const complete = rest.match(
    /<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>\s*([\s\S]*)/i,
  );
  if (complete) {
    const answer = [before, complete[2].trim()].filter(Boolean).join("\n\n");
    return { think: complete[1].trim(), answer, partial: false };
  }
  // ストリーミング中（閉じタグなし）
  const partial = rest.match(/<think(?:ing)?>([\s\S]*)/i);
  if (partial) return { think: partial[1], answer: before, partial: true };
  return { think: null, answer: text, partial: false };
}

function buildThinkToggle(sectionEl, thinkText) {
  sectionEl.innerHTML = "";

  const label = document.createElement("div");
  label.className = "think-section-tag";
  label.innerHTML = `${ICONS.lightbulb}<span>${t(lang, "thinkTab")}</span>`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "chat-think-content";
  contentDiv.innerHTML = markdownToHtml(thinkText);

  sectionEl.appendChild(label);
  sectionEl.appendChild(contentDiv);
}

function renderAIBubbleContent(aiBubble, bubbleWrap, fullText) {
  const { think, answer, partial } = parseThinking(fullText);

  if (think !== null) {
    let section = bubbleWrap.querySelector(".chat-think-section");
    if (!section) {
      section = document.createElement("div");
      section.className = "chat-think-section";
      bubbleWrap.prepend(section); // 常に先頭（回答の上）に配置
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
      // 回答タグを .chat-msg-outer の直前に追加
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
      // finalized 済み（o-series: 思考完了後に回答が届くケース）
      if (answer !== aiBubble.dataset.md) {
        aiBubble.innerHTML = markdownToHtml(answer);
        aiBubble.dataset.md = answer;
      }
    }
  } else {
    bubbleWrap.querySelector(".chat-think-section")?.remove();
    bubbleWrap.querySelector(".answer-section-tag")?.remove();
    aiBubble.innerHTML = markdownToHtml(fullText);
    aiBubble.dataset.md = fullText;
  }
}

// ===== チャット読み上げ =====
let activeSpeakBtn = null;

function speakMessage(text, btn) {
  if (!window.speechSynthesis) return;

  // 別のボタンが喋っていたらリセット
  if (activeSpeakBtn && activeSpeakBtn !== btn) {
    activeSpeakBtn.innerHTML = ICONS.speakerWave;
    activeSpeakBtn.removeAttribute("data-speaking");
    activeSpeakBtn = null;
  }

  // 同じボタンを再クリック → トグル停止
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

// ===== チャットお気に入り =====
function likeChatMessage(text, btn) {
  if (!text) return;
  chrome.storage.local.get({ chatFavorites: [] }, (data) => {
    const favs = data.chatFavorites;
    const already = favs.findIndex((f) => f.text === text);
    if (already >= 0) {
      // すでに保存済み → 削除（トグル）
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

// メッセージエリアへのクリックを委譲（speak / like）
chatMessages.addEventListener("click", (e) => {
  // コードブロックのコピーボタン
  const copyCodeBtn = e.target.closest(".code-copy-btn");
  if (copyCodeBtn) {
    const code = copyCodeBtn.closest(".code-block")?.querySelector("code");
    if (code) {
      navigator.clipboard.writeText(code.textContent).then(() => {
        const orig = copyCodeBtn.innerHTML;
        copyCodeBtn.innerHTML = ICONS.check;
        setTimeout(() => {
          copyCodeBtn.innerHTML = orig;
        }, 1500);
      });
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
    navigator.clipboard.writeText(copyText).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = ICONS.check;
      setTimeout(() => {
        btn.innerHTML = orig;
      }, 1500);
    });
  }
  if (btn.dataset.action === "branch") {
    // DOM上の順番からchatHistory内のインデックスを特定
    const allMsgEls = [...chatMessages.children].filter(
      (el) =>
        el.classList.contains("chat-bubble-wrap") ||
        el.classList.contains("chat-msg-outer"),
    );
    const msgIdx = allMsgEls.indexOf(wrap);
    if (msgIdx >= 0) branchFromMessage(msgIdx);
  }
});

// ===== スクロール制御（ChatGPT風：ユーザーが上スクロール中は追従しない） =====
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

// ===== ファイル添付 =====
let attachedFiles = []; // [{ name, type, content }]  content = base64 or text

const chatAttachBtn = document.getElementById("chatAttachBtn");
const chatFileInput = document.getElementById("chatFileInput");
const chatAttachPrev = document.getElementById("chatAttachPreview");

chatAttachBtn?.addEventListener("click", () => chatFileInput?.click());

chatFileInput?.addEventListener("change", async () => {
  for (const file of chatFileInput.files) {
    if (attachedFiles.length >= 4) break; // 最大4ファイル
    const isImage = file.type.startsWith("image/");
    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      if (isImage) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
    attachedFiles.push({
      name: file.name,
      type: isImage ? "image" : "text",
      content,
    });
  }
  chatFileInput.value = "";
  renderAttachPreview();
});

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
          ? `<img src="${f.content}" class="attach-thumb" alt="${escapeHtml(f.name)}">`
          : `${ICONS.fileText}<span class="attach-name">${escapeHtml(f.name)}</span>`
      }
      <button class="attach-rm" data-i="${i}">${ICONS.xMark}</button>
    </div>`,
    )
    .join("");
  chatAttachPrev.querySelectorAll(".attach-rm").forEach((btn) => {
    btn.addEventListener("click", () => {
      attachedFiles.splice(Number(btn.dataset.i), 1);
      renderAttachPreview();
    });
  });
}

const TEXT_FILE_MAX_CHARS = 12000; // 外部 API 用 ~3000 tokens
const TEXT_FILE_MAX_CHARS_BUILTIN = 2000; // 内蔵 AI 用 ~500 tokens（Gemini Nano 上限対策）

function buildUserContentWithAttachments(
  text,
  files = attachedFiles,
  forBuiltin = false,
) {
  if (!files.length) return text || "";
  const effectiveText = text || "添付ファイルについて説明してください。";
  const limit = forBuiltin ? TEXT_FILE_MAX_CHARS_BUILTIN : TEXT_FILE_MAX_CHARS;
  const parts = [{ type: "text", text: effectiveText }];
  for (const f of files) {
    if (f.type === "image") {
      if (forBuiltin) {
        parts[0].text += `\n[画像添付: ${f.name}（内蔵AIは画像非対応）]`;
      } else {
        parts.push({ type: "image_url", image_url: { url: f.content } });
      }
    } else {
      const body =
        f.content.length > limit
          ? f.content.slice(0, limit) +
            `\n...(以降省略 ${f.content.length - limit} 文字)`
          : f.content;
      parts[0].text += `\n\n---\n📄 ${f.name}:\n${body}`;
    }
  }
  return parts.length === 1 ? parts[0].text : parts;
}

async function sendChat() {
  const text = chatInput.value.trim();
  if ((!text && !attachedFiles.length) || chatBusy) return;

  stopChatSpeak(); // 前のメッセージの読み上げを停止
  chatAutoScroll = true; // 自分のメッセージ送信時は必ず最下部追従を再開
  // 添付ファイルをユーザーバブルに表示（pendingAttachments はこの直後に確定）
  const pendingAttachments = [...attachedFiles];
  const userContent = buildUserContentWithAttachments(text, pendingAttachments);
  // displayText: バブル表示用（画像は <img> レンダリングのため base64 込み）
  const attachPart = pendingAttachments
    .map((f) =>
      f.type === "image" ? `![${f.name}](${f.content})` : `📄 ${f.name}`,
    )
    .join("\n");
  const displayText = [text, attachPart].filter(Boolean).join("\n");
  // storageText: 保存用（base64 省略・ファイル名のみ）
  const storageText =
    [
      text,
      pendingAttachments
        .map((f) => (f.type === "image" ? `🖼️ ${f.name}` : `📄 ${f.name}`))
        .join("\n"),
    ]
      .filter(Boolean)
      .join("\n") || text;
  addBubble("user", displayText);
  attachedFiles = [];
  renderAttachPreview();
  chatInput.value = "";
  autoGrowChat();

  // ユーザー発言を履歴に保存（base64 なし）
  chatHistory.push({ role: "user", text: storageText });
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
    if (aiProvider === "external") {
      if (!apiEndpoint || !modelName)
        throw new Error("エンドポイントとモデル名を設定してください");
      const oSeries = isOSeriesModel(modelName);
      // 添付ファイルがある場合は最後のメッセージを multipart content に
      const historyMessages = chatHistory.map((m, idx) => {
        const isLast = idx === chatHistory.length - 1;
        let content =
          isLast && pendingAttachments.length ? userContent : m.text;
        // 思考モード ON かつ最後のユーザーメッセージ → thinking 指示を付加
        // （o-series はネイティブ推論なので不要）
        if (isLast && m.role === "user" && deepThinkMode && !oSeries) {
          const thinkInstruction =
            "\n\n[" + t(lang, "deepThinkInstruction") + "]";
          if (Array.isArray(content)) {
            content = content.map((p) =>
              p.type === "text" ? { ...p, text: p.text + thinkInstruction } : p,
            );
          } else {
            content = (content || "") + thinkInstruction;
          }
        }
        return {
          role:
            m.role === "assistant" ? "assistant" : oSeries ? "user" : m.role,
          content,
        };
      });
      // o-series は system ロールなし（developer ロールに変換）
      const systemMsg = oSeries
        ? { role: "developer", content: chatSystemPrompt() }
        : { role: "system", content: chatSystemPrompt() };
      const messages = [systemMsg, ...historyMessages];
      // o-series 用追加パラメータ
      const extraOpts = oSeries ? { reasoning_effort: "medium" } : {};
      aiText = await fetchLLMStream(
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
    } else {
      // 内蔵AIで画像を送ろうとした場合は早期に警告
      const hasImages = pendingAttachments.some((f) => f.type === "image");
      if (hasImages) {
        aiBubble.textContent = t(lang, "builtinNoImage");
        aiText = aiBubble.textContent;
      } else {
        const session = await createBuiltinSession();
        if (!session) {
          aiBubble.textContent = t(lang, "chatUnavailable");
        } else {
          // builtin AI はテキストのみ対応・コンテキスト制限あり
          const builtinContent = buildUserContentWithAttachments(
            text,
            pendingAttachments,
            true,
          );
          let builtinPrompt =
            typeof builtinContent === "string"
              ? builtinContent
              : builtinContent
                  .filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("\n");
          if (deepThinkMode)
            builtinPrompt += "\n\n[" + t(lang, "deepThinkInstruction") + "]";
          try {
            if (typeof session.promptStreaming === "function") {
              const stream = session.promptStreaming(builtinPrompt, { signal });
              let full = "";
              for await (const chunk of stream) {
                if (signal.aborted) break; // abort 時はループを即抜ける
                full += chunk;
                renderAIBubbleContent(aiBubble, bubbleWrap, full);
                scrollToBottom();
              }
              aiText = full;
            } else {
              aiText = await session.prompt(builtinPrompt, { signal });
              if (!signal.aborted)
                renderAIBubbleContent(aiBubble, bubbleWrap, aiText);
            }
          } finally {
            session.destroy?.();
          }
        }
      } // end: no-image else
    }
  } catch (e) {
    if (e.name !== "AbortError") {
      const msg = e.message || "";
      let friendlyMsg;
      if (
        msg.includes("kErrorUnknown") ||
        msg.includes("kErrorInvalidRequest")
      ) {
        friendlyMsg =
          "⚠️ 入力が長すぎます。添付ファイルのサイズを小さくするか、外部 API をご利用ください。";
      } else if (msg.includes("kNotSupported") || msg.includes("unavailable")) {
        friendlyMsg =
          "⚠️ Chrome 内蔵 AI が利用できません。設定で外部 API に切り替えてください。";
      } else {
        friendlyMsg = "⚠️ " + msg;
      }
      aiBubble.textContent = friendlyMsg;
    }
    // 途中テキストを取得（think セクションを除く）
    const msgEl = bubbleWrap?.querySelector(".chat-msg.ai");
    aiText = msgEl
      ? msgEl.dataset.md || msgEl.textContent
      : aiBubble.dataset.md || aiBubble.textContent;
  } finally {
    if (!wasManuallyStopped) {
      // 通常完了：履歴保存・UI 解除
      if (aiText && aiText !== t(lang, "chatThinking")) {
        chatHistory.push({ role: "assistant", text: aiText });
        saveChatHistory();
      }
      if (bubbleWrap) bubbleWrap.classList.remove("streaming");
      activeBubbleWrap = null;
      chatAbort = null;
      setChatUIBusy(false);
    } else {
      // 手動停止：履歴は停止ボタンハンドラで保存済み・UI 解除済み
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

  // チャット履歴を即座に保存（setChatUIBusy 解除より先に行う）
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

// ===== 音声入力（サイドパネル直接実行） =====
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecognizing = false;
const chatMicBtn = document.getElementById("chatMicBtn");
let speechBaseText = "";
let speechFinalTranscript = "";

function getSpeechInputLang() {
  if (speechLang !== "auto") return speechLang;
  const map = { ja: "ja-JP", en: "en-US", zh: "zh-CN" };
  return map[lang] || "ja-JP";
}

function stopRecognition() {
  isRecognizing = false;
  chatMicBtn?.classList.remove("recording");
  chatInput.placeholder = t(lang, "chatPlaceholder");
  try {
    recognition?.abort();
  } catch {}
  recognition = null;
}

function showSpeechError(code) {
  const errMap = {
    "not-allowed": t(lang, "speechErrPermission"),
    "service-not-allowed": t(lang, "speechErrPermission"),
    network: t(lang, "speechErrNetwork"),
    "no-speech": t(lang, "speechErrNoSpeech"),
    unsupported: t(lang, "speechErrUnsupported"),
  };
  const msg = errMap[code] || `🎤 ${code}`;
  let toast = document.getElementById("speechErrorToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "speechErrorToast";
    toast.className = "speech-error-toast";
    // chatFooter が取得できない場合は body に fallback
    const footer = document.getElementById("chatFooter") || document.body;
    footer.prepend(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 6000);
}

function startRecognition() {
  speechBaseText = chatInput.value;
  speechFinalTranscript = "";

  recognition = new SR();
  recognition.lang = getSpeechInputLang();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRecognizing = true;
    chatMicBtn.classList.add("recording");
    chatInput.placeholder = t(lang, "speechRecording");
  };

  recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal)
        speechFinalTranscript += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    chatInput.value = speechBaseText + speechFinalTranscript + interim;
    autoGrowChat();
  };

  recognition.onerror = (e) => {
    isRecognizing = false;
    chatMicBtn.classList.remove("recording");
    recognition = null;
    if (e.error !== "aborted") showSpeechError(e.error);
    else chatInput.placeholder = t(lang, "chatPlaceholder");
  };

  recognition.onend = () => {
    if (isRecognizing) {
      try {
        recognition.start();
        return;
      } catch {}
    }
    chatInput.value = speechBaseText + speechFinalTranscript;
    autoGrowChat();
    chatInput.focus();
    isRecognizing = false;
    chatMicBtn.classList.remove("recording");
    chatInput.placeholder = t(lang, "chatPlaceholder");
    recognition = null;
  };

  recognition.start();
}

if (chatMicBtn) {
  chatMicBtn.addEventListener("click", async () => {
    if (isRecognizing) {
      stopRecognition();
      return;
    }
    if (!SR) {
      showSpeechError("unsupported");
      return;
    }

    // getUserMedia でマイク権限を先取得してから SpeechRecognition を起動
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        const code =
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "not-allowed"
            : "network";
        showSpeechError(code);
        return;
      }
    }

    startRecognition();
  });
}

// ===== 思考モード（Deep Think） =====
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

// スクリーンショット貼り付け（Ctrl+V）
chatInput.addEventListener("paste", (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (!item.type.startsWith("image/")) continue;
    e.preventDefault();
    if (attachedFiles.length >= 4) return;
    const blob = item.getAsFile();
    if (!blob) continue;
    const reader = new FileReader();
    reader.onload = () => {
      const name = `screenshot_${Date.now()}.png`;
      attachedFiles.push({ name, type: "image", content: reader.result });
      renderAttachPreview();
    };
    reader.readAsDataURL(blob);
    return; // 1枚ずつ処理
  }
});

chatInput.addEventListener("keydown", (e) => {
  // Ctrl+Enter または Cmd+Enter で送信、Enterのみは改行
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    sendChat();
  }
});

// ===== サイドバー（フォルダ・複数選択対応） =====
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
    <button class="sidebar-menu-btn" data-id="${s.id}" title="メニュー">${ICONS.ellipsisVertical}</button>
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
        <button class="folder-menu-btn" data-folder-id="${folder.id}" title="メニュー">${ICONS.ellipsisVertical}</button>
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
    <button class="sidebar-folder-ok" title="確定">${ICONS.check}</button>
    <button class="sidebar-folder-cancel" title="キャンセル">${ICONS.xMark}</button>`;
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

  // フォルダヘッダーをインライン入力に置き換え
  headerEl.innerHTML = `
    <input type="text" class="sidebar-folder-input" value="${escapeHtml(folder.name)}" maxlength="20">
    <button class="sidebar-folder-ok" title="確定">${ICONS.check}</button>
    <button class="sidebar-folder-cancel" title="キャンセル">${ICONS.xMark}</button>`;
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

// ===== サイドバー コンテキストメニュー =====
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
  menu.innerHTML = `<button class="sidebar-menu-item" data-action="rename">${ICONS.pencil} リネーム</button>
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

// ===== サイドバー ドラッグ＆ドロップ =====
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

// ===== 確認ダイアログ =====
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

// ===== お気に入りパネル =====
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
            ? `${favSelectedIdxs.size}${t(lang, "countSuffix")}選択中`
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
  // お気に入りと会話履歴を同時に表示
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
  // 選択モード: アイテムをクリックで選択トグル
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
    chrome.storage.local.get({ chatFavorites: [] }, (data) => {
      const f = data.chatFavorites[idx];
      if (!f) return;
      navigator.clipboard
        .writeText(f.text)
        .then(() => {
          const orig = copyBtn.innerHTML;
          copyBtn.innerHTML = ICONS.check;
          setTimeout(() => {
            copyBtn.innerHTML = orig;
          }, 1500);
        })
        .catch(() => {});
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

// ===== 設定タブ切り替え =====
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

// ===== 新しい会話ボタン =====
newChatBtn.addEventListener("click", newConversation);

// 起動時: 保存済みセッション・フォルダを読み込み
chrome.storage.local.get(
  { [CHAT_SESSIONS_KEY]: [], [CHAT_FOLDERS_KEY]: [] },
  (data) => {
    chatSessions = data[CHAT_SESSIONS_KEY];
    chatFolders = data[CHAT_FOLDERS_KEY];
    // 常に新しいチャットとして開始（過去の会話はサイドバーから選択）
    activeSessionId = null;
    chatHistory = [];
    renderChatEmpty();
    updateChatBadge();
    if (chatSidebar.classList.contains("open")) renderSidebar();
  },
);
