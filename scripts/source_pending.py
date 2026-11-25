#!/usr/bin/env python3
"""
Targeted second pass for any remaining pending items.
Uses Wikipedia and Wikimedia Commons with specific cultural search terms.
"""

import os
import re
import json
import time
import subprocess
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional

HEADERS = {
    "User-Agent": "KulturaPH/1.0 (cultural-atlas@kulturaph.org; https://github.com/tope/kultura-ph)"
}

TARGETS = {
    "fest::bicol::Rodeo Masbateño": ("Rodeo Masbate", "frontend/public/content/images/festivals/rodeo-masbateño.jpg"),
    "fest::bicol::Kasanggayahan Festival": ("Kasanggayahan", "frontend/public/content/images/festivals/kasanggayahan-festival.jpg"),
    "fest::calabarzon::Lambanog": ("Lambanog", "frontend/public/content/images/heritage/calabarzon-food.jpg"),
    "story::calabarzon::crafts": ("Woodcarving Paete", "frontend/public/content/images/heritage/calabarzon-crafts.jpg"),
    "story::calabarzon::food": ("Lambanog", "frontend/public/content/images/heritage/calabarzon-food.jpg"),
    "story::car::food": ("Etag Cordillera", "frontend/public/content/images/heritage/car-food.jpg"),
    "fest::car::Gotad ad Ifugao": ("Ifugao traditional celebration", "frontend/public/content/images/festivals/gotad-ad-ifugao.jpg"),
    "story::caraga::crafts": ("Philippine traditional basket", "frontend/public/content/images/heritage/caraga-crafts.jpg"),
    "story::caraga::food": ("Surigao seafood delicacy", "frontend/public/content/images/heritage/caraga-food.jpg"),
    "fest::caraga::Kadagayaan Festival": ("Kadagayaan", "frontend/public/content/images/festivals/kadagayaan-festival.jpg"),
    "story::central-visayas::crafts": ("Guitar workshop Lapu-Lapu Cebu", "frontend/public/content/images/heritage/central-visayas-crafts.jpg"),
    "fest::davao-region::Kadayawan sa Dabaw": ("Kadayawan Festival", "frontend/public/content/images/festivals/kadayawan-sa-dabaw.jpg"),
    "story::mimaropa::crafts": ("Ambahan Mangyan", "frontend/public/content/images/heritage/mimaropa-crafts.jpg"),
    "story::mimaropa::food": ("Tamilok", "frontend/public/content/images/heritage/mimaropa-food.jpg"),
    "fest::mimaropa::Biniray Festival": ("Biniray Romblon", "frontend/public/content/images/festivals/biniray-festival.jpg"),
    "fest::region-1::Viva Vigan Binatbatan Festival of the Arts": ("Binatbatan Vigan", "frontend/public/content/images/festivals/viva-vigan-binatbatan-festival-of-the-arts.jpg"),
    "story::region-1::heritage": ("Calle Crisologo Vigan Ilocos Sur", "frontend/public/content/images/heritage/region-1-heritage.jpg"),
    "story::region-2::crafts": ("Ivatan people Batanes", "frontend/public/content/images/heritage/region-2-crafts.jpg"),
    "fest::region-1::Pista'y Dayat": ("Pistay Dayat Lingayen Pangasinan", "frontend/public/content/images/festivals/pistay-dayat.jpg"),
    "fest::region-2::Aggao Nac Cagayan": ("Cagayan holiday festival", "frontend/public/content/images/festivals/aggao-nac-cagayan.jpg"),
    "fest::region-2::Pavvurulun Afi": ("Tuguegarao festival", "frontend/public/content/images/festivals/pavvurulun-afi.jpg"),
    "fest::region-3::Sabutan Festival": ("Sabutan craft Baler Aurora", "frontend/public/content/images/festivals/sabutan-festival.jpg"),
    "story::zamboanga-peninsula::food": ("Ranina ranina Zamboanga", "frontend/public/content/images/heritage/zamboanga-peninsula-food.jpg"),
}

def clean_html(text: str) -> str:
    if not text: return ""
    return re.sub(r"<[^>]+>", "", text).strip()

def search_wikimedia(query: str) -> Optional[Dict[str, Any]]:
    # 1. Wikipedia summary
    wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(query.replace(' ', '_'))}"
    req = urllib.request.Request(wiki_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "originalimage" in data:
                return {
                    "url": data["originalimage"]["source"],
                    "credit": f"Wikipedia / {data.get('title', query)}",
                    "width": data["originalimage"].get("width"),
                    "height": data["originalimage"].get("height"),
                }
    except Exception:
        pass

    # 2. Commons query
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&srlimit=8&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

    hits = data.get("query", {}).get("search", [])
    candidates = [h["title"] for h in hits if not h["title"].lower().endswith((".svg", ".ogg", ".pdf"))]
    if not candidates:
        return None

    titles_str = "|".join(candidates[:5])
    info_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(titles_str)}&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json"
    req = urllib.request.Request(info_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

    pages = data.get("query", {}).get("pages", {})
    best = None
    for pid, p in pages.items():
        if "imageinfo" not in p: continue
        ii = p["imageinfo"][0]
        w = ii.get("width", 0)
        h = ii.get("height", 0)
        if w < 500 or h < 350: continue
        meta = ii.get("extmetadata", {})
        artist = clean_html(meta.get("Artist", {}).get("value", "Wikimedia Commons"))
        license_name = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
        url = ii.get("url", "").split("?")[0]
        score = w + (1000 if w >= h else 0)
        if best is None or score > best["score"]:
            best = {
                "url": url,
                "credit": f"{artist[:50]} ({license_name})",
                "width": w,
                "height": h,
                "score": score
            }
    return best

def download(url: str, dest: str) -> bool:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r, open(dest, "wb") as f:
            f.write(r.read())
        subprocess.run(["sips", "-Z", "1920", dest], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception as e:
        print("Download error:", e)
        return False

def main():
    print("Running targeted second pass for pending items...")
    resolved = 0
    for key, (term, dest) in TARGETS.items():
        if os.path.exists(dest) and os.path.getsize(dest) > 10000:
            print(f"Already exists: {dest}")
            resolved += 1
            continue

        res = search_wikimedia(term)
        if res and download(res["url"], dest):
            resolved += 1
            local_rel = "/" + os.path.relpath(dest, "frontend/public")
            print(f"[RESOLVED] {key} -> {local_rel} ({res['credit']})")
            
            # Update markdown file
            parts = key.split("::")
            ktype, rslug = parts[0], parts[1]
            md_path = f"frontend/public/content/data/regions/{rslug}.md"
            if os.path.exists(md_path):
                with open(md_path, "r") as f:
                    content = f.read()
                
                if ktype == "fest":
                    fname = parts[2]
                    # update festival image
                    pattern = rf'(-\s*\{{\s*name:\s*"{re.escape(fname)}".*?image:\s*)"[^"]*"(.*?credit:\s*)"[^"]*"'
                    content = re.sub(pattern, rf'\1"{local_rel}"\2"{res["credit"]}"', content, flags=re.DOTALL)
                elif ktype == "story":
                    cat = parts[2]
                    # update storyImages
                    pat = rf'({cat}:\s*\n\s+image:\s*)"[^"]*"(.*?credit:\s*)"[^"]*"'
                    if re.search(pat, content):
                        content = re.sub(pat, rf'\1"{local_rel}"\2"{res["credit"]}"', content)
                    else:
                        block = f"  {cat}:\n    image: \"{local_rel}\"\n    credit: \"{res['credit']}\""
                        if "storyImages:" in content:
                            content = content.replace("storyImages:\n", f"storyImages:\n{block}\n")
                
                with open(md_path, "w") as f:
                    f.write(content)
        else:
            print(f"[STILL PENDING] {key} (tried: {term})")
        time.sleep(0.2)

    print(f"Second pass finished. Resolved {resolved}/{len(TARGETS)} targets.")

if __name__ == "__main__":
    main()
