"use client";

import { useState } from "react";

const S = {
  bg3: "var(--color-bg-3)", bdr: "var(--color-bdr)",
  t2: "var(--color-t-2)", t3: "var(--color-t-3)",
  acc: "var(--color-acc)", blu: "var(--color-blu)",
  mono: "'JetBrains Mono', var(--mono), monospace",
};

interface Msg { role: "ai" | "user"; content: string }

const INITIAL: Msg[] = [
  { role: "ai", content: `I can generate media, build pipelines, switch modes, approve steps, post to social, and optimize prompts. Available tools:\n\ncreate_pipeline • modify_step • set_execution_mode • configure_provider • set_variables • improve_prompt • analyze_output • suggest_pipeline • estimate_cost • run_pipeline • approve_step • retry_step` },
  { role: "user", content: "Generate 50 product images with FLUX, then auto-post to Instagram and TikTok" },
  { role: "ai", content: `→ estimate_cost(tool: FLUX, count: 50)\nCost: 50 × $0.03 = $1.50\n\n→ run_pipeline(mode: automatic, gate: 85%)\nSubmitting 50 jobs to batch queue. Tab-close safe.\n\n→ social_post(platforms: [instagram, tiktok], trigger: on_complete)\nAuto-post configured for all completions scoring ≥ 85%.\n\n✓ 50 FLUX jobs queued. Auto-posting to IG + TikTok on completion.` },
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: input.trim() }]);
    setInput("");
    // Simulated AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", content: "→ Processing your request...\n\nI'll analyze the best approach and execute the appropriate tool calls." }]);
    }, 600);
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>🤖 AI Copilot</h1>
      <p style={{ fontSize: 11.5, color: S.t2, marginBottom: 16 }}>12 tool calls — generate, pipeline, mode switch, approve, post, optimize</p>

      {/* Chat */}
      <div style={{ maxWidth: 600 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 12, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "ai" && (
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${S.acc}, ${S.blu})`,
                display: "grid", placeItems: "center", fontSize: 11, color: "#000", fontWeight: 700,
              }}>AI</div>
            )}
            <div style={{
              background: msg.role === "ai" ? S.bg3 : S.acc,
              color: msg.role === "ai" ? S.t2 : "#000",
              borderRadius: 10, padding: "10px 14px", fontSize: 11, lineHeight: 1.7,
              maxWidth: "80%", whiteSpace: "pre-wrap",
              fontFamily: msg.role === "ai" && msg.content.includes("→") ? S.mono : "inherit",
            }}>{msg.content}</div>
          </div>
        ))}

        {/* Input */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask the copilot to generate, build pipelines, post..."
            style={{
              flex: 1, padding: "9px 11px", background: S.bg3, border: `1px solid ${S.bdr}`,
              borderRadius: 7, color: "var(--color-t-1)", fontSize: 12, fontFamily: "inherit",
            }}
          />
          <button onClick={send} style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: S.acc, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit",
          }}>Send</button>
        </div>
      </div>
    </div>
  );
}
