# T.V Reddy Electronics — AI Telugu Marketing Generator

## Original Problem Statement
Build a mobile-first AI web app that helps T.V Reddy Electronics (Thorrur, Telangana 506163, Phone 9441066578) generate high-quality Telugu marketing content and branded posters in under 60 seconds. Owner enters offer, category, audience, tone, special notes → Gemini AI produces WhatsApp/Facebook/Instagram content, hashtags, Telugu tagline, best post time, editable branded poster. No login/payments. localStorage + persistent MongoDB history.

## Architecture
- **Frontend**: React 19 (CRA + craco), Tailwind, shadcn/ui, lucide-react, html2canvas, sonner toasts, Anek Telugu + Noto Sans Telugu fonts
- **Backend**: FastAPI + emergentintegrations LlmChat with `gemini-2.5-flash` via Emergent Universal Key
- **Storage**: MongoDB (server history) + browser localStorage (drafts, quick history)

## User Personas
- Primary: Shop owner (35-60, basic smartphone user, Telugu-first)
- Secondary: Family member helping with marketing (18-30)

## Core Requirements (Static)
- Telugu-only content (95% Telugu script, English only for brand/tech terms)
- Mobile-first, 48px+ touch targets, 18px+ base fonts
- Never invent prices/offers/warranty; never claim "best/lowest"
- 6 poster templates: Festival, EMI, Exchange, Repair, Spotlight, New Stock
- <60s total generation, <5s poster export

## Implemented (2026-02-XX — v1)
- Backend routes: POST /api/generate, POST /api/regenerate, POST /api/history, GET /api/history, DELETE /api/history/{id}
- 5-field input form with voice input (Telugu te-IN, graceful fallback)
- Progress bar (4 steps: Connecting → Generating → Quality Check → Poster)
- 4-tab output: WhatsApp / FB & IG / Tagline / Poster
- Copy buttons + Share-to-WhatsApp deep link (wa.me)
- Poster editor: 6 CSS templates, square/story sizes, editable headline/subtitle/CTA, product image upload, html2canvas PNG download
- History drawer with restore/delete, last-100 cap
- Festival helper (auto-suggests Festive tone within 7 days of Sankranti/Ugadi/Bonalu/Bathukamma/Dasara/Deepavali etc.)
- Similarity guard (warns if offer >80% similar to recent post)
- Draft auto-save to localStorage
- All data-testids in place; 100% pass on backend + frontend tests

## Prioritized Backlog
### P1
- Poster: add QR code (Google Maps + WhatsApp) generation
- Poster: multi-line auto font-fitting for very long headlines
- Better product image cropping/repositioning inside poster placeholder
### P2
- Poster: PDF export
- Bulk-generate weekly campaign (7 posts in one shot)
- Multi-language (Hindi/English) support via existing modular prompt
### P3
- Facebook/Instagram auto-post (V2 roadmap)
- Analytics dashboard, WhatsApp Business API

## Implemented (2026-02-XX — v1.1)
- **QR Code on Posters**: Toggle (None / Google Maps / WhatsApp) — generates scannable code embedded in the poster; QR links to `SHOP.maps` or `wa.me/919441066578`. Uses `qrcode` npm package.
- **Auto Font-Fit**: Poster headline now auto-shrinks (48px → 20px) and wraps for long Telugu strings; guaranteed no overflow within poster bounds.
- **PDF Export**: New "Download PDF" button alongside PNG; uses jsPDF with html2canvas capture. Square 200×200mm, Story 108×192mm.
- **Product Image Crop Controls**: Zoom slider (0.5×–2.5×) + Horizontal/Vertical offset sliders (−30%/+30%) with live preview + Reset button. Only shown after upload.
- **Trending Idea Radar**: New backend endpoint `/api/ideas` (Gemini) returns 6 fresh non-repeating Telugu angle ideas — varied categories, tones, angles (monsoon care, student, farmer, wedding gift, repair, etc.). Client passes recent offer history to avoid duplicates. Clicking an idea auto-fills the form (offer/category/tone/notes).

## Test Results
- iteration_2.json: 100% pass on backend + frontend for all v1.1 additions and regression on v1 endpoints. Zero console errors.
