import React from "react";
import { Copy, Share2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SHOP } from "@/utils/constants";
import { APP } from "@/constants/testIds";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PosterEditor } from "./PosterEditor";

const copy = async (text, label = "Content") => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  } catch { toast.error("Copy failed"); }
};

const shareWhatsApp = (text) => {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

const OutputCard = ({ title, text, testIdCopy, secondary }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-bold text-slate-900 font-heading">{title}</h3>
      <span className="text-xs text-slate-500">{text.length} chars</span>
    </div>
    <div className="bg-slate-50 rounded-xl p-4 whitespace-pre-wrap text-base text-slate-800 font-telugu leading-relaxed border border-slate-100 max-h-[350px] overflow-y-auto">
      {text || <span className="text-slate-400">No content generated.</span>}
    </div>
    <div className="mt-4 flex gap-2">
      <button
        onClick={() => copy(text, title)}
        data-testid={testIdCopy}
        className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Copy size={18} strokeWidth={2.5} /> Copy
      </button>
      {secondary}
    </div>
  </div>
);

export const ContentTabs = ({ content, setContent, onRegenerate, regenerating }) => {
  if (!content) return null;

  const hashtagsText = (content.hashtags || []).map(h => h.startsWith("#") ? h : "#" + h).join(" ");
  const fbFull = content.facebook + (hashtagsText ? "\n\n" + hashtagsText : "");
  const igFull = content.instagram + (hashtagsText ? "\n\n" + hashtagsText : "");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 font-heading">Your Marketing Content</h2>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          data-testid={APP.regenerateBtn}
          className="h-11 px-4 bg-white border-2 border-slate-200 hover:border-[#0B3D91] text-slate-700 hover:text-[#0B3D91] font-semibold rounded-xl flex items-center gap-2 text-sm transition-colors"
        >
          <RefreshCw size={16} strokeWidth={2.5} className={regenerating ? "animate-spin" : ""} />
          Regenerate
        </button>
      </div>

      {content.best_post_time && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm font-semibold">
          Best time to post today: <span className="font-bold">{content.best_post_time}</span>
        </div>
      )}

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList data-testid={APP.tabsList} className="grid grid-cols-4 h-auto bg-slate-100 p-1.5 rounded-xl">
          <TabsTrigger data-testid={APP.tabWhatsapp} value="whatsapp" className="h-11 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0B3D91] data-[state=active]:shadow-sm">WhatsApp</TabsTrigger>
          <TabsTrigger data-testid={APP.tabSocial} value="social" className="h-11 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0B3D91] data-[state=active]:shadow-sm">FB & IG</TabsTrigger>
          <TabsTrigger data-testid={APP.tabTagline} value="tagline" className="h-11 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0B3D91] data-[state=active]:shadow-sm">Tagline</TabsTrigger>
          <TabsTrigger data-testid={APP.tabPoster} value="poster" className="h-11 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0B3D91] data-[state=active]:shadow-sm">Poster</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="mt-4">
          <OutputCard
            title="WhatsApp Message"
            text={content.whatsapp || ""}
            testIdCopy={APP.copyWhatsappBtn}
            secondary={
              <button
                onClick={() => shareWhatsApp(content.whatsapp)}
                data-testid={APP.shareWhatsappBtn}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 size={18} strokeWidth={2.5} /> Share to WhatsApp
              </button>
            }
          />
        </TabsContent>

        <TabsContent value="social" className="mt-4 space-y-4">
          <OutputCard title="Facebook Caption" text={fbFull} testIdCopy={APP.copyFacebookBtn} />
          <OutputCard title="Instagram Caption" text={igFull} testIdCopy={APP.copyInstagramBtn} />
          {hashtagsText && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-lg font-bold text-slate-900 mb-3 font-heading">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {(content.hashtags || []).map((h, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 text-[#0B3D91] rounded-full text-sm font-semibold font-telugu">
                    {h.startsWith("#") ? h : "#" + h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tagline" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-3">Telugu Tagline</div>
            <div className="text-3xl md:text-4xl font-black text-[#0B3D91] font-heading leading-tight py-6">
              {content.tagline || "—"}
            </div>
            <div className="text-sm text-slate-500 mb-5">— {SHOP.shortName}</div>
            <button
              onClick={() => copy(content.tagline, "Tagline")}
              data-testid={APP.copyTaglineBtn}
              className="h-12 px-6 mx-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <Copy size={18} strokeWidth={2.5} /> Copy Tagline
            </button>
          </div>
        </TabsContent>

        <TabsContent value="poster" className="mt-4">
          <PosterEditor content={content} setContent={setContent} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
