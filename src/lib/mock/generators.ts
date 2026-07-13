import type {
  AiGenerationResult,
  CdsAlert,
  CodingResult,
  ClinicalDocumentation,
  EncounterInput,
} from "@/lib/types";
import { uid } from "@/lib/utils";

type Scenario = "diabetes" | "chest" | "uri" | "generic";

function detectScenario(input: EncounterInput): Scenario {
  const text = `${input.chiefComplaint} ${input.historyOfPresentIllness} ${input.labs} ${input.assessmentNotes}`.toLowerCase();
  if (
    text.includes("polyuria") ||
    text.includes("polydipsia") ||
    text.includes("hba1c") ||
    text.includes("diabetes") ||
    text.includes("glucose")
  ) {
    return "diabetes";
  }
  if (text.includes("chest") || text.includes("acs") || text.includes("troponin")) {
    return "chest";
  }
  if (
    text.includes("sore throat") ||
    text.includes("cough") ||
    text.includes("uri") ||
    text.includes("fever") ||
    text.includes("cold")
  ) {
    return "uri";
  }
  return "generic";
}

function diabetesDocs(input: EncounterInput): ClinicalDocumentation {
  return {
    soap: {
      subjective: `${input.patientName} is a ${input.age}-year-old ${input.gender} presenting with ${input.chiefComplaint}. HPI: ${input.historyOfPresentIllness} PMH: ${input.pastMedicalHistory}. Medications: ${input.medications}. Allergies: ${input.allergies}.`,
      objective: `Vitals: ${input.vitals}. Exam: ${input.examFindings}. Labs: ${input.labs}.`,
      assessment:
        "1. New or poorly controlled type 2 diabetes mellitus with hyperglycemia. 2. Comorbid hypertension and cardiometabolic risk factors as documented.",
      plan: "Initiate or optimize antihyperglycemic therapy, reinforce lifestyle measures, arrange diabetes education, and schedule close follow-up with labs.",
    },
    clinicalSummary: `${input.patientName} presents with osmotic symptoms and laboratory evidence consistent with type 2 diabetes. Documentation supports timely pharmacologic therapy, education, and comorbidity management.`,
    assessment:
      input.assessmentNotes ||
      "Type 2 diabetes mellitus without complications; concurrent hypertension requiring optimization.",
    treatmentPlan:
      "Metformin initiation/titration as renal function allows; continue current antihypertensives; nutrition and exercise counseling; home glucose monitoring education.",
    followUpPlan:
      "Clinic follow-up in 1–2 weeks. Recheck BMP, lipids, and urine microalbumin. Ophthalmology screening within guideline window.",
  };
}

function chestDocs(input: EncounterInput): ClinicalDocumentation {
  return {
    soap: {
      subjective: `${input.patientName}, ${input.age}${input.gender[0].toUpperCase()}, with ${input.chiefComplaint}. ${input.historyOfPresentIllness}`,
      objective: `Vitals ${input.vitals}. Exam: ${input.examFindings}. Studies: ${input.labs}.`,
      assessment: "Chest pain with features concerning for acute coronary syndrome until proven otherwise.",
      plan: "ACS pathway: ECG, serial troponins, antiplatelet therapy as indicated, cardiology involvement.",
    },
    clinicalSummary:
      "Acute chest pain evaluated under ACS protocol with urgent diagnostics and risk stratification.",
    assessment: input.assessmentNotes || "Chest pain — rule out ACS.",
    treatmentPlan: "Aspirin if not contraindicated, monitoring, cardiology consultation, disposition based on biomarkers.",
    followUpPlan: "If ruled out, outpatient cardiology and risk-factor modification within 1 week.",
  };
}

function uriDocs(input: EncounterInput): ClinicalDocumentation {
  return {
    soap: {
      subjective: `${input.patientName} reports ${input.chiefComplaint}. ${input.historyOfPresentIllness}`,
      objective: `Vitals: ${input.vitals}. HEENT/Pulm: ${input.examFindings}. Labs: ${input.labs}.`,
      assessment: "Likely viral upper respiratory infection; bacterial pharyngitis less likely.",
      plan: "Supportive care, return precautions, avoid unnecessary antibiotics unless culture-confirmed.",
    },
    clinicalSummary: "Outpatient URI presentation with low concern for bacterial complication at this time.",
    assessment: input.assessmentNotes || "Acute viral upper respiratory infection.",
    treatmentPlan: "Hydration, analgesics/antipyretics, rest; consider antivirals only if indicated by testing.",
    followUpPlan: "Return if dyspnea, high fever >72h, or symptoms worsen.",
  };
}

function genericDocs(input: EncounterInput): ClinicalDocumentation {
  return {
    soap: {
      subjective: `${input.patientName} (${input.age}y ${input.gender}) presents for ${input.chiefComplaint}. HPI: ${input.historyOfPresentIllness}. PMH: ${input.pastMedicalHistory}. Meds: ${input.medications}. Allergies: ${input.allergies}.`,
      objective: `Vitals: ${input.vitals}. Exam: ${input.examFindings}. Diagnostics: ${input.labs}.`,
      assessment: input.assessmentNotes || `Clinical assessment for ${input.chiefComplaint}.`,
      plan: "Evidence-based workup and management tailored to presenting complaint; shared decision-making documented.",
    },
    clinicalSummary: `Encounter addresses ${input.chiefComplaint.toLowerCase()} with structured documentation suitable for continuity and coding.`,
    assessment: input.assessmentNotes || `Working assessment related to ${input.chiefComplaint}.`,
    treatmentPlan: "Initiate indicated therapy, address comorbidities, and document patient education.",
    followUpPlan: "Follow up as clinically appropriate; earlier return for red-flag symptoms.",
  };
}

function codingFor(scenario: Scenario): CodingResult {
  if (scenario === "diabetes") {
    return {
      icd10: [
        { code: "E11.9", description: "Type 2 diabetes mellitus without complications", confidence: 95 + (Math.random() * 3) },
        { code: "I10", description: "Essential (primary) hypertension", confidence: 90 + Math.random() * 5 },
        { code: "E66.9", description: "Obesity, unspecified", confidence: 78 + Math.random() * 8 },
      ],
      cpt: [
        { code: "99214", description: "Office/outpatient visit, established patient, moderate", confidence: 88 + Math.random() * 6 },
        { code: "83036", description: "Hemoglobin; glycosylated (A1C)", confidence: 96 + Math.random() * 3 },
      ],
      confidence: 92,
      completeness: 90,
      claimReadiness: 87,
    };
  }
  if (scenario === "chest") {
    return {
      icd10: [
        { code: "R07.9", description: "Chest pain, unspecified", confidence: 86 },
        { code: "I10", description: "Essential hypertension", confidence: 88 },
      ],
      cpt: [
        { code: "99285", description: "Emergency department visit, high MDM", confidence: 84 },
        { code: "93010", description: "Electrocardiogram, interpretation", confidence: 95 },
      ],
      confidence: 87,
      completeness: 85,
      claimReadiness: 82,
    };
  }
  if (scenario === "uri") {
    return {
      icd10: [
        { code: "J06.9", description: "Acute upper respiratory infection, unspecified", confidence: 91 },
        { code: "R50.9", description: "Fever, unspecified", confidence: 80 },
      ],
      cpt: [{ code: "99213", description: "Office/outpatient visit, low-moderate MDM", confidence: 89 }],
      confidence: 88,
      completeness: 86,
      claimReadiness: 84,
    };
  }
  return {
    icd10: [
      { code: "Z00.00", description: "Encounter for general adult medical examination", confidence: 70 },
      { code: "R69", description: "Illness, unspecified", confidence: 65 },
    ],
    cpt: [{ code: "99213", description: "Office/outpatient visit", confidence: 82 }],
    confidence: 80,
    completeness: 78,
    claimReadiness: 75,
  };
}

function cdsFor(scenario: Scenario, input: EncounterInput): { alerts: CdsAlert[]; reasoning: string; confidence: number } {
  const alerts: CdsAlert[] = [];
  if (scenario === "diabetes") {
    alerts.push(
      {
        id: uid("cds"),
        category: "missing_labs",
        severity: "warning",
        title: "Confirm renal function before metformin titration",
        detail: "Ensure recent creatinine/eGFR is available.",
      },
      {
        id: uid("cds"),
        category: "screening",
        severity: "info",
        title: "Dilated eye exam",
        detail: "Recommend ophthalmology screening within 12 months of diabetes diagnosis.",
      },
      {
        id: uid("cds"),
        category: "risk",
        severity: "warning",
        title: "ASCVD risk management",
        detail: "Consider statin and ACE/ARB given diabetes with hypertension.",
      },
      {
        id: uid("cds"),
        category: "follow_up",
        severity: "info",
        title: "Glycemic follow-up",
        detail: "Reassess symptoms and home glucose logs in 1–2 weeks.",
      }
    );
  } else if (scenario === "chest") {
    alerts.push(
      {
        id: uid("cds"),
        category: "risk",
        severity: "critical",
        title: "ACS pathway activation",
        detail: "Do not delay ECG and serial troponins.",
      },
      {
        id: uid("cds"),
        category: "investigation",
        severity: "warning",
        title: "Serial biomarkers",
        detail: "Repeat troponin per institutional protocol.",
      }
    );
  } else if (scenario === "uri") {
    alerts.push(
      {
        id: uid("cds"),
        category: "missing_documentation",
        severity: "info",
        title: "Antibiotic stewardship",
        detail: "Document decision rationale if antibiotics are considered.",
      },
      {
        id: uid("cds"),
        category: "follow_up",
        severity: "info",
        title: "Return precautions",
        detail: "Counsel on dyspnea, persistent fever, or dehydration.",
      }
    );
  } else {
    alerts.push(
      {
        id: uid("cds"),
        category: "missing_documentation",
        severity: "info",
        title: "Complete HPI elements",
        detail: "Ensure onset, severity, and associated symptoms are fully captured.",
      },
      {
        id: uid("cds"),
        category: "follow_up",
        severity: "info",
        title: "Follow-up timing",
        detail: "Specify follow-up interval and contingency plan.",
      }
    );
  }

  if (input.medications.toLowerCase().includes("warfarin") || input.medications.toLowerCase().includes("apixaban")) {
    alerts.push({
      id: uid("cds"),
      category: "interaction",
      severity: "warning",
      title: "Anticoagulation present",
      detail: "Review bleeding risk and drug–drug interactions before new prescriptions.",
    });
  }

  return {
    alerts,
    reasoning: `Operyx Clinical AI mapped chief complaint keywords to the ${scenario} pathway and generated CDS aligned with common ambulatory/ED guidelines. Human review required before finalizing orders.`,
    confidence: scenario === "diabetes" ? 91 : scenario === "chest" ? 90 : 84,
  };
}

/** Deterministic-ish clinical AI generator — FastAPI: POST /api/v1/encounters/generate */
export function generateClinicalAi(input: EncounterInput): AiGenerationResult {
  const scenario = detectScenario(input);
  const documentation =
    scenario === "diabetes"
      ? diabetesDocs(input)
      : scenario === "chest"
        ? chestDocs(input)
        : scenario === "uri"
          ? uriDocs(input)
          : genericDocs(input);
  const coding = codingFor(scenario);
  const cds = cdsFor(scenario, input);
  const aiConfidence = Math.round(
    (coding.confidence + cds.confidence + (scenario === "diabetes" ? 94 : 86)) / 3
  );
  const documentationQuality = Math.min(
    98,
    Math.round(82 + coding.completeness * 0.12 + (input.labs ? 4 : 0) + (input.examFindings ? 3 : 0))
  );

  return {
    documentation,
    coding: {
      ...coding,
      icd10: coding.icd10.map((c) => ({ ...c, confidence: Math.round(c.confidence) })),
      cpt: coding.cpt.map((c) => ({ ...c, confidence: Math.round(c.confidence) })),
      confidence: Math.round(coding.confidence),
      completeness: Math.round(coding.completeness),
      claimReadiness: Math.round(coding.claimReadiness),
    },
    cds,
    aiConfidence,
    documentationQuality,
  };
}
