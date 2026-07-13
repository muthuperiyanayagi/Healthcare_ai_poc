export type EncounterStatus = "draft" | "reviewed" | "exported";

export type Gender = "male" | "female" | "other" | "unknown";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  mrn?: string;
}

export interface EncounterInput {
  patientName: string;
  age: number;
  gender: Gender;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  vitals: string;
  examFindings: string;
  labs: string;
  assessmentNotes: string;
}

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ClinicalDocumentation {
  soap: SoapNote;
  clinicalSummary: string;
  assessment: string;
  treatmentPlan: string;
  followUpPlan: string;
}

export interface CodeItem {
  code: string;
  description: string;
  confidence: number;
}

export interface CodingResult {
  icd10: CodeItem[];
  cpt: CodeItem[];
  confidence: number;
  completeness: number;
  claimReadiness: number;
}

export type CdsSeverity = "info" | "warning" | "critical";

export interface CdsAlert {
  id: string;
  category:
    | "interaction"
    | "missing_documentation"
    | "missing_labs"
    | "screening"
    | "investigation"
    | "risk"
    | "follow_up";
  severity: CdsSeverity;
  title: string;
  detail: string;
}

export interface CdsResult {
  alerts: CdsAlert[];
  reasoning: string;
  confidence: number;
}

export interface AiGenerationResult {
  documentation: ClinicalDocumentation;
  coding: CodingResult;
  cds: CdsResult;
  aiConfidence: number;
  documentationQuality: number;
}

export interface Encounter extends EncounterInput {
  id: string;
  patientId: string;
  status: EncounterStatus;
  createdAt: string;
  updatedAt: string;
  documentation?: ClinicalDocumentation;
  coding?: CodingResult;
  cds?: CdsResult;
  aiConfidence?: number;
  documentationQuality?: number;
  timeSavedMinutes?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface DashboardMetrics {
  patientsToday: number;
  aiNotesGenerated: number;
  timeSavedMinutes: number;
  codingAccuracy: number;
  claimReadiness: number;
  documentationQuality: number;
  aiConfidence: number;
  revenueLeakagePrevented: number;
}

export interface WeeklyPoint {
  day: string;
  encounters: number;
  aiNotes: number;
  timeSaved: number;
}

export interface AnalyticsSeries {
  encountersOverTime: { date: string; count: number }[];
  codingAccuracy: { date: string; value: number }[];
  timeSaved: { date: string; minutes: number }[];
  revenueImprovement: { date: string; amount: number }[];
  claimReadiness: { date: string; value: number }[];
  documentationQuality: { date: string; value: number }[];
}

export interface AppSettings {
  hospitalName: string;
  doctorName: string;
  organization: string;
  aiProvider: string;
  model: string;
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
}

export interface AuthSession {
  email: string;
  name: string;
  role: string;
  loggedInAt: string;
}

export interface FhirBundle {
  resourceType: "Bundle";
  type: "collection";
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: Record<string, unknown>;
  }>;
}
