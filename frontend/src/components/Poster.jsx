import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { SHOP, TEMPLATES } from "@/utils/constants";

/**
 * Measure-based auto-fit headline. Shrinks font-size until the text fits
 * both the available width AND the parent height budget.
 * Working in a fixed 1080-px design canvas, so measurements are stable.
 */
const FitHeadline = ({ text, maxPx, minPx = 44, maxLines = 3, color = "#fff" }) => {
  const ref = useRef(null);
  const [size, setSize] = useState(maxPx);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    let s = maxPx;
    el.style.fontSize = `${s}px`;

    let guard = 100;
    while (guard-- > 0 && s > minPx) {
      const parentH = parent.clientHeight;
      const lineH = s * 1.1;
      const budget = Math.min(parentH, lineH * maxLines);
      if (el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= budget + 1) break;
      s -= 2;
      el.style.fontSize = `${s}px`;
    }
    setSize(s);
  }, [text, maxPx, minPx, maxLines]);

  return (
    <h1
      ref={ref}
      style={{
        fontSize: `${size}px`,
        fontWeight: 900,
        lineHeight: 1.08,
        letterSpacing: "-0.01em",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        color,
        margin: 0,
      }}
    >
      {text || "మీ కోసం ప్రత్యేక ఆఫర్"}
    </h1>
  );
};

/**
 * JS-measured line-clamp. Replaces CSS -webkit-line-clamp, which html2canvas
 * does not render correctly (causes overlapping/cut-off text in downloaded PNG/PDF
 * even though the live preview looks fine, since real browsers support it natively).
 * This measures actual rendered height and truncates with an ellipsis, producing
 * plain flowing text + overflow:hidden — both of which html2canvas handles correctly.
 */
const ClampText = ({ text, maxLines = 2, style }) => {
  const ref = useRef(null);
  const [display, setDisplay] = useState(text);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !text) {
      setDisplay(text || "");
      return;
    }
    el.textContent = text;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
    const maxHeight = lineHeight * maxLines;

    if (el.scrollHeight <= maxHeight + 1) {
      setDisplay(text);
      return;
    }

    let lo = 0, hi = text.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      el.textContent = text.slice(0, mid).trimEnd() + "…";
      if (el.scrollHeight <= maxHeight + 1) lo = mid; else hi = mid - 1;
    }
    const truncated = text.slice(0, lo).trimEnd();
    setDisplay(truncated.length < text.length ? truncated + "…" : truncated);
  }, [text, maxLines]);

  return <p ref={ref} style={{ ...style, overflow: "hidden" }}>{display}</p>;
};

/**
 * Poster renders at FIXED 1080x1080 (square) or 1080x1920 (story) logical pixels.
 * The caller can visually scale it down using CSS `transform: scale()` for preview,
 * while download captures the un-transformed 1:1 DOM for pixel-perfect PNG/PDF output.
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
  const W = 1080;
  const H = isStory ? 1920 : 1080;
  const isLightBg = template === "spotlight";

  const [qrDataUrl, setQrDataUrl] = useState("");
  useEffect(() => {
    if (qrMode === "off") { setQrDataUrl(""); return; }
    const target =
      qrMode === "maps"
        ? SHOP.maps
        : `https://wa.me/${SHOP.phoneIntl}?text=${encodeURIComponent("Namaste, T.V Reddy Electronics gurinchi vivaralu kavali.")}`;
    QRCode.toDataURL(target, { margin: 1, width: 400, color: { dark: "#0F172A", light: "#FFFFFF" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrMode]);

  const fg = isLightBg ? "#0F172A" : "#FFFFFF";
  const subFg = isLightBg ? "#334155" : "rgba(255,255,255,0.9)";
  const accent = isLightBg ? "#F59E0B" : "#FCD34D";
  const borderColor = isLightBg ? "rgba(15,23,42,0.15)" : "rgba(255,255,255,0.3)";

  const hasImage = Boolean(productImage);
  const imageBasis = hasImage ? (isStory ? "40%" : "36%") : "0%";
  const textBasis = hasImage ? (isStory ? "36%" : "40%") : "100%";
  const headlineMax = isStory ? 110 : 90;
  const headlineMin = 44;

  const pad = 64;

  return (
    <div
      ref={ref}
      className={tpl.className}
      style={{
        position: "relative",
        width: `${W}px`,
        height: `${H}px`,
        borderRadius: "36px",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        fontFamily: "'Anek Telugu', 'Noto Sans Telugu', 'Gautami', sans-serif",
        color: fg,
      }}
    >
      {/* Decorative blur circles */}
      <div style={{ position: "absolute", top: -160, right: -160, width: 480, height: 480, borderRadius: "50%", background: "rgba(255,255,255,0.10)", filter: "blur(48px)" }} />
      <div style={{ position: "absolute", bottom: -200, left: -200, width: 560, height: 560, borderRadius: "50%", background: "rgba(0,0,0,0.10)", filter: "blur(64px)" }} />

      <div style={{ position: "relative", zIndex: 10, height: "100%", width: "100%", padding: pad, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        {/* Row 1: Brand strip */}
        <header style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent }}>
            {tpl.nameT}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4, letterSpacing: "-0.01em" }}>
            T.V Reddy Electronics
          </div>
        </header>

        {/* Row 2: Product image */}
        {hasImage && (
          <div
            style={{
              flexBasis: imageBasis,
              flexShrink: 0,
              minHeight: 0,
              marginTop: 24,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius: 20,
            }}
          >
            <img
              src={productImage}
              alt="product"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.25))",
                transform: `translate(${imgTransform.offsetX}%, ${imgTransform.offsetY}%) scale(${imgTransform.zoom})`,
                transformOrigin: "center",
              }}
            />
          </div>
        )}

        {/* Row 3: Headline + subtitle */}
        <div
          style={{
            flexBasis: textBasis,
            flexGrow: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          <FitHeadline
            text={content?.poster_headline || ""}
            maxPx={headlineMax}
            minPx={headlineMin}
            maxLines={hasImage ? 2 : 3}
            color={fg}
          />
          <ClampText
            text={content?.poster_subtitle || "తొర్రూరులో ఇప్పుడే సందర్శించండి"}
            maxLines={2}
            style={{
              marginTop: 16,
              fontSize: 28,
              fontWeight: 500,
              color: subFg,
              lineHeight: 1.35,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              margin: "16px 0 0 0",
            }}
          />
        </div>

        {/* Row 4: CTA + QR */}
        <div style={{ flexShrink: 0, marginTop: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "16px 28px",
              borderRadius: 999,
              background: "#F59E0B",
              color: "#FFFFFF",
              fontSize: 26,
              fontWeight: 800,
              boxShadow: "0 8px 16px rgba(0,0,0,0.20)",
              maxWidth: qrDataUrl ? "62%" : "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {content?.cta || "ఇప్పుడే సందర్శించండి"}
          </div>
          {qrDataUrl && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <img src={qrDataUrl} alt="QR" style={{ width: 150, height: 150, borderRadius: 12, background: "#FFFFFF", padding: 6, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }} />
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: isLightBg ? "#475569" : "rgba(255,255,255,0.85)" }}>
                {qrMode === "maps" ? "Scan · Map" : "Scan · WhatsApp"}
              </span>
            </div>
          )}
        </div>

        {/* Row 5: Phone + Location footer */}
        <footer
          style={{
            flexShrink: 0,
            marginTop: 24,
            paddingTop: 20,
            borderTop: `2px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            fontWeight: 700,
            gap: 16,
          }}
        >
          <span>📞 {SHOP.phone}</span>
          <span>📍 తొర్రూరు, తెలంగాణ</span>
        </footer>
      </div>
    </div>
  );
});

Poster.displayName = "Poster";