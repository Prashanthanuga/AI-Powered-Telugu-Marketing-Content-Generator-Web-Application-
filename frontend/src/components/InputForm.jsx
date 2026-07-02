// Forcing Vercel to update

import React, { useState, useEffect } from "react";
import { Sparkles, Sparkle } from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import { CATEGORIES, AUDIENCES, TONES } from "@/utils/constants";
import { APP } from "@/constants/testIds";
import { saveDraft, loadDraft } from "@/utils/localHistory";
import { upcomingFestival } from "@/utils/festivalHelper";

export const InputForm = ({ onGenerate, loading, prefill }) => {
  const [offer, setOffer] = useState("");
  const [category, setCategory] = useState("TV");
  const [audience, setAudience] = useState("Families");
  const [tone, setTone] = useState("Friendly");
  const [notes, setNotes] = useState("");

  // Load draft on mount
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setOffer(d.offer || "");
      setCategory(d.category || "TV");
      setAudience(d.audience || "Families");
      setTone(d.tone || "Friendly");
      setNotes(d.notes || "");
    }
    // Suggest festive tone if festival is near
    const fest = upcomingFestival();
    if (fest && !d) setTone("Festive");
  }, []);

  // Apply prefill from IdeaRadar
  useEffect(() => {
    if (!prefill) return;
    if (prefill.offer !== undefined) setOffer(prefill.offer);
    if (prefill.category) setCategory(prefill.category);
    if (prefill.tone) setTone(prefill.tone);
    if (prefill.special_notes !== undefined) setNotes(prefill.special_notes);
  }, [prefill]);

  // Auto-save draft
  useEffect(() => {
    const t = setTimeout(() => saveDraft({ offer, category, audience, tone, notes }), 500);
    return () => clearTimeout(t);
  }, [offer, category, audience, tone, notes]);

  const canSubmit = offer.trim().length >= 3 && !loading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onGenerate({
      offer: offer.trim(),
      category,
      audience,
      tone,
      special_notes: notes.trim(),
    });
  };

  const fest = upcomingFestival();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fest && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 text-orange-800 px-5 py-3.5 rounded-2xl shadow-sm transition-all animate-fade-in-up">
          <Sparkle size={20} strokeWidth={2.5} className="text-orange-500 animate-pulse" />
          <span className="text-sm font-semibold tracking-wide">
            {fest.name} is {fest.daysAway === 0 ? "today" : `${fest.daysAway} days away`} — Festive tone suggested
          </span>
        </div>
      )}

      {/* Offer with voice */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2.5 uppercase tracking-wider">
          Offer / Product Description <span className="text-red-500">*</span>
        </label>
        <div className="flex items-start gap-2 bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200 focus-within:border-[#0B3D91]/50 focus-within:ring-4 focus-within:ring-[#0B3D91]/10 focus-within:bg-white transition-all duration-300 p-2 shadow-sm">
          <textarea
            data-testid={APP.offerInput}
            value={offer}
            onChange={(e) => setOffer(e.target.value.slice(0, 250))}
            placeholder="e.g. Samsung 43 inch Smart TV Festival Offer"
            maxLength={250}
            rows={3}
            className="flex-1 bg-transparent text-lg text-slate-800 placeholder:text-slate-400 p-2 focus:outline-none resize-none font-telugu"
          />
          <VoiceInput onResult={(t) => setOffer((prev) => (prev ? prev + " " + t : t).slice(0, 250))} disabled={loading} />
        </div>
        <p className="text-xs text-slate-400 mt-2 font-medium pl-1">{offer.length}/250 · Tip: Tap the mic to speak in Telugu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2.5 uppercase tracking-wider">Product Category</label>
          <select
            data-testid={APP.categorySelect}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-14 w-full bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200 focus:border-[#0B3D91]/50 focus:ring-4 focus:ring-[#0B3D91]/10 focus:bg-white outline-none px-4 text-base font-medium text-slate-800 transition-all duration-300 shadow-sm cursor-pointer"
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Audience */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2.5 uppercase tracking-wider">Target Audience</label>
          <select
            data-testid={APP.audienceSelect}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="h-14 w-full bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200 focus:border-[#0B3D91]/50 focus:ring-4 focus:ring-[#0B3D91]/10 focus:bg-white outline-none px-4 text-base font-medium text-slate-800 transition-all duration-300 shadow-sm cursor-pointer"
          >
            {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2.5 uppercase tracking-wider">Tone</label>
        <select
          data-testid={APP.toneSelect}
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="h-14 w-full bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200 focus:border-[#0B3D91]/50 focus:ring-4 focus:ring-[#0B3D91]/10 focus:bg-white outline-none px-4 text-base font-medium text-slate-800 transition-all duration-300 shadow-sm cursor-pointer"
        >
          {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2.5 uppercase tracking-wider">
          Special Notes <span className="text-slate-400 font-normal normal-case ml-1">(optional)</span>
        </label>
        <input
          data-testid={APP.notesInput}
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 150))}
          placeholder="e.g. Free Installation, No Cost EMI, Exchange Available"
          className="h-14 w-full bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200 focus:border-[#0B3D91]/50 focus:ring-4 focus:ring-[#0B3D91]/10 focus:bg-white outline-none px-4 text-base text-slate-800 transition-all duration-300 shadow-sm font-telugu"
        />
      </div>

      <button
        type="submit"
        data-testid={APP.generateBtn}
        disabled={!canSubmit}
        className="w-full mt-4 py-4 px-4 bg-gradient-to-r from-[#0B3D91] to-blue-600 text-white rounded-2xl font-bold text-lg shadow-[0_4px_20px_rgba(11,61,145,0.3)] hover:shadow-[0_8px_25px_rgba(11,61,145,0.4)] hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 font-heading"
      >
        <Sparkles size={24} strokeWidth={2.5} className={loading ? "animate-spin" : ""} />
        {loading ? "Generating Magic..." : "Generate AI Content"}
      </button>
    </form>
  );
};