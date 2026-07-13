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
