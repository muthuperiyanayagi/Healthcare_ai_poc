"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileCheck2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  PriorAuthForm,
  toPriorAuthEncounterInput,
  type PriorAuthFormValues,
} from "@/components/prior-auth/prior-auth-form";
import { PriorAuthResults } from "@/components/prior-auth/prior-auth-results";
import { PriorAuthQueue } from "@/components/prior-auth/prior-auth-queue";
import {
  listPriorAuthQueue,
  runPriorAuthAssessment,
} from "@/lib/services/prior-auth.service";
import type { PriorAuthAssessment } from "@/lib/types";
import { getEncounterById } from "@/stores/local-store";

export default function PriorAuthPage() {
  const [queueLoading, setQueueLoading] = useState(true);
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof listPriorAuthQueue>> | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessment, setAssessment] = useState<PriorAuthAssessment | null>(null);
  const [lastContext, setLastContext] = useState<PriorAuthFormValues | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formDefaults, setFormDefaults] = useState<Partial<PriorAuthFormValues> | undefined>();

  const refreshQueue = useCallback(() => {
    setQueueLoading(true);
    listPriorAuthQueue()
      .then(setQueue)
      .catch(() => toast.error("Failed to load prior auth queue"))
      .finally(() => setQueueLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;
    listPriorAuthQueue()
      .then((data) => {
        if (mounted) setQueue(data);
      })
      .catch(() => {
        if (mounted) toast.error("Failed to load prior auth queue");
      })
      .finally(() => {
        if (mounted) setQueueLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleAssess(values: PriorAuthFormValues) {
    setAssessing(true);
    setAssessment(null);
    setLastContext(values);
    try {
      const input = toPriorAuthEncounterInput(values);
      const result = await runPriorAuthAssessment(input);
      setAssessment(result);
      toast.success(
        result.required
          ? "Prior authorization likely required — review checklist"
          : "No prior authorization required for current services"
      );
      refreshQueue();
    } catch {
      toast.error("Prior auth assessment failed");
    } finally {
      setAssessing(false);
    }
  }

  function handleAssessFromQueue(item: {
    encounterId: string;
    patientName: string;
    summary: string;
  }) {
    const encounter = getEncounterById(item.encounterId);
    if (!encounter) {
      toast.error("Encounter not found in local store");
      return;
    }

    const defaults: Partial<PriorAuthFormValues> = {
      patientName: encounter.patientName,
      age: encounter.age,
      gender: encounter.gender,
      insurancePayer: "UnitedHealthcare",
      insurancePlan: "Commercial PPO",
      memberId: `MBR-${encounter.id.slice(-6).toUpperCase()}`,
      procedureCode: encounter.coding?.cpt?.[0]?.code ?? "99214",
      procedureDescription:
        encounter.coding?.cpt?.[0]?.description ?? encounter.chiefComplaint,
      clinicalJustification:
        encounter.assessmentNotes ||
        encounter.historyOfPresentIllness ||
        encounter.chiefComplaint,
      referralFileName: undefined,
    };

    setFormDefaults(defaults);
    setFormKey((k) => k + 1);
    setAssessment(encounter.priorAuth ?? null);
    setLastContext({
      patientName: defaults.patientName!,
      age: defaults.age!,
      gender: defaults.gender!,
      insurancePayer: defaults.insurancePayer!,
      insurancePlan: defaults.insurancePlan!,
      memberId: defaults.memberId!,
      procedureCode: defaults.procedureCode!,
      procedureDescription: defaults.procedureDescription!,
      clinicalJustification: defaults.clinicalJustification!,
      referralFileName: undefined,
    });
    toast.message("Queue encounter loaded — run assessment to refresh AI outputs");
  }

  return (
    <div>
      <PageHeader
        title="AI Prior Authorization Assistant"
        description="Assess referral, insurance, and procedure context for coverage, medical necessity, document gaps, and approval probability — then work the live PA queue."
        actions={
          <Button asChild variant="outline">
            <Link href="/encounters/new">Open Clinical Documentation</Link>
          </Button>
        }
      />

      {queueLoading || !queue ? (
        <div className="space-y-4" aria-busy="true" aria-live="polite" aria-label="Loading prior authorization">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="Pending review"
              value={queue.pendingReview}
              subtitle="Likely required or submitted"
              icon={ShieldAlert}
              accent="warning"
            />
            <KpiCard
              title="Not required"
              value={queue.notRequired}
              subtitle="Clear to proceed"
              icon={FileCheck2}
              accent="success"
              delay={0.05}
            />
            <KpiCard
              title="Likely required"
              value={queue.likelyRequired}
              subtitle="Needs PA workflow"
              icon={ClipboardList}
              accent="primary"
              delay={0.1}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PriorAuthForm
              key={formKey}
              defaultValues={formDefaults}
              onSubmit={handleAssess}
              generating={assessing}
            />
            <PriorAuthResults
              assessment={assessment}
              loading={assessing}
              context={lastContext}
            />
          </div>

          <PriorAuthQueue items={queue.items} onAssessEncounter={handleAssessFromQueue} />
        </div>
      )}
    </div>
  );
}
