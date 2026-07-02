import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { InputForm } from "@/components/InputForm";
import { ProgressBar } from "@/components/ProgressBar";
import { ContentTabs } from "@/components/ContentTabs";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { IdeaRadar } from "@/components/IdeaRadar";
import { devError } from "@/utils/logger";
import { loadHistory, saveHistoryItem, deleteHistoryItem, findSimilar } from "@/utils/localHistory";
import { SHOP, PROGRESS_STEPS } from "@/utils/constants";
import { Zap, MapPin, Phone } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [content, setContent] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [regenerating, setRegenerating] = useState(false);
  const [prefill, setPrefill] = useState(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // NEW: Auto-scroll to results when content finishes generating
  useEffect(() => {
    if (content && !loading) {
      setTimeout(() => {
        document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [content, loading]);

  const runGeneration = async (data, isRegen = false) => {
    if (!isRegen) {
      const similar = findSimilar(data.offer, history);
      if (similar) {
        const proceed = window.confirm(
          "This looks similar to a recent post. Generate a fresh variation anyway?"
        );
        if (!proceed) return;
      }
    }

    setLastRequest(data);
    if (isRegen) setRegenerating(true); else setLoading(true);
    setStep(0);

    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
    }, 4000);

    try {
      const endpoint = isRegen ? "/regenerate" : "/generate";
      const resp = await axios.post(`${API}${endpoint}`, data, { timeout: 60000 });
      clearInterval(stepTimer);
      setStep(PROGRESS_STEPS.length);
      setContent(resp.data);

      const item = {
        id: crypto.randomUUID?.() || String(Date.now()),
        date: new Date().toISOString(),
        ...data,
        template: "festival",
        content: resp.data,
      };
      setHistory(saveHistoryItem(item));
      axios.post(`${API}/history`, item).catch(() => {});
      toast.success("Content generated successfully!");
    } catch (e) {
      clearInterval(stepTimer);
      const status = e.response?.status;
      const detail = e.response?.data?.detail || "";
      if (status === 429 || /quota|limit/i.test(detail)) {
        toast.error("Today's AI generation limit has been reached. Please try again later.");
      } else if (e.code === "ECONNABORTED") {
        toast.error("Gemini is taking longer than expected. Please retry.");
      } else {
        toast.error("Content generation failed. Please try again.");
      }
      devError(e);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleGenerate = (data) => runGeneration(data, false);
  const handleRegenerate = () => { if (lastRequest) runGeneration(lastRequest, true); };
  const handleRestore = (item) => {
    setContent(item.content);
    setLastRequest({ offer: item.offer, category: item.category, audience: item.audience, tone: item.tone, special_notes: item.special_notes });
    toast.success("Restored from history");
  };
  const handleDeleteHistory = (id) => {
    setHistory(deleteHistoryItem(id));
    axios.delete(`${API}/history/${id}`).catch(() => {});
    toast.success("Deleted");
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-orange-200/30 blur-[100px] pointer-events-none" />

      <Toaster position="top-center" richColors />

      {/* Frosted Glass Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-300 cursor-pointer">
            <div className="h-11 w-11 bg-gradient-to-br from-[#0B3D91] to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="text-white font-black text-xl">T</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 font-heading leading-tight tracking-tight">
                T.V Reddy Electronics
              </h1>
              <p className="text-xs text-slate-500 font-medium">Telugu Marketing AI · తెలుగు మార్కెటింగ్</p>
            </div>
          </div>
          <HistoryDrawer history={history} onSelect={handleRestore} onDelete={handleDeleteHistory} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8 relative z-10">
        
        {/* Hero Section */}
        <section className="text-center pt-2 pb-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
            <Zap size={14} strokeWidth={2.5} className="text-orange-500" /> Powered by Gemini AI
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 font-heading leading-tight tracking-tight">
            Create Telugu Marketing in <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B3D91] to-blue-500">60 seconds</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-md mx-auto font-telugu leading-relaxed">
            WhatsApp, Facebook, Instagram కోసం professional తెలుగు content మరియు branded posters.
          </p>
        </section>

        {/* Idea Radar */}
        {!loading && (
          <div className="transition-all duration-500 ease-in-out">
            <IdeaRadar
              recentOffers={history.slice(0, 20).map((h) => h.offer)}
              onPick={(p) => setPrefill({ ...p, _t: Date.now() })}
            />
          </div>
        )}

        {/* Form Card (Floating UI) */}
        {!loading && (
          <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <InputForm onGenerate={handleGenerate} loading={loading || regenerating} prefill={prefill} />
          </section>
        )}

        {/* Progress & Output */}
        {loading && <ProgressBar step={step} />}
        
        {/* NEW: Added id="result-section" here */}
        {content && !loading && (
          <section id="result-section" className="animate-fade-in-up">
            <ContentTabs content={content} setContent={setContent} onRegenerate={handleRegenerate} regenerating={regenerating} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/60 bg-slate-50/50 backdrop-blur-sm relative z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-slate-500 space-y-4">
          <div className="font-bold text-slate-800 font-heading tracking-wide">{SHOP.name}</div>
          <div className="flex items-center justify-center gap-6 flex-wrap font-medium">
            <a href={`tel:${SHOP.phone}`} className="flex items-center gap-2 hover:text-[#0B3D91] transition-colors">
              <Phone size={16} strokeWidth={2.5} /> {SHOP.phone}
            </a>
            <a href={SHOP.maps} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#0B3D91] transition-colors">
              <MapPin size={16} strokeWidth={2.5} /> {SHOP.location}
            </a>
          </div>
          <p className="pt-2">&copy; 2026 T.V Reddy Electronics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}