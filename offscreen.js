// Offscreen document — SpeechRecognition 中継
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRunning = false;

function send(msg) {
  chrome.runtime.sendMessage({ target: "sidepanel", ...msg }).catch(() => {});
}

function start(lang) {
  if (!SR) {
    send({ action: "speech-error", error: "unsupported" });
    return;
  }
  if (isRunning) return;

  recognition = new SR();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRunning = true;
    send({ action: "speech-started" });
  };

  recognition.onresult = (e) => {
    let interim = "";
    let finalChunk = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    send({ action: "speech-result", finalChunk, interim });
  };

  recognition.onerror = (e) => {
    isRunning = false;
    send({ action: "speech-error", error: e.error });
  };

  recognition.onend = () => {
    if (isRunning) {
      try {
        recognition.start();
        return;
      } catch {}
    }
    isRunning = false;
    send({ action: "speech-ended" });
  };

  recognition.start();
}

function stop() {
  isRunning = false;
  try {
    recognition?.abort();
  } catch {}
  recognition = null;
  send({ action: "speech-ended" });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target !== "offscreen") return;
  if (msg.action === "speech-start") start(msg.lang);
  else if (msg.action === "speech-stop") stop();
});

// ロード完了を background に通知
chrome.runtime
  .sendMessage({ target: "background", action: "offscreen-ready" })
  .catch(() => {});
