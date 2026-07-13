"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EncountersTable } from "@/components/dashboard/encounters-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listEncounters,
  type EncounterListResult,
} from "@/lib/services/encounter.service";
import type { EncounterStatus } from "@/lib/types";

const PAGE_SIZE = 8;

export default function EncounterHistoryPage() {
  const [result, setResult] = useState<EncounterListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<"all" | EncounterStatus>("all");
  const [page, setPage] = useState(1);
  const [filterKey, setFilterKey] = useState(`|all`);
  const [requestKey, setRequestKey] = useState(`|all|1`);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const nextFilterKey = `${debouncedQuery}|${status}`;
  if (nextFilterKey !== filterKey) {
    setFilterKey(nextFilterKey);
    setPage(1);
  }

  const nextRequestKey = `${debouncedQuery}|${status}|${page}`;
  if (nextRequestKey !== requestKey) {
    setRequestKey(nextRequestKey);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    listEncounters({
      search: debouncedQuery,
      status,
      page,
      pageSize: PAGE_SIZE,
    }).then((data) => {
      if (!cancelled) {
        setResult(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, status, page]);

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));
  const items = result?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Encounter History"
        description="Search, filter, and review documented clinical encounters."
        actions={
          <Button asChild>
            <Link href="/encounters/new">
              <Plus className="h-4 w-4" />
              New Encounter
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2 sm:max-w-sm sm:flex-1">
          <Label htmlFor="encounter-search">Search</Label>
          <Input
            id="encounter-search"
            placeholder="Search patient or chief complaint…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:w-48">
          <Label htmlFor="encounter-status">Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "all" | EncounterStatus)}
          >
            <SelectTrigger id="encounter-status" className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="exported">Exported</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <EncountersTable
            encounters={items}
            emptyMessage="No encounters match your search or filter."
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {items.length} of {result?.total ?? 0} encounters
              {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : null}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
