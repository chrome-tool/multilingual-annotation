// ===== State =====
let tooltip = null;
let aiSession = null;
let hoverTimer = null;
let isEnabled = true;
let triggerMode = "hover";
let hoverDelay = 600;
let lang = "ja";
let theme = "dark";
let aiProvider = "builtin"; // 'builtin' | 'external'
let apiEndpoint = "";
let apiKey = "";
let modelName = "";
let currentAnnotation = null; // { word, raw }
let requestSeq = 0;
let lastWord = null;
let currentAbort = null;
const cache = new Map();
let downloadProgressCallback = null;
let sessionPromise = null;
let promptLock = null;

// ===== Settings =====
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
};

chrome.storage.sync.get(DEFAULTS, (s) => {
  isEnabled = s.enabled;
  triggerMode = s.triggerMode;
  hoverDelay = s.hoverDelay;
  lang = s.lang;
  theme = s.theme;
  aiProvider = s.aiProvider;
  apiEndpoint = s.apiEndpoint;
  apiKey = s.apiKey;
  modelName = s.modelName;
  applyTooltipTheme();
  setTimeout(warmSession, 1500);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    if (!isEnabled) hideTooltip();
  }
  if (changes.triggerMode) {
    triggerMode = changes.triggerMode.newValue;
    hideTooltip();
  }
  if (changes.hoverDelay) hoverDelay = changes.hoverDelay.newValue;
  if (changes.lang) {
    lang = changes.lang.newValue;
    resetSession();
  }
  if (changes.theme) {
    theme = changes.theme.newValue;
    applyTooltipTheme();
  }
  if (changes.aiProvider) {
    aiProvider = changes.aiProvider.newValue;
    resetSession();
  }
  if (changes.apiEndpoint) apiEndpoint = changes.apiEndpoint.newValue;
  if (changes.apiKey) apiKey = changes.apiKey.newValue;
  if (changes.modelName) modelName = changes.modelName.newValue;
});

function applyTooltipTheme() {
  if (tooltip) tooltip.dataset.theme = theme;
}

// ===== AI Session =====
function buildSystemPrompt(targetLang) {
  const name = t(targetLang, "aiLangName");
  return `You translate and explain text for a language learner. Output language: ${name}.

Output ONLY the explanation itself. No preamble like "Here is", no quotes around your answer, no markdown, no extra blank lines.

Decide the type of the input and respond accordingly:
- Single word or short phrase: on line 1 give the ${name} meaning; on line 2 give the part of speech and one short example of use.
- Full sentence or longer text: give only a natural ${name} translation.
- If the input is already in ${name}: briefly paraphrase or define it in ${name}.

Keep it to 3 short lines maximum. Be direct and concrete.`;
}

function resetSession() {
  try {
    aiSession?.destroy?.();
  } catch {}
  aiSession = null;
  sessionPromise = null;
  cache.clear();
  requestSeq++;
  hideTooltip();
}

async function getAISession() {
  if (aiSession) return aiSession;
  if (sessionPromise) return sessionPromise;

  const api =
    self.LanguageModel ?? window.ai?.languageModel ?? window.ai?.assistant;
  if (!api) return null;

  const systemPrompt = buildSystemPrompt(lang);
  sessionPromise = api
    .create({
      initialPrompts: [{ role: "system", content: systemPrompt }],
      systemPrompt,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          const pct = Math.round((e.loaded ?? 0) * 100);
          if (downloadProgressCallback) downloadProgressCallback(pct);
        });
      },
    })
    .then((s) => {
      aiSession = s;
      return s;
    })
    .catch((e) => {
      console.warn("[多言語注釈] セッション作成失敗:", e);
      sessionPromise = null;
      return null;
    });

  return sessionPromise;
}

async function warmSession() {
  if (!isEnabled) return;
  await getAISession();
}

// Serializes prompts; skips if isStale() while waiting in queue
async function streamPrompt(session, text, onChunk, signal, isStale) {
  while (promptLock) {
    try {
      await promptLock;
    } catch {}
    if (isStale?.()) return null; // newer request came in while waiting — skip
  }

  let release;
  promptLock = new Promise((r) => {
    release = r;
  });

  try {
    if (isStale?.()) return null;
    const query = `Explain this text: "${text}"`;
    const opts = signal ? { signal } : undefined;

    if (typeof session.promptStreaming === "function") {
      const stream = session.promptStreaming(query, opts);
      let full = "";
      for await (const chunk of stream) {
        full += chunk;
        onChunk(full);
      }
      return full;
    }

    const result = await session.prompt(query, opts);
    onChunk(result);
    return result;
  } finally {
    release();
    promptLock = null;
  }
}

// ===== Tooltip DOM =====
function getTooltip() {
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "ml-annotation-tooltip";
    tooltip.dataset.theme = theme;
    document.body.appendChild(tooltip);
    tooltip.addEventListener("click", onTooltipClick);
  }
  return tooltip;
}

function showTooltip(x, y, html) {
  const el = getTooltip();
  el.innerHTML = html;

  // Force layout while still invisible so getBoundingClientRect returns real dimensions
  void el.offsetWidth;
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = x + window.scrollX + 14;
  let top = y + window.scrollY + 24;

  // Flip right→left if overflows right edge
  if (left + rect.width > window.scrollX + vw - 10) {
    left = x + window.scrollX - rect.width - 14;
  }
  // Flip below→above if overflows bottom edge
  if (top + rect.height > window.scrollY + vh - 10) {
    top = y + window.scrollY - rect.height - 10;
  }
  // Clamp to viewport
  left = Math.max(window.scrollX + 6, left);
  top = Math.max(window.scrollY + 6, top);

  // Set position BEFORE adding .visible so the fade-in starts at the right spot
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.classList.add("visible");
}

function hideTooltip() {
  stopTooltipSpeak();
  if (tooltip) tooltip.classList.remove("visible");
  lastWord = null;
}

// ===== Annotation HTML =====

// bodyHtml: pre-built inner HTML for the .ml-body element
function buildAnnotationHTML(word, bodyHtml, streaming = false) {
  const stopBtn = streaming
    ? `<button class="ml-btn ml-stop" data-action="stop" title="${t(lang, "stopTitle")}">${ICONS.squareStop}</button>`
    : "";
  return `
    <div class="ml-word">${escapeHtml(word)}</div>
    <div class="ml-body">${bodyHtml}</div>
    <div class="ml-actions">
      ${stopBtn}
      <button class="ml-btn" data-action="speak" title="${t(lang, "speakTitle")}">${ICONS.speakerWave}</button>
      <button class="ml-btn" data-action="save"  title="${t(lang, "saveTitle")}">${ICONS.star}</button>
      <button class="ml-btn" data-action="copy"  title="${t(lang, "copyTitle")}">${ICONS.clipboard}</button>
      <button class="ml-btn" data-action="close" title="${t(lang, "closeTitle")}">${ICONS.xMark}</button>
    </div>
  `;
}

function rawToBodyHtml(raw) {
  return escapeHtml(raw).replace(/\n/g, "<br>");
}

function loadingBodyHtml(msg) {
  return `<span class="ml-loading">${escapeHtml(msg)}</span>`;
}

function errorBodyHtml(msg) {
  return `<span class="ml-error">${escapeHtml(msg)}</span>`;
}

function removeStopButton() {
  tooltip?.querySelector(".ml-stop")?.remove();
}

// Update only the .ml-body content during streaming (avoids re-rendering buttons)
function updateAnnotationBody(raw) {
  const body = tooltip?.querySelector(".ml-body");
  if (body) body.innerHTML = rawToBodyHtml(raw);
}

function updateAnnotationBodyHtml(html) {
  const body = tooltip?.querySelector(".ml-body");
  if (body) body.innerHTML = html;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

// ===== Button Handlers =====
function onTooltipClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "close") {
    abortCurrent();
    hideTooltip();
    return;
  }
  if (action === "stop") {
    abortCurrent();
    removeStopButton();
    return;
  }

  const { word, raw } = currentAnnotation ?? {};
  if (!raw) return; // buttons inactive while body is still loading

  if (action === "speak") {
    speakWordAndExplanation(word, raw, btn);
  } else if (action === "copy") {
    navigator.clipboard
      .writeText(`${word}\n${raw}`)
      .then(() => flashButton(btn));
  } else if (action === "save") {
    chrome.storage.local.get({ vocabulary: [] }, (data) => {
      const list = data.vocabulary;
      const existing = list.findIndex((v) => v.word === word);
      if (existing >= 0) {
        list.splice(existing, 1);
        btn.classList.remove("liked");
        btn.innerHTML = ICONS.star;
        chrome.storage.local.set({ vocabulary: list });
      } else {
        const entry = {
          word,
          annotation: raw,
          url: location.href,
          date: new Date().toISOString(),
        };
        list.unshift(entry);
        chrome.storage.local.set({ vocabulary: list });
        btn.classList.add("liked");
        btn.innerHTML = ICONS.check;
        setTimeout(() => {
          btn.innerHTML = ICONS.star;
        }, 1200);
      }
    });
  }
}

function abortCurrent() {
  try {
    currentAbort?.abort();
  } catch {}
  currentAbort = null;
}

function flashButton(btn) {
  const orig = btn.innerHTML;
  btn.innerHTML = ICONS.check;
  setTimeout(() => {
    btn.innerHTML = orig;
  }, 1500);
}

// ===== Speech =====
const SPEECH_LANG = { ja: "ja-JP", en: "en-US", zh: "zh-CN" };
let activeSpeakBtn = null;

function stopTooltipSpeak() {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  if (activeSpeakBtn) {
    activeSpeakBtn.innerHTML = ICONS.speakerWave;
    activeSpeakBtn.removeAttribute("data-speaking");
    activeSpeakBtn = null;
  }
}

function speakWordAndExplanation(word, raw, btn) {
  if (!window.speechSynthesis) return;

  // 同じボタン再クリック → 停止
  if (btn.dataset.speaking) {
    stopTooltipSpeak();
    return;
  }

  stopTooltipSpeak();
  activeSpeakBtn = btn;
  btn.innerHTML = ICONS.speakerXMark;
  btn.dataset.speaking = "1";

  const wordLang = /^[\x00-\x7F\s]+$/.test(word) ? "en-US" : "";
  const utterances = [
    { text: word, lang: wordLang },
    { text: raw, lang: SPEECH_LANG[lang] || "" },
  ].filter((u) => u.text);

  const onDone = () => {
    if (activeSpeakBtn === btn) stopTooltipSpeak();
  };

  utterances.forEach((u, i) => {
    const utt = new SpeechSynthesisUtterance(u.text);
    if (u.lang) utt.lang = u.lang;
    if (i === utterances.length - 1) {
      utt.onend = onDone;
      utt.onerror = onDone;
    }
    speechSynthesis.speak(utt);
  });
}

// ===== Word Detection =====
function getWordAtPoint(x, y) {
  const range = document.caretRangeFromPoint?.(x, y);
  if (!range) return null;
  try {
    range.expand("word");
  } catch {
    return null;
  }
  const text = range
    .toString()
    .trim()
    .replace(/[。、！？.,!?'"「」『』]/g, "");
  return text.length >= 2 ? text : null;
}

// ===== Core Annotation =====
async function annotate(text, x, y) {
  stopTooltipSpeak(); // 前の再生を止めてから新しい注釈を表示
  const myId = ++requestSeq;
  abortCurrent();

  if (cache.has(text)) {
    const raw = cache.get(text);
    currentAnnotation = { word: text, raw };
    showTooltip(x, y, buildAnnotationHTML(text, rawToBodyHtml(raw)));
    return;
  }

  currentAnnotation = { word: text, raw: "" };
  showTooltip(
    x,
    y,
    buildAnnotationHTML(text, loadingBodyHtml(t(lang, "analyzing")), true),
  );

  currentAbort = new AbortController();
  try {
    const response =
      aiProvider === "external"
        ? await annotateExternal(text, myId, currentAbort.signal)
        : await annotateBuiltin(text, myId, currentAbort.signal);

    if (myId !== requestSeq) return;
    if (response) cache.set(text, response);
    removeStopButton();
  } catch (e) {
    if (myId !== requestSeq) return;
    if (e.name === "AbortError") {
      removeStopButton();
      return;
    }
    updateAnnotationBodyHtml(errorBodyHtml(`⚠️ ${e.message}`));
    removeStopButton();
  }
}

async function annotateBuiltin(text, myId, signal) {
  downloadProgressCallback = (pct) => {
    if (myId !== requestSeq) return;
    updateAnnotationBodyHtml(
      loadingBodyHtml(`${t(lang, "downloading")} ${pct}%`),
    );
  };

  const session = await getAISession();
  downloadProgressCallback = null;
  if (myId !== requestSeq) return null;

  if (!session) {
    updateAnnotationBodyHtml(errorBodyHtml(t(lang, "aiUnavailable")));
    removeStopButton();
    return null;
  }

  return streamPrompt(
    session,
    text,
    (partial) => {
      if (myId !== requestSeq) return;
      currentAnnotation = { word: text, raw: partial };
      updateAnnotationBody(partial);
    },
    signal,
    () => myId !== requestSeq,
  );
}

async function annotateExternal(text, myId, signal) {
  if (!apiEndpoint || !modelName) {
    updateAnnotationBodyHtml(
      errorBodyHtml("⚠️ エンドポイントとモデル名を設定してください"),
    );
    removeStopButton();
    return null;
  }

  const messages = [
    { role: "system", content: buildSystemPrompt(lang) },
    { role: "user", content: `Explain this text: "${text}"` },
  ];

  return fetchLLMStream(
    apiEndpoint,
    apiKey,
    modelName,
    messages,
    (partial) => {
      if (myId !== requestSeq) return;
      currentAnnotation = { word: text, raw: partial };
      updateAnnotationBody(partial);
    },
    signal,
    { max_tokens: 256 },
  );
}

// ===== Hover Mode =====
document.addEventListener("mousemove", (e) => {
  if (!isEnabled || triggerMode !== "hover") return;
  if (tooltip?.contains(e.target)) return;

  const mx = e.clientX;
  const my = e.clientY;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    const text = getWordAtPoint(mx, my);
    if (!text || text === lastWord) return;
    lastWord = text;
    annotate(text, mx, my);
  }, hoverDelay);
});

// ===== Select Mode =====
document.addEventListener("mouseup", (e) => {
  if (!isEnabled || triggerMode !== "select") return;
  if (tooltip?.contains(e.target)) return;

  const selection = window.getSelection();
  const text = selection?.toString().trim();
  if (!text || text.length < 2) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  annotate(text, rect.left + rect.width / 2, rect.top);
});

// ===== Context Menu / Keyboard Shortcut =====
function annotateSelection(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  const selection = window.getSelection();
  let x = window.innerWidth / 2;
  let y = 100;
  if (selection?.rangeCount > 0) {
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width || rect.height) {
      x = rect.left + rect.width / 2;
      y = rect.top;
    }
  }
  annotate(trimmed, x, y);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!isEnabled) return;
  if (msg.type === "annotate-selection") annotateSelection(msg.text);
  else if (msg.type === "annotate-shortcut")
    annotateSelection(window.getSelection()?.toString());
});
