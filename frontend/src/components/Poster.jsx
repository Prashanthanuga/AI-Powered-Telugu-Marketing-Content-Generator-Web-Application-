import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { SHOP, TEMPLATES } from "@/utils/constants";
import { Phone, MapPin } from "lucide-react";

/**
 * Measure-based auto-fit headline. Iteratively shrinks font size and
 * enables wrapping until it fits inside the parent container.
 */
const FitHeadline = ({ text, maxPx = 56, minPx = 18, className = "" }) => {
  const ref = useRef(null);
  const [size, setSize] = useState(maxPx);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let s = maxPx;
    el.style.fontSize = `${s}px`;
    // Shrink until width + height fit the container
    const parent = el.parentElement;
    if (!parent) return;
    // Give it 3-line max height budget
    const maxHeight = s * 3.2;
    let guard = 40;
    while (guard-- > 0 && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > maxHeight) && s > minPx) {
      s -= 2;
      el.style.fontSize = `${s}px`;
    }
    setSize(s);
  }, [text, maxPx, minPx]);

  return (
    <h1
      ref={ref}
      className={`font-black leading-[1.05] tracking-tight break-words ${className}`}
      style={{ fontSize: `${size}px`, wordBreak: "break-word", hyphens: "auto" }}
    >
      {text || "మీ కోసం ప్రత్యేక ఆఫర్"}
    </h1>
  );
};

/**
 * Auto-fit uploaded photo — img is always contained inside the placeholder
 * (object-fit: contain) and the user's zoom/offset transform layers on top.
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

  return (
    <div
      ref={ref}
      className={`relative ${dims} w-full rounded-2xl overflow-hidden shadow-xl ${tpl.className} grain`}
      style={{ fontFamily: "'Anek Telugu', 'Noto Sans Telugu', sans-serif" }}
    >
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-black/10 blur-3xl" />

      <div className={`relative z-10 h-full w-full flex flex-col p-6 md:p-8 ${isLightBg ? "text-slate-900" : "text-white"}`}>
        {/* Brand strip top */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${isLightBg ? "text-[#F59E0B]" : "text-yellow-300"}`}>
              {tpl.nameT}
            </div>
            <div className={`text-base md:text-lg font-extrabold mt-0.5 leading-tight ${isLightBg ? "text-[#0B3D91]" : ""}`}>
              T.V Reddy Electronics
            </div>
          </div>
          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center ${isLightBg ? "bg-[#0B3D91]" : "bg-white/20 backdrop-blur border border-white/30"}`}>
            <span className="text-lg md:text-xl font-black text-white">T</span>
          </div>
        </div>

        {/* Product image — auto-contained placeholder */}
        {productImage && (
          <div className="my-3 flex-1 flex items-center justify-center min-h-0 overflow-hidden rounded-xl">
            <div className="relative h-full w-full flex items-center justify-center">
              <img
                src={productImage}
                alt="product"
                crossOrigin="anonymous"
                className="max-h-full max-w-full object-contain drop-shadow-2xl"
                style={{
                  transform: `translate(${imgTransform.offsetX}%, ${imgTransform.offsetY}%) scale(${imgTransform.zoom})`,
                  transformOrigin: "center",
                  transition: "transform 120ms ease-out",
                }}
              />
            </div>
          </div>
        )}
        {!productImage && <div className="flex-1" />}

        {/* Headline + Sub */}
        <div className="mt-auto">
          <FitHeadline
            text={content?.poster_headline || ""}
            maxPx={isStory ? 60 : 48}
            minPx={18}
            className={headlineColor}
          />
          <p className={`mt-2 text-sm md:text-lg font-medium ${subColor} leading-snug break-words`}>
            {content?.poster_subtitle || "T.V Reddy Electronics లో ఇప్పుడే సందర్శించండి"}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#F59E0B] text-white text-xs md:text-sm font-bold shadow-lg">
              {content?.cta || "ఇప్పుడే సందర్శించండి"}
            </div>
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-1">
                <img src={qrDataUrl} alt="QR" className="h-16 w-16 md:h-20 md:w-20 rounded-md bg-white p-1 shadow-md" />
                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wide ${isLightBg ? "text-slate-600" : "text-white/80"}`}>
                  {qrMode === "maps" ? "Scan for Map" : "Scan for WhatsApp"}
                </span>
              </div>
            )}
          </div>

          {/* Brand footer */}
          <div className={`mt-4 pt-3 border-t ${isLightBg ? "border-slate-300" : "border-white/30"} flex items-center justify-between gap-2 text-[11px] md:text-sm font-semibold`}>
            <div className="flex items-center gap-1.5">
              <Phone size={14} strokeWidth={2.5} />
              <span>{SHOP.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} strokeWidth={2.5} />
              <span>Thorrur, Telangana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Poster.displayName = "Poster";

