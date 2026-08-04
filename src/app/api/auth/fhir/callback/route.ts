import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth/jwt";

/**
 * SMART on FHIR Callback Endpoint
 * EHR auth server redirects back here with code and state parameters.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code from EHR" }, { status: 400 });
    }

    const savedStateCookie = req.headers.get("cookie") || "";
    const fhirLaunchCookie = savedStateCookie
      .split("; ")
      .find((row) => row.startsWith("fhir_launch_state="))
      ?.split("=")[1];

    let finalIss = "https://r4.smarthealthit.org";

    // Graceful check fallback for local development HTTP cookie/CSRF blocking
    if (!fhirLaunchCookie) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Dev Mode Warning: Missing launch session state cookie due to localhost third-party policies. Bypassing check.");
      } else {
        return NextResponse.json({ error: "Missing launch session state" }, { status: 400 });
      }
    } else {
      try {
        const decoded = JSON.parse(decodeURIComponent(fhirLaunchCookie));
        if (state !== decoded.state && process.env.NODE_ENV === "production") {
          return NextResponse.json({ error: "State parameter validation failed (CSRF check)" }, { status: 403 });
        }
        finalIss = decoded.iss;
      } catch (err) {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json({ error: "Invalid launch session state format" }, { status: 400 });
        }
      }
    }

    // 1. Fetch token endpoint via well-known configuration
    const wellKnownUrl = `${finalIss.replace(/\/$/, "")}/.well-known/smart-configuration`;
    let tokenUrl = "";

    try {
      const configRes = await fetch(wellKnownUrl, { headers: { Accept: "application/json" } });
      if (configRes.ok) {
        const config = await configRes.json();
        tokenUrl = config.token_endpoint;
      }
    } catch (err) {
      console.warn("Could not fetch token endpoint from .well-known");
    }

    if (!tokenUrl) {
      if (finalIss.includes("smarthealthit.org")) {
        tokenUrl = "https://launch.smarthealthit.org/v/r4/auth/token";
      } else {
        tokenUrl = `${finalIss}/token`;
      }
    }

    const clientId = process.env.NEXT_PUBLIC_FHIR_CLIENT_ID || "operyx_poc_client_id";
    const redirectUri = `${new URL(req.url).origin}/api/auth/fhir/callback`;

    // 2. Perform Code Exchange against EHR token endpoint
    const bodyParams = new URLSearchParams();
    bodyParams.set("grant_type", "authorization_code");
    bodyParams.set("code", code);
    bodyParams.set("redirect_uri", redirectUri);
    bodyParams.set("client_id", clientId);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("EHR Token Exchange Error:", errText);
      return NextResponse.json({ error: "EHR Token exchange failed", details: errText }, { status: 401 });
    }

    const tokenData = await tokenRes.json();
    const { access_token, patient: launchedPatientId } = tokenData;

    // 3. Query EHR FHIR Server to retrieve Patient details
    let patientName = "Unknown SMART Patient";
    let patientGender = "unknown";
    let patientAge = 45;

    if (launchedPatientId) {
      try {
        const patientRes = await fetch(`${finalIss}/Patient/${launchedPatientId}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (patientRes.ok) {
          const patientData = await patientRes.json();
          patientName = patientData.name?.[0]?.text || 
            `${patientData.name?.[0]?.given?.join(" ") || ""} ${patientData.name?.[0]?.family || ""}`.trim() || 
            patientName;
          patientGender = patientData.gender || "unknown";
          
          if (patientData.birthDate) {
            const birthYear = new Date(patientData.birthDate).getFullYear();
            patientAge = new Date().getFullYear() - birthYear;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch patient resource details from EHR:", err);
      }
    }

    // 4. Create clinician session
    const clinicianSession = {
      id: "demo-doctor-id",
      email: "smart.clinician@hospital.org",
      name: "Dr. Sarah Chen (SSO)",
      role: "Doctor",
    };

    const sessionToken = await signToken(clinicianSession);

    // 5. Redirect user to New Encounter pre-populated with patient context
    const response = NextResponse.redirect(
      new URL(
        `/encounters/new?patientId=${launchedPatientId || "mock-patient"}&patientName=${encodeURIComponent(
          patientName
        )}&gender=${patientGender}&age=${patientAge}`,
        req.url
      )
    );

    // Store secure app auth cookie
    response.cookies.set({
      name: "token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    // Cleanup SMART launch session cookie if present
    response.cookies.delete("fhir_launch_state");

    return response;
  } catch (error) {
    console.error("SMART Callback Error:", error);
    return NextResponse.json({ error: "Failed to handle SMART on FHIR callback" }, { status: 500 });
  }
}
