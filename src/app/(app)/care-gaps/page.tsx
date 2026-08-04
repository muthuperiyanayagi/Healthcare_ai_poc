"use client";

import { useEffect } from "react";
import { CareGapWorkspace } from "@/components/care-gaps/care-gap-workspace";

export default function CareGapsPage() {
  useEffect(() => {
    // Record HIPAA audit log for care gaps panel access
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "view_care_gaps",
        entity: "care_gaps",
        details: "Clinician opened clinical Care Gaps compliance queue and workspace",
      }),
    }).catch((err) => console.warn("Failed to submit audit log:", err));
  }, []);

  return <CareGapWorkspace />;
}
