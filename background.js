importScripts("i18n.js");

const DEFAULT_LANG = "en";

// 現在の言語で右クリックメニューを作り直す
function refreshContextMenu() {
  chrome.storage.sync.get({ lang: DEFAULT_LANG }, ({ lang }) => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "ml-annotate",
        title: t(lang, "ctxMenuTitle"),
        contexts: ["selection"],
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  // ツールバーアイコンのクリックでサイドパネルを開く
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((e) => console.warn("sidePanel 設定失敗:", e));

  refreshContextMenu();
});

// 言語が変わったらメニューの文言も更新
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.lang) refreshContextMenu();
});

// メニュークリック → 選択テキストをコンテンツスクリプトへ送る
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ml-annotate" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "annotate-selection",
      text: info.selectionText,
    });
  }
});

// キーボードショートカット（Alt+A）→ ページ側の選択範囲を解析
chrome.commands.onCommand.addListener((command) => {
  if (command !== "annotate-selection") return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "annotate-shortcut" });
  });
});
