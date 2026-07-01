"""Tests for new /api/ideas endpoint and regression on existing endpoints."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tv-reddy-generator.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

TELUGU_RE = re.compile(r'[\u0C00-\u0C7F]')


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ============ NEW: /api/ideas ============

class TestIdeas:
    def test_ideas_count6_variety(self, api_client):
        payload = {
            "recent_offers": ["Samsung Smart TV Festival Offer", "LG Refrigerator Sale"],
            "count": 6,
        }
        r = api_client.post(f"{API}/ideas", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "ideas" in data
        ideas = data["ideas"]
        assert len(ideas) == 6, f"Expected 6 got {len(ideas)}"

        required_keys = {"title", "hook", "category", "tone", "angle"}
        cats, tones = set(), set()
        for item in ideas:
            assert required_keys.issubset(item.keys()), f"Missing keys in {item}"
            assert isinstance(item["title"], str) and item["title"].strip()
            assert isinstance(item["hook"], str) and item["hook"].strip()
            # Telugu script presence in title or hook
            assert TELUGU_RE.search(item["title"]) or TELUGU_RE.search(item["hook"]), \
                f"No Telugu script in: {item['title']} / {item['hook']}"
            cats.add(item["category"])
            tones.add(item["tone"])
        # variety - at least 2 distinct categories and 2 distinct tones
        assert len(cats) >= 2, f"Categories not varied: {cats}"
        assert len(tones) >= 2, f"Tones not varied: {tones}"

    def test_ideas_empty_recent_offers(self, api_client):
        r = api_client.post(f"{API}/ideas", json={"recent_offers": [], "count": 5}, timeout=90)
        assert r.status_code == 200, r.text
        ideas = r.json().get("ideas", [])
        assert len(ideas) >= 3

    def test_ideas_count3(self, api_client):
        r = api_client.post(f"{API}/ideas", json={"recent_offers": [], "count": 3}, timeout=90)
        assert r.status_code == 200, r.text
        ideas = r.json().get("ideas", [])
        assert len(ideas) == 3


# ============ REGRESSION ============

class TestRegression:
    def test_generate_ok(self, api_client):
        payload = {
            "offer": "Samsung 43 inch Smart TV Festival Offer",
            "category": "TV",
            "audience": "Families",
            "tone": "Festive",
            "special_notes": "Free installation",
        }
        r = api_client.post(f"{API}/generate", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ["whatsapp", "facebook", "instagram", "tagline", "hashtags",
                  "best_post_time", "poster_headline", "poster_subtitle", "cta"]:
            assert k in data, f"Missing key: {k}"
        assert isinstance(data["hashtags"], list)
        # Telugu presence in whatsapp
        assert TELUGU_RE.search(data["whatsapp"])

    def test_regenerate_ok(self, api_client):
        payload = {
            "offer": "LG Double Door Refrigerator",
            "category": "Refrigerator",
            "audience": "Families",
            "tone": "Friendly",
            "special_notes": "",
        }
        r = api_client.post(f"{API}/regenerate", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("whatsapp")

    def test_history_flow(self, api_client):
        # Create
        item = {
            "offer": "TEST_ regression offer",
            "category": "TV",
            "audience": "Families",
            "tone": "Friendly",
            "special_notes": "",
            "template": "festival",
            "content": {
                "whatsapp": "టెస్ట్ మెసేజ్",
                "facebook": "టెస్ట్",
                "instagram": "టెస్ట్",
                "tagline": "టెస్ట్",
                "hashtags": ["#test"],
                "best_post_time": "7 PM",
                "poster_headline": "టెస్ట్",
                "poster_subtitle": "టెస్ట్",
                "cta": "సందర్శించండి",
            },
        }
        r = api_client.post(f"{API}/history", json=item, timeout=30)
        assert r.status_code == 200, r.text
        created = r.json()
        assert "id" in created
        hid = created["id"]

        # List
        r2 = api_client.get(f"{API}/history", timeout=30)
        assert r2.status_code == 200
        ids = [h["id"] for h in r2.json()]
        assert hid in ids

        # Delete cleanup
        r3 = api_client.delete(f"{API}/history/{hid}", timeout=30)
        assert r3.status_code == 200
        assert r3.json().get("deleted") == 1
