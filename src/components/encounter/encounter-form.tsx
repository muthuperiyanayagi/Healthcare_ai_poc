"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EncounterInput, Gender } from "@/lib/types";
import { JOHN_SMITH_PRESET } from "@/lib/mock/seed";
import { Sparkles, UserRound } from "lucide-react";

/** John Smith demo dialogue — merged into HPI for generators when preset is applied. */
const JOHN_SMITH_VOICE_TRANSCRIPT =
  "Doctor: Good morning Mr. Smith, what brings you in today? Patient: I've been peeing a lot, especially at night, and I'm always thirsty. I also feel wiped out. Doctor: Any weight changes? Patient: Maybe lost a few pounds without trying. Doctor: Your last A1c was 8.4 and today's glucose is elevated. We'll confirm diabetes and start a treatment plan.";

export type EncounterFormValues = EncounterInput & {
  voiceTranscript: string;
};

export const EMPTY_ENCOUNTER_INPUT: EncounterFormValues = {
  patientName: "",
  age: 0,
  gender: "unknown",
  chiefComplaint: "",
  historyOfPresentIllness: "",
  pastMedicalHistory: "",
  medications: "",
  allergies: "",
  vitals: "",
  examFindings: "",
  labs: "",
  assessmentNotes: "",
  voiceTranscript: "",
};

export function toEncounterInput(values: EncounterFormValues): EncounterInput {
  const transcript = values.voiceTranscript.trim();
  const hpi = values.historyOfPresentIllness.trim();
  const historyOfPresentIllness =
    transcript && hpi
      ? `${hpi}\n\nVoice transcript:\n${transcript}`
      : transcript || hpi;

  return {
    patientName: values.patientName,
    age: values.age,
    gender: values.gender,
    chiefComplaint: values.chiefComplaint,
    historyOfPresentIllness,
    pastMedicalHistory: values.pastMedicalHistory,
    medications: values.medications,
    allergies: values.allergies,
    vitals: values.vitals,
    examFindings: values.examFindings,
    labs: values.labs,
    assessmentNotes: values.assessmentNotes,
  };
}

function isEncounterFormComplete(value: EncounterFormValues) {
  return (
    value.patientName.trim().length > 0 &&
    Number.isFinite(value.age) &&
    value.age > 0 &&
    Boolean(value.gender) &&
    value.chiefComplaint.trim().length > 0 &&
    value.pastMedicalHistory.trim().length > 0 &&
    value.medications.trim().length > 0 &&
    value.allergies.trim().length > 0 &&
    value.assessmentNotes.trim().length > 0 &&
    value.voiceTranscript.trim().length > 0
  );
}

export function EncounterForm({
  value,
  onChange,
  onGenerate,
  generating,
}: {
  value: EncounterFormValues;
  onChange: (next: EncounterFormValues) => void;
  onGenerate: () => void;
  generating?: boolean;
}) {
  function set<K extends keyof EncounterFormValues>(key: K, v: EncounterFormValues[K]) {
    onChange({ ...value, [key]: v });
  }

  function applyJohnSmithPreset() {
    onChange({
      ...JOHN_SMITH_PRESET,
      voiceTranscript: JOHN_SMITH_VOICE_TRANSCRIPT,
    });
  }

  const canGenerate = isEncounterFormComplete(value);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Encounter details</CardTitle>
          <CardDescription>
            Capture patient context for AI clinical documentation, coding, and CDS
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={applyJohnSmithPreset}>
          <UserRound className="h-4 w-4" />
          John Smith preset
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="patientName">Patient Name</Label>
            <Input
              id="patientName"
              value={value.patientName}
              onChange={(e) => set("patientName", e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min={1}
              max={120}
              value={value.age || ""}
              onChange={(e) => set("age", Number(e.target.value) || 0)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={value.gender} onValueChange={(v) => set("gender", v as Gender)}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Field
          label="Chief Complaint"
          value={value.chiefComplaint}
          onChange={(v) => set("chiefComplaint", v)}
          rows={2}
          required
        />
        <Field
          label="Medical History"
          value={value.pastMedicalHistory}
          onChange={(v) => set("pastMedicalHistory", v)}
          rows={3}
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Current Medications"
            value={value.medications}
            onChange={(v) => set("medications", v)}
            required
          />
          <Field
            label="Allergies"
            value={value.allergies}
            onChange={(v) => set("allergies", v)}
            required
          />
        </div>
        <Field
          label="Doctor Notes"
          value={value.assessmentNotes}
          onChange={(v) => set("assessmentNotes", v)}
          rows={3}
          required
        />
        <Field
          label="Voice Transcript"
          value={value.voiceTranscript}
          onChange={(v) => set("voiceTranscript", v)}
          rows={4}
          required
        />

        <div className="grid gap-4 border-t border-border/60 pt-5 md:grid-cols-2">
          <Field
            label="History of present illness"
            value={value.historyOfPresentIllness}
            onChange={(v) => set("historyOfPresentIllness", v)}
            rows={3}
          />
          <Field label="Vitals" value={value.vitals} onChange={(v) => set("vitals", v)} />
          <Field
            label="Exam findings"
            value={value.examFindings}
            onChange={(v) => set("examFindings", v)}
            rows={3}
          />
          <Field label="Labs / diagnostics" value={value.labs} onChange={(v) => set("labs", v)} />
        </div>

        {!canGenerate ? (
          <p className="text-xs text-muted-foreground">
            Complete Patient Name, Age, Gender, Chief Complaint, Medical History, Current Medications,
            Allergies, Doctor Notes, and Voice Transcript to generate documentation — or use the John
            Smith preset.
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="w-full md:w-auto"
          disabled={generating || !canGenerate}
          onClick={onGenerate}
        >
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating clinical documentation…" : "Generate AI Clinical Documentation"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  rows = 2,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
