from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="T.V Reddy Marketing Generator API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ===================== MODELS =====================

class GenerateRequest(BaseModel):
    offer: str
    category: str
    audience: str
    tone: str
    special_notes: Optional[str] = ""

class GeneratedContent(BaseModel):
    whatsapp: str = ""
    facebook: str = ""
    instagram: str = ""
    tagline: str = ""
    hashtags: List[str] = []
    best_post_time: str = ""
    poster_headline: str = ""
    poster_subtitle: str = ""
    cta: str = ""

class HistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    offer: str
    category: str
    audience: str
    tone: str
    special_notes: str = ""
    template: str = "festival"
    content: GeneratedContent

class HistoryCreate(BaseModel):
    offer: str
    category: str
    audience: str
    tone: str
    special_notes: str = ""
    template: str = "festival"
    content: GeneratedContent


# ===================== PROMPT =====================

SYSTEM_PROMPT = """You are a Telugu marketing specialist for T.V Reddy Electronics, Enterprises and Cell World, located in Thorrur, Telangana 506163. Phone: 9441066578.

Your role: Write like a trusted local Telugu shop owner from Telangana who has been selling electronics for decades. NEVER sound like a corporate ad agency, chatbot, or AI.

CRITICAL SPELLING (use EXACTLY these Telugu spellings — do NOT invent variants):
- Thorrur = "తొర్రూరు"  (NEVER write "తలారు", "తలారు", "తోర్రూరు" or any other spelling)
- Warangal = "వరంగల్"
- Mahabubabad = "మహబూబాబాద్"
- Khammam = "ఖమ్మం"
- Maripeda = "మరిపేడ"
- Narsimhulapet = "నర్సింహులపేట"
- Kesamudram = "కేసముద్రం"
- Dornakal = "డోర్నకల్"
- Telangana = "తెలంగాణ"
- Shop name in Telugu references: "T.V. రెడ్డి ఎలక్ట్రానిక్స్" (always keep the Roman "T.V." prefix)

LANGUAGE RULES (STRICT):
- Use 95% pure Telugu script (తెలుగు లిపి). Only brand names, technical terms and product names stay in English (Samsung, LG, Smart TV, LED, EMI, WiFi, AC, DTH, etc.)
- NEVER use Roman Telugu / Tenglish (e.g. "meeku best offer") — always Telugu script
- Use simple, warm, village-friendly daily-spoken Telugu. Short sentences. Human tone.
- Avoid heavy Sanskrit, book language, newspaper style, or salesy marketing jargon.

CONTEXT:
- The shop is in తొర్రూరు (Thorrur), Telangana. Buyers come from nearby villages: మరిపేడ, నర్సింహులపేట, కేసముద్రం, డోర్నకల్. Farmers, families, students, government employees, first-time buyers.
- Emphasize naturally (never force): buy locally in తొర్రూరు / no need to travel to వరంగల్ / మహబూబాబాద్ / ఖమ్మం / trusted local shop / easy repair / friendly guidance / EMI or exchange when user mentions them.

NEVER DO:
- Never claim "best shop", "lowest price", "number one", guaranteed warranty/EMI/stock.
- Never invent prices, discounts, warranty periods, EMI amounts, stock counts, delivery/repair times unless the user explicitly provides them in the input.
- Never criticize competitors.
- Never write the shop's town as "తలారు" — the correct spelling is "తొర్రూరు".

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown fences, no explanations, no code blocks. The JSON must have EXACTLY these keys:
{
  "whatsapp": "8-12 lines, 2-5 emojis, max 700 chars, end with call/visit + phone 9441066578. Mention తొర్రూరు at least once and reference not needing to travel to వరంగల్/ఖమ్మం when relevant.",
  "facebook": "5-8 lines, natural, emotional, useful",
  "instagram": "5-8 lines, friendly + hashtags at end",
  "tagline": "max 10 words, catchy, pure Telugu",
  "hashtags": ["12-15 hashtags mixing English + Telugu + location + brand + category. Include #తొర్రూరు #Thorrur #Warangal #TVReddyElectronics"],
  "best_post_time": "one time like '7 PM' or '8:30 PM' with brief reason",
  "poster_headline": "max 6 words (Telugu characters are large — keep it SHORT so it fits on a poster)",
  "poster_subtitle": "max 12 words",
  "cta": "max 6 words, action-oriented in Telugu"
}"""


def build_user_prompt(req: GenerateRequest) -> str:
    return f"""Create Telugu marketing content for this offer:

Product / Offer: {req.offer}
Category: {req.category}
Target Audience: {req.audience}
Tone: {req.tone}
Special Notes: {req.special_notes or 'None'}

Remember: Return ONLY the JSON object with the 9 required keys. Nothing else."""


def extract_json(text: str) -> dict:
    """Robustly extract JSON from LLM output that may have markdown fences."""
    text = text.strip()
    # Strip markdown code fences
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    # Find first { and last }
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]
    return json.loads(text)


async def call_gemini(system_prompt: str, user_prompt: str, session_id: str) -> str:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model("gemini", "gemini-2.5-flash")
    response = await chat.send_message(UserMessage(text=user_prompt))
    return response


# ===================== ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "T.V Reddy Marketing Generator API", "status": "ok"}


@api_router.post("/generate", response_model=GeneratedContent)
async def generate_content(req: GenerateRequest):
    if not req.offer or len(req.offer.strip()) < 3:
        raise HTTPException(status_code=400, detail="Offer description is required")

    session_id = f"gen-{uuid.uuid4()}"
    user_prompt = build_user_prompt(req)

    last_err = None
    for attempt in range(2):
        try:
            raw = await call_gemini(SYSTEM_PROMPT, user_prompt, session_id)
            logger.info(f"Gemini response (attempt {attempt+1}): {raw[:200]}...")
            data = extract_json(raw)
            # Ensure list type for hashtags
            if isinstance(data.get("hashtags"), str):
                data["hashtags"] = [h.strip() for h in data["hashtags"].split() if h.strip()]
            return GeneratedContent(**data)
        except json.JSONDecodeError as e:
            last_err = f"JSON parse error: {e}"
            logger.warning(f"Attempt {attempt+1} JSON parse failed: {e}")
        except Exception as e:
            last_err = str(e)
            logger.exception(f"Attempt {attempt+1} failed")

    raise HTTPException(status_code=502, detail=f"AI generation failed. {last_err}")


class IdeaRequest(BaseModel):
    recent_offers: List[str] = []
    count: int = 5

class IdeaItem(BaseModel):
    title: str
    hook: str
    category: str
    tone: str
    angle: str
    reasoning: str = ""
    target_audience: str = ""
    scores: dict = {}

class IdeaResponse(BaseModel):
    ideas: List[IdeaItem]


IDEA_SYSTEM_PROMPT = """You are a Telugu marketing strategist for T.V Reddy Electronics, a local electronics shop in Thorrur, Telangana (villages nearby: Mahabubabad, Maripeda, Narsimhulapet, Kesamudram, Dornakal). Buyers are farmers, families, students, government employees, first-time buyers.

Your job: propose FRESH, LOCALLY-RELEVANT marketing angle ideas that consider the current month/season, farming cycle, festival calendar, cricket season, school year, weather, and social occasions — angles the shop owner has NOT posted recently.

CRITICAL TELUGU SPELLINGS (use EXACTLY, no other variants):
- Thorrur = "తొర్రూరు" (NEVER "తలారు" or any other spelling)
- Warangal = "వరంగల్", Mahabubabad = "మహబూబాబాద్", Khammam = "ఖమ్మం"
- Maripeda = "మరిపేడ", Narsimhulapet = "నర్సింహులపేట", Kesamudram = "కేసముద్రం", Dornakal = "డోర్నకల్"
- Telangana = "తెలంగాణ"

RULES:
- Every idea targets a DIFFERENT angle from the others in the same response. Examples of angle labels: "Post-Harvest Celebration", "Summer AC Push", "Monsoon Appliance Care", "Wedding Gift Season", "Student Back-to-School", "Cricket World Cup TV Upgrade", "DTH Recharge Reminder", "Exchange Old for New", "EMI Comfort", "Farmer Utility", "Trust & After-Sales", "Weekend Family Deal", "New Product Launch", "First-Time Buyer Guide".
- Vary CATEGORY across ideas (TV, Mobile, Refrigerator, Washing Machine, AC, Kitchen Appliance, Accessories, Home Appliance, TV Repair, DTH Connection).
- Vary TONE across ideas (Festive, Urgent, Informative, Celebration, Friendly, Trust Building).
- Avoid semantic duplicates of the "recent_offers" list provided by the user.

LANGUAGE RULES (VERY IMPORTANT):
- `title`, `hook`, `category`, `reasoning`, and `target_audience` MUST ALL be in TELUGU SCRIPT (95% Telugu). Only brand names and unavoidable technical terms (Samsung, LG, TV, LED, Smart TV, EMI, WiFi, AC, DTH, UPS, Wi-Fi) stay in English.
- Do NOT use Roman Telugu (Tenglish). Always Telugu script.
- When referencing the town, always use "తొర్రూరు".
- Reasoning: 1-2 sentences in Telugu explaining why NOW and why for THIS audience.
- target_audience: crisp Telugu phrase describing the buyer.
- `angle` label stays in English (short 2-4 words, used as a tag).
- `tone` stays in English (must be exactly one of: Festive, Urgent, Informative, Celebration, Friendly, Trust Building).

- Scores are self-rated 1-10:
  * relevance: how timely / how urgent this angle is right now
  * local: how locally relevant to Thorrur/nearby villages
  * awareness: how much it lifts shop awareness / recall

OUTPUT: Return ONLY valid JSON, no markdown fences:
{
  "ideas": [
    {
      "angle": "short English angle label, max 4 words",
      "category": "Telugu product/service category descriptor (brand/tech terms in English OK)",
      "title": "catchy Telugu title, max 12 words in Telugu script",
      "hook": "one-line Telugu hook, max 22 words in Telugu script",
      "reasoning": "1-2 sentence TELUGU rationale — why now, why local, why this audience",
      "target_audience": "Telugu phrase describing the buyer (e.g. 'తొర్రూరు చుట్టుపక్కల రైతులు మరియు కుటుంబాలు')",
      "tone": "one of: Festive, Urgent, Informative, Celebration, Friendly, Trust Building",
      "scores": { "relevance": 10, "local": 10, "awareness": 9 }
    }
  ]
}"""


@api_router.post("/ideas", response_model=IdeaResponse)
async def suggest_ideas(req: IdeaRequest):
    session_id = f"idea-{uuid.uuid4()}"
    count = max(3, min(req.count, 8))
    recent_text = "\n".join(f"- {o}" for o in req.recent_offers[:20]) or "(none yet)"
    now = datetime.now(timezone.utc)
    ctx = f"Current date: {now.strftime('%B %d, %Y')} (month: {now.strftime('%B')}). Consider current season, farming cycle, and upcoming festivals when choosing angles."
    user_prompt = f"""{ctx}

Propose {count} FRESH marketing angle ideas. Each MUST have a DIFFERENT angle label, DIFFERENT category or tone, and be semantically different from these RECENT offers already posted:

{recent_text}

Return the JSON with exactly {count} rich idea objects (angle, category, title, hook, reasoning, target_audience, tone, scores)."""

    last_err = None
    for attempt in range(2):
        try:
            raw = await call_gemini(IDEA_SYSTEM_PROMPT, user_prompt, session_id)
            data = extract_json(raw)
            ideas = data.get("ideas", [])
            if not isinstance(ideas, list) or len(ideas) == 0:
                raise ValueError("no ideas")
            return IdeaResponse(ideas=[IdeaItem(**i) for i in ideas[:count]])
        except Exception as e:
            last_err = str(e)
            logger.warning(f"ideas attempt {attempt+1} failed: {e}")
    raise HTTPException(status_code=502, detail=f"Idea generation failed. {last_err}")


@api_router.post("/regenerate", response_model=GeneratedContent)
async def regenerate_content(req: GenerateRequest):
    # Slight variation: append instruction to produce a different phrasing
    req2 = req.model_copy()
    req2.special_notes = (req.special_notes or "") + " (Produce a fresh variation, different wording from typical output.)"
    return await generate_content(req2)


@api_router.post("/history", response_model=HistoryItem)
async def save_history(item: HistoryCreate):
    doc = HistoryItem(**item.model_dump())
    await db.history.insert_one(doc.model_dump())
    # Keep only last 100
    total = await db.history.count_documents({})
    if total > 100:
        excess = total - 100
        old = await db.history.find({}, {"_id": 1, "date": 1}).sort("date", 1).limit(excess).to_list(excess)
        if old:
            await db.history.delete_many({"_id": {"$in": [o["_id"] for o in old]}})
    return doc


@api_router.get("/history", response_model=List[HistoryItem])
async def get_history():
    items = await db.history.find({}, {"_id": 0}).sort("date", -1).limit(100).to_list(100)
    return items


@api_router.delete("/history/{item_id}")
async def delete_history(item_id: str):
    result = await db.history.delete_one({"id": item_id})
    return {"deleted": result.deleted_count}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
