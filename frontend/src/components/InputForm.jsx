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
    // Smooth scroll form into view
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {fest && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-900 px-4 py-3 rounded-xl">
          <Sparkle size={18} strokeWidth={2.5} />
          <span className="text-sm font-semibold">
            {fest.name} is {fest.daysAway === 0 ? "today" : `${fest.daysAway} days away`} — Festive tone suggested
          </span>
        </div>
      )}

      {/* Offer with voice */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
          Offer / Product Description <span className="text-red-600">*</span>
        </label>
        <div className="flex items-start gap-2 bg-slate-50 rounded-xl border-2 border-slate-200 focus-within:border-[#0B3D91] focus-within:bg-white transition-colors p-2">
          <textarea
            data-testid={APP.offerInput}
            value={offer}
            onChange={(e) => setOffer(e.target.value.slice(0, 250))}
            placeholder="e.g. Samsung 43 inch Smart TV Festival Offer"
            maxLength={250}
            rows={3}
            className="flex-1 bg-transparent text-lg text-slate-900 placeholder:text-slate-400 p-2 focus:outline-none resize-none font-telugu"
          />
          <VoiceInput onResult={(t) => setOffer((prev) => (prev ? prev + " " + t : t).slice(0, 250))} disabled={loading} />
        </div>
        <p className="text-xs text-slate-500 mt-1">{offer.length}/250 · Tip: Tap the mic to speak in Telugu</p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Product Category</label>
        <select
          data-testid={APP.categorySelect}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-14 w-full bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-[#0B3D91] focus:bg-white outline-none px-4 text-lg text-slate-900 transition-colors"
        >
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Audience */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Target Audience</label>
        <select
          data-testid={APP.audienceSelect}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="h-14 w-full bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-[#0B3D91] focus:bg-white outline-none px-4 text-lg text-slate-900 transition-colors"
        >
          {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Tone</label>
        <select
          data-testid={APP.toneSelect}
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="h-14 w-full bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-[#0B3D91] focus:bg-white outline-none px-4 text-lg text-slate-900 transition-colors"
        >
          {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
          Special Notes <span className="text-slate-400 font-normal normal-case">(optional)</span>
        </label>
        <input
          data-testid={APP.notesInput}
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 150))}
          placeholder="e.g. Free Installation, No Cost EMI, Exchange Available"
          className="h-14 w-full bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-[#0B3D91] focus:bg-white outline-none px-4 text-lg text-slate-900 transition-colors font-telugu"
        />
      </div>

      <button
        type="submit"
        data-testid={APP.generateBtn}
        disabled={!canSubmit}
        className="h-16 w-full bg-[#0B3D91] hover:bg-[#093070] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xl font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-heading"
      >
        <Sparkles size={24} strokeWidth={2.5} />
        {loading ? "Generating..." : "Generate AI Content"}
      </button>
    </form>
  );
};
