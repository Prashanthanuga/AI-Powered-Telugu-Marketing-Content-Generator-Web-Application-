import React from "react";
import { SHOP, TEMPLATES } from "@/utils/constants";
import { Phone, MapPin } from "lucide-react";

/**
 * Renders one of 6 poster designs.
 * Uses pure CSS/HTML — captured with html2canvas.
 */
export const Poster = React.forwardRef(({ template, content, productImage, size = "square" }, ref) => {
  const tpl = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];
  const isStory = size === "story";
  const dims = isStory ? "aspect-[9/16]" : "aspect-square";
  const isLightBg = template === "spotlight";

  return (
    <div
      ref={ref}
      className={`relative ${dims} w-full rounded-2xl overflow-hidden shadow-xl ${tpl.className} grain`}
      style={{ fontFamily: "'Anek Telugu', 'Noto Sans Telugu', sans-serif" }}
    >
      {/* Decorative elements */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-black/10 blur-3xl" />

      {/* Content */}
      <div className={`relative z-10 h-full w-full flex flex-col p-8 md:p-10 ${isLightBg ? "text-slate-900" : "text-white"}`}>
        {/* Brand strip top */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs md:text-sm font-bold uppercase tracking-widest ${isLightBg ? "text-[#F59E0B]" : "text-yellow-300"}`}>
              {tpl.nameT}
            </div>
            <div className={`text-lg md:text-xl font-extrabold mt-1 leading-tight ${isLightBg ? "text-[#0B3D91]" : ""}`}>
              T.V Reddy Electronics
            </div>
          </div>
          {!isLightBg && (
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
              <span className="text-2xl font-black">T</span>
            </div>
          )}
          {isLightBg && (
            <div className="h-12 w-12 rounded-full bg-[#0B3D91] flex items-center justify-center">
              <span className="text-2xl font-black text-white">T</span>
            </div>
          )}
        </div>

        {/* Product image */}
        {productImage && (
          <div className="my-4 flex-1 flex items-center justify-center min-h-0">
            <img
              src={productImage}
              alt="product"
              crossOrigin="anonymous"
              className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-xl"
            />
          </div>
        )}
        {!productImage && <div className="flex-1" />}

        {/* Headline */}
        <div className="mt-auto">
          <h1 className={`text-3xl md:text-5xl font-black leading-tight tracking-tight ${isLightBg ? "text-[#0B3D91]" : ""}`}>
            {content?.poster_headline || "మీ కోసం ప్రత్యేక ఆఫర్"}
          </h1>
          <p className={`mt-2 text-base md:text-xl font-medium ${isLightBg ? "text-slate-700" : "text-white/90"} leading-snug`}>
            {content?.poster_subtitle || "T.V Reddy Electronics లో ఇప్పుడే సందర్శించండి"}
          </p>

          {/* CTA badge */}
          <div className="mt-5 inline-flex items-center px-5 py-2.5 rounded-full bg-[#F59E0B] text-white text-sm md:text-base font-bold shadow-lg">
            {content?.cta || "ఇప్పుడే సందర్శించండి"}
          </div>

          {/* Brand footer */}
          <div className={`mt-6 pt-4 border-t ${isLightBg ? "border-slate-300" : "border-white/30"} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs md:text-sm font-semibold`}>
            <div className="flex items-center gap-1.5">
              <Phone size={16} strokeWidth={2.5} />
              <span>{SHOP.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={16} strokeWidth={2.5} />
              <span>Thorrur, Telangana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Poster.displayName = "Poster";
