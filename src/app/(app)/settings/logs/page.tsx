"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, RefreshCw, ShieldAlert, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  role: string;
  details: string;
  createdAt: string;
  outcome: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      (l.details || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost" className="h-8 w-8">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Back to Settings</span>
      </div>

      <PageHeader
        title="HIPAA Audit Logs"
        description="Comprehensive monitoring registry tracing all Protected Health Information (PHI) access, modifications, and system access events."
        actions={
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search audit details, actions or roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            HIPAA Audit History
          </CardTitle>
          <CardDescription>
            Showing recent transaction audit markers mapped directly to Neon PostgreSQL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No matching audit logs found.
            </div>
          ) : (
            <div className="rounded-md border border-border/80 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Event Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-semibold text-xs capitalize whitespace-nowrap">
                        <Badge variant="secondary" className="px-2 py-0.5 font-normal">
                          {log.action.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.role}</TableCell>
                      <TableCell className="text-sm max-w-[320px] truncate" title={log.details}>
                        {log.details}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.ipAddress || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {log.outcome === "success" ? (
                            <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 gap-1.5">
                              <CheckCircle2 className="h-3 w-3" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 gap-1.5">
                              <AlertTriangle className="h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
