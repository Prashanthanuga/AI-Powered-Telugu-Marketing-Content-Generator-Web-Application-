import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Poster } from "./Poster";
import { TEMPLATES } from "@/utils/constants";
import { Download, Upload, Trash2, RefreshCw, QrCode, FileText, ZoomIn, Move } from "lucide-react";
import { toast } from "sonner";
import { APP } from "@/constants/testIds";
import { devError } from "@/utils/logger";

const captureCanvas = async (node, scale) => {
  if (document.fonts?.ready) await document.fonts.ready;
  // Wait for all <img> inside the node to fully decode so html2canvas captures them
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(imgs.map((img) => {
    if (img.complete && img.naturalWidth) return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    return new Promise((res) => {
      img.onload = () => res();
      img.onerror = () => res();
    });
  }));
  return html2canvas(node, { scale, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
};

export const PosterEditor = ({ content, setContent }) => {
  const [template, setTemplate] = useState("festival");
  const [size, setSize] = useState("square");
  const [productImage, setProductImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [qrMode, setQrMode] = useState("maps"); // off | maps | whatsapp
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const posterRef = useRef(null);
  const fileInputRef = useRef(null);

  const imgTransform = { zoom, offsetX, offsetY };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setProductImage(reader.result);
      setZoom(1); setOffsetX(0); setOffsetY(0);
    };
    reader.readAsDataURL(file);
  };

  const download = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const scale = size === "story" ? 2.25 : 2.7;
      const canvas = await captureCanvas(posterRef.current, scale);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.download = `tvreddy-${template}-${size}-${stamp}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Poster PNG downloaded!");
    } catch (e) {
      devError(e);
      toast.error("Poster download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const downloadPdf = async () => {
    if (!posterRef.current) return;
    setPdfBusy(true);
    try {
      const canvas = await captureCanvas(posterRef.current, 2.5);
      const img = canvas.toDataURL("image/png");
      const isStory = size === "story";
      const w = isStory ? 108 : 200;
      const h = isStory ? 192 : 200;
      const pdf = new jsPDF({ orientation: isStory ? "portrait" : "portrait", unit: "mm", format: [w, h] });
      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save(`tvreddy-${template}-${size}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Poster PDF downloaded!");
    } catch (e) {
      devError(e);
      toast.error("PDF export failed. Please try again.");
    } finally {
      setPdfBusy(false);
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
        <button type="button" onClick={() => setSize("square")}
          className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-colors ${size === "square" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-700"}`}>
          Square (1080×1080)
        </button>
        <button type="button" onClick={() => setSize("story")}
          className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-colors ${size === "story" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-700"}`}>
          Story (1080×1920)
        </button>
      </div>

      {/* Editable text */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Headline</label>
          <input value={content?.poster_headline || ""} onChange={(e) => setContent({ ...content, poster_headline: e.target.value })}
            className="w-full h-11 bg-white rounded-lg border border-slate-200 px-3 text-base font-telugu focus:outline-none focus:border-[#0B3D91]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Subtitle</label>
          <input value={content?.poster_subtitle || ""} onChange={(e) => setContent({ ...content, poster_subtitle: e.target.value })}
            className="w-full h-11 bg-white rounded-lg border border-slate-200 px-3 text-base font-telugu focus:outline-none focus:border-[#0B3D91]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Call to Action</label>
          <input value={content?.cta || ""} onChange={(e) => setContent({ ...content, cta: e.target.value })}
            className="w-full h-11 bg-white rounded-lg border border-slate-200 px-3 text-base font-telugu focus:outline-none focus:border-[#0B3D91]" />
        </div>
      </div>

      {/* QR toggle */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
          <QrCode size={16} strokeWidth={2.5} /> QR Code
        </label>
        <div className="grid grid-cols-3 gap-2" data-testid={APP.qrToggle}>
          {[
            { v: "off", label: "None" },
            { v: "maps", label: "Google Maps" },
            { v: "whatsapp", label: "WhatsApp" },
          ].map((opt) => (
            <button key={opt.v} type="button" onClick={() => setQrMode(opt.v)}
              data-testid={`qr-${opt.v}`}
              className={`h-11 rounded-xl font-semibold text-sm transition-colors ${qrMode === opt.v ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-700"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product image upload + crop controls */}
      <div className="flex gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-12 bg-white border-2 border-dashed border-slate-300 hover:border-[#0B3D91] rounded-xl flex items-center justify-center gap-2 text-slate-700 font-semibold text-sm transition-colors">
          <Upload size={18} strokeWidth={2.5} />
          {productImage ? "Change Product Image" : "Upload Product Image"}
        </button>
        {productImage && (
          <button type="button" onClick={() => setProductImage(null)}
            className="h-12 w-12 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition-colors" aria-label="Remove image">
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
      </div>

      {productImage && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
              <ZoomIn size={14} strokeWidth={2.5} /> Zoom ({zoom.toFixed(2)}x)
            </label>
            <input type="range" min="0.5" max="2.5" step="0.05" value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              data-testid={APP.imgZoom} className="w-full accent-[#0B3D91]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                <Move size={14} strokeWidth={2.5} /> Horizontal ({offsetX}%)
              </label>
              <input type="range" min="-30" max="30" step="1" value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
                data-testid={APP.imgOffsetX} className="w-full accent-[#0B3D91]" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                <Move size={14} strokeWidth={2.5} /> Vertical ({offsetY}%)
              </label>
              <input type="range" min="-30" max="30" step="1" value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
                data-testid={APP.imgOffsetY} className="w-full accent-[#0B3D91]" />
            </div>
          </div>
          <button type="button" onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-[#0B3D91]">
            Reset image
          </button>
        </div>
      )}

      {/* Preview */}
      <div className="bg-slate-100 rounded-2xl p-4">
        <div className="max-w-md mx-auto" data-testid={APP.posterPreview}>
          <Poster
            ref={posterRef}
            template={template}
            content={content}
            productImage={productImage}
            size={size}
            qrMode={qrMode}
            imgTransform={imgTransform}
          />
        </div>
      </div>

      {/* Download */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={download} disabled={downloading}
          data-testid={APP.downloadPosterBtn}
          className="h-14 bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-slate-300 text-white text-base font-bold rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          {downloading ? <RefreshCw size={20} strokeWidth={2.5} className="animate-spin" /> : <Download size={20} strokeWidth={2.5} />}
          {downloading ? "Preparing..." : "Download PNG"}
        </button>
        <button type="button" onClick={downloadPdf} disabled={pdfBusy}
          data-testid={APP.downloadPdfBtn}
          className="h-14 bg-[#0B3D91] hover:bg-[#093070] disabled:bg-slate-300 text-white text-base font-bold rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          {pdfBusy ? <RefreshCw size={20} strokeWidth={2.5} className="animate-spin" /> : <FileText size={20} strokeWidth={2.5} />}
          {pdfBusy ? "Preparing..." : "Download PDF"}
        </button>
      </div>
    </div>
  );
};
