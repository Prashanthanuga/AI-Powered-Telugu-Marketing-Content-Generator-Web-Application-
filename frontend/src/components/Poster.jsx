import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { SHOP, TEMPLATES } from "@/utils/constants";
import { Phone, MapPin } from "lucide-react";

/**
 * Measure-based auto-fit headline. Shrinks font-size until the text fits
 * BOTH the available width AND the parent height budget.
 */
const FitHeadline = ({ text, maxPx = 40, minPx = 14, maxLines = 3, className = "" }) => {
  const ref = useRef(null);
  const [size, setSize] = useState(maxPx);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    let s = maxPx;
    el.style.fontSize = `${s}px`;

    let guard = 60;
    while (guard-- > 0 && s > minPx) {
      const parentH = parent.clientHeight;
      const lineH = s * 1.12;
      const budget = Math.min(parentH, lineH * maxLines);
      if (el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= budget + 1) break;
      s -= 1;
      el.style.fontSize = `${s}px`;
    }
    setSize(s);
  }, [text, maxPx, minPx, maxLines]);

  return (
    <h1
      ref={ref}
      className={`font-black leading-[1.08] tracking-tight ${className}`}
      style={{
        fontSize: `${size}px`,
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        hyphens: "auto",
      }}
    >
      {text || "మీ కోసం ప్రత్యేక ఆఫర్"}
    </h1>
  );
};

/**
 * Fixed proportional layout so headline never overlaps image or footer:
 *   ~9%  brand strip
 *   ~40% product image (only if uploaded)
 *   ~35% headline + subtitle
 *   ~16% CTA + QR + phone/location footer
 */
export const Poster = React.forwardRef(({
  template,
  content,
  productImage,
  size = "square",
  qrMode = "off",
  imgTransform = { zoom: 1, offsetX: 0, offsetY: 0 },
}, ref) => {
  const tpl = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];
  const isStory = size === "story";
  const dims = isStory ? "aspect-[9/16]" : "aspect-square";
  const isLightBg = template === "spotlight";

  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (qrMode === "off") { setQrDataUrl(""); return; }
    const target =
      qrMode === "maps"
        ? SHOP.maps
        : `https://wa.me/${SHOP.phoneIntl}?text=${encodeURIComponent("Namaste, T.V Reddy Electronics gurinchi vivaralu kavali.")}`;
    QRCode.toDataURL(target, { margin: 1, width: 240, color: { dark: "#0F172A", light: "#FFFFFF" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrMode]);

  const headlineColor = isLightBg ? "text-[#0B3D91]" : "text-white";
  const subColor = isLightBg ? "text-slate-700" : "text-white/90";
  const footerBorder = isLightBg ? "border-slate-300" : "border-white/30";

  const hasImage = Boolean(productImage);
  // Percentage-based row budget (content area between top brand and bottom footer)
  const imageBasis = hasImage ? (isStory ? "40%" : "36%") : "0%";
  const textBasis = hasImage ? (isStory ? "36%" : "40%") : "100%";
  const headlineMax = isStory ? 46 : 38;

  return (
    <div
      ref={ref}
      className={`relative ${dims} w-full rounded-2xl overflow-hidden shadow-xl ${tpl.className} grain`}
      style={{ fontFamily: "'Anek Telugu', 'Noto Sans Telugu', sans-serif" }}
    >
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-black/10 blur-3xl" />

      <div className={`relative z-10 h-full w-full flex flex-col p-5 md:p-6 ${isLightBg ? "text-slate-900" : "text-white"}`}>
        {/* Row 1: brand strip */}
        <header className="shrink-0">
          <div className={`text-[9px] md:text-[11px] font-bold uppercase tracking-widest ${isLightBg ? "text-[#F59E0B]" : "text-yellow-300"}`}>
            {tpl.nameT}
          </div>
          <div className={`text-sm md:text-base font-extrabold leading-tight mt-0.5 ${isLightBg ? "text-[#0B3D91]" : ""}`}>
            T.V Reddy Electronics
          </div>
        </header>

        {/* Row 2: product image */}
        {hasImage && (
          <div
            className="flex items-center justify-center overflow-hidden rounded-xl my-2 shrink-0"
            style={{ flexBasis: imageBasis, minHeight: 0 }}
          >
            <img
              src={productImage}
              alt="product"
              className="max-h-full max-w-full object-contain drop-shadow-xl"
              style={{
                transform: `translate(${imgTransform.offsetX}%, ${imgTransform.offsetY}%) scale(${imgTransform.zoom})`,
                transformOrigin: "center",
                transition: "transform 120ms ease-out",
              }}
            />
          </div>
        )}

        {/* Row 3: headline + subtitle (flexible, absorbs remaining space) */}
        <div
          className="flex flex-col justify-end overflow-hidden min-h-0"
          style={{ flexBasis: textBasis, flexGrow: 1 }}
        >
          <FitHeadline
            text={content?.poster_headline || ""}
            maxPx={headlineMax}
            minPx={14}
            maxLines={hasImage ? 2 : 3}
            className={headlineColor}
          />
          <p
            className={`mt-1.5 text-xs md:text-sm font-medium ${subColor} leading-snug`}
            style={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {content?.poster_subtitle || "తొర్రూరులో ఇప్పుడే సందర్శించండి"}
          </p>
        </div>

        {/* Row 4: CTA + QR */}
        <div className="shrink-0 mt-2 flex items-end justify-between gap-3">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#F59E0B] text-white text-[11px] md:text-xs font-bold shadow-lg max-w-[65%]">
            <span className="truncate">{content?.cta || "ఇప్పుడే సందర్శించండి"}</span>
          </div>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <img src={qrDataUrl} alt="QR" className="h-14 w-14 md:h-16 md:w-16 rounded-md bg-white p-1 shadow-md" />
              <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-wide ${isLightBg ? "text-slate-600" : "text-white/80"}`}>
                {qrMode === "maps" ? "Scan · Map" : "Scan · WhatsApp"}
              </span>
            </div>
          )}
        </div>

        {/* Row 5: phone + location footer */}
        <footer className={`shrink-0 mt-2 pt-2 border-t ${footerBorder} flex items-center justify-between gap-2 text-[10px] md:text-xs font-semibold`}>
          <div className="flex items-center gap-1">
            <Phone size={12} strokeWidth={2.5} />
            <span>{SHOP.phone}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={12} strokeWidth={2.5} />
            <span>తొర్రూరు, తెలంగాణ</span>
          </div>
        </footer>
      </div>
    </div>
  );
});

Poster.displayName = "Poster";
