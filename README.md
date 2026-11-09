# Multilingual Live Annotation

A Chrome extension (Manifest V3) that annotates text on any web page in your chosen language. It runs on Chrome Built-in AI (Gemini Nano) or on any OpenAI-compatible API.

## Features

- **Three trigger modes**: annotate on mouse hover, on text selection, or only from the right-click menu.
- **Keyboard shortcut**: `Alt+A` annotates the current selection.
- **AI providers**:
  - Chrome Built-in AI: free and runs locally.
  - External API: OpenAI, Ollama, or any endpoint compatible with `/chat/completions`. Responses stream in.
- **Vocabulary list**: save words with ⭐, search them, and export them to CSV.
- **Chat**: a side-panel chat that keeps your conversation history.
- **Read aloud**: text-to-speech with adjustable language and speed.
- **Themes**: auto, dark, or light.
- **UI languages**: English, 日本語, 简体中文.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the project folder.
4. Click the extension icon to open the side panel and configure it.

## Using Chrome Built-in AI

1. In `chrome://flags/#prompt-api-for-gemini-nano`, set the flag to **Enabled**.
2. In `chrome://flags/#optimization-guide-on-device-model`, set the flag to **Enabled BypassPerfRequirement**.
3. Restart Chrome, then download the model from `chrome://components`.

## Using an External API

In the side panel, select **External API** and fill in these fields:

| Field    | Example                                                  |
| -------- | -------------------------------------------------------- |
| Endpoint | `https://api.openai.com/v1` / `http://localhost:11434/v1` |
| API Key  | `sk-...` (leave blank for Ollama)                         |
| Model    | `gpt-4o-mini` / `llama3.2`                               |

## Project Structure

| File | Purpose |
| ---- | ------- |
| `manifest.json` | Extension manifest |
| `background.js` | Service worker: context menu, commands, side panel |
| `content.js` / `tooltip.css` | In-page annotation tooltip |
| `sidepanel.html` / `.js` / `.css` | Settings, vocabulary, and chat UI |
| `llm.js` | Streaming client for OpenAI-compatible APIs |
| `prompts.js` | Prompt templates |
| `i18n.js` | Localization helper |
| `icons.js` | Inline SVG icons |
| `_locales/` | UI translations (en, ja, zh_CN) |
