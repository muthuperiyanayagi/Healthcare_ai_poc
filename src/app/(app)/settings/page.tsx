"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ComplianceBadges } from "@/components/shared/compliance-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AI_MODELS,
  AI_PROVIDERS,
  fetchSettings,
  updateSettings,
} from "@/lib/services/settings.service";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchSettings().then((s) => {
      if (mounted) setSettings(s);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function onSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await updateSettings(settings);
      setSettings(saved);
      setTheme(saved.theme);
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Organization preferences, AI model selection, theme, and notification controls."
        actions={
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Hospital, clinician, and network identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Hospital Name" htmlFor="hospital-name">
              <Input
                id="hospital-name"
                value={settings.hospitalName}
                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
              />
            </Field>
            <Field label="Doctor Name" htmlFor="doctor-name">
              <Input
                id="doctor-name"
                value={settings.doctorName}
                onChange={(e) => setSettings({ ...settings, doctorName: e.target.value })}
              />
            </Field>
            <Field label="Organization" htmlFor="organization">
              <Input
                id="organization"
                value={settings.organization}
                onChange={(e) => setSettings({ ...settings, organization: e.target.value })}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI & Experience</CardTitle>
            <CardDescription>Provider, model, theme, and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="AI Provider" htmlFor="ai-provider">
              <Select
                value={settings.aiProvider}
                onValueChange={(v) => setSettings({ ...settings, aiProvider: v })}
              >
                <SelectTrigger id="ai-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Model Selection" htmlFor="ai-model">
              <Select
                value={settings.model}
                onValueChange={(v) => setSettings({ ...settings, model: v })}
              >
                <SelectTrigger id="ai-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Theme" htmlFor="theme-preference">
              <Select
                value={settings.theme}
                onValueChange={(v) =>
                  setSettings({ ...settings, theme: v as AppSettings["theme"] })
                }
              >
                <SelectTrigger id="theme-preference">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
              <div>
                <Label htmlFor="notifications-enabled" className="text-sm font-medium">
                  Notifications
                </Label>
                <div className="text-xs text-muted-foreground">
                  CDS alerts and claim readiness updates
                </div>
              </div>
              <Switch
                id="notifications-enabled"
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notificationsEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Enterprise Compliance</CardTitle>
          <CardDescription>Platform posture for regulated clinical workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceBadges />
          <p className="mt-4 text-sm text-muted-foreground">
            Operyx AI is designed for regulated clinical workflows. All AI outputs require human
            clinician review before final chart commitment. FHIR R4 export and HL7-ready interfaces
            support EHR interoperability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
