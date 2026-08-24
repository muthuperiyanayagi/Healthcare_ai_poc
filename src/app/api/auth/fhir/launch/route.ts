import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

function base64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * SMART on FHIR Launch Endpoint (EHR Integration Launch)
 * Receives:
 * - iss: EHR FHIR Server Base URL (e.g. https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4)
 * - launch: Unique EHR Launch Context ID
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const iss = searchParams.get("iss");
    const launch = searchParams.get("launch");

    if (!iss) {
      return NextResponse.json({ error: "Missing FHIR Server URL (iss parameter)" }, { status: 400 });
    }

    // 1. Fetch well-known SMART configuration to discover OAuth endpoints
    const wellKnownUrl = `${iss.replace(/\/$/, "")}/.well-known/smart-configuration`;
    let authorizeUrl = "";

    try {
      const configRes = await fetch(wellKnownUrl, { headers: { Accept: "application/json" } });
      if (configRes.ok) {
        const config = await configRes.json();
        authorizeUrl = config.authorization_endpoint;
      }
    } catch (err) {
      console.warn("Could not fetch .well-known configuration, falling back to heuristic authorization endpoint");
    }

    // Fallback if .well-known endpoint is blocked or unavailable in dev sandbox
    if (!authorizeUrl) {
      if (iss.includes("smarthealthit.org")) {
        authorizeUrl = "https://launch.smarthealthit.org/v/r4/auth/authorize";
      } else {
        authorizeUrl = `${iss}/authorize`;
      }
    }

    const clientId = process.env.NEXT_PUBLIC_FHIR_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "NEXT_PUBLIC_FHIR_CLIENT_ID is not configured" }, { status: 500 });
    }

    const redirectUri = `${new URL(req.url).origin}/api/auth/fhir/callback`;
    const state = base64url(randomBytes(16));

    // PKCE (required by Epic for public clients)
    const codeVerifier = base64url(randomBytes(32));
    const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());

    // 2. Build EHR Authorization redirect URL
    const authRedirect = new URL(authorizeUrl);
    authRedirect.searchParams.set("response_type", "code");
    authRedirect.searchParams.set("client_id", clientId);
    authRedirect.searchParams.set("redirect_uri", redirectUri);
    authRedirect.searchParams.set("aud", iss);
    authRedirect.searchParams.set("state", state);
    authRedirect.searchParams.set("scope", "launch patient/Patient.read patient/Encounter.read openid fhirUser");
    authRedirect.searchParams.set("code_challenge", codeChallenge);
    authRedirect.searchParams.set("code_challenge_method", "S256");

    if (launch) {
      authRedirect.searchParams.set("launch", launch);
    }

    // Redirect clinician's browser to Epic / Cerner login page
    const response = NextResponse.redirect(authRedirect.toString());

    // Store launch details temporarily in secure session cookie
    response.cookies.set({
      name: "fhir_launch_state",
      value: JSON.stringify({ state, iss, codeVerifier }),
      httpOnly: true,
      maxAge: 300, // 5 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("SMART Launch Error:", error);
    return NextResponse.json({ error: "Failed to initiate SMART on FHIR launch" }, { status: 500 });
  }
}
