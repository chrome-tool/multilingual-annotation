importScripts('i18n.js');

const DEFAULT_LANG = 'ja';


// Rebuild the context menu in the current language
async function refreshContextMenu() {
  await localeReady;
  chrome.storage.sync.get({ lang: DEFAULT_LANG }, ({ lang }) => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'ml-annotate',
        title: t(lang, 'ctxMenuTitle'),
        contexts: ['selection']
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  // Open the side panel when the toolbar icon is clicked
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((e) => console.warn('sidePanel setup failed:', e));

  refreshContextMenu();
});

// Rebuild menu text when the user changes the language
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.lang) refreshContextMenu();
});

// Context menu click → forward selected text to the content script
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ml-annotate' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'annotate-selection',
      text: info.selectionText
    });
  }
});

// Keyboard shortcut (Alt+A) → ask the active page to analyze its selection
chrome.commands.onCommand.addListener((command) => {
  if (command !== 'annotate-selection') return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'annotate-shortcut' });
  });
});
