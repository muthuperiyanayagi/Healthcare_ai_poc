"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Sparkles, UserRound, X } from "lucide-react";
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

const priorAuthFormSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  age: z.number().int().min(1, "Age is required").max(120),
  gender: z.enum(["male", "female", "other", "unknown"]),
  insurancePayer: z.string().min(2, "Insurance payer is required"),
  insurancePlan: z.string().min(1, "Plan type is required"),
  memberId: z.string().min(2, "Member ID is required"),
  procedureCode: z.string().min(1, "Procedure code is required"),
  procedureDescription: z.string().min(2, "Procedure description is required"),
  clinicalJustification: z.string().min(10, "Add brief clinical justification"),
  referralFileName: z.string().optional(),
});

export type PriorAuthFormValues = z.infer<typeof priorAuthFormSchema>;

/** Demo request that triggers a PA-required imaging pathway in generators. */
export const MRI_PRIOR_AUTH_PRESET: PriorAuthFormValues = {
  patientName: "Maria Alvarez",
  age: 48,
  gender: "female",
  insurancePayer: "Aetna Better Health",
  insurancePlan: "Commercial PPO",
  memberId: "AET-94822103",
  procedureCode: "72148",
  procedureDescription: "MRI lumbar spine without contrast",
  clinicalJustification:
    "Right L5 radiculopathy for 9 weeks with positive straight-leg raise and incomplete relief after 5 physical therapy visits and NSAIDs. MRI requested to guide epidural vs surgical referral.",
  referralFileName: "referral_orthopedics_mri_lumbar.pdf",
};

export const DIABETES_PRIOR_AUTH_PRESET: PriorAuthFormValues = {
  patientName: "John Smith",
  age: 57,
  gender: "male",
  insurancePayer: "UnitedHealthcare",
  insurancePlan: "Commercial HMO",
  memberId: "UHC-44102918",
  procedureCode: "99214",
  procedureDescription: "Office visit — new type 2 diabetes evaluation with HbA1c",
  clinicalJustification:
    "New osmotic symptoms with HbA1c 8.4%. Assessing coverage for E/M and diagnostic labs before any specialty diabetes technology.",
  referralFileName: undefined,
};

export function toPriorAuthEncounterInput(values: PriorAuthFormValues): EncounterInput {
  const insuranceLine = `Insurance: ${values.insurancePayer} (${values.insurancePlan}), Member ID ${values.memberId}`;
  const procedureLine = `Requested procedure: ${values.procedureCode} — ${values.procedureDescription}`;
  const referralLine = values.referralFileName
    ? `Referral packet on file: ${values.referralFileName}`
    : "No referral file attached";

  return {
    patientName: values.patientName,
    age: values.age,
    gender: values.gender as Gender,
    chiefComplaint: `${values.procedureDescription} (${values.procedureCode})`,
    historyOfPresentIllness: values.clinicalJustification,
    pastMedicalHistory: referralLine,
    medications: "See clinical justification / chart",
    allergies: "NKDA or see chart",
    vitals: "Deferred — prior auth intake",
    examFindings: procedureLine,
    labs: "",
    assessmentNotes: `${insuranceLine}. ${values.clinicalJustification}`,
  };
}

export function PriorAuthForm({
  onSubmit,
  generating,
  defaultValues,
}: {
  onSubmit: (values: PriorAuthFormValues) => void;
  generating?: boolean;
  defaultValues?: Partial<PriorAuthFormValues>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<PriorAuthFormValues>({
    resolver: zodResolver(priorAuthFormSchema),
    defaultValues: {
      patientName: "",
      age: 0,
      gender: "unknown",
      insurancePayer: "",
      insurancePlan: "",
      memberId: "",
      procedureCode: "",
      procedureDescription: "",
      clinicalJustification: "",
      referralFileName: undefined,
      ...defaultValues,
    },
  });

  const referralFileName = useWatch({ control, name: "referralFileName" });
  const gender = useWatch({ control, name: "gender" });

  function onFilePick(file: File | undefined) {
    if (!file) return;
    setValue("referralFileName", file.name, { shouldValidate: true });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Prior auth intake</CardTitle>
          <CardDescription>
            Upload referral context, confirm insurance, and specify the procedure to assess authorization
            likelihood
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => reset(DIABETES_PRIOR_AUTH_PRESET)}
          >
            <UserRound className="h-4 w-4" />
            John Smith
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => reset(MRI_PRIOR_AUTH_PRESET)}>
            <Sparkles className="h-4 w-4" />
            MRI demo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Patient name" error={errors.patientName?.message}>
              <Input placeholder="Full name" {...register("patientName")} />
            </Field>
            <Field label="Age" error={errors.age?.message}>
              <Input type="number" min={1} {...register("age", { valueAsNumber: true })} />
            </Field>
            <Field label="Gender" error={errors.gender?.message}>
              <Select
                value={gender}
                onValueChange={(v) => setValue("gender", v as PriorAuthFormValues["gender"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Insurance payer" error={errors.insurancePayer?.message}>
              <Input placeholder="e.g. Aetna, UHC, BCBS" {...register("insurancePayer")} />
            </Field>
            <Field label="Plan type" error={errors.insurancePlan?.message}>
              <Input placeholder="PPO / HMO / Medicare Advantage" {...register("insurancePlan")} />
            </Field>
            <Field label="Member ID" error={errors.memberId?.message}>
              <Input placeholder="Plan member ID" {...register("memberId")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Procedure code" error={errors.procedureCode?.message}>
              <Input placeholder="CPT / HCPCS" {...register("procedureCode")} />
            </Field>
            <Field label="Procedure" error={errors.procedureDescription?.message}>
              <Input placeholder="Service requested" {...register("procedureDescription")} />
            </Field>
          </div>

          <Field label="Clinical justification" error={errors.clinicalJustification?.message}>
            <Textarea
              rows={4}
              placeholder="Symptoms, failed therapies, exam findings supporting medical necessity…"
              {...register("clinicalJustification")}
            />
          </Field>

          <div className="space-y-2">
            <Label>Referral packet</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => onFilePick(e.target.files?.[0])}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="h-4 w-4" />
                {referralFileName ? "Replace file" : "Upload referral"}
              </Button>
              {referralFileName ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/40 px-2.5 py-1 text-xs">
                  {referralFileName}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove referral file"
                    onClick={() => {
                      setValue("referralFileName", undefined);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">PDF or image mock upload</span>
              )}
            </div>
          </div>

          <Button type="submit" disabled={generating} className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4" />
            {generating ? "Assessing prior auth…" : "Run prior auth assessment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
