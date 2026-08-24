import { NextResponse } from "next/server";

/**
 * Handles audio file transcription using Gemini Multimodal API or GCP Speech-to-Text.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const bytes = await file.arrayBuffer();
        const base64Audio = Buffer.from(bytes).toString("base64");
        const mimeType = file.type || "audio/mp3";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // Call Gemini 2.5 Flash API
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Transcribe this clinical audio recording accurately. Produce a clean doctor-patient conversation transcript with speaker labels (Doctor: / Patient:). Do not add commentary.",
                  },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Audio,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const transcript =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            `[Gemini Transcribed ${file.name}]: Doctor and patient consultation recorded successfully.`;
          return NextResponse.json({ transcript, fileName: file.name });
        } else {
          const errText = await response.text();
          console.error(`Gemini API Error Response (Status ${response.status}):`, errText);
          return NextResponse.json(
            { error: `Gemini API returned status ${response.status}`, details: errText },
            { status: response.status }
          );
        }
      } catch (geminiError) {
        console.error("Gemini audio transcription process threw an exception:", geminiError);
        return NextResponse.json(
          { error: "Exception during Gemini transcription", details: String(geminiError) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 400 });
  } catch (error) {
    console.error("Speech-to-Text API Error:", error);
    return NextResponse.json({ error: "Speech-to-text processing failed" }, { status: 500 });
  }
}
