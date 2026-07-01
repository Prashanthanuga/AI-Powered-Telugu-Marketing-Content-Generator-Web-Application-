import React, { useEffect, useState } from "react";
import axios from "axios";
import { Radar, Sparkle, ArrowRight, RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";
import { APP } from "@/constants/testIds";
import { devError } from "@/utils/logger";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ScorePill = ({ label, value }) => {
  const v = Math.max(0, Math.min(10, Number(value) || 0));
  const color = v >= 9 ? "bg-green-500" : v >= 7 ? "bg-yellow-500" : "bg-slate-400";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`inline-flex items-center h-5 min-w-[38px] px-1.5 rounded-full ${color} text-white text-[11px] font-bold justify-center`}>
        {v}/10
      </span>
    </div>
  );
};

/**
 * Trending Idea Radar — rich cards with angle, reasoning, scores, target audience.
 */
export const IdeaRadar = ({ recentOffers = [], onPick, autoLoad = true }) => {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const resp = await axios.post(`${API}/ideas`, {
        recent_offers: recentOffers,
        count: 6,
      }, { timeout: 55000 });
      setIdeas(resp.data.ideas || []);
      setHasLoaded(true);
    } catch (e) {
      devError(e);
      toast.error("Couldn't fetch ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load once on mount when requested
  useEffect(() => {
    if (autoLoad && !hasLoaded && !loading) {
      fetchIdeas();
    }
  }, []);

  const pick = (idea) => {
    onPick({
      offer: idea.title,
      category: normalizeCategory(idea.category),
      tone: idea.tone,
      special_notes: idea.hook,
    });
    toast.success("Idea loaded into the form!");
  };

  return (
    <section className="bg-gradient-to-br from-[#0B3D91] via-[#1E40AF] to-[#0F172A] rounded-2xl p-5 md:p-7 shadow-xl text-white relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#F59E0B]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
            <Radar size={24} strokeWidth={2.5} className={loading ? "animate-spin" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg md:text-xl font-extrabold font-heading">Trending Idea Radar</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded">AI</span>
            </div>
            <p className="text-sm text-white/80 leading-snug max-w-md">
              No repetition. Different services, different angles. Pick one or use your own idea below.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchIdeas}
          disabled={loading}
          data-testid={APP.ideaRadarBtn}
          className="h-11 px-4 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-70 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors shrink-0"
        >
          {loading ? <RefreshCw size={16} strokeWidth={2.5} className="animate-spin" /> : <Sparkle size={16} strokeWidth={2.5} />}
          {loading ? "Scanning" : hasLoaded ? "Refresh" : "Get ideas"}
        </button>
      </div>

      {loading && ideas.length === 0 && (
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white/10 rounded-xl p-4 border border-white/10 animate-pulse h-40" />
          ))}
        </div>
      )}

      {ideas.length > 0 && (
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid={APP.ideaRadarPanel}>
          {ideas.map((idea, idx) => (
            <IdeaCard key={`${idea.angle || "idea"}-${idx}`} idea={idea} onPick={pick} />
          ))}
        </div>
      )}

      {!loading && ideas.length === 0 && hasLoaded && (
        <div className="text-white/70 text-sm">No ideas returned. Try Refresh.</div>
      )}
    </section>
  );
};

const IdeaCard = ({ idea, onPick }) => {
  const scores = idea.scores || {};
  return (
    <div
      data-testid={APP.ideaCard}
      className="bg-white/95 backdrop-blur text-slate-900 rounded-xl p-4 border border-white/25 shadow-lg flex flex-col gap-2.5 hover:shadow-2xl transition-shadow"
    >
      {/* Angle label */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B]">
          {idea.angle}
        </span>
      </div>

      {/* Category */}
      <div className="text-sm font-bold text-[#0B3D91] leading-tight font-telugu">
        {idea.category}
      </div>

      {/* Telugu title */}
      <div className="font-black text-base md:text-lg leading-snug font-telugu text-slate-900">
        {idea.title}
      </div>

      {/* Reasoning */}
      {idea.reasoning && (
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-telugu">
          {idea.reasoning}
        </p>
      )}

      {/* Scores */}
      {(scores.relevance || scores.local || scores.awareness) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
          <ScorePill label="Relevance" value={scores.relevance} />
          <ScorePill label="Local" value={scores.local} />
          <ScorePill label="Awareness" value={scores.awareness} />
        </div>
      )}

      {/* Target audience */}
      {idea.target_audience && (
        <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-0.5">
          <Target size={13} strokeWidth={2.5} className="mt-0.5 shrink-0 text-slate-400" />
          <span className="leading-snug font-telugu">{idea.target_audience}</span>
        </div>
      )}

      {/* Use this */}
      <button
        type="button"
        onClick={() => onPick(idea)}
        className="mt-1 h-10 w-full bg-[#0B3D91] hover:bg-[#093070] text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        Use this <ArrowRight size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
};

// Map LLM's flexible category descriptor back to our dropdown values
const CATEGORY_KEYWORDS = [
  ["repair", "TV Repair"],
  ["dth", "DTH Connection"],
  ["dish", "DTH Connection"],
  ["recharge", "DTH Connection"],
  ["tv", "TV"],
  ["mobile", "Mobile"],
  ["smartphone", "Mobile"],
  ["phone", "Mobile"],
  ["refrigerator", "Refrigerator"],
  ["fridge", "Refrigerator"],
  ["washing", "Washing Machine"],
  ["ac", "AC"],
  ["air condition", "AC"],
  ["cooler", "AC"],
  ["kitchen", "Kitchen Appliance"],
  ["mixer", "Kitchen Appliance"],
  ["accessor", "Accessories"],
  ["fan", "Accessories"],
];

function normalizeCategory(cat) {
  const s = (cat || "").toLowerCase();
  const match = CATEGORY_KEYWORDS.find(([k]) => s.includes(k));
  return match ? match[1] : "Home Appliance";
}
