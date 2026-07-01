import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Poster } from "./Poster";
import { TEMPLATES, SHOP } from "@/utils/constants";
import { Download, Upload, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { APP } from "@/constants/testIds";

export const PosterEditor = ({ content, setContent }) => {
  const [template, setTemplate] = useState("festival");
  const [size, setSize] = useState("square");
  const [productImage, setProductImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setProductImage(reader.result);
    reader.readAsDataURL(file);
  };

  const download = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      // Wait for fonts to load before capture
      if (document.fonts?.ready) await document.fonts.ready;
      const scale = size === "story" ? 2.25 : 2.7; // ~1080px target
      const canvas = await html2canvas(posterRef.current, {
        scale,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.download = `tvreddy-${template}-${size}-${stamp}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Poster downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Poster download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Template selector */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Choose Template</label>
        <div className="grid grid-cols-3 gap-2" data-testid={APP.templateSelect}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              data-testid={`template-${t.id}`}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                template === t.id
                  ? "border-[#0B3D91] bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className={`h-8 w-full rounded ${t.className} mb-1.5`} />
              <div className="text-xs font-bold text-slate-900">{t.name}</div>
              <div className="text-[10px] text-slate-500 font-telugu truncate">{t.nameT}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Size toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSize("square")}
          className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-colors ${
            size === "square" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Square (1080×1080)
        </button>
        <button
          type="button"
          onClick={() => setSize("story")}
          className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-colors ${
            size === "story" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Story (1080×1920)
        </button>
      </div>

      {/* Editable fields */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Headline</label>
          <input
            value={content?.poster_headline || ""}
            onChange={(e) => setContent({ ...content, poster_headline: e.target.value })}
            className="w-full h-11 bg-white rounded-lg border border-slate-200 px-3 text-base font-telugu focus:outline-none focus:border-[#0B3D91]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Subtitle</label>
          <input
            value={content?.poster_subtitle || ""}
            onChange={(e) => setContent({ ...content, poster_subtitle: e.target.value })}
            className="w-full h-11 bg-white rounded-lg border border-slate-200 px-3 text-base font-telugu focus:outline-none focus:border-[#0B3D91]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Call to Action</label>
          <input
            value={content?.cta || ""}
            onChange={(e) => setContent({ ...content, cta: e.target.value })}
            className="w-full h-11 bg-white rounded-lg border border-slate-200 px-3 text-base font-telugu focus:outline-none focus:border-[#0B3D91]"
          />
        </div>
      </div>

      {/* Product image upload */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-12 bg-white border-2 border-dashed border-slate-300 hover:border-[#0B3D91] rounded-xl flex items-center justify-center gap-2 text-slate-700 font-semibold text-sm transition-colors"
        >
          <Upload size={18} strokeWidth={2.5} />
          {productImage ? "Change Product Image" : "Upload Product Image"}
        </button>
        {productImage && (
          <button
            type="button"
            onClick={() => setProductImage(null)}
            className="h-12 w-12 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition-colors"
            aria-label="Remove image"
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
      </div>

      {/* Poster preview */}
      <div className="bg-slate-100 rounded-2xl p-4">
        <div className="max-w-md mx-auto" data-testid={APP.posterPreview}>
          <Poster ref={posterRef} template={template} content={content} productImage={productImage} size={size} />
        </div>
      </div>

      {/* Download */}
      <button
        type="button"
        onClick={download}
        disabled={downloading}
        data-testid={APP.downloadPosterBtn}
        className="h-14 w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-slate-300 text-white text-lg font-bold rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-heading"
      >
        {downloading ? <RefreshCw size={22} strokeWidth={2.5} className="animate-spin" /> : <Download size={22} strokeWidth={2.5} />}
        {downloading ? "Preparing PNG..." : "Download Poster (PNG)"}
      </button>
    </div>
  );
};
