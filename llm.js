// OpenAI-compatible API streaming call
// endpoint: "https://api.openai.com/v1" / "http://localhost:11434/v1" etc.
// apiKey  : API key (pass empty string if not required, e.g. Ollama)
// model   : "gpt-4o-mini" / "llama3.2" etc.
// messages: [{role, content}]
// onChunk : (fullTextSoFar: string) => void  — incremental callback
// signal  : AbortSignal (optional)
// options : additional parameters such as { max_tokens?, temperature? }

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
  let reasoningFull = ""; // o-series reasoning_content
  let contentFull = ""; // regular content
  let buf = "";
  let finished = false;

  // While contentFull is still empty, reasoning is streaming — leave the tag open (treated as partial).
  // Once contentFull starts arriving, close the tag so parseThinking treats it as complete.
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
          // o-series: collect reasoning_content (thinking) and content (answer) separately
          if (delta.reasoning_content) {
            reasoningFull += delta.reasoning_content;
            onChunk(buildFull());
          } else if (delta.content) {
            contentFull += delta.content;
            onChunk(buildFull());
          }
        } catch {
          /* ignore incomplete JSON fragments */
        }
      }
      if (finished) break; // exit immediately after [DONE] without waiting for the stream to close
    }
  } finally {
    reader.cancel().catch(() => {}); // always release the stream
  }

  return buildFull();
}
