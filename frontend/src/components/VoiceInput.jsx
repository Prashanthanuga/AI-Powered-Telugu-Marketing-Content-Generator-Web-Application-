import React, { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { APP } from "@/constants/testIds";

/**
 * Voice input button using browser Web Speech API (Telugu te-IN).
 * - Continuous listening with interim results (auto-stops after ~1.8s silence)
 * - Concatenates final chunks
 * - Shows interim transcript as live feedback
 * - Hides itself if API is unsupported
 */
export const VoiceInput = ({ onResult, disabled }) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef(null);
  const finalRef = useRef("");
  const silenceTimerRef = useRef(null);
  const startingTranscriptRef = useRef("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "te-IN";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interimStr = "";
      let addFinal = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) addFinal += t + " ";
        else interimStr += t;
      }
      if (addFinal) {
        finalRef.current = (finalRef.current + " " + addFinal).replace(/\s+/g, " ").trim();
      }
      setInterim(interimStr);
      // Reset auto-stop silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        try { rec.stop(); } catch (e) { /* ignore */ }
      }, 1800);
    };
    rec.onerror = (e) => {
      console.warn("SpeechRecognition error:", e.error || e);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      const combined = (startingTranscriptRef.current + " " + finalRef.current).trim();
      if (finalRef.current) onResult(combined);
      finalRef.current = "";
    };
    recognitionRef.current = rec;
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { rec.stop(); } catch (e) { /* ignore */ }
    };
  }, [onResult]);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
      setListening(false);
      return;
    }
    finalRef.current = "";
    startingTranscriptRef.current = "";
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch (e) { setListening(false); }
  };

  return (
    <div className="flex flex-col items-center shrink-0">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        data-testid={APP.voiceBtn}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        className={`h-12 w-12 flex items-center justify-center rounded-full transition-all ${
          listening
            ? "bg-red-600 text-white shadow-lg ring-4 ring-red-200 animate-pulse"
            : "bg-slate-100 text-[#0B3D91] hover:bg-[#0B3D91] hover:text-white"
        }`}
      >
        {listening ? <Square size={20} strokeWidth={3} fill="currentColor" /> : <Mic size={22} strokeWidth={2.5} />}
      </button>
      {listening && (
        <div className="absolute -bottom-6 right-1 text-[10px] text-red-600 font-semibold">Listening…</div>
      )}
      {listening && interim && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] px-4 py-2 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 text-sm font-telugu">
          <span className="text-red-600 font-bold mr-2">•</span>{interim}
        </div>
      )}
    </div>
  );
};
