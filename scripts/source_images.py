#!/usr/bin/env python3
"""
Automated Image Sourcing Pipeline for Kultura PH
Sources authentic, real-world photographs from Wikimedia Commons and Wikipedia
for all Festivals and Heritage Stories across all Philippine regions.
"""

import os
import re
import json
import time
import glob
import urllib.request
import urllib.parse
from typing import Optional, Dict, Any, List, Tuple

CACHE_FILE = "frontend/public/content/image-cache.json"
REGIONS_DIR = "frontend/public/content/data/regions"
HEADERS = {
    "User-Agent": "KulturaPH/1.0 (cultural-heritage-atlas@kulturaph.org; https://github.com/tope/kultura-ph)"
}

BAD_KEYWORDS = [
    "flag", "coat of arms", "seal", "logo", "map", "locator", "icon",
    "drawing", "symbol", "diagram", "route", "vector", "sketch",
    "infobox", "template", "blank", "stub", "shield", "emblem", "chart"
]

def load_cache() -> Dict[str, Any]:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache: Dict[str, Any]):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)

def clean_html(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<[^>]+>", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def fetch_json(url: str) -> Optional[Dict[str, Any]]:
    req = urllib.request.Request(url, headers=HEADERS)
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            time.sleep(0.4)
    return None

def get_wikimedia_imageinfo(title: str) -> Optional[Dict[str, Any]]:
    """Fetch metadata, license, author and full resolution URL for a Wikimedia file."""
    api_url = (
        "https://commons.wikimedia.org/w/api.php?action=query&titles="
        + urllib.parse.quote(title)
        + "&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json"
    )
    data = fetch_json(api_url)
    if not data:
        return None
    pages = data.get("query", {}).get("pages", {})
    for pid, p in pages.items():
        if "imageinfo" not in p:
            continue
        ii = p["imageinfo"][0]
        w = ii.get("width", 0)
        h = ii.get("height", 0)
        mime = ii.get("mime", "")
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        if w < 500 or h < 350:
            continue

        meta = ii.get("extmetadata", {})
        artist = clean_html(meta.get("Artist", {}).get("value", ""))
        license_name = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
        credit = clean_html(meta.get("Credit", {}).get("value", ""))

        author = artist or credit or "Wikimedia Commons"
        if len(author) > 60:
            author = author[:57] + "..."
        if not author:
            author = "Wikimedia Commons"

        raw_url = ii.get("url", "")
        if "?" in raw_url:
            raw_url = raw_url.split("?")[0]

        return {
            "url": raw_url,
            "width": w,
            "height": h,
            "aspect": w / h if h > 0 else 1.0,
            "credit": f"{author} ({license_name})",
            "title": p.get("title", title),
            "source": "Wikimedia Commons"
        }
    return None

def search_wikipedia_summary(term: str) -> Optional[Dict[str, Any]]:
    """Try to get curated lead image from Wikipedia article."""
    formatted_term = term.strip().replace(" ", "_")
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(formatted_term)}"
    data = fetch_json(url)
    if not data or "originalimage" not in data:
        return None
    orig = data["originalimage"]
    src = orig.get("source", "")
    w = orig.get("width", 0)
    h = orig.get("height", 0)
    if not src or w < 500 or h < 350:
        return None

    # Derive Commons file name from URL if possible
    m = re.search(r"/wikipedia/commons/(?:thumb/)?[a-f0-9]/[a-f0-9]{2}/([^/]+)", src)
    if m:
        filename = urllib.parse.unquote(m.group(1))
        filename = re.sub(r"^\d+px-", "", filename)
        file_title = "File:" + filename
        info = get_wikimedia_imageinfo(file_title)
        if info:
            return info

    return {
        "url": src,
        "width": w,
        "height": h,
        "aspect": w / h if h > 0 else 1.0,
        "credit": f"Wikipedia / {data.get('title', term)}",
        "title": data.get("title", term),
        "source": "Wikipedia"
    }

def search_wikimedia_commons(query: str) -> Optional[Dict[str, Any]]:
    """Search Wikimedia Commons for high-resolution authentic photographs."""
    url = (
        "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch="
        + urllib.parse.quote(query)
        + "&srnamespace=6&srlimit=8&format=json"
    )
    data = fetch_json(url)
    if not data:
        return None
    hits = data.get("query", {}).get("search", [])
    if not hits:
        return None

    candidates = []
    for hit in hits:
        t = hit["title"]
        lower = t.lower()
        if any(b in lower for b in BAD_KEYWORDS):
            continue
        if lower.endswith((".svg", ".ogg", ".ogv", ".pdf", ".tif", ".tiff", ".webm")):
            continue
        candidates.append(t)

    if not candidates:
        return None

    # Retrieve info for top candidates
    titles_str = "|".join(candidates[:6])
    api_url = (
        "https://commons.wikimedia.org/w/api.php?action=query&titles="
        + urllib.parse.quote(titles_str)
        + "&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json"
    )
    info_data = fetch_json(api_url)
    if not info_data:
        return None

    pages = info_data.get("query", {}).get("pages", {})
    best = None
    for pid, p in pages.items():
        if "imageinfo" not in p:
            continue
        ii = p["imageinfo"][0]
        w = ii.get("width", 0)
        h = ii.get("height", 0)
        mime = ii.get("mime", "")
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        if w < 600 or h < 400:
            continue

        meta = ii.get("extmetadata", {})
        artist = clean_html(meta.get("Artist", {}).get("value", ""))
        license_name = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
        credit = clean_html(meta.get("Credit", {}).get("value", ""))

        author = artist or credit or "Wikimedia Commons"
        if len(author) > 60:
            author = author[:57] + "..."

        raw_url = ii.get("url", "")
        if "?" in raw_url:
            raw_url = raw_url.split("?")[0]

        aspect = w / h if h > 0 else 1.0
        # Score calculation: prefer landscape (aspect >= 1.2) and high resolution (>= 1920)
        score = w
        if aspect >= 1.2:
            score += 2000
        elif aspect >= 1.0:
            score += 1000

        res_item = {
            "url": raw_url,
            "width": w,
            "height": h,
            "aspect": aspect,
            "credit": f"{author} ({license_name})",
            "title": p.get("title", ""),
            "source": "Wikimedia Commons",
            "score": score
        }
        if best is None or score > best["score"]:
            best = res_item

    return best

def find_best_image(name: str, place: str = "", context: str = "", cache: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
    """Intelligent multi-step retrieval with fallback queries and local caching."""
    cache_key = f"{name}::{place}::{context}".strip(":")
    if cache and cache_key in cache:
        return cache[cache_key]

    clean_name = re.sub(r"\(.*?\)", "", name).strip()
    clean_place = re.sub(r"\(.*?\)", "", place).strip()

    search_attempts: List[Tuple[str, str]] = []

    if context == "festival":
        search_attempts.append(("wiki", f"{clean_name} Festival"))
        search_attempts.append(("wiki", clean_name))
        if clean_place:
            search_attempts.append(("commons", f"{clean_name} Festival {clean_place}"))
            search_attempts.append(("commons", f"{clean_name} {clean_place}"))
        search_attempts.append(("commons", f"{clean_name} Festival Philippines"))
        search_attempts.append(("commons", f"{clean_name} Festival"))
        search_attempts.append(("commons", f"{clean_name}"))
    else:
        # Heritage or Cultural Story
        search_attempts.append(("wiki", clean_name))
        if clean_place:
            search_attempts.append(("commons", f"{clean_name} {clean_place}"))
        search_attempts.append(("commons", f"{clean_name} Philippines"))
        search_attempts.append(("commons", clean_name))

    for stype, query in search_attempts:
        res = None
        if stype == "wiki":
            res = search_wikipedia_summary(query)
        elif stype == "commons":
            res = search_wikimedia_commons(query)

        if res and res.get("url"):
            if cache is not None:
                cache[cache_key] = res
                save_cache(cache)
            return res

        time.sleep(0.12)  # Respect API rate limits

    return None

# Specific cultural fallback mappings when frontmatter lists are empty or generic
KNOWN_CULTURAL_TARGETS = {
    "barmm": {
        "crafts": "Okir wood carving Maranao",
        "food": "Pastil Maguindanao",
        "heritage": "Grand Mosque of Cotabato"
    },
    "bicol": {
        "crafts": "Abaca handicraft Bicol",
        "food": "Bicol Express",
        "heritage": "Cagsawa Ruins Mayon Volcano"
    },
    "car": {
        "crafts": "Ifugao bulul carving",
        "food": "Pinikpikan Cordillera",
        "heritage": "Batad Rice Terraces Banaue"
    },
    "caraga": {
        "crafts": "Mamanwa basket weaving",
        "food": "Sayongsong Surigao",
        "heritage": "Balangay boat Butuan"
    },
    "central-visayas": {
        "crafts": "Lapu-Lapu acoustic guitar",
        "food": "Cebu lechon",
        "heritage": "Basilica del Santo Nino Cebu"
    },
    "eastern-visayas": {
        "crafts": "Basey mat weaving Samar",
        "food": "Binagol Leyte",
        "heritage": "San Juanico Bridge"
    },
    "ncr": {
        "crafts": "Jeepney art Manila",
        "food": "Philippine adobo",
        "heritage": "San Agustin Church Intramuros"
    },
    "negros-island-region": {
        "crafts": "MassKara festival mask making",
        "food": "Chicken inasal Bacolod",
        "heritage": "The Ruins Talisay"
    },
    "region-1": {
        "crafts": "Inabel weaving Ilocos",
        "food": "Bagnet Ilocos",
        "heritage": "Calle Crisologo Vigan"
    },
    "soccsksargen": {
        "crafts": "T'nalak weaving T'boli",
        "food": "General Santos tuna",
        "heritage": "Lake Sebu South Cotabato"
    }
}

def update_region_file(filepath: str, cache: Dict[str, Any]) -> Tuple[int, int, int]:
    """Process a single region markdown file: updates festivals and storyImages."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Match frontmatter
    fm_match = re.match(r"^---\n(.*?)\n---\n(.*)$", content, re.DOTALL)
    if not fm_match:
        return 0, 0, 0

    fm_raw, body_raw = fm_match.group(1), fm_match.group(2)

    region_name = ""
    rn_match = re.search(r'^name:\s*"([^"]+)"', fm_raw, re.M)
    if rn_match:
        region_name = rn_match.group(1)

    slug_match = re.search(r'^slug:\s*"([^"]+)"', fm_raw, re.M)
    region_slug = slug_match.group(1) if slug_match else ""

    # 1. Update Festivals
    fest_count = 0
    updated_fest_count = 0

    def festival_replacer(match):
        nonlocal fest_count, updated_fest_count
        chunk = match.group(0)
        fest_count += 1
        name_m = re.search(r'name:\s*"([^"]+)"', chunk)
        place_m = re.search(r'place:\s*"([^"]*)"', chunk)
        if not name_m:
            return chunk

        fname = name_m.group(1)
        fplace = place_m.group(1) if place_m else ""

        img_m = re.search(r'image:\s*"([^"]*)"', chunk)
        curr_img = img_m.group(1) if img_m else ""

        if curr_img and curr_img.startswith("http"):
            updated_fest_count += 1
            return chunk

        img_info = find_best_image(fname, fplace, "festival", cache)
        if img_info and img_info.get("url"):
            new_url = img_info["url"]
            new_credit = img_info["credit"].replace('"', '\\"')
            chunk = re.sub(r'image:\s*"[^"]*"', f'image: "{new_url}"', chunk)
            chunk = re.sub(r'credit:\s*"[^"]*"', f'credit: "{new_credit}"', chunk)
            updated_fest_count += 1
            print(f"  [Festival OK] {fname} -> {new_url[:50]}... ({img_info['width']}x{img_info['height']})")
        else:
            print(f"  [Festival PENDING] {fname} ({fplace}) - no image found")

        return chunk

    new_fm = re.sub(
        r'-\s*\{\s*name:\s*"[^"]+".*?image:\s*"[^"]*".*?credit:\s*"[^"]*".*?\}',
        festival_replacer,
        fm_raw,
        flags=re.DOTALL
    )

    # 2. Extract lists for story targets
    def extract_list(key: str) -> List[str]:
        m = re.search(rf'^{key}:\s*\n\s*\[(.*?)\]', fm_raw, re.M | re.S)
        if not m:
            return []
        return re.findall(r'"([^"]+)"', m.group(1))

    crafts_list = extract_list("crafts")
    food_list = extract_list("food")
    heritage_list = extract_list("heritageSites")

    known = KNOWN_CULTURAL_TARGETS.get(region_slug, {})
    crafts_target = crafts_list[0] if crafts_list else known.get("crafts", f"{region_name} traditional crafts")
    food_target = food_list[0] if food_list else known.get("food", f"{region_name} local cuisine")
    heritage_target = heritage_list[0] if heritage_list else known.get("heritage", f"{region_name} heritage landmark")

    # Clean targets
    story_targets = {
        "crafts": re.sub(r"\(.*?\)", "", crafts_target).strip(),
        "food": re.sub(r"\(.*?\)", "", food_target).strip(),
        "heritage": re.sub(r"\(.*?\)", "", heritage_target).strip(),
    }

    story_images = {}
    story_updated_count = 0
    for cat, query in story_targets.items():
        res = find_best_image(query, region_name, cat, cache)
        if res and res.get("url"):
            story_images[cat] = {
                "image": res["url"],
                "credit": res["credit"].replace('"', '\\"'),
                "width": res.get("width"),
                "height": res.get("height")
            }
            story_updated_count += 1
            print(f"  [Story OK] [{cat.upper()}] {query} -> {res['url'][:50]}... ({res.get('width')}x{res.get('height')})")
        else:
            print(f"  [Story PENDING] [{cat.upper()}] {query} - no image found")

    # Format storyImages YAML block
    if story_images:
        story_yaml_lines = ["storyImages:"]
        for cat in ("crafts", "food", "heritage"):
            if cat in story_images:
                si = story_images[cat]
                story_yaml_lines.append(f"  {cat}:")
                story_yaml_lines.append(f'    image: "{si["image"]}"')
                story_yaml_lines.append(f'    credit: "{si["credit"]}"')
        story_yaml = "\n".join(story_yaml_lines)

        if "storyImages:" in new_fm:
            new_fm = re.sub(
                r'storyImages:\s*\n(?:\s+[a-z]+:\s*\n\s+image:\s*"[^"]*"\s*\n\s+credit:\s*"[^"]*"\s*\n?)+',
                story_yaml + "\n",
                new_fm
            )
        else:
            if "reviewed:" in new_fm:
                new_fm = new_fm.replace("reviewed:", f"{story_yaml}\nreviewed:")
            else:
                new_fm = new_fm + f"\n{story_yaml}\n"

    new_content = f"---\n{new_fm}\n---\n{body_raw}"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

    return fest_count, updated_fest_count, story_updated_count

def main():
    print("=" * 60)
    print("KULTURA PH: AUTOMATED IMAGE SOURCING & INTEGRATION")
    print("=" * 60)

    cache = load_cache()
    print(f"Loaded {len(cache)} existing cached image results.")

    files = sorted(glob.glob(f"{REGIONS_DIR}/*.md"))
    region_files = [f for f in files if "README" not in f]
    print(f"Processing {len(region_files)} region files...\n")

    total_festivals = 0
    total_updated_festivals = 0
    total_updated_stories = 0

    for filepath in region_files:
        basename = os.path.basename(filepath)
        print(f"\n>>> Processing {basename}...")
        fc, ufc, usc = update_region_file(filepath, cache)
        total_festivals += fc
        total_updated_festivals += ufc
        total_updated_stories += usc

    print("\n" + "=" * 60)
    print("IMAGE SOURCING PIPELINE SUMMARY")
    print("=" * 60)
    print(f"Total Region Files: {len(region_files)}")
    print(f"Total Festivals Checked: {total_festivals}")
    print(f"Total Festivals with Images: {total_updated_festivals} / {total_festivals} ({total_updated_festivals/total_festivals*100:.1f}%)")
    print(f"Total Heritage Stories with Images: {total_updated_stories} / {len(region_files)*3} ({total_updated_stories/(len(region_files)*3)*100:.1f}%)")
    print(f"Total Cached Image Queries: {len(cache)}")
    print("=" * 60)

if __name__ == "__main__":
    main()
