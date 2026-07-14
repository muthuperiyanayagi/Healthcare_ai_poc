import type {
  AiGenerationResult,
  CareGap,
  CareGapResult,
  CdsAlert,
  ClaimReadinessResult,
  ClinicalDocumentation,
  ClinicalReasoning,
  CodingRecommendation,
  CodingResult,
  DenialRiskPrediction,
  DifferentialDiagnosisItem,
  EncounterInput,
  ExecutiveSummary,
  MedicalNecessitySummary,
  MedicationReviewItem,
  PriorAuthAssessment,
  ProviderProductivity,
  RevenuePrediction,
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

function diabetesDifferentials(): DifferentialDiagnosisItem[] {
  return [
    {
      condition: "Type 2 diabetes mellitus with hyperglycemia",
      likelihood: "high",
      rationale:
        "Classic osmotic triad (polyuria, polydipsia, fatigue), unintentional weight loss, HbA1c 8.4%, and fasting glucose 186 mg/dL meet diagnostic thresholds.",
      supportingFindings: ["HbA1c 8.4%", "Fasting glucose 186 mg/dL", "Polyuria/polydipsia × 3 weeks"],
      icd10Hint: "E11.9",
    },
    {
      condition: "Uncontrolled essential hypertension",
      likelihood: "high",
      rationale:
        "Office BP 148/92 with known hypertension on amlodipine monotherapy supports concurrent cardiometabolic disease requiring intensification.",
      supportingFindings: ["BP 148/92", "History of hypertension since 2018", "BMI 31.2"],
      icd10Hint: "I10",
    },
    {
      condition: "Type 1 diabetes mellitus (new onset)",
      likelihood: "low",
      rationale:
        "Adult onset and gradual symptom course favor T2DM; lack of ketoacidosis and preserved oral intake argue against new T1DM, though autoimmune markers are not indicated today.",
      supportingFindings: ["Age 57", "Obesity (BMI 31.2)", "No reported ketosis symptoms"],
      icd10Hint: "E10.9",
    },
    {
      condition: "Diabetes insipidus",
      likelihood: "low",
      rationale:
        "Polyuria with marked hyperglycemia and elevated HbA1c is far more consistent with osmotic diuresis from diabetes mellitus than central/nephrogenic DI.",
      supportingFindings: ["Elevated glucose", "Elevated HbA1c", "Weight loss"],
    },
  ];
}

function diabetesReasoning(): ClinicalReasoning {
  return {
    summary:
      "Presentation maps to new or previously unrecognized type 2 diabetes with symptomatic hyperglycemia. Concurrent uncontrolled hypertension and obesity elevate ASCVD risk and support early multifactorial therapy.",
    pathways: [
      "ADA diagnostic pathway: HbA1c ≥6.5% with clinical correlation",
      "Cardiometabolic risk bundling: BP, lipids, statin consideration, ACE/ARB",
      "Metformin first-line if eGFR adequate after renal labs return",
    ],
    evidenceLinks: [
      "ADA Standards of Care in Diabetes — Diagnosis and Pharmacologic Therapy",
      "ACC/AHA BP guideline — Diabetes and hypertension co-management",
      "USPSTF / ADA — Dilated eye exam within 1 year of diagnosis",
    ],
    confidence: 92,
  };
}

function diabetesMedNecessity(): MedicalNecessitySummary {
  return {
    summary:
      "Office visit (99214-level MDM), HbA1c assay, and diabetes education are medically necessary given new hyperglycemia with symptomatic burden and comorbidity risk.",
    justifiedServices: [
      "Outpatient E/M with moderate MDM for new diabetes + HTN",
      "HbA1c (83036) for diagnosis/severity stratification",
      "Diabetes self-management education referral",
      "Metformin initiation counseling and monitoring plan",
    ],
    supportingDocumentation: [
      "Osmotic symptoms documented in HPI",
      "HbA1c 8.4% and fasting glucose 186 mg/dL",
      "Exam findings and vitals captured",
      "Shared assessment and follow-up interval specified",
    ],
    gaps: ["Pending BMP/eGFR before metformin titration", "Lipid panel and urine ACR not yet resulted"],
    score: 88,
  };
}

function diabetesMedicationReview(input: EncounterInput): MedicationReviewItem[] {
  return [
    {
      medication: input.medications || "Amlodipine 5 mg daily",
      status: "continue",
      notes: "Continue calcium-channel blocker; BP remains above goal — consider ACE/ARB at follow-up.",
    },
    {
      medication: "Metformin 500 mg PO BID with meals",
      status: "start",
      notes: "First-line antihyperglycemic if eGFR ≥45. Counsel on GI side effects and lactic acidosis precautions.",
      interactions: ["Hold for iodinated contrast per protocol once eGFR known"],
    },
    {
      medication: "High-intensity or moderate-intensity statin (e.g., atorvastatin)",
      status: "monitor",
      notes: "ASCVD risk elevated with diabetes + hypertension; initiate after lipids return unless contraindicated.",
    },
  ];
}

function diabetesDocs(input: EncounterInput): ClinicalDocumentation {
  const differentials = diabetesDifferentials();
  const reasoning = diabetesReasoning();
  const medNec = diabetesMedNecessity();
  return {
    soap: {
      subjective: `${input.patientName} is a ${input.age}-year-old ${input.gender} presenting with ${input.chiefComplaint}. HPI: ${input.historyOfPresentIllness} PMH: ${input.pastMedicalHistory}. Medications: ${input.medications}. Allergies: ${input.allergies}.`,
      objective: `Vitals: ${input.vitals}. Exam: ${input.examFindings}. Labs: ${input.labs}.`,
      assessment:
        "1. New-onset type 2 diabetes mellitus with hyperglycemia (HbA1c 8.4%, fasting glucose 186 mg/dL). 2. Uncontrolled essential hypertension. 3. Obesity (BMI 31.2) with elevated cardiometabolic risk.",
      plan: "Initiate metformin pending/alongside renal function review, reinforce lifestyle measures, arrange diabetes education, home glucose monitoring, and schedule close follow-up with labs and ophthalmology screening.",
    },
    clinicalSummary: `${input.patientName} presents with osmotic symptoms and laboratory evidence consistent with type 2 diabetes. Documentation supports timely pharmacologic therapy, education, comorbidity management, and structured follow-up.`,
    assessment:
      input.assessmentNotes ||
      "Type 2 diabetes mellitus without complications; concurrent hypertension requiring optimization.",
    treatmentPlan:
      "Metformin initiation/titration as renal function allows; continue current antihypertensives with planned ACE/ARB consideration; nutrition and exercise counseling; home glucose monitoring education; statin decision pending lipids.",
    followUpPlan:
      "Clinic follow-up in 1–2 weeks. Recheck BMP, lipids, and urine microalbumin. Ophthalmology screening within guideline window. Escalate therapy if fasting glucoses remain >150 or symptoms persist.",
    clinicalContextSummary: `${input.patientName} (${input.age}y ${input.gender}) has a 3-week progressive osmotic symptom complex with unintentional weight loss and known hypertension on amlodipine. Objective data show BMI 31.2, BP above goal, and diagnostic hyperglycemia (HbA1c 8.4%, fasting glucose 186). Clinical priority is safe antihyperglycemic initiation, BP optimization, ASCVD risk reduction, and guideline-directed screening.`,
    differentialDiagnosis: differentials,
    clinicalReasoning: reasoning,
    medicalNecessitySummary: medNec,
    medicationReview: diabetesMedicationReview(input),
    patientInstructions:
      "Start the prescribed diabetes medication with food as directed. Check fingerstick glucose as taught and bring a log to follow-up. Limit sugary drinks, aim for daily walking, and seek urgent care for severe weakness, vomiting, confusion, chest pain, or blood glucose persistently above 300 mg/dL. Keep your blood pressure appointment medication plan and do not stop amlodipine unless advised.",
    providerNotes:
      "Discussed new diabetes diagnosis, lifestyle intervention, metformin plan contingent on renal labs, and cardiovascular risk. Patient verbalized understanding and agreed to diabetes education referral. Time spent in counseling documented for moderate MDM support.",
    codingExplanation:
      "Primary diagnosis E11.9 is supported by diagnostic HbA1c and symptomatic hyperglycemia. I10 reflects documented elevated BP with known hypertension. E66.9 is supported by BMI 31.2. CPT 99214 is justified by moderate medical decision-making across a new chronic illness plus comorbidity management; 83036 reflects performed/reviewed HbA1c. HCPCS G0108 supports diabetes education referral when billed by qualified educators/programs.",
    documentationCompletenessScore: 91,
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
    clinicalContextSummary: `${input.patientName} presents with acute chest symptoms requiring time-sensitive ischemic evaluation. History, vitals, ECG, and biomarker strategy drive risk stratification and disposition.`,
    differentialDiagnosis: [
      {
        condition: "Acute coronary syndrome",
        likelihood: "high",
        rationale: "Exertional/pressure-like pain with autonomic features warrants ACS pathway.",
        supportingFindings: ["Chest pressure", "Autonomic symptoms", "Risk factors as documented"],
        icd10Hint: "R07.9",
      },
      {
        condition: "Aortic dissection",
        likelihood: "low",
        rationale: "Consider if tearing pain, pulse deficits, or mediastinal widening — currently less likely.",
        supportingFindings: ["No tearing quality documented"],
      },
      {
        condition: "Pulmonary embolism",
        likelihood: "moderate",
        rationale: "Dyspnea or risk factors would raise suspicion; keep on differential until ACS workup clarifies.",
        supportingFindings: ["Chest symptoms with tachycardia if present"],
      },
    ],
    clinicalReasoning: {
      summary: "Time-critical chest pain pathway prioritizes ECG and serial troponins over premature disposition.",
      pathways: ["ED ACS protocol", "HEART/TIMI-style risk framing", "Cardiology escalation triggers"],
      evidenceLinks: ["AHA/ACC Chest Pain Guideline", "Institutional ACS order set"],
      confidence: 90,
    },
    medicalNecessitySummary: {
      summary: "ED-level evaluation and ECG interpretation are medically necessary for possible ACS.",
      justifiedServices: ["High-complexity ED E/M", "ECG interpretation", "Serial troponin pathway"],
      supportingDocumentation: ["HPI with cardiac features", "Vitals", "ECG documentation"],
      gaps: ["Pending troponin result", "Disposition pending"],
      score: 84,
    },
    medicationReview: [
      {
        medication: input.medications || "Home medications",
        status: "continue",
        notes: "Review antiplatelet/anticoagulant status before new agents.",
      },
      {
        medication: "Aspirin 325 mg (if not contraindicated)",
        status: "start",
        notes: "Give early in ACS pathway unless allergy or active bleeding.",
      },
    ],
    patientInstructions:
      "Remain for monitoring until cleared. Report worsening chest pain, shortness of breath, syncope, or severe dizziness immediately.",
    providerNotes:
      "ACS cannot be excluded. Pathway activated; cardiology notified as indicated. Shared decision-making deferred until biomarker clarity.",
    codingExplanation:
      "Symptom code R07.9 remains primary until a more specific ischemic diagnosis is confirmed. CPT complexity reflects ED MDM and ECG interpretation.",
    documentationCompletenessScore: 85,
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
    clinicalContextSummary: `Ambulatory evaluation for ${input.chiefComplaint.toLowerCase()} with exam and testing supportive of viral URI and low bacterial risk.`,
    differentialDiagnosis: [
      {
        condition: "Viral upper respiratory infection",
        likelihood: "high",
        rationale: "Symptom cluster and negative/pending rapid testing pattern favor viral etiology.",
        supportingFindings: ["Sore throat/cough/fever constellation", "Exam without high-risk bacterial signs"],
        icd10Hint: "J06.9",
      },
      {
        condition: "Streptococcal pharyngitis",
        likelihood: "low",
        rationale: "Rapid strep negative or low Centor features reduce likelihood.",
        supportingFindings: ["Testing as documented"],
      },
    ],
    clinicalReasoning: {
      summary: "Antibiotic stewardship prioritized given viral likelihood and absence of red flags.",
      pathways: ["Centor/McIsaac framing", "Supportive care pathway"],
      evidenceLinks: ["IDSA pharyngitis guidance", "CDC adult outpatient antibiotic stewardship"],
      confidence: 86,
    },
    medicalNecessitySummary: {
      summary: "Office visit and selective testing are medically necessary for acute URI symptoms.",
      justifiedServices: ["Low-moderate MDM E/M", "Rapid antigen testing if performed"],
      supportingDocumentation: ["Symptom onset", "Exam findings", "Return precautions"],
      gaps: [],
      score: 86,
    },
    medicationReview: [
      {
        medication: "Acetaminophen/ibuprofen as needed",
        status: "start",
        notes: "Symptomatic relief; avoid antibiotics unless indicated.",
      },
    ],
    patientInstructions:
      "Hydrate, rest, and use fever reducers as directed. Return for breathing difficulty, persistent high fever, neck stiffness, or inability to tolerate fluids.",
    providerNotes: "Counseled on viral course and antibiotic stewardship; shared decision documented.",
    codingExplanation: "J06.9 captures acute URI; visit level reflects straightforward ambulatory MDM.",
    documentationCompletenessScore: 86,
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
    clinicalContextSummary: `Visit focuses on ${input.chiefComplaint.toLowerCase()} with available history, exam, and diagnostics synthesized for assessment and plan.`,
    differentialDiagnosis: [
      {
        condition: `Working diagnosis related to ${input.chiefComplaint}`,
        likelihood: "moderate",
        rationale: "Based on presenting complaint and documented findings pending further specificity.",
        supportingFindings: [input.chiefComplaint, input.assessmentNotes || "Clinical notes"],
      },
    ],
    clinicalReasoning: {
      summary: "Structured clinical reasoning applied to chief complaint with guideline-aligned follow-up.",
      pathways: ["Problem-focused evaluation", "Shared decision-making"],
      evidenceLinks: ["Encounter-specific specialty guidelines as applicable"],
      confidence: 80,
    },
    medicalNecessitySummary: {
      summary: "Evaluation and management services are supported by documented chief complaint and clinical workup.",
      justifiedServices: ["Outpatient E/M"],
      supportingDocumentation: ["HPI", "Exam", "Assessment/Plan"],
      gaps: ["Additional specificity may improve coding precision"],
      score: 78,
    },
    medicationReview: [
      {
        medication: input.medications || "None listed",
        status: "continue",
        notes: "Reconcile medication list and allergies before new prescriptions.",
      },
    ],
    patientInstructions: "Follow the agreed care plan and return sooner for red-flag symptoms discussed today.",
    providerNotes: "Assessment and plan reviewed with patient; questions addressed.",
    codingExplanation: "Codes selected from documented diagnoses and services; confidence lower when details are limited.",
    documentationCompletenessScore: 78,
  };
}

function codingFor(scenario: Scenario): CodingResult {
  if (scenario === "diabetes") {
    const recommendations: CodingRecommendation[] = [
      {
        id: uid("rec"),
        priority: "high",
        title: "Link medical necessity to HbA1c",
        detail:
          "Ensure the claim narrative/chart note explicitly ties osmotic symptoms and new T2DM assessment to CPT 83036.",
        relatedCodes: ["E11.9", "83036"],
      },
      {
        id: uid("rec"),
        priority: "medium",
        title: "Document BMI for E66.x support",
        detail: "BMI 31.2 is present; keep objective BMI in the note to defend obesity coding.",
        relatedCodes: ["E66.9"],
      },
      {
        id: uid("rec"),
        priority: "medium",
        title: "Capture diabetes education if performed",
        detail: "If DSME/DSMT is furnished, bill HCPCS G0108/G0109 with attendance and content documented.",
        relatedCodes: ["G0108"],
      },
    ];
    return {
      icd10: [
        {
          code: "E11.9",
          description: "Type 2 diabetes mellitus without complications",
          confidence: 96,
          explanation:
            "Diagnostic HbA1c 8.4% plus osmotic symptoms establish T2DM without documented microvascular/macrovascular complications today.",
        },
        {
          code: "I10",
          description: "Essential (primary) hypertension",
          confidence: 94,
          explanation: "Known hypertension with office BP 148/92 supports active I10 coding this encounter.",
        },
        {
          code: "E66.9",
          description: "Obesity, unspecified",
          confidence: 82,
          explanation: "BMI 31.2 meets obesity threshold; consider E66.01/E66.09 if more specific classing is preferred.",
        },
      ],
      cpt: [
        {
          code: "99214",
          description: "Office/outpatient visit, established patient, moderate",
          confidence: 91,
          explanation:
            "Moderate MDM supported by new chronic illness (diabetes), prescription drug management, and comorbidity optimization.",
        },
        {
          code: "83036",
          description: "Hemoglobin; glycosylated (A1C)",
          confidence: 98,
          explanation: "HbA1c resulted/reviewed during this evaluation and is medically necessary for diagnosis.",
        },
      ],
      hcpcs: [
        {
          code: "G0108",
          description: "Diabetes outpatient self-management training, individual, per 30 minutes",
          confidence: 84,
          explanation:
            "Recommended when individual DSMT is scheduled/performed; requires qualified provider and attendance documentation.",
        },
        {
          code: "A4253",
          description: "Blood glucose test or reagent strips for home blood glucose monitor, per 50 strips",
          confidence: 78,
          explanation: "Supports home monitoring plan if supplies are dispensed/ordered under covered criteria.",
        },
      ],
      confidence: 93,
      completeness: 91,
      claimReadiness: 88,
      estimatedAccuracy: 92,
      diagnosisConfidence: 94,
      procedureConfidence: 90,
      medicalNecessityValidation: {
        isSupported: true,
        score: 88,
        justifiedServices: ["99214", "83036", "G0108 (if DSMT delivered)"],
        unsupportedServices: [],
        notes: "Medical necessity is strong for E/M and HbA1c; confirm DSMT delivery before submitting G0108.",
      },
      documentationValidation: {
        isComplete: true,
        score: 91,
        missingElements: ["Final eGFR before metformin dose escalation"],
        strengths: ["Symptom chronology", "Diagnostic labs", "Assessment/plan specificity"],
        notes: "Documentation supports claim submission after renal lab acknowledgment.",
      },
      codingRecommendations: recommendations,
    };
  }
  if (scenario === "chest") {
    return {
      icd10: [
        {
          code: "R07.9",
          description: "Chest pain, unspecified",
          confidence: 86,
          explanation: "Use until a more specific ischemia diagnosis is confirmed by ECG/biomarkers.",
        },
        {
          code: "I10",
          description: "Essential hypertension",
          confidence: 88,
          explanation: "Elevated BP documented during evaluation.",
        },
      ],
      cpt: [
        {
          code: "99285",
          description: "Emergency department visit, high MDM",
          confidence: 84,
          explanation: "High complexity MDM justified by possible ACS workup and disposition risk.",
        },
        {
          code: "93010",
          description: "Electrocardiogram, interpretation",
          confidence: 95,
          explanation: "ECG interpretation is a core ACS pathway service.",
        },
      ],
      hcpcs: [
        {
          code: "J0131",
          description: "Injection, acetylsalicylic acid",
          confidence: 70,
          explanation: "Only if facility billing model requires injectable aspirin coding.",
        },
      ],
      confidence: 87,
      completeness: 85,
      claimReadiness: 82,
      estimatedAccuracy: 85,
      diagnosisConfidence: 84,
      procedureConfidence: 90,
      medicalNecessityValidation: {
        isSupported: true,
        score: 84,
        justifiedServices: ["99285", "93010"],
        unsupportedServices: [],
        notes: "Keep differential and ECG findings explicit for medical necessity defense.",
      },
      documentationValidation: {
        isComplete: false,
        score: 82,
        missingElements: ["Final troponin", "Disposition"],
        strengths: ["Urgent symptom capture", "ECG documentation"],
        notes: "Claim readiness improves once biomarkers and disposition are finalized.",
      },
      codingRecommendations: [
        {
          id: uid("rec"),
          priority: "high",
          title: "Update diagnosis after ACS rule-out/rule-in",
          detail: "Replace or add more specific ICD codes once troponin/ECG confirm or exclude ACS.",
          relatedCodes: ["R07.9"],
        },
      ],
    };
  }
  if (scenario === "uri") {
    return {
      icd10: [
        {
          code: "J06.9",
          description: "Acute upper respiratory infection, unspecified",
          confidence: 91,
          explanation: "Best captures ambulatory viral URI when a more specific pathogen is unavailable.",
        },
        {
          code: "R50.9",
          description: "Fever, unspecified",
          confidence: 80,
          explanation: "Add if fever is a clinically relevant presenting feature not inherent to the primary code narrative preferred by payer.",
        },
      ],
      cpt: [
        {
          code: "99213",
          description: "Office/outpatient visit, low-moderate MDM",
          confidence: 89,
          explanation: "Straightforward acute illness with limited data reviewed and low risk of morbidity.",
        },
      ],
      hcpcs: [],
      confidence: 88,
      completeness: 86,
      claimReadiness: 84,
      estimatedAccuracy: 87,
      diagnosisConfidence: 88,
      procedureConfidence: 89,
      medicalNecessityValidation: {
        isSupported: true,
        score: 86,
        justifiedServices: ["99213"],
        unsupportedServices: [],
        notes: "Avoid billing unnecessary cultures/antibiotics without documented indication.",
      },
      documentationValidation: {
        isComplete: true,
        score: 86,
        missingElements: [],
        strengths: ["Exam", "Stewardship rationale", "Return precautions"],
        notes: "Documentation is adequate for ambulatory claim submission.",
      },
      codingRecommendations: [
        {
          id: uid("rec"),
          priority: "low",
          title: "Document negative strep explicitly",
          detail: "Supports medical necessity of supportive care without antibiotics.",
          relatedCodes: ["J06.9"],
        },
      ],
    };
  }
  return {
    icd10: [
      {
        code: "Z00.00",
        description: "Encounter for general adult medical examination",
        confidence: 70,
        explanation: "Fallback when documentation lacks a clearer problem-focused diagnosis.",
      },
      {
        code: "R69",
        description: "Illness, unspecified",
        confidence: 65,
        explanation: "Temporary symptom/illness placeholder — refine with clinician review.",
      },
    ],
    cpt: [
      {
        code: "99213",
        description: "Office/outpatient visit",
        confidence: 82,
        explanation: "Default ambulatory visit level pending richer MDM elements.",
      },
    ],
    hcpcs: [],
    confidence: 80,
    completeness: 78,
    claimReadiness: 75,
    estimatedAccuracy: 76,
    diagnosisConfidence: 68,
    procedureConfidence: 80,
    medicalNecessityValidation: {
      isSupported: true,
      score: 75,
      justifiedServices: ["99213"],
      unsupportedServices: [],
      notes: "Increase specificity of assessment to strengthen medical necessity.",
    },
    documentationValidation: {
      isComplete: false,
      score: 74,
      missingElements: ["More specific diagnosis", "Clearer plan timeframe"],
      strengths: ["Chief complaint captured"],
      notes: "Clinician review recommended before claim submission.",
    },
    codingRecommendations: [
      {
        id: uid("rec"),
        priority: "high",
        title: "Replace unspecified illness coding",
        detail: "Add problem-specific ICD-10 after clinician confirmation.",
      },
    ],
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

export function buildClaimReadiness(scenario: Scenario, coding: CodingResult): ClaimReadinessResult {
  const score = coding.claimReadiness;
  const status = score >= 88 ? "ready" : score >= 78 ? "needs_review" : "high_risk";
  const checklist =
    scenario === "diabetes"
      ? [
          {
            id: uid("chk"),
            label: "Diagnosis specificity",
            status: "pass" as const,
            detail: "E11.9 and I10 are supported by labs and vitals.",
          },
          {
            id: uid("chk"),
            label: "Procedure linkage",
            status: "pass" as const,
            detail: "83036 linked to hyperglycemia workup.",
          },
          {
            id: uid("chk"),
            label: "Medical necessity narrative",
            status: "warn" as const,
            detail: "Confirm metformin counseling and education referral language before submission.",
          },
          {
            id: uid("chk"),
            label: "Pending labs",
            status: "warn" as const,
            detail: "BMP/eGFR pending — annotate in claim notes if billed today.",
          },
        ]
      : [
          {
            id: uid("chk"),
            label: "Core coding complete",
            status: score >= 80 ? ("pass" as const) : ("fail" as const),
            detail: "ICD/CPT combination reviewed for internal consistency.",
          },
          {
            id: uid("chk"),
            label: "Documentation support",
            status: coding.completeness >= 85 ? ("pass" as const) : ("warn" as const),
            detail: "Chart completeness scored from SOAP and objective data.",
          },
        ];

  return {
    score,
    status,
    checklist,
    missingElements:
      scenario === "diabetes"
        ? ["Final eGFR annotation", "Optional lipid/ACR results"]
        : coding.documentationValidation?.missingElements ?? [],
    recommendations:
      scenario === "diabetes"
        ? [
            "Attach HbA1c result to claim documentation packet",
            "Verify DSMT HCPCS only if education encounter occurred",
            "Include BMI and BP values for comorbidity support",
          ]
        : ["Clinician review of unspecified codes", "Confirm medical necessity narrative"],
    estimatedDenialRisk: Math.max(8, 100 - score),
    summary:
      scenario === "diabetes"
        ? "Claim is near ready: diabetes and hypertension coding are well supported. Resolve renal-lab annotation and DSMT billing confirmation before final submit."
        : `Claim readiness scored ${score}. Address checklist warnings before submission.`,
  };
}

export function buildDenialRisk(scenario: Scenario, claimScore: number): DenialRiskPrediction {
  const overallRisk = Math.max(8, Math.min(55, 100 - claimScore + (scenario === "chest" ? 8 : 0)));
  const riskLevel = overallRisk >= 35 ? "high" : overallRisk >= 20 ? "moderate" : "low";
  if (scenario === "diabetes") {
    return {
      overallRisk,
      riskLevel,
      topDenialReasons: [
        {
          id: uid("den"),
          reason: "Insufficient linkage of labs to diagnosis",
          contribution: 28,
          severity: "moderate",
          mitigation: "Explicitly document HbA1c review in assessment and claim notes.",
        },
        {
          id: uid("den"),
          reason: "DSMT billed without attendance proof",
          contribution: 22,
          severity: "moderate",
          mitigation: "Bill G0108 only with educator documentation and time.",
        },
        {
          id: uid("den"),
          reason: "Medical necessity challenge for moderate E/M",
          contribution: 15,
          severity: "low",
          mitigation: "Highlight new chronic illness + Rx management elements for 99214.",
        },
      ],
      mitigationActions: [
        "Complete claim readiness checklist",
        "Attach diagnostic lab evidence",
        "Avoid premature HCPCS billing",
      ],
      confidence: 89,
      summary: `Estimated denial risk ${overallRisk}% for the diabetes claim package, driven mainly by lab linkage and education coding hygiene.`,
    };
  }
  return {
    overallRisk,
    riskLevel,
    topDenialReasons: [
      {
        id: uid("den"),
        reason: "Diagnosis specificity",
        contribution: 30,
        severity: "moderate",
        mitigation: "Replace unspecified codes after clinical confirmation.",
      },
      {
        id: uid("den"),
        reason: "Incomplete documentation elements",
        contribution: 25,
        severity: riskLevel === "high" ? "high" : "moderate",
        mitigation: "Close documentation validation gaps before submission.",
      },
    ],
    mitigationActions: ["Clinician coding review", "Strengthen medical necessity narrative"],
    confidence: 84,
    summary: `Denial risk estimated at ${overallRisk}% based on coding completeness and documentation validation.`,
  };
}

export function buildRevenuePrediction(scenario: Scenario, coding: CodingResult): RevenuePrediction {
  const base =
    scenario === "diabetes" ? 286 : scenario === "chest" ? 1480 : scenario === "uri" ? 168 : 210;
  const expected = Math.round(base * (0.72 + coding.claimReadiness / 500));
  const atRisk = Math.round(base * ((100 - coding.claimReadiness) / 220));
  const protectedAmt = Math.round(base * 0.18 + coding.confidence);
  return {
    estimatedCharge: base,
    expectedReimbursement: expected,
    revenueAtRisk: atRisk,
    revenueProtected: protectedAmt,
    leakageRisk: Math.round((100 - coding.claimReadiness) * 0.6),
    kpiSummary: {
      netCollectionsRate: 94.2,
      daysInAR: 28,
      denialRate: 4.8,
      firstPassYield: 91.5,
      revenueProtectedMtd: 24800,
      revenueLeakageMtd: 6200,
    },
    summary:
      scenario === "diabetes"
        ? `Expected professional reimbursement ~$${expected} with ~$${atRisk} at risk if claim hygiene slips. AI coding defense currently protects ~$${protectedAmt} versus under-coding.`
        : `Estimated charge $${base}; expected reimbursement $${expected}; $${atRisk} remains sensitive to denial risk.`,
  };
}

export function buildCareGaps(scenario: Scenario, input: EncounterInput): CareGapResult {
  const isJohnSmith = input.patientName.toLowerCase().includes("john smith");
  const gaps: CareGap[] =
    scenario === "diabetes"
      ? [
          {
            id: uid("gap"),
            category: "labs",
            severity: "critical",
            title: "HbA1c follow-up overdue / monitoring plan missing",
            detail: isJohnSmith
              ? "Diagnostic HbA1c is 8.4% with fasting glucose 186 mg/dL, but no 3-month repeat A1c or structured glycemic monitoring order is documented in the plan."
              : `Recent glycemic labs support diabetes (${input.labs || "A1c/glucose not fully reconciled"}), yet a timed repeat HbA1c and monitoring cadence are not confirmed.`,
            recommendedAction:
              "Order follow-up HbA1c in ~90 days and document SMBG/CGM review at the 2-week follow-up.",
            measureId: "HEDIS-CDC-HbA1c",
            dueBy: isJohnSmith ? "2026-10-12" : "90 days",
          },
          {
            id: uid("gap"),
            category: "screening",
            severity: "warning",
            title: "Retinal exam overdue",
            detail: isJohnSmith
              ? "New T2DM with intermittent blurred vision; ADA recommends dilated retinal evaluation near diagnosis, and no ophthalmology referral is on file."
              : "ADA recommends ophthalmology evaluation within 1 year of diabetes diagnosis; no eye exam documented.",
            recommendedAction: "Place ophthalmology / dilated retinal exam referral and track completion.",
            measureId: "HEDIS-CDC-Eye",
            dueBy: isJohnSmith ? "2026-09-15" : "90 days",
          },
          {
            id: uid("gap"),
            category: "screening",
            severity: "warning",
            title: "Foot exam overdue",
            detail: isJohnSmith
              ? "Encounter notes state neuropathy screen was deferred; comprehensive diabetic foot exam (visual, pulses, monofilament) remains incomplete."
              : "Comprehensive diabetic foot exam is due and not documented for this visit pathway.",
            recommendedAction: "Complete foot exam today or schedule podiatry within 30 days; document risk category.",
            measureId: "HEDIS-CDC-Foot",
            dueBy: isJohnSmith ? "2026-08-01" : "30 days",
          },
          {
            id: uid("gap"),
            category: "labs",
            severity: "warning",
            title: "Kidney function screening overdue",
            detail: isJohnSmith
              ? "BMP/eGFR is still pending and urine albumin-creatinine ratio has not been ordered despite new T2DM diagnosis."
              : "Nephropathy screening (eGFR + urine ACR) is indicated at type 2 diabetes diagnosis.",
            recommendedAction: "Order urine ACR with BMP/eGFR (and lipids) at next lab draw.",
            measureId: "HEDIS-CDC-Nephropathy",
            dueBy: isJohnSmith ? "2026-07-28" : "30 days",
          },
          {
            id: uid("gap"),
            category: "immunization",
            severity: "warning",
            title: "Vaccination overdue",
            detail: isJohnSmith
              ? "Pneumococcal, influenza, hepatitis B, and COVID immunization status are not reconciled for a newly diagnosed adult with diabetes."
              : "Vaccination status should be reconciled for patients with diabetes (influenza, pneumococcal, Hep B as indicated).",
            recommendedAction: "Reconcile immunization history and offer indicated vaccines before or at follow-up.",
            measureId: "HEDIS-Imm",
            dueBy: isJohnSmith ? "2026-08-15" : "60 days",
          },
          {
            id: uid("gap"),
            category: "prevention",
            severity: "info",
            title: "Cancer screening overdue",
            detail: isJohnSmith
              ? "Age 57 male — colorectal cancer screening status (FIT/colonoscopy) is not documented alongside the diabetes intake workup."
              : `Age-appropriate cancer screening should be reconciled during chronic disease visits (patient age ${input.age}).`,
            recommendedAction: "Document CRC screening status and order FIT or colonoscopy referral if due.",
            measureId: "HEDIS-COL",
            dueBy: isJohnSmith ? "2026-11-30" : "6 months",
          },
          {
            id: uid("gap"),
            category: "adherence",
            severity: "warning",
            title: "Medication adherence at risk",
            detail: isJohnSmith
              ? "Metformin is being initiated and amlodipine continues with BP 148/92; no adherence counseling, pill burden review, or refill monitoring plan is documented."
              : "New or intensified therapy needs an adherence support plan and follow-up check.",
            recommendedAction:
              "Counsel on metformin tolerability, set adherence check at 2-week visit, and consider ACE-I for BP/renal protection.",
            measureId: "PDC-Diabetes",
            dueBy: isJohnSmith ? "2026-07-28" : "14 days",
          },
          {
            id: uid("gap"),
            category: "counseling",
            severity: "info",
            title: "Lifestyle counselling due",
            detail: isJohnSmith
              ? "BMI 31.2 with new T2DM — medical nutrition therapy, activity prescription, and diabetes self-management training referral are incomplete in the closure checklist."
              : "Lifestyle and diabetes education counseling should be documented for cardiometabolic risk reduction.",
            recommendedAction:
              "Complete lifestyle counseling and place DSME / dietitian referral; provide written patient instructions.",
            measureId: "HEDIS-CDC-Education",
            dueBy: isJohnSmith ? "2026-08-05" : "30 days",
          },
        ]
      : scenario === "chest"
        ? [
            {
              id: uid("gap"),
              category: "follow_up",
              severity: "critical",
              title: "Cardiology follow-up if ACS ruled out",
              detail: "Outpatient cardiac risk stratification should be scheduled promptly.",
              recommendedAction: "Book cardiology within 7 days if discharged.",
              dueBy: "7 days",
            },
          ]
        : [
            {
              id: uid("gap"),
              category: "prevention",
              severity: "info",
              title: "Age-appropriate screening review",
              detail: `Opportunity to reconcile prevention gaps during visit for ${input.chiefComplaint.toLowerCase()}.`,
              recommendedAction: "Review due screenings at next wellness touchpoint.",
              dueBy: "90 days",
            },
          ];

  const priorityCount = gaps.filter((g) => g.severity !== "info").length;
  return {
    gaps,
    closureRate: scenario === "diabetes" ? (isJohnSmith ? 48 : 58) : 74,
    priorityCount,
    summary:
      scenario === "diabetes"
        ? isJohnSmith
          ? "Eight open care gaps for John Smith's new T2DM pathway: HbA1c monitoring, retinal and foot exams, kidney labs, vaccinations, colorectal screening, medication adherence, and lifestyle counselling. Closing these aligns with ADA / HEDIS quality measures."
          : "Multiple diabetes care gaps detected across glycemic monitoring, microvascular screening, immunizations, adherence, and lifestyle counselling."
        : `${gaps.length} care gap(s) identified for this encounter pathway.`,
  };
}

function detectPriorAuthProcedure(input?: EncounterInput): string | null {
  if (!input) return null;
  const text =
    `${input.chiefComplaint} ${input.historyOfPresentIllness} ${input.assessmentNotes} ${input.examFindings}`.toLowerCase();
  if (/mri|magnetic resonance/.test(text)) return "mri";
  if (/ct scan|computed tomography|ct abdomen|ct chest/.test(text)) return "ct";
  if (/physical therapy|pt eval|rehab/.test(text)) return "pt";
  if (/sleep study|polysomnography|cpap/.test(text)) return "sleep";
  if (/cgm|continuous glucose|freestyle libre|dexcom/.test(text)) return "cgm";
  if (/referral|specialty consult|orthop|cardiology|neurology/.test(text)) return "specialty";
  return null;
}

export function buildPriorAuth(scenario: Scenario, input?: EncounterInput): PriorAuthAssessment {
  const procedure = detectPriorAuthProcedure(input);

  if (procedure === "mri") {
    return {
      required: true,
      status: "likely_required",
      services: [
        {
          code: "72148",
          description: "MRI lumbar spine without contrast",
          likelyRequired: true,
          payerCriteria:
            "PA required after failed conservative therapy ≥6 weeks unless red-flag neurologic findings documented.",
        },
      ],
      documentationChecklist: [
        "Signed order with ICD-10 diagnosis supporting MRI",
        "Conservative therapy trial timeline (PT, NSAIDs, activity modification)",
        "Neurologic exam findings (strength, reflexes, straight-leg raise)",
        "Prior imaging reports if available (X-ray / prior MRI)",
        "Referral letter stating clinical question for imaging",
      ],
      requiredDocuments: [
        "CMS-1500 / electronic PA request",
        "Clinical notes from referring provider (last 90 days)",
        "Failed conservative therapy attestation",
        "Relevant ICD-10 and CPT/HCPCS codes",
      ],
      missingDocuments: [
        "Physical therapy attendance log (≥4 visits)",
        "Prior lumbar X-ray report",
      ],
      payerHints: [
        "Commercial plans commonly route MRI through radiology benefit manager (e.g., eviCore/Carelon)",
        "Urgent PA pathway available for progressive motor deficit or cauda equina suspicion",
      ],
      coverageSummary:
        "MRI lumbar spine is a covered benefit when medical-necessity criteria are met, but prospective prior authorization is required. Denial risk rises when conservative care duration or neurologic findings are incomplete.",
      medicalNecessitySummary:
        "Imaging is medically necessary to evaluate radicular symptoms unresponsive to outpatient conservative care and to guide interventional or surgical decisions. Supporting progressive pain, positive exam findings, and failed PT strengthens approval odds.",
      estimatedApprovalProbability: 74,
      estimatedTurnaroundDays: 3,
      summary:
        "Prior authorization is likely required for MRI lumbar spine. Conservative-care documentation and neurologic exam details are the primary gates to approval.",
    };
  }

  if (procedure === "ct") {
    return {
      required: true,
      status: "likely_required",
      services: [
        {
          code: "71250",
          description: "CT chest without contrast",
          likelyRequired: true,
          payerCriteria: "PA often required for elective outpatient CT; emergent studies may be exempt.",
        },
      ],
      documentationChecklist: [
        "Clinical indication tied to ICD-10",
        "Why CT vs alternative modality",
        "Recent related imaging / labs",
        "Urgency designation (routine vs urgent)",
      ],
      requiredDocuments: [
        "Signed imaging order",
        "Referring clinician note",
        "Payer imaging criteria checklist",
      ],
      missingDocuments: ["Contrast allergy / GFR documentation if contrast planned"],
      payerHints: ["Verify radiology benefit manager portal submission SLA"],
      coverageSummary:
        "Outpatient CT is covered under diagnostic imaging benefits with prior authorization for non-emergent requests.",
      medicalNecessitySummary:
        "CT is justified when clinical findings require cross-sectional imaging that cannot be answered by X-ray or ultrasound alone.",
      estimatedApprovalProbability: 71,
      estimatedTurnaroundDays: 2,
      summary: "Prior authorization likely required for elective CT; ensure indication and alternative-modality rationale are documented.",
    };
  }

  if (procedure === "cgm" || (scenario === "diabetes" && procedure === "cgm")) {
    return {
      required: true,
      status: "likely_required",
      services: [
        {
          code: "A4239",
          description: "CGM supply allowance",
          likelyRequired: true,
          payerCriteria: "Insulin use and hypoglycemia documentation commonly required.",
        },
      ],
      documentationChecklist: [
        "Insulin regimen and dosing frequency",
        "Hypoglycemia history or impaired awareness",
        "HbA1c and SMBG logs",
        "Prescriber attestation for therapeutic CGM",
      ],
      requiredDocuments: ["CGM prescription", "Diabetes visit note", "Insulin invoice/rx history"],
      missingDocuments: ["30-day glucose log if not uploaded"],
      payerHints: ["DME PA channels differ from medical benefit — confirm plan benefit category"],
      coverageSummary:
        "Therapeutic CGM is a covered DME/medical benefit for qualifying insulin-treated members after prior authorization.",
      medicalNecessitySummary:
        "CGM is medically necessary to reduce hypoglycemia risk and improve glycemic monitoring when multiple daily insulin injections are in use.",
      estimatedApprovalProbability: 68,
      estimatedTurnaroundDays: 5,
      summary: "Prior authorization required for CGM supplies; insulin use and hypoglycemia documentation drive approval.",
    };
  }

  if (procedure === "pt") {
    return {
      required: true,
      status: "likely_required",
      services: [
        {
          code: "97110",
          description: "Therapeutic exercises",
          likelyRequired: true,
          payerCriteria: "Many plans authorize an initial visit count; extensions need progress notes.",
        },
      ],
      documentationChecklist: [
        "PT evaluation with functional deficits",
        "Plan of care with goals and frequency",
        "Referring diagnosis and date of onset",
      ],
      requiredDocuments: ["PT plan of care", "Referring physician order", "Baseline functional scores"],
      missingDocuments: ["Home exercise compliance note"],
      payerHints: ["Initial authorization often covers 6–12 visits; track utilization"],
      coverageSummary:
        "Outpatient physical therapy is covered with an authorized visit allotment; extensions require demonstrated functional progress.",
      medicalNecessitySummary:
        "Skilled PT is medically necessary to restore function, reduce pain, and avoid higher-cost interventions when deficits are documented.",
      estimatedApprovalProbability: 82,
      estimatedTurnaroundDays: 2,
      summary: "Prior authorization / visit authorization expected for outpatient PT episode of care.",
    };
  }

  if (procedure === "sleep") {
    return {
      required: true,
      status: "likely_required",
      services: [
        {
          code: "95810",
          description: "Polysomnography",
          likelyRequired: true,
          payerCriteria: "STOP-Bang / ESS scores and BMI commonly required; home sleep test first on some plans.",
        },
      ],
      documentationChecklist: [
        "Epworth Sleepiness Scale",
        "STOP-Bang or equivalent risk screen",
        "BMI and comorbidity list",
        "Rationale if facility study preferred over HSAT",
      ],
      requiredDocuments: ["Sleep study order", "Screening scores", "Primary care / sleep clinic note"],
      missingDocuments: ["Home sleep apnea test attempt documentation (if plan requires step therapy)"],
      payerHints: ["Many payers require HSAT before facility polysomnography for uncomplicated OSA suspicion"],
      coverageSummary:
        "Sleep studies are covered when OSA pretest probability is documented; facility PSG often needs PA after HSAT pathway.",
      medicalNecessitySummary:
        "Diagnostic sleep testing is medically necessary to confirm OSA and guide CPAP therapy in symptomatic high-risk patients.",
      estimatedApprovalProbability: 69,
      estimatedTurnaroundDays: 4,
      summary: "Prior authorization likely for facility sleep study; screening scores and HSAT step-therapy are key.",
    };
  }

  if (scenario === "diabetes") {
    return {
      required: false,
      status: "not_required",
      services: [
        {
          code: "83036",
          description: "HbA1c",
          likelyRequired: false,
          payerCriteria: "Typically covered without PA for diagnostic/management use.",
        },
        {
          code: "G0108",
          description: "Diabetes self-management training",
          likelyRequired: false,
          payerCriteria: "May require certified program enrollment; verify benefit, not always formal PA.",
        },
        {
          code: "CGM supply (example)",
          description: "Continuous glucose monitoring supplies if ordered later",
          likelyRequired: true,
          payerCriteria: "Often requires PA with insulin use / hypoglycemia documentation.",
        },
      ],
      documentationChecklist: [
        "Diagnostic HbA1c / glucose values",
        "Current diabetes medications",
        "Hypoglycemia history if requesting CGM",
        "Educator referral notes for DSMT",
        "Payer membership and benefit verification on file",
      ],
      requiredDocuments: [
        "Office visit note with diabetes assessment",
        "Lab results (HbA1c / glucose)",
        "Active medication list",
      ],
      missingDocuments: [],
      payerHints: [
        "Metformin and E/M services do not require prior auth for this commercial-style plan profile",
        "Escalate PA workflow only if specialty diabetes technology is ordered",
      ],
      coverageSummary:
        "Today's evaluation-and-management visit and diagnostic HbA1c fall under standard outpatient benefits and do not require prospective prior authorization. Specialty diabetes technology (CGM, pumps) would shift into a PA-required pathway.",
      medicalNecessitySummary:
        "Core diabetes diagnostics and initial pharmacologic management are medically necessary given osmotic symptoms and confirmed hyperglycemia. Documentation already supports medical necessity for today's services.",
      estimatedApprovalProbability: 94,
      estimatedTurnaroundDays: 0,
      summary:
        "No prior authorization required for today's core diabetes visit and HbA1c. Future CGM or specialty therapy may trigger PA — checklist prepared.",
    };
  }
  if (scenario === "chest") {
    return {
      required: false,
      status: "not_required",
      services: [
        {
          code: "93010",
          description: "ECG interpretation",
          likelyRequired: false,
          payerCriteria: "Emergent diagnostics typically exempt from prospective PA.",
        },
      ],
      documentationChecklist: ["ECG indication", "ACS pathway notes", "Disposition / acuity documentation"],
      requiredDocuments: ["ED or urgent visit note", "ECG report", "Troponin / cardiac workup results"],
      missingDocuments: [],
      payerHints: ["Emergent care exception applies"],
      coverageSummary:
        "Emergent ACS evaluation pathway (ECG, troponin, observation) is covered without prior authorization under emergency / urgent benefit carve-outs.",
      medicalNecessitySummary:
        "Immediate cardiac diagnostics are medically necessary to rule out acute coronary syndrome given chest pain risk factors and clinical presentation.",
      estimatedApprovalProbability: 97,
      estimatedTurnaroundDays: 0,
      summary: "Prior auth not required for emergent ACS evaluation pathway.",
    };
  }
  return {
    required: false,
    status: "not_required",
    services: [],
    documentationChecklist: [
      "Service-level medical necessity narrative",
      "Signed order if any advanced service planned",
      "Insurance eligibility verification",
    ],
    requiredDocuments: ["Clinical visit note", "Procedure order (if applicable)"],
    missingDocuments: [],
    payerHints: ["Most ambulatory supportive-care visits do not require PA"],
    coverageSummary:
      "Planned ambulatory services appear covered under outpatient medical benefits without prospective prior authorization for this encounter profile.",
    medicalNecessitySummary:
      "Documentation supports medically necessary evaluation and management for the presenting complaint; no PA-triggering specialty service detected.",
    estimatedApprovalProbability: 91,
    estimatedTurnaroundDays: 0,
    summary: "No prior authorization anticipated for the planned services.",
  };
}

export function buildProductivity(timeSaved: number): ProviderProductivity {
  return {
    documentationMinutesSaved: timeSaved,
    encountersPerHourEquivalent: Number((60 / Math.max(12, 28 - timeSaved / 3)).toFixed(2)),
    productivityIndex: Math.min(98, 70 + Math.round(timeSaved * 1.2)),
    benchmarkComparison: `Documentation time saved (~${timeSaved} min) lifts productivity above clinic baseline for AI-assisted notes.`,
  };
}

export function buildExecutiveSummary(
  scenario: Scenario,
  documentation: ClinicalDocumentation,
  coding: CodingResult,
  claim: ClaimReadinessResult,
  revenue: RevenuePrediction,
  careGaps: CareGapResult
): ExecutiveSummary {
  return {
    headline:
      scenario === "diabetes"
        ? "New type 2 diabetes with strong documentation/coding support and actionable care gaps"
        : `Clinical AI package ready for ${scenario} pathway review`,
    clinicalHighlights: [
      documentation.clinicalSummary,
      documentation.assessment,
    ],
    codingHighlights: [
      `Top diagnosis ${coding.icd10[0]?.code}: ${coding.icd10[0]?.description}`,
      `Claim readiness ${claim.score}% · estimated coding accuracy ${coding.estimatedAccuracy ?? coding.confidence}%`,
    ],
    revenueHighlights: [
      revenue.summary,
      `Revenue protected ≈ $${revenue.revenueProtected}; at risk ≈ $${revenue.revenueAtRisk}`,
    ],
    actionItems: [
      ...claim.recommendations.slice(0, 2),
      ...careGaps.gaps.slice(0, 2).map((g) => g.recommendedAction),
    ],
    narrative:
      scenario === "diabetes"
        ? "John Smith's encounter (or similar diabetes presentation) is clinically coherent: osmotic symptoms plus HbA1c establish T2DM, coding is explainable, claim readiness is high with minor lab/education hygiene items, and care gaps around eye exam, nephropathy labs, and statin therapy should be closed next."
        : `${documentation.clinicalContextSummary ?? documentation.clinicalSummary} Claim and revenue implications are summarized for operations follow-up.`,
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
  const claimReadinessDetail = buildClaimReadiness(scenario, coding);
  const denialRisk = buildDenialRisk(scenario, coding.claimReadiness);
  const revenuePrediction = buildRevenuePrediction(scenario, coding);
  const careGaps = buildCareGaps(scenario, input);
  const priorAuth = buildPriorAuth(scenario, input);
  const timeSaved = 12 + Math.round(Math.random() * 10) + (scenario === "diabetes" ? 4 : 0);
  const productivity = buildProductivity(timeSaved);
  const executiveSummary = buildExecutiveSummary(
    scenario,
    documentation,
    coding,
    claimReadinessDetail,
    revenuePrediction,
    careGaps
  );

  const aiConfidence = Math.round(
    (coding.confidence + cds.confidence + (scenario === "diabetes" ? 94 : 86)) / 3
  );
  const documentationQuality = Math.min(
    98,
    Math.round(82 + coding.completeness * 0.12 + (input.labs ? 4 : 0) + (input.examFindings ? 3 : 0))
  );

  return {
    documentation: {
      ...documentation,
      documentationCompletenessScore:
        documentation.documentationCompletenessScore ?? coding.completeness,
    },
    coding: {
      ...coding,
      icd10: coding.icd10.map((c) => ({ ...c, confidence: Math.round(c.confidence) })),
      cpt: coding.cpt.map((c) => ({ ...c, confidence: Math.round(c.confidence) })),
      hcpcs: (coding.hcpcs ?? []).map((c) => ({ ...c, confidence: Math.round(c.confidence) })),
      confidence: Math.round(coding.confidence),
      completeness: Math.round(coding.completeness),
      claimReadiness: Math.round(coding.claimReadiness),
      estimatedAccuracy: Math.round(coding.estimatedAccuracy ?? coding.confidence),
      diagnosisConfidence: Math.round(coding.diagnosisConfidence ?? coding.confidence),
      procedureConfidence: Math.round(coding.procedureConfidence ?? coding.confidence),
    },
    cds,
    aiConfidence,
    documentationQuality,
    claimReadinessDetail,
    denialRisk,
    revenuePrediction,
    careGaps,
    priorAuth,
    productivity,
    documentationTimeSavedMinutes: timeSaved,
    executiveSummary,
  };
}

/** Standalone scenario detection for Phase B services */
export function detectClinicalScenario(input: EncounterInput): Scenario {
  return detectScenario(input);
}
