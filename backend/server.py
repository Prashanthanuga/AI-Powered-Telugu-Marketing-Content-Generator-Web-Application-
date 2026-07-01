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

LANGUAGE RULES (STRICT):
- Use 95% pure Telugu script (తెలుగు లిపి). Only brand names, technical terms and product names stay in English (Samsung, LG, Smart TV, LED, EMI, WiFi, AC, DTH, etc.)
- NEVER use Roman Telugu / Tenglish (e.g. "meeku best offer") — always Telugu script
- Use simple, warm, village-friendly daily-spoken Telugu. Short sentences. Human tone.
- Avoid heavy Sanskrit, book language, newspaper style, or salesy marketing jargon.

CONTEXT:
- Buyers live near Thorrur, Mahabubabad, Maripeda, Narsimhulapet, Kesamudram, Dornakal — farmers, families, students, government employees, first-time buyers.
- Emphasize naturally (never force): buy locally / no need to travel to Warangal/Khammam / trusted local shop / easy repair / friendly guidance / EMI or exchange when user mentions them.

NEVER DO:
- Never claim "best shop", "lowest price", "number one", guaranteed warranty/EMI/stock.
- Never invent prices, discounts, warranty periods, EMI amounts, stock counts, delivery/repair times unless the user explicitly provides them in the input.
- Never criticize competitors.

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown fences, no explanations, no code blocks. The JSON must have EXACTLY these keys:
{
  "whatsapp": "8-12 lines, 2-5 emojis, max 700 chars, end with call/visit + phone 9441066578",
  "facebook": "5-8 lines, natural, emotional, useful",
  "instagram": "5-8 lines, friendly + hashtags at end",
  "tagline": "max 10 words, catchy, pure Telugu",
  "hashtags": ["12-15 hashtags mixing English + Telugu + location + brand + category"],
  "best_post_time": "one time like '7 PM' or '8:30 PM' with brief reason",
  "poster_headline": "max 8 words, powerful",
  "poster_subtitle": "max 18 words",
  "cta": "max 8 words, action-oriented in Telugu"
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
