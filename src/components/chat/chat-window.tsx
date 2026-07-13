"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { askOperyx } from "@/lib/services/chat.service";
import type { ChatMessage, Encounter } from "@/lib/types";
import { uid } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const SUGGESTED_PROMPTS = [
  "Summarize the latest encounter",
  "Suggest diagnosis",
  "Explain the top ICD-10 codes",
  "What treatment plan is recommended?",
  "Recommend investigations",
  "Missing documentation or labs?",
  "Any drug interactions I should watch?",
  "Generate a discharge summary",
  "Generate a patient-friendly explanation",
] as const;

function renderRichText(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i} className="block min-h-[1.1em]">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="font-semibold text-foreground">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
            return (
              <em key={j} className="text-muted-foreground">
                {part.slice(1, -1)}
              </em>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </span>
    );
  });
}

export function ChatWindow({
  encounter,
  encounterId,
}: {
  encounter?: Encounter | null;
  encounterId?: string;
}) {
  const resolvedId = encounterId ?? encounter?.id;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I'm Operyx AI. Ask about summaries, diagnosis, ICD codes, treatment plans, investigations, missing docs, drug interactions, discharge drafts, or patient-friendly explanations. Context uses your latest encounter when available.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await askOperyx(trimmed, resolvedId);
      setMessages((m) => [...m, reply]);
    } catch {
      toast.error("Chat request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-[calc(100vh-10rem)] min-h-[560px] flex-col overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-gradient-to-br from-primary/8 via-transparent to-accent/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              Ask Operyx AI
            </CardTitle>
            <CardDescription>
              Intent-routed clinical assistance with mock encounter context
            </CardDescription>
          </div>
          {encounter ? (
            <Badge variant="secondary" className="max-w-[260px] truncate font-normal">
              Context: {encounter.patientName} · {encounter.chiefComplaint}
            </Badge>
          ) : (
            <Badge variant="outline" className="font-normal">
              Loading encounter context…
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-3">
          {SUGGESTED_PROMPTS.map((p) => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant="outline"
              className="h-auto whitespace-normal rounded-full px-3 py-1.5 text-left text-xs"
              disabled={loading}
              onClick={() => void send(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-6">
        <ScrollArea className="flex-1 rounded-2xl border border-border/60 bg-secondary/25 p-4">
          <div className="space-y-4 pr-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex gap-2.5",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {m.role !== "user" ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Bot className="h-4 w-4" />
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/70 bg-card-solid/70 text-foreground shadow-sm backdrop-blur"
                    )}
                  >
                    {m.role === "user" ? m.content : renderRichText(m.content)}
                  </div>
                  {m.role === "user" ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <UserRound className="h-4 w-4" />
                    </span>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading ? (
              <div className="flex gap-2.5">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="w-full max-w-md space-y-2 rounded-2xl border border-border/70 bg-card-solid/50 px-4 py-3">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <label htmlFor="ask-operyx-input" className="sr-only">
            Ask Operyx AI
          </label>
          <Textarea
            id="ask-operyx-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a clinical question…"
            rows={2}
            className="min-h-[64px] resize-none rounded-2xl"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="h-12 w-12 shrink-0 self-end rounded-2xl"
            disabled={loading || !input.trim()}
            onClick={() => void send(input)}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
