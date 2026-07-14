"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ClaimReadinessWorkspace } from "@/components/claim-readiness/claim-readiness-workspace";
import { Button } from "@/components/ui/button";

export default function ClaimReadinessPage() {
  return (
    <div>
      <PageHeader
        title="AI Claim Readiness & Denial Prevention"
        description="Portfolio hygiene, documentation gaps, coding support, and denial risk with AI remediation for each encounter."
        actions={
          <Button asChild variant="outline">
            <Link href="/encounters/new">
              <Sparkles className="h-4 w-4" />
              Open Clinical Documentation
            </Link>
          </Button>
        }
      />
      <ClaimReadinessWorkspace />
    </div>
  );
}
