import { NextResponse } from "next/server";
import { generateClinicalAi } from "@/lib/mock/generators";
import { uid } from "@/lib/utils";
import { verifyToken } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/services/audit.service";

// Helper to sanitize markdown block wrappers from LLM responses if any
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

export async function POST(request: Request) {
  try {
    // Validate that only the "Doctor" role can execute generation APIs
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    let isDoctor = false;
    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload && (payload.role || "").toLowerCase() === "doctor") {
          isDoctor = true;
        }
      } catch (err) {
        console.warn("Failed to check token in generate route:", err);
      }
    }

    if (!isDoctor) {
      return NextResponse.json(
        { error: "Access Denied: Only Doctor role has encounter generation privileges." },
        { status: 403 }
      );
    }

    const { input, type = "all" } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the environment variables." },
        { status: 500 }
      );
    }

    // Generate the base fallback object
    const baseResult = generateClinicalAi(input);

    const systemPrompt = `You are Operyx AI, an advanced, highly clinical AI assistant specialized in healthcare operations, clinical documentation, medical coding (ICD-10, CPT, HCPCS), clinical decision support (CDS), and billing compliance.

Analyze the following clinical encounter details:
Patient Name: ${input.patientName}
Age: ${input.age}
Gender: ${input.gender}
Chief Complaint: ${input.chiefComplaint}
History of Present Illness: ${input.historyOfPresentIllness}
Past Medical History: ${input.pastMedicalHistory}
Medications: ${input.medications}
Allergies: ${input.allergies}
Vitals: ${input.vitals}
Exam Findings: ${input.examFindings}
Labs: ${input.labs}
Assessment Notes: ${input.assessmentNotes}

${
  type === "all"
    ? `You must generate a complete clinical documentation and coding assessment package in JSON format.
Here is a template of the JSON structure representing a mock response. Update all the values in this template so they are clinically accurate, detailed, and realistic for the patient's specific presentation.
Ensure the ICD-10, CPT, and HCPCS codes are real, valid medical codes. The SOAP note must reflect the actual history and findings. The CDS alerts, care gaps, prior authorizations, revenue metrics, and denial risks must be clinically and operationally sound.

Template JSON to modify:
${JSON.stringify(baseResult, null, 2)}`
    : type === "claim-readiness"
    ? `You must generate a Claim Readiness Assessment in JSON format.
Here is a template of the JSON structure representing a mock response for the claimReadinessDetail. Update all the values in this template so they are clinically accurate and realistic for the patient's specific presentation.
Template JSON to modify:
${JSON.stringify(baseResult.claimReadinessDetail, null, 2)}`
    : type === "denial-risk"
    ? `You must generate a Denial Risk Prediction in JSON format.
Here is a template of the JSON structure representing a mock response for the denialRisk. Update all the values in this template so they are clinically accurate and realistic for the patient's specific presentation.
Template JSON to modify:
${JSON.stringify(baseResult.denialRisk, null, 2)}`
    : type === "revenue-prediction"
    ? `You must generate a Revenue Prediction in JSON format.
Here is a template of the JSON structure representing a mock response for the revenuePrediction. Update all the values in this template so they are clinically accurate and realistic for the patient's specific presentation.
Template JSON to modify:
${JSON.stringify(baseResult.revenuePrediction, null, 2)}`
    : type === "care-gaps"
    ? `You must generate a Care Gaps Assessment in JSON format.
Here is a template of the JSON structure representing a mock response for the careGaps. Update all the values in this template so they are clinically accurate and realistic for the patient's specific presentation.
Template JSON to modify:
${JSON.stringify(baseResult.careGaps, null, 2)}`
    : type === "prior-auth"
    ? `You must generate a Prior Authorization Assessment in JSON format.
Here is a template of the JSON structure representing a mock response for the priorAuth. Update all the values in this template so they are clinically accurate and realistic for the patient's specific presentation.
Template JSON to modify:
${JSON.stringify(baseResult.priorAuth, null, 2)}`
    : type === "executive-summary"
    ? `You must generate an Executive Summary in JSON format.
Here is a template of the JSON structure representing a mock response for the executiveSummary. Update all the values in this template so they are clinically accurate and realistic for the patient's specific presentation.
Template JSON to modify:
${JSON.stringify(baseResult.executiveSummary, null, 2)}`
    : ""
}

Return ONLY the raw JSON object conforming exactly to the template structure. Do not wrap the JSON in markdown code blocks. Do not add any text before or after the JSON.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Gemini API error: ${response.statusText}. Details: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json(baseResult);
    }

    const cleanedText = cleanJsonResponse(text);
    const parsedGemini = JSON.parse(cleanedText);

    // Merge parsed Gemini response with our baseResult
    let finalResult = { ...baseResult };

    if (type === "all") {
      finalResult = {
        ...baseResult,
        ...parsedGemini,
        documentation: {
          ...baseResult.documentation,
          ...(parsedGemini.documentation || {}),
          soap: {
            ...baseResult.documentation.soap,
            ...(parsedGemini.documentation?.soap || {}),
          },
          differentialDiagnosis: (parsedGemini.documentation?.differentialDiagnosis || baseResult.documentation.differentialDiagnosis || []).map(
            (item: any) => ({
              ...item,
            })
          ),
          clinicalReasoning: {
            ...baseResult.documentation.clinicalReasoning,
            ...(parsedGemini.documentation?.clinicalReasoning || {}),
          },
          medicalNecessitySummary: {
            ...baseResult.documentation.medicalNecessitySummary,
            ...(parsedGemini.documentation?.medicalNecessitySummary || {}),
          },
          medicationReview: (parsedGemini.documentation?.medicationReview || baseResult.documentation.medicationReview || []).map(
            (item: any) => ({
              ...item,
            })
          ),
        },
        coding: {
          ...baseResult.coding,
          ...(parsedGemini.coding || {}),
          icd10: (parsedGemini.coding?.icd10 || baseResult.coding.icd10 || []).map((item: any) => ({
            ...item,
            confidence: Math.round(item.confidence || 80),
          })),
          cpt: (parsedGemini.coding?.cpt || baseResult.coding.cpt || []).map((item: any) => ({
            ...item,
            confidence: Math.round(item.confidence || 80),
          })),
          hcpcs: (parsedGemini.coding?.hcpcs || baseResult.coding.hcpcs || []).map((item: any) => ({
            ...item,
            confidence: Math.round(item.confidence || 80),
          })),
          medicalNecessityValidation: {
            ...baseResult.coding.medicalNecessityValidation,
            ...(parsedGemini.coding?.medicalNecessityValidation || {}),
          },
          documentationValidation: {
            ...baseResult.coding.documentationValidation,
            ...(parsedGemini.coding?.documentationValidation || {}),
          },
          codingRecommendations: (parsedGemini.coding?.codingRecommendations || baseResult.coding.codingRecommendations || []).map(
            (item: any) => ({
              id: item.id || uid("rec"),
              priority: item.priority || "medium",
              title: item.title || "",
              detail: item.detail || "",
              relatedCodes: item.relatedCodes || [],
            })
          ),
        },
        cds: {
          ...baseResult.cds,
          ...(parsedGemini.cds || {}),
          alerts: (parsedGemini.cds?.alerts || baseResult.cds.alerts || []).map((alert: any) => ({
            id: alert.id || uid("cds"),
            category: alert.category || "risk",
            severity: alert.severity || "info",
            title: alert.title || "",
            detail: alert.detail || "",
          })),
        },
        claimReadinessDetail: parsedGemini.claimReadinessDetail
          ? {
              ...baseResult.claimReadinessDetail,
              ...parsedGemini.claimReadinessDetail,
              checklist: (parsedGemini.claimReadinessDetail.checklist || []).map((item: any) => ({
                id: item.id || uid("chk"),
                label: item.label || "",
                status: item.status || "pass",
                detail: item.detail || "",
              })),
            }
          : baseResult.claimReadinessDetail,
        denialRisk: parsedGemini.denialRisk
          ? {
              ...baseResult.denialRisk,
              ...parsedGemini.denialRisk,
              topDenialReasons: (parsedGemini.denialRisk.topDenialReasons || []).map((item: any) => ({
                id: item.id || uid("dr"),
                reason: item.reason || "",
                contribution: item.contribution || 0,
                severity: item.severity || "low",
                mitigation: item.mitigation || "",
              })),
            }
          : baseResult.denialRisk,
        revenuePrediction: parsedGemini.revenuePrediction
          ? {
              ...baseResult.revenuePrediction,
              ...parsedGemini.revenuePrediction,
              kpiSummary: {
                ...(baseResult.revenuePrediction?.kpiSummary || {}),
                ...(parsedGemini.revenuePrediction.kpiSummary || {}),
              },
            }
          : baseResult.revenuePrediction,
        careGaps: parsedGemini.careGaps
          ? {
              ...baseResult.careGaps,
              ...parsedGemini.careGaps,
              gaps: (parsedGemini.careGaps.gaps || []).map((item: any) => ({
                id: item.id || uid("gap"),
                category: item.category || "",
                severity: item.severity || "info",
                title: item.title || "",
                detail: item.detail || "",
                recommendedAction: item.recommendedAction || "",
                measureId: item.measureId,
                dueBy: item.dueBy,
              })),
            }
          : baseResult.careGaps,
        priorAuth: parsedGemini.priorAuth
          ? {
              ...baseResult.priorAuth,
              ...parsedGemini.priorAuth,
              services: (parsedGemini.priorAuth.services || []).map((item: any) => ({
                ...item,
              })),
            }
          : baseResult.priorAuth,
        executiveSummary: parsedGemini.executiveSummary
          ? {
              ...baseResult.executiveSummary,
              ...parsedGemini.executiveSummary,
            }
          : baseResult.executiveSummary,
      };
    } else if (type === "claim-readiness") {
      finalResult.claimReadinessDetail = {
        ...baseResult.claimReadinessDetail,
        ...parsedGemini,
        checklist: (parsedGemini.checklist || []).map((item: any) => ({
          id: item.id || uid("chk"),
          label: item.label || "",
          status: item.status || "pass",
          detail: item.detail || "",
        })),
      };
    } else if (type === "denial-risk") {
      finalResult.denialRisk = {
        ...baseResult.denialRisk,
        ...parsedGemini,
        topDenialReasons: (parsedGemini.topDenialReasons || []).map((item: any) => ({
          id: item.id || uid("dr"),
          reason: item.reason || "",
          contribution: item.contribution || 0,
          severity: item.severity || "low",
          mitigation: item.mitigation || "",
        })),
      };
    } else if (type === "revenue-prediction") {
      finalResult.revenuePrediction = {
        ...baseResult.revenuePrediction,
        ...parsedGemini,
        kpiSummary: {
          ...(baseResult.revenuePrediction?.kpiSummary || {}),
          ...(parsedGemini.kpiSummary || {}),
        },
      };
    } else if (type === "care-gaps") {
      finalResult.careGaps = {
        ...baseResult.careGaps,
        ...parsedGemini,
        gaps: (parsedGemini.gaps || []).map((item: any) => ({
          id: item.id || uid("gap"),
          category: item.category || "",
          severity: item.severity || "info",
          title: item.title || "",
          detail: item.detail || "",
          recommendedAction: item.recommendedAction || "",
          measureId: item.measureId,
          dueBy: item.dueBy,
        })),
      };
    } else if (type === "prior-auth") {
      finalResult.priorAuth = {
        ...baseResult.priorAuth,
        ...parsedGemini,
        services: (parsedGemini.services || []).map((item: any) => ({
          ...item,
        })),
      };
    } else if (type === "executive-summary") {
      finalResult.executiveSummary = {
        ...baseResult.executiveSummary,
        ...parsedGemini,
      };
    }

    // Ensure all numeric values are properly rounded/clamped
    if (finalResult.aiConfidence) finalResult.aiConfidence = Math.min(100, Math.max(0, Math.round(finalResult.aiConfidence)));
    if (finalResult.documentationQuality) finalResult.documentationQuality = Math.min(100, Math.max(0, Math.round(finalResult.documentationQuality)));

    // Record HIPAA audit log for successful clinical documentation generation
    await createAuditLogHelper(request, {
      action: "generate_encounter",
      entity: "encounter",
      details: `Successfully generated AI clinical documentation and coding for patient: ${input.patientName}`,
      outcome: "success",
    });

    return NextResponse.json(finalResult);
  } catch (error: any) {
    console.error("API Generate Error:", error);
    
    // Record HIPAA audit log for failed documentation generation
    try {
      const clonedReq = request.clone();
      const { input } = await clonedReq.json();
      await createAuditLogHelper(clonedReq, {
        action: "generate_encounter",
        entity: "encounter",
        details: `Failed to generate AI clinical documentation for patient: ${input?.patientName || "unknown"}. Error: ${error.message || String(error)}`,
        outcome: "failure",
        errorCode: "GENERATION_FAILED",
        errorMessage: error.message || String(error),
      });
    } catch (auditErr) {
      console.warn("Audit logging for failed generation also failed:", auditErr);
    }

    try {
      const { input } = await request.clone().json();
      return NextResponse.json(generateClinicalAi(input));
    } catch {
      return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
    }
  }
}

/**
 * Resolves session parameters and records the audit log from inside the API route context.
 */
async function createAuditLogHelper(
  request: Request,
  logData: {
    action: string;
    entity: string;
    details: string;
    outcome: "success" | "failure";
    errorCode?: string;
    errorMessage?: string;
  }
) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    let performedBy = undefined;
    let role = "unknown";

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        performedBy = (payload as any).id || undefined;
        role = payload.role || "unknown";
      }
    }

    await createAuditLog({
      ...logData,
      performedBy,
      role,
    });
  } catch (err) {
    console.warn("Helper failed to commit generate audit log:", err);
  }
}

