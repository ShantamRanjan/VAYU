import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ChevronDown, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  id: 0,
  role: "assistant",
  content:
    "👋 Hi! I'm **VAYU AI** — your solar & wind energy expert powered by 4 specialized agents.\n\nAsk me about:\n- ☀️ Solar panel sizing & calculations\n- 🌬️ Wind turbine power output\n- 💰 ROI, LCOE & payback periods\n- 🔋 Battery storage & off-grid systems",
};

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed
      prose-headings:text-primary prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
      prose-h2:text-sm prose-h3:text-xs
      prose-p:my-1 prose-p:leading-relaxed
      prose-strong:text-foreground prose-strong:font-semibold
      prose-em:text-muted-foreground
      prose-table:text-xs prose-table:w-full
      prose-thead:bg-primary/10
      prose-th:px-2 prose-th:py-1 prose-th:text-left prose-th:font-semibold prose-th:text-primary
      prose-td:px-2 prose-td:py-1 prose-td:border-b prose-td:border-border
      prose-tr:even:bg-secondary/30
      prose-ul:my-1 prose-ul:pl-4
      prose-ol:my-1 prose-ol:pl-4
      prose-li:my-0.5
      prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[10px]
      prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-2
      prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic
      [&_.katex]:text-sm [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2
      [&_table]:border-collapse [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:border [&_table]:border-border
      [&_hr]:border-border [&_hr]:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: data.final_answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "⚠️ Unable to reach the AI server. Make sure `chatbot_server.py` is running on port 5001.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center text-white hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        aria-label="Open AI Chatbot"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-h-[620px] flex flex-col rounded-2xl shadow-2xl border border-border bg-background overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">VAYU AI</p>
                <p className="text-[11px] opacity-75 mt-0.5">4 agents · Solar & Wind Expert</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[88%] rounded-2xl px-3 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm text-xs"
                    : "bg-card border border-border rounded-bl-sm"
                }`}>
                  {msg.role === "user"
                    ? <p className="text-xs leading-relaxed">{msg.content}</p>
                    : <AssistantMessage content={msg.content} />
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Agents debating your question…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-background shrink-0">
            <div className="flex items-end gap-2 bg-secondary/40 rounded-xl px-3 py-2 border border-border focus-within:border-primary/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about solar or wind energy…"
                rows={1}
                className="flex-1 bg-transparent resize-none text-xs outline-none placeholder:text-muted-foreground min-h-[20px] max-h-28 leading-relaxed"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 mb-0.5"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-1.5">
              Powered by Groq · Dr. Solar · Dr. Windward · Dr. Critic · Dr. Synthesis
            </p>
          </div>
        </div>
      )}
    </>
  );
}
