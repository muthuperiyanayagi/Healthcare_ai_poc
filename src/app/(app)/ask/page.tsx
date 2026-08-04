"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ChatWindow } from "@/components/chat/chat-window";
import { listEncounters } from "@/lib/services/encounter.service";
import type { Encounter } from "@/lib/types";

export default function AskPage() {
  const [encounter, setEncounter] = useState<Encounter | null>(null);

  useEffect(() => {
    let mounted = true;

    // Record HIPAA audit log for Ask AI session activation
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "view_ask_ai",
        entity: "ask_ai",
        details: "Clinician opened Ask AI chatbot and clinical querying assistant",
      }),
    }).catch((err) => console.warn("Failed to submit audit log:", err));

    listEncounters({ page: 1, pageSize: 20 }).then((res) => {
      if (!mounted) return;
      const john = res.items.find((e) => e.patientName === "John Smith");
      setEncounter(john ?? res.items[0] ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Ask Operyx AI"
        description="Conversational clinical assistant for summaries, coding rationale, CDS, and patient education."
      />
      <ChatWindow encounter={encounter} />
    </div>
  );
}
