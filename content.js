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
function resetSession() {
  try {
    aiSession?.destroy?.();
  } catch {
    /* ignore destroy errors */
  }
  aiSession = null;
  sessionPromise = null;
  cache.clear();
  requestSeq++;
  hideTooltip();
}

async function getAISession() {
  if (aiSession) return aiSession;
  if (sessionPromise) return sessionPromise;

  if (!getLanguageModelAPI()) return null;

  sessionPromise = (async () => {
    try {
      const s = await createAISession(lang, {
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            const pct = Math.round((e.loaded ?? 0) * 100);
            if (downloadProgressCallback) downloadProgressCallback(pct);
          });
        },
      });
      aiSession = s;
      return s;
    } catch (e) {
      console.warn("[multilingual-annotation] Failed to create AI session:", e);
      sessionPromise = null;
      return null;
    }
  })();

  return sessionPromise;
}

async function warmSession() {
  if (!isEnabled) return;
  await getAISession();
}

// Serializes prompts; skips if isStale() while waiting in queue
async function streamPrompt(
  session,
  text,
  onChunk,
  signal,
  isStale,
  outputLang,
) {
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
    const query = text;
    const opts = {
      ...(signal ? { signal } : {}),
      ...(outputLang ? { outputLanguage: outputLang } : {}),
    };

    // Built-in AI (Chrome Gemini Nano): chunks are cumulative, not deltas
    if (typeof session.promptStreaming === "function") {
      const stream = session.promptStreaming(query, opts);
      let full = "";
      for await (const chunk of stream) {
        full += chunk;
        onChunk(full);
      }
      return full;
    }

    // Built-in AI fallback: non-streaming prompt
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
  let s = escapeHtml(raw);
  s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  const lines = s.split("\n");
  let html = "";
  let listTag = null;
  for (const line of lines) {
    const bullet = line.match(/^[-*]\s+(.+)/);
    const ordered = line.match(/^\d+\.\s+(.+)/);
    const tag = bullet ? "ul" : ordered ? "ol" : null;
    const content = bullet?.[1] ?? ordered?.[1];
    if (tag) {
      if (listTag !== tag) {
        if (listTag) html += `</${listTag}>`;
        html += `<${tag}>`;
        listTag = tag;
      }
      html += `<li>${content}</li>`;
    } else if (listTag && !line.trim()) {
      // blank line inside a list — skip without closing
    } else {
      if (listTag) {
        html += `</${listTag}>`;
        listTag = null;
      }
      if (html) html += "<br>";
      html += line;
    }
  }
  if (listTag) html += `</${listTag}>`;
  return html;
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
async function onTooltipClick(e) {
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
    await navigator.clipboard.writeText(`${word}\n${raw}`);
    flashButton(btn);
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

  // Same button clicked again → stop
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
  stopTooltipSpeak(); // Stop any active speech before showing new annotation
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

  const outputLang = CHROME_AI_OUTPUT_LANGS.has(lang) ? lang : undefined;
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
    outputLang,
  );
}

async function annotateExternal(text, myId, signal) {
  if (!apiEndpoint || !modelName) {
    updateAnnotationBodyHtml(
      errorBodyHtml(t(lang, "externalApiNotConfigured")),
    );
    removeStopButton();
    return null;
  }

  const messages = [
    { role: "system", content: buildSystemPrompt(lang) },
    { role: "user", content: `"${text}"` },
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
