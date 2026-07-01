import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { APP } from "@/constants/testIds";

/**
 * Voice input button using browser Web Speech API (Telugu te-IN).
 * Hides itself if API is unsupported.
 */
export const VoiceInput = ({ onResult, disabled }) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "te-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(" ");
      onResult(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch (e) { /* ignore */ } };
  }, [onResult]);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch { setListening(false); }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      data-testid={APP.voiceBtn}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={`h-12 w-12 flex items-center justify-center rounded-full transition-all shrink-0 ${
        listening
          ? "bg-red-600 text-white animate-pulse shadow-lg"
          : "bg-slate-100 text-[#0B3D91] hover:bg-[#0B3D91] hover:text-white"
      }`}
    >
      {listening ? <MicOff size={22} strokeWidth={2.5} /> : <Mic size={22} strokeWidth={2.5} />}
    </button>
  );
};
