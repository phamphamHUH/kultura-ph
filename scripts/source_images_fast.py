#!/usr/bin/env python3
"""
High-Speed Concurrent Image Sourcing Pipeline for Kultura PH.
Sources authentic, real-world photographs from Wikimedia Commons and Wikipedia
for all 66 Festivals and 54 Heritage Stories across all 18 Philippine regions.
Downloads and optimizes images locally into:
  - frontend/public/content/images/festivals/<slug>.jpg
  - frontend/public/content/images/heritage/<region>-<category>.jpg
Updates region markdown frontmatter and registers full source metadata in image-cache.json.
"""

import os
import re
import json
import time
import glob
import subprocess
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, Dict, Any, List, Tuple

CACHE_FILE = "frontend/public/content/image-cache.json"
REGIONS_DIR = "frontend/public/content/data/regions"
FESTIVALS_IMG_DIR = "frontend/public/content/images/festivals"
HERITAGE_IMG_DIR = "frontend/public/content/images/heritage"

HEADERS = {
    "User-Agent": "KulturaPH/1.0 (cultural-heritage-atlas@kulturaph.org; https://github.com/tope/kultura-ph)"
}

BAD_KEYWORDS = [
    "flag", "coat of arms", "seal", "logo", "map", "locator", "icon",
    "drawing", "symbol", "diagram", "route", "vector", "sketch",
    "infobox", "template", "blank", "stub", "shield", "emblem", "chart",
    "stamps", "postage", "currency", "banknote", "coin"
]

def slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", s)

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
            time.sleep(0.3)
    return None

def get_wikimedia_imageinfo(title: str) -> Optional[Dict[str, Any]]:
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
        if w < 600 or h < 400:
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
    formatted_term = term.strip().replace(" ", "_")
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(formatted_term)}"
    data = fetch_json(url)
    if not data or "originalimage" not in data:
        return None
    orig = data["originalimage"]
    src = orig.get("source", "")
    w = orig.get("width", 0)
    h = orig.get("height", 0)
    if not src or w < 600 or h < 400:
        return None

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
    url = (
        "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch="
        + urllib.parse.quote(query)
        + "&srnamespace=6&srlimit=10&format=json"
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

def query_candidates_for_item(name: str, place: str, context: str) -> List[Tuple[str, str]]:
    clean_name = re.sub(r"\(.*?\)", "", name).strip()
    clean_place = re.sub(r"\(.*?\)", "", place).strip()
    # clean commas
    clean_name = clean_name.split(",")[0].strip()
    clean_place = clean_place.split(",")[0].strip()

    attempts = []
    if context == "festival":
        # Wikipedia article names
        if not clean_name.lower().endswith("festival"):
            attempts.append(("wiki", f"{clean_name} Festival"))
        attempts.append(("wiki", clean_name))

        # Commons search queries
        if clean_place:
            attempts.append(("commons", f"{clean_name} Festival {clean_place}"))
            attempts.append(("commons", f"{clean_name} {clean_place}"))
        attempts.append(("commons", f"{clean_name} Festival Philippines"))
        attempts.append(("commons", f"{clean_name} Festival"))
        attempts.append(("commons", f"{clean_name} Philippines"))
        attempts.append(("commons", clean_name))
    else:
        # Heritage / Craft / Food
        attempts.append(("wiki", clean_name))
        if clean_place:
            attempts.append(("commons", f"{clean_name} {clean_place}"))
        attempts.append(("commons", f"{clean_name} Philippines"))
        attempts.append(("commons", clean_name))

    return attempts

def download_and_optimize(url: str, dest_path: str) -> bool:
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 10000:
        return True

    req = urllib.request.Request(url, headers=HEADERS)
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp, open(dest_path, "wb") as out:
                out.write(resp.read())
            # Run sips resize to max 1920 width
            subprocess.run(["sips", "-Z", "1920", dest_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except Exception:
            time.sleep(0.5)
    return False

KNOWN_CULTURAL_TARGETS = {
    "barmm": {
        "crafts": "Okir wood carving Maranao",
        "food": "Pastil Maguindanao",
        "heritage": "Torogan house Maranao"
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
    "northern-mindanao": {
        "crafts": "Talaandig beadwork Bukidnon",
        "food": "Pastel de Camiguin",
        "heritage": "Camiguin Sunken Cemetery"
    },
    "region-1": {
        "crafts": "Inabel weaving Ilocos",
        "food": "Bagnet Ilocos",
        "heritage": "Calle Crisologo Vigan"
    },
    "region-2": {
        "crafts": "Vakul Ivatan Batanes",
        "food": "Pancit batil patong Tuguegarao",
        "heritage": "Batanes stone house Sabtang"
    },
    "region-3": {
        "crafts": "Giant lantern San Fernando Pampanga",
        "food": "Sisig Pampanga",
        "heritage": "Barasoain Church Malolos"
    },
    "soccsksargen": {
        "crafts": "T'nalak weaving T'boli",
        "food": "General Santos tuna",
        "heritage": "Lake Sebu South Cotabato"
    },
    "western-visayas": {
        "crafts": "Pina cloth weaving Aklan",
        "food": "La Paz batchoy",
        "heritage": "Miag-ao Church Iloilo"
    },
    "zamboanga-peninsula": {
        "crafts": "Vinta boat Zamboanga",
        "food": "Curacha crab Zamboanga",
        "heritage": "Fort Pilar Zamboanga"
    },
    "calabarzon": {
        "crafts": "Paete woodcarving Laguna",
        "food": "Lambanog liquor Quezon",
        "heritage": "Taal Heritage Town Basilica"
    },
    "mimaropa": {
        "crafts": "Mangyan ambahan script Mindoro",
        "food": "Tamilok woodworm Palawan",
        "heritage": "Puerto Princesa Subterranean River"
    },
    "davao-region": {
        "crafts": "Mandaya Dagmay weaving Davao",
        "food": "Durian fruit Davao",
        "heritage": "Mount Apo Davao"
    }
}

# Specific festival query overrides for challenging festival names
FESTIVAL_QUERY_OVERRIDES = {
    "Rodeo Masbateño": "Rodeo Masbate",
    "Kasanggayahan Festival": "Kasanggayahan Sorsogon",
    "Sillag Festival": "Sillag Poro Point",
    "Kadagayaan Festival": "Kadagayaan Davao del Norte",
    "Naliyagan Festival": "Naliyagan Agusan del Sur",
    "Pasaka Festival": "Pasaka Tanauan Leyte",
    "Baragatan sa Palawan": "Baragatan Palawan",
    "Pandurucan Festival": "Pandurucan Calapan",
    "Kuyamis Festival": "Kuyamis Misamis Oriental",
    "Pavvurulun Afi": "Pav-vurulun Afi Tuguegarao",
    "Pulilan Carabao Festival": "Carabao Festival Pulilan Bulacan",
    "Sabutan Festival": "Sabutan Baler Aurora",
    "Zambales Mango Festival": "Dinagbapan Zambales Mango",
    "Kalivungan Festival": "Kalivungan Cotabato",
    "Halaran Festival": "Halaran Roxas Capiz",
    "Hermosa Festival / Fiesta Pilar": "Zamboanga Hermosa Festival",
    "Regatta de Zamboanga": "Regatta de Zamboanga vinta",
    "Buklog (Subanen thanksgiving ritual)": "Buklog Subanen",
    "Lami-Lamihan Festival": "Lami-Lamihan Lamitan Basilan",
    "Hariraya Eid'l Fitr": "Eid al-Fitr Philippines",
    "Hariraya Eid'l Adha": "Eid al-Adha Philippines",
    "Maulid un-Nabi": "Mawlid celebration",
    "Pista'y Dayat": "Pistay Dayat Pangasinan",
    "Sandurot Festival": "Sandurot Dumaguete",
    "Turumba Festival": "Turumba Pakil Laguna",
    "Anilag Festival": "Anilag Laguna",
    "Binatbatan Festival of the Arts": "Viva Vigan Binatbatan",
    "Aggao Nac Cagayan": "Aggao Nac Cagayan",
    "Diyandi Festival": "Diyandi Iligan City"
}

def process_single_task(task: Dict[str, Any], cache: Dict[str, Any]) -> Dict[str, Any]:
    name = task["name"]
    place = task.get("place", "")
    context = task["context"]
    task_id = task["id"]
    dest_path = task["dest_path"]

    cache_key = f"{name}::{place}::{context}"
    if cache_key in cache:
        res = cache[cache_key]
        if download_and_optimize(res["url"], dest_path):
            return {
                "id": task_id,
                "success": True,
                "local_path": "/" + os.path.relpath(dest_path, "frontend/public"),
                "credit": res["credit"],
                "width": res.get("width"),
                "height": res.get("height"),
                "name": name,
                "source": res.get("source")
            }

    # Generate attempts
    override_query = FESTIVAL_QUERY_OVERRIDES.get(name)
    attempts = []
    if override_query:
        attempts.append(("wiki", override_query))
        attempts.append(("commons", override_query))

    attempts.extend(query_candidates_for_item(name, place, context))

    for stype, q in attempts:
        res = None
        if stype == "wiki":
            res = search_wikipedia_summary(q)
        elif stype == "commons":
            res = search_wikimedia_commons(q)

        if res and res.get("url"):
            cache[cache_key] = res
            if download_and_optimize(res["url"], dest_path):
                return {
                    "id": task_id,
                    "success": True,
                    "local_path": "/" + os.path.relpath(dest_path, "frontend/public"),
                    "credit": res["credit"],
                    "width": res.get("width"),
                    "height": res.get("height"),
                    "name": name,
                    "source": res.get("source")
                }

    return {"id": task_id, "success": False, "name": name}

def main():
    print("=" * 65)
    print("KULTURA PH: HIGH-SPEED IMAGE SOURCING PIPELINE")
    print("=" * 65)

    os.makedirs(FESTIVALS_IMG_DIR, exist_ok=True)
    os.makedirs(HERITAGE_IMG_DIR, exist_ok=True)

    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                cache = json.load(f)
        except Exception:
            cache = {}

    region_files = sorted(glob.glob(f"{REGIONS_DIR}/*.md"))
    region_files = [f for f in region_files if "README" not in f]

    tasks = []

    # 1. Harvest all tasks
    for filepath in region_files:
        with open(filepath, "r", encoding="utf-8") as f:
            c = f.read()
        slug_m = re.search(r'^slug:\s*"([^"]+)"', c, re.M)
        if not slug_m:
            continue
        slug = slug_m.group(1)
        name_m = re.search(r'^name:\s*"([^"]+)"', c, re.M)
        region_name = name_m.group(1) if name_m else slug

        # Festivals
        fest_matches = re.finditer(r'-\s*\{\s*name:\s*"([^"]+)".*?place:\s*"([^"]*)".*?image:\s*"([^"]*)".*?credit:\s*"([^"]*)".*?\}', c, re.DOTALL)
        for m in fest_matches:
            fname = m.group(1)
            fplace = m.group(2)
            fslug = slugify(fname)
            dest = f"{FESTIVALS_IMG_DIR}/{fslug}.jpg"
            tasks.append({
                "type": "festival",
                "id": f"fest::{slug}::{fname}",
                "name": fname,
                "place": fplace,
                "region_slug": slug,
                "region_name": region_name,
                "context": "festival",
                "dest_path": dest
            })

        # Heritage Stories (3 per region)
        known = KNOWN_CULTURAL_TARGETS.get(slug, {})
        for cat in ("crafts", "food", "heritage"):
            target = known.get(cat, f"{region_name} {cat}")
            dest = f"{HERITAGE_IMG_DIR}/{slug}-{cat}.jpg"
            tasks.append({
                "type": "story",
                "id": f"story::{slug}::{cat}",
                "name": target,
                "place": region_name,
                "region_slug": slug,
                "category": cat,
                "context": cat,
                "dest_path": dest
            })

    print(f"Discovered {len(tasks)} items to source (Festivals & Stories)...")
    print("Executing parallel retrieval with 8 workers...\n")

    results = {}
    successful_count = 0

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_single_task, t, cache): t for t in tasks}
        for future in as_completed(futures):
            res = future.result()
            results[res["id"]] = res
            if res.get("success"):
                successful_count += 1
                print(f"  [SUCCESS] {res['name']} -> {res['local_path']} ({res.get('width')}x{res.get('height')})")
            else:
                print(f"  [PENDING] {res['name']} - could not find photo")

    # Save cache
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)

    print(f"\nRetrieval complete: {successful_count}/{len(tasks)} images sourced.")
    print("Updating region markdown files with local image paths and credits...")

    # 2. Update markdown files with local image paths and credits
    for filepath in region_files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        fm_m = re.match(r"^---\n(.*?)\n---\n(.*)$", content, re.DOTALL)
        if not fm_m:
            continue
        fm_raw, body_raw = fm_m.group(1), fm_m.group(2)
        slug_m = re.search(r'^slug:\s*"([^"]+)"', fm_raw, re.M)
        slug = slug_m.group(1) if slug_m else ""

        # Update festivals
        def fest_update(match):
            chunk = match.group(0)
            name_m = re.search(r'name:\s*"([^"]+)"', chunk)
            if not name_m:
                return chunk
            fname = name_m.group(1)
            tid = f"fest::{slug}::{fname}"
            r = results.get(tid)
            if r and r.get("success"):
                lpath = r["local_path"]
                lcred = r["credit"].replace('"', '\\"')
                chunk = re.sub(r'image:\s*"[^"]*"', f'image: "{lpath}"', chunk)
                chunk = re.sub(r'credit:\s*"[^"]*"', f'credit: "{lcred}"', chunk)
            return chunk

        new_fm = re.sub(
            r'-\s*\{\s*name:\s*"[^"]+".*?image:\s*"[^"]*".*?credit:\s*"[^"]*".*?\}',
            fest_update,
            fm_raw,
            flags=re.DOTALL
        )

        # Update storyImages
        story_lines = ["storyImages:"]
        for cat in ("crafts", "food", "heritage"):
            tid = f"story::{slug}::{cat}"
            r = results.get(tid)
            if r and r.get("success"):
                story_lines.append(f"  {cat}:")
                story_lines.append(f'    image: "{r["local_path"]}"')
                story_lines.append(f'    credit: "{r["credit"].replace(chr(34), chr(92) + chr(34))}"')

        if len(story_lines) > 1:
            story_block = "\n".join(story_lines)
            if "storyImages:" in new_fm:
                new_fm = re.sub(
                    r'storyImages:\s*\n(?:\s+[a-z]+:\s*\n\s+image:\s*"[^"]*"\s*\n\s+credit:\s*"[^"]*"\s*\n?)+',
                    story_block + "\n",
                    new_fm
                )
            else:
                if "reviewed:" in new_fm:
                    new_fm = new_fm.replace("reviewed:", f"{story_block}\nreviewed:")
                else:
                    new_fm = new_fm + f"\n{story_block}\n"

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"---\n{new_fm}\n---\n{body_raw}")

    print("\n" + "=" * 65)
    print("IMAGE SOURCING PIPELINE SUMMARY")
    print("=" * 65)
    print(f"Total Items Processed: {len(tasks)}")
    print(f"Successfully Sourced & Integrated: {successful_count} / {len(tasks)} ({successful_count/len(tasks)*100:.1f}%)")
    print(f"Festival Images Saved to: {FESTIVALS_IMG_DIR}")
    print(f"Heritage Images Saved to: {HERITAGE_IMG_DIR}")
    print("=" * 65)

if __name__ == "__main__":
    main()
