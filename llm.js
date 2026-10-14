// OpenAI互換 API のストリーミング呼び出し
// endpoint: "https://api.openai.com/v1" / "http://localhost:11434/v1" など
// apiKey  : APIキー（Ollama など不要な場合は空文字）
// model   : "gpt-4o-mini" / "llama3.2" など
// messages: [{role, content}]
// onChunk : (fullTextSoFar: string) => void  — 逐次コールバック
// signal  : AbortSignal（省略可）
// options : { max_tokens?, temperature? } など追加パラメータ

async function fetchLLMStream(
  endpoint,
  apiKey,
  model,
  messages,
  onChunk,
  signal,
  options = {},
) {
  const url = endpoint.replace(/\/+$/, "") + "/chat/completions";

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, stream: true, ...options }),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(`API ${resp.status}: ${errText.slice(0, 150)}`);
  }

  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let reasoningFull = ""; // o-series の reasoning_content
  let contentFull = ""; // 通常の content
  let buf = "";
  let finished = false;

  // contentFull がまだ空 = reasoning ストリーミング中 → タグを開けたまま（partial 扱い）
  // contentFull が届き始めたら閉じる → parseThinking が complete と判定
  const buildFull = () => {
    if (!reasoningFull) return contentFull;
    if (!contentFull) return `<think>${reasoningFull}`;
    return `<think>${reasoningFull}</think>${contentFull}`;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") {
          finished = true;
          break;
        }
        try {
          const delta = JSON.parse(raw).choices?.[0]?.delta;
          if (!delta) continue;
          // o-series: reasoning_content（思考）と content（回答）を分けて収集
          if (delta.reasoning_content) {
            reasoningFull += delta.reasoning_content;
            onChunk(buildFull());
          } else if (delta.content) {
            contentFull += delta.content;
            onChunk(buildFull());
          }
        } catch {
          /* JSON不完全な断片は無視 */
        }
      }
      if (finished) break; // [DONE] 受信後は接続を待たずに即終了
    }
  } finally {
    reader.cancel().catch(() => {}); // ストリームを確実に解放
  }

  return buildFull();
}
