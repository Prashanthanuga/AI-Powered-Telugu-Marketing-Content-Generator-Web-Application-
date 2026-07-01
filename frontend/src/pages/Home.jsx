import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { InputForm } from "@/components/InputForm";
import { ProgressBar } from "@/components/ProgressBar";
import { ContentTabs } from "@/components/ContentTabs";
import { HistoryDrawer } from "@/components/HistoryDrawer";
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

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const runGeneration = async (data, isRegen = false) => {
    // Warn if similar recent
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

    // Animate steps
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
    }, 4000);

    try {
      const endpoint = isRegen ? "/regenerate" : "/generate";
      const resp = await axios.post(`${API}${endpoint}`, data, { timeout: 60000 });
      clearInterval(stepTimer);
      setStep(PROGRESS_STEPS.length);
      setContent(resp.data);

      // Save to local + server history
      const item = {
        id: crypto.randomUUID?.() || String(Date.now()),
        date: new Date().toISOString(),
        ...data,
        template: "festival",
        content: resp.data,
      };
      setHistory(saveHistoryItem(item));
      // fire-and-forget server persist
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
      console.error(e);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleGenerate = (data) => runGeneration(data, false);
  const handleRegenerate = () => {
    if (lastRequest) runGeneration(lastRequest, true);
  };
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-[#0B3D91] rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xl">T</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 font-heading leading-tight">
                T.V Reddy Electronics
              </h1>
              <p className="text-xs text-slate-500">Telugu Marketing AI · తెలుగు మార్కెటింగ్</p>
            </div>
          </div>
          <HistoryDrawer history={history} onSelect={handleRestore} onDelete={handleDeleteHistory} />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8">
        {/* Hero */}
        <section className="text-center pt-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Zap size={14} strokeWidth={2.5} /> Powered by Gemini AI
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-heading leading-tight">
            Create Telugu Marketing in <span className="text-[#0B3D91]">60 seconds</span>
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-md mx-auto font-telugu">
            WhatsApp, Facebook, Instagram కోసం professional తెలుగు content మరియు branded posters.
          </p>
        </section>

        {/* Form Card */}
        {!loading && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-7">
            <InputForm onGenerate={handleGenerate} loading={loading || regenerating} />
          </section>
        )}

        {/* Progress */}
        {loading && <ProgressBar step={step} />}

        {/* Output */}
        {content && !loading && (
          <section>
            <ContentTabs
              content={content}
              setContent={setContent}
              onRegenerate={handleRegenerate}
              regenerating={regenerating}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-slate-600 space-y-2">
          <div className="font-bold text-slate-900 font-heading">{SHOP.name}</div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href={`tel:${SHOP.phone}`} className="flex items-center gap-1.5 hover:text-[#0B3D91]">
              <Phone size={14} strokeWidth={2.5} /> {SHOP.phone}
            </a>
            <a href={SHOP.maps} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#0B3D91]">
              <MapPin size={14} strokeWidth={2.5} /> {SHOP.location}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
