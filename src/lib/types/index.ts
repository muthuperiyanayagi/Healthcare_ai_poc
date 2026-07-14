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

/** Extended clinical documentation — additive fields are optional for backward compatibility */
export interface ClinicalDocumentation {
  soap: SoapNote;
  clinicalSummary: string;
  assessment: string;
  treatmentPlan: string;
  followUpPlan: string;
  /** Narrative context across HPI, PMH, vitals, and labs */
  clinicalContextSummary?: string;
  differentialDiagnosis?: DifferentialDiagnosisItem[];
  clinicalReasoning?: ClinicalReasoning;
  medicalNecessitySummary?: MedicalNecessitySummary;
  medicationReview?: MedicationReviewItem[];
  patientInstructions?: string;
  providerNotes?: string;
  codingExplanation?: string;
  /** 0–100 completeness of required documentation elements */
  documentationCompletenessScore?: number;
}

export interface CodeItem {
  code: string;
  description: string;
  confidence: number;
  /** Human-readable rationale for the recommendation */
  explanation?: string;
}

/** Alias for clarity — same shape as CodeItem */
export type HcpcsCodeItem = CodeItem;

export interface CodingRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  relatedCodes?: string[];
}

export interface MedicalNecessityValidation {
  isSupported: boolean;
  score: number;
  justifiedServices: string[];
  unsupportedServices: string[];
  notes: string;
}

export interface DocumentationValidation {
  isComplete: boolean;
  score: number;
  missingElements: string[];
  strengths: string[];
  notes: string;
}

export interface CodingResult {
  icd10: CodeItem[];
  cpt: CodeItem[];
  /** HCPCS Level II supply / injectable / DME codes when applicable */
  hcpcs?: HcpcsCodeItem[];
  confidence: number;
  completeness: number;
  claimReadiness: number;
  /** Overall estimated coding accuracy 0–100 */
  estimatedAccuracy?: number;
  diagnosisConfidence?: number;
  procedureConfidence?: number;
  medicalNecessityValidation?: MedicalNecessityValidation;
  documentationValidation?: DocumentationValidation;
  codingRecommendations?: CodingRecommendation[];
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

export type DifferentialLikelihood = "high" | "moderate" | "low";

export interface DifferentialDiagnosisItem {
  condition: string;
  likelihood: DifferentialLikelihood;
  rationale: string;
  supportingFindings: string[];
  icd10Hint?: string;
}

export interface ClinicalReasoning {
  summary: string;
  pathways: string[];
  evidenceLinks: string[];
  confidence: number;
}

export interface MedicalNecessitySummary {
  summary: string;
  justifiedServices: string[];
  supportingDocumentation: string[];
  gaps: string[];
  score: number;
}

export type MedicationReviewStatus =
  | "continue"
  | "start"
  | "adjust"
  | "discontinue"
  | "monitor";

export interface MedicationReviewItem {
  medication: string;
  status: MedicationReviewStatus;
  notes: string;
  interactions?: string[];
}

export interface ClaimReadinessChecklistItem {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export type ClaimReadinessStatus = "ready" | "needs_review" | "high_risk";

export interface ClaimReadinessResult {
  score: number;
  status: ClaimReadinessStatus;
  checklist: ClaimReadinessChecklistItem[];
  missingElements: string[];
  recommendations: string[];
  estimatedDenialRisk: number;
  summary: string;
}

export interface DenialRiskFactor {
  id: string;
  reason: string;
  contribution: number;
  severity: "low" | "moderate" | "high";
  mitigation: string;
}

export interface DenialRiskPrediction {
  overallRisk: number;
  riskLevel: "low" | "moderate" | "high";
  topDenialReasons: DenialRiskFactor[];
  mitigationActions: string[];
  confidence: number;
  summary: string;
}

export interface PriorAuthServiceItem {
  code: string;
  description: string;
  likelyRequired: boolean;
  payerCriteria: string;
}

export type PriorAuthStatus =
  | "not_required"
  | "likely_required"
  | "submitted"
  | "approved"
  | "denied";

export interface PriorAuthAssessment {
  required: boolean;
  status: PriorAuthStatus;
  services: PriorAuthServiceItem[];
  documentationChecklist: string[];
  payerHints: string[];
  estimatedTurnaroundDays: number;
  summary: string;
  /** Phase B workspace — additive fields */
  coverageSummary?: string;
  medicalNecessitySummary?: string;
  requiredDocuments?: string[];
  missingDocuments?: string[];
  estimatedApprovalProbability?: number;
}

export interface CareGap {
  id: string;
  category: string;
  severity: CdsSeverity;
  title: string;
  detail: string;
  recommendedAction: string;
  measureId?: string;
  dueBy?: string;
}

export interface CareGapResult {
  gaps: CareGap[];
  closureRate: number;
  priorityCount: number;
  summary: string;
}

export interface RevenueKpiSummary {
  netCollectionsRate: number;
  daysInAR: number;
  denialRate: number;
  firstPassYield: number;
  revenueProtectedMtd: number;
  revenueLeakageMtd: number;
}

export interface RevenuePrediction {
  estimatedCharge: number;
  expectedReimbursement: number;
  revenueAtRisk: number;
  revenueProtected: number;
  leakageRisk: number;
  kpiSummary: RevenueKpiSummary;
  summary: string;
}

export interface ProviderProductivity {
  documentationMinutesSaved: number;
  encountersPerHourEquivalent: number;
  /** 0–100 productivity index vs clinic benchmark */
  productivityIndex: number;
  benchmarkComparison: string;
}

export interface ExecutiveSummary {
  headline: string;
  clinicalHighlights: string[];
  codingHighlights: string[];
  revenueHighlights: string[];
  actionItems: string[];
  narrative: string;
}

export interface AiGenerationResult {
  documentation: ClinicalDocumentation;
  coding: CodingResult;
  cds: CdsResult;
  aiConfidence: number;
  documentationQuality: number;
  claimReadinessDetail?: ClaimReadinessResult;
  denialRisk?: DenialRiskPrediction;
  revenuePrediction?: RevenuePrediction;
  careGaps?: CareGapResult;
  priorAuth?: PriorAuthAssessment;
  productivity?: ProviderProductivity;
  documentationTimeSavedMinutes?: number;
  executiveSummary?: ExecutiveSummary;
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
  claimReadinessDetail?: ClaimReadinessResult;
  denialRisk?: DenialRiskPrediction;
  revenuePrediction?: RevenuePrediction;
  careGaps?: CareGapResult;
  priorAuth?: PriorAuthAssessment;
  productivity?: ProviderProductivity;
  executiveSummary?: ExecutiveSummary;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface DashboardMetrics {
  patientsToday: number;
  /** SOAP / AI clinical notes generated — displayed as "SOAP Notes" */
  aiNotesGenerated: number;
  timeSavedMinutes: number;
  codingAccuracy: number;
  claimReadiness: number;
  documentationQuality: number;
  aiConfidence: number;
  revenueLeakagePrevented: number;
  /** Revenue protected through AI coding / claim readiness (MTD) */
  revenueProtected?: number;
  /** Estimated remaining revenue leakage exposure (MTD) */
  revenueLeakage?: number;
  /** Average denial risk score 0–100 (higher = more risk) */
  denialRisk?: number;
  /** Care gap closure rate 0–100 */
  careGapClosure?: number;
  /** Clinical productivity index 0–100 */
  clinicalProductivity?: number;
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
