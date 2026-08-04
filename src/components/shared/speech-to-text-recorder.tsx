"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Upload, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SpeechToTextProps {
  onTranscriptChange: (transcript: string) => void;
  currentTranscript: string;
}

// Declare SpeechRecognition for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function SpeechToTextRecorder({
  onTranscriptChange,
  currentTranscript,
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalSpeech = "";
      let interimSpeech = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalSpeech += event.results[i][0].transcript + " ";
        } else {
          interimSpeech += event.results[i][0].transcript;
        }
      }

      if (finalSpeech) {
        const updated = currentTranscript
          ? `${currentTranscript.trim()} ${finalSpeech.trim()}`
          : finalSpeech.trim();
        onTranscriptChange(updated);
      }
      setInterimTranscript(interimSpeech);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error !== "no-speech") {
        toast.error(`Microphone error: ${event.error}`);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setInterimTranscript("");
      if (recognitionRef.current?.shouldContinue) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.shouldContinue = false;
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [currentTranscript, onTranscriptChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.shouldContinue = false;
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      toast.info("Voice dictation stopped");
    } else {
      try {
        recognitionRef.current.shouldContinue = true;
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Voice dictation active — speak into your microphone");
      } catch (err) {
        console.error("Failed to start speech recognition", err);
        toast.error("Could not access microphone");
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);
    setAudioUrl(URL.createObjectURL(file));
    toast.info(`Processing audio file: ${file.name}`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Speech-to-Text transcription failed");
      }

      const data = await res.json();
      if (data.transcript) {
        const updated = currentTranscript
          ? `${currentTranscript.trim()}\n\n${data.transcript}`
          : data.transcript;
        onTranscriptChange(updated);
        toast.success("Audio file transcribed successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to transcribe audio file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearAudio = () => {
    setAudioUrl(null);
    setUploadedFileName(null);
    onTranscriptChange("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/85 bg-muted/35 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={toggleListening}
            className="relative gap-2 font-medium"
          >
            {isListening ? (
              <>
                <span className="absolute -left-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                </span>
                <MicOff className="h-4 w-4" />
                Stop Dictation
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Start Live Dictation
              </>
            )}
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? "Transcribing Audio..." : "Upload Audio File"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {isListening && (
            <Badge variant="outline" className="animate-pulse border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 gap-1.5">
              <Volume2 className="h-3.5 w-3.5 animate-bounce" />
              Listening to microphone...
            </Badge>
          )}
          {!isSupported && (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              Web Speech fallback (File Upload supported)
            </Badge>
          )}
          {(currentTranscript || audioUrl) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAudio}
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Clear Audio & Transcript
            </Button>
          )}
        </div>
      </div>

      {audioUrl && (
        <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-background/50 p-3 shadow-inner">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium truncate max-w-[280px]">Uploaded: {uploadedFileName}</span>
            <span>Local Playback</span>
          </div>
          <audio controls src={audioUrl} className="w-full h-9 rounded-md bg-muted" />
        </div>
      )}

      {interimTranscript && (
        <div className="w-full text-xs italic text-muted-foreground bg-background/60 p-2 rounded border border-border/40">
          Listening: &quot;{interimTranscript}&quot;
        </div>
      )}
    </div>
  );
}
