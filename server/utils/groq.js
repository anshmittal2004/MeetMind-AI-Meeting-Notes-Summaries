
import fetch from "node-fetch";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export async function summarizeWithGroq(transcript, prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return transcript.split(/\n+/).slice(0, 5).map((l,i)=>`• ${l}`).join("\n");
  }
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: "You summarize transcripts clearly." },
      { role: "user", content: `Instruction: ${prompt}\nTranscript:\n${transcript}` }
    ],
    temperature: 0.3,
    max_tokens: 1000
  };
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content?.trim() || "No summary";
}
