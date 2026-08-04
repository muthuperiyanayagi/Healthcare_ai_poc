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
import { getEncounter } from "@/lib/services/encounter.service";

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

    // Record HIPAA audit log for prior auth workspace access
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "view_prior_auth",
        entity: "prior_auth",
        details: "Clinician opened Prior Authorization assistant and queue",
      }),
    }).catch((err) => console.warn("Failed to submit audit log:", err));

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

  async function handleAssessFromQueue(item: {
    encounterId: string;
    patientName: string;
    summary: string;
  }) {
    setAssessing(true);
    try {
      const encounter = await getEncounter(item.encounterId);
      const values: PriorAuthFormValues = {
        patientName: encounter.patientName,
        age: encounter.age,
        gender: encounter.gender,
        insurancePayer: "UnitedHealthcare",
        insurancePlan: "Commercial HMO",
        memberId: "UHC-44102918",
        procedureCode: encounter.coding?.cpt?.[0]?.code ?? "99214",
        procedureDescription: encounter.coding?.cpt?.[0]?.description ?? "Office visit",
        clinicalJustification: encounter.historyOfPresentIllness || encounter.assessmentNotes || "Clinical necessity justification",
        referralFileName: undefined,
      };
      setFormDefaults(values);
      setFormKey((k) => k + 1);
      
      const input = toPriorAuthEncounterInput(values);
      const result = await runPriorAuthAssessment(input);
      setAssessment(result);
      setLastContext(values);
      toast.success(
        result.required
          ? "Prior authorization likely required — review checklist"
          : "No prior authorization required for current services"
      );
      refreshQueue();
    } catch (err) {
      console.error(err);
      toast.error("Failed to load or assess encounter details");
    } finally {
      setAssessing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <PageHeader
          title="Prior Authorization Assistant"
          description="Instant payer policy validation, clinical rules verification, auto-generated coverage documentation, and checklist matching."
        />

        {queueLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : queue ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="Pending Review"
              value={queue.pendingReview}
              icon={ClipboardList}
              accent="warning"
            />
            <KpiCard
              title="Likely Required"
              value={queue.likelyRequired}
              icon={ShieldAlert}
              accent="accent"
            />
            <KpiCard
              title="Not Required"
              value={queue.notRequired}
              icon={FileCheck2}
              accent="success"
            />
          </div>
        ) : null}

        <PriorAuthForm
          key={formKey}
          onSubmit={handleAssess}
          generating={assessing}
          defaultValues={formDefaults}
        />

        {assessment && lastContext && (
          <PriorAuthResults assessment={assessment} context={lastContext} />
        )}
      </div>

      <div className="space-y-6">
        {queueLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          queue && (
            <PriorAuthQueue
              items={queue.items}
              onAssessEncounter={handleAssessFromQueue}
            />
          )
        )}
      </div>
    </div>
  );
}
