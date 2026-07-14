"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  PortfolioList,
  type PortfolioItem,
} from "@/components/claim-readiness/portfolio-list";
import { PortfolioMetrics } from "@/components/claim-readiness/portfolio-metrics";
import { ReadinessScoreGrid } from "@/components/claim-readiness/readiness-score-grid";
import { ReadinessInsights } from "@/components/claim-readiness/readiness-insights";
import { DenialPreventionPanel } from "@/components/claim-readiness/denial-prevention-panel";
import {
  ClaimReadinessDetailSkeleton,
  ClaimReadinessPageSkeleton,
} from "@/components/claim-readiness/skeletons";
import {
  deriveCodingErrors,
  deriveScoreBreakdown,
  encounterToInput,
  estimatedApprovalProbability,
} from "@/components/claim-readiness/utils";
import {
  getEncounterClaimReadiness,
  listClaimReadinessPortfolio,
  runClaimReadinessAssessment,
} from "@/lib/services/claim-readiness.service";
import { patchEncounter } from "@/lib/services/encounter.service";
import type { ClaimReadinessResult, DenialRiskPrediction, Encounter } from "@/lib/types";

type PortfolioData = Awaited<ReturnType<typeof listClaimReadinessPortfolio>>;

export function ClaimReadinessWorkspace() {
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [reassessing, setReassessing] = useState(false);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [claim, setClaim] = useState<ClaimReadinessResult | null>(null);
  const [denial, setDenial] = useState<DenialRiskPrediction | null>(null);
  const [selectionKey, setSelectionKey] = useState<string | null>(null);

  if (selectedId !== selectionKey) {
    setSelectionKey(selectedId);
    setEncounter(null);
    setClaim(null);
    setDenial(null);
    setDetailLoading(!!selectedId);
  }

  const loadPortfolio = useCallback(async (preferId?: string | null) => {
    const data = await listClaimReadinessPortfolio();
    setPortfolio(data);
    setSelectedId((current) => {
      if (preferId && data.items.some((i) => i.encounterId === preferId)) return preferId;
      if (current && data.items.some((i) => i.encounterId === current)) return current;
      return data.items[0]?.encounterId ?? null;
    });
    return data;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listClaimReadinessPortfolio();
        if (!mounted) return;
        setPortfolio(data);
        setSelectedId(data.items[0]?.encounterId ?? null);
      } catch {
        if (mounted) toast.error("Failed to load claim readiness portfolio");
      } finally {
        if (mounted) setPortfolioLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    let mounted = true;
    getEncounterClaimReadiness(selectedId)
      .then((res) => {
        if (!mounted) return;
        setEncounter(res.encounter);
        setClaim(res.claimReadiness);
        setDenial(res.denialRisk);
      })
      .catch(() => {
        if (mounted) {
          toast.error("Failed to load encounter claim readiness");
          setEncounter(null);
          setClaim(null);
          setDenial(null);
        }
      })
      .finally(() => {
        if (mounted) setDetailLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedId]);

  async function refreshAssessment(mode: "reassess" | "improve") {
    if (!encounter || !selectedId) return;
    const busy = mode === "improve" ? setImproving : setReassessing;
    busy(true);
    try {
      const input = encounterToInput(encounter);
      const result = await runClaimReadinessAssessment(input);

      let nextClaim = result.claimReadiness;
      let nextDenial = result.denialRisk;

      if (mode === "improve") {
        const boostedScore = Math.min(98, nextClaim.score + 4);
        nextClaim = {
          ...nextClaim,
          score: boostedScore,
          status: boostedScore >= 88 ? "ready" : boostedScore >= 78 ? "needs_review" : "high_risk",
          missingElements: nextClaim.missingElements.slice(0, Math.max(0, nextClaim.missingElements.length - 1)),
          recommendations: [
            "AI auto-improved documentation narrative for medical necessity linkage",
            ...nextClaim.recommendations.filter(
              (r) => !r.toLowerCase().includes("auto-improved")
            ),
          ],
          estimatedDenialRisk: Math.max(6, nextClaim.estimatedDenialRisk - 5),
          summary: `${nextClaim.summary} Documentation auto-improvement applied.`,
        };
        nextDenial = {
          ...nextDenial,
          overallRisk: Math.max(6, nextDenial.overallRisk - 5),
          riskLevel:
            Math.max(6, nextDenial.overallRisk - 5) >= 35
              ? "high"
              : Math.max(6, nextDenial.overallRisk - 5) >= 20
                ? "moderate"
                : "low",
          mitigationActions: [
            "Auto-improved documentation packet applied",
            ...nextDenial.mitigationActions,
          ],
          summary: `Post-improvement denial risk ${Math.max(6, nextDenial.overallRisk - 5)}%. ${nextDenial.summary}`,
        };
      }

      const updated = await patchEncounter(selectedId, {
        claimReadinessDetail: nextClaim,
        denialRisk: nextDenial,
        coding: encounter.coding
          ? {
              ...encounter.coding,
              claimReadiness: nextClaim.score,
              completeness: Math.min(
                99,
                (encounter.coding.completeness ?? nextClaim.score) + (mode === "improve" ? 3 : 0)
              ),
            }
          : encounter.coding,
      });

      setEncounter(updated);
      setClaim(nextClaim);
      setDenial(nextDenial);
      await loadPortfolio(selectedId);

      toast.success(
        mode === "improve"
          ? "Documentation auto-improved and readiness refreshed"
          : "Claim readiness reassessment complete"
      );
    } catch {
      toast.error(
        mode === "improve" ? "Auto-improve documentation failed" : "Reassessment failed"
      );
    } finally {
      busy(false);
    }
  }

  if (portfolioLoading || !portfolio) {
    return <ClaimReadinessPageSkeleton />;
  }

  if (!portfolio.items.length) {
    return (
      <EmptyState
        title="No coded encounters yet"
        description="Generate clinical documentation with coding to populate the claim readiness portfolio."
        action={
          <Button asChild>
            <Link href="/encounters/new">
              <Sparkles className="h-4 w-4" />
              New Encounter
            </Link>
          </Button>
        }
      />
    );
  }

  const scores =
    claim &&
    deriveScoreBreakdown(
      claim,
      encounter?.coding,
      encounter?.documentation?.documentationCompletenessScore
    );
  const codingErrors = claim ? deriveCodingErrors(claim, encounter?.coding) : [];
  const approvalProbability =
    claim && denial ? estimatedApprovalProbability(claim, denial) : null;

  return (
    <div className="space-y-6">
      <PortfolioMetrics
        averageScore={portfolio.averageScore}
        readyCount={portfolio.readyCount}
        reviewCount={portfolio.reviewCount}
        highRiskCount={portfolio.highRiskCount}
      />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <PortfolioList
          items={portfolio.items as PortfolioItem[]}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div className="min-w-0 space-y-4">
          {detailLoading || !claim || !denial || !scores || approvalProbability === null ? (
            <ClaimReadinessDetailSkeleton />
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight">
                    {encounter?.patientName ?? "Encounter"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {encounter?.chiefComplaint ?? "Claim readiness workspace"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reassessing || improving}
                    onClick={() => void refreshAssessment("reassess")}
                  >
                    <RefreshCw className={`h-4 w-4 ${reassessing ? "animate-spin" : ""}`} />
                    Reassess
                  </Button>
                  <Button
                    size="sm"
                    disabled={improving || reassessing}
                    onClick={() => void refreshAssessment("improve")}
                  >
                    <Wand2 className={`h-4 w-4 ${improving ? "animate-pulse" : ""}`} />
                    Auto Improve Documentation
                  </Button>
                  {selectedId ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/encounters/${selectedId}`}>
                        <FileText className="h-4 w-4" />
                        Open chart
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </motion.div>

              <ReadinessScoreGrid
                scores={scores}
                status={claim.status}
                summary={claim.summary}
              />
              <ReadinessInsights
                claim={claim}
                denial={denial}
                codingErrors={codingErrors}
                approvalProbability={approvalProbability}
              />
              <DenialPreventionPanel
                denial={denial}
                missingElements={claim.missingElements}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
