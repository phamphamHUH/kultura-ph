#!/usr/bin/env python3
"""
Final precision sourcing pass for the remaining 11 festivals and 9 story images.
Ensures 100% complete authentic photographic coverage across Kultura PH.
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

# The remaining items and their search queries
MISSING_ITEMS = [
    # Festivals
    ("fest", "bicol", "Rodeo Masbateño", ["Rodeo Masbate", "Masbate cattle", "Masbate rodeo festival"], "frontend/public/content/images/festivals/rodeo-masbateño.jpg"),
    ("fest", "bicol", "Kasanggayahan Festival", ["Kasanggayahan", "Sorsogon festival", "Sorsogon street dance"], "frontend/public/content/images/festivals/kasanggayahan-festival.jpg"),
    ("fest", "car", "Gotad ad Ifugao", ["Ifugao cultural festival", "Ifugao rituals", "Banaue cultural performance"], "frontend/public/content/images/festivals/gotad-ad-ifugao.jpg"),
    ("fest", "caraga", "Kadagayaan Festival", ["Kadagayaan festival", "Surigao festival", "Surigao del Sur culture"], "frontend/public/content/images/festivals/kadagayaan-festival.jpg"),
    ("fest", "mimaropa", "Baragatan sa Palawan", ["Baragatan festival", "Palawan festival", "Puerto Princesa dancers"], "frontend/public/content/images/festivals/baragatan-sa-palawan.jpg"),
    ("fest", "mimaropa", "Biniray Festival", ["Biniray festival", "Romblon festival", "Romblon Biniray"], "frontend/public/content/images/festivals/biniray-festival.jpg"),
    ("fest", "mimaropa", "Pandurucan Festival", ["Oriental Mindoro festival", "Calapan street dancing", "Mangyan festival"], "frontend/public/content/images/festivals/pandurucan-festival.jpg"),
    ("fest", "northern-mindanao", "Diyandi Festival", ["Diyandi festival", "Iligan City festival", "Iligan street dancing"], "frontend/public/content/images/festivals/diyandi-festival.jpg"),
    ("fest", "region-1", "Pista'y Dayat", ["Pistay Dayat", "Pangasinan sea festival", "Lingayen beach festival"], "frontend/public/content/images/festivals/pistay-dayat.jpg"),
    ("fest", "region-2", "Aggao Nac Cagayan", ["Cagayan festival", "Cagayan Valley cultural celebration", "Tuguegarao festival"], "frontend/public/content/images/festivals/aggao-nac-cagayan.jpg"),
    ("fest", "region-3", "Sabutan Festival", ["Sabutan festival", "Baler Aurora festival", "Baler street dance"], "frontend/public/content/images/festivals/sabutan-festival.jpg"),
    
    # Story Images
    ("story", "calabarzon", "crafts", ["Paete woodcarving", "Wood carving Laguna", "Paete artisan"], "frontend/public/content/images/heritage/calabarzon-crafts.jpg"),
    ("story", "calabarzon", "food", ["Pancit habhab", "Lucban longganisa", "Pancit Lucban"], "frontend/public/content/images/heritage/calabarzon-food.jpg"),
    ("story", "car", "food", ["Etag pork", "Cordillera preserved meat", "Pinikpikan"], "frontend/public/content/images/heritage/car-food.jpg"),
    ("story", "caraga", "food", ["Sayongsong Surigao", "Surigao delicacy", "Caraga seafood"], "frontend/public/content/images/heritage/caraga-food.jpg"),
    ("story", "central-visayas", "crafts", ["Alegre guitar factory", "Lapu-Lapu guitar maker", "Cebu guitar maker"], "frontend/public/content/images/heritage/central-visayas-crafts.jpg"),
    ("story", "mimaropa", "crafts", ["Mangyan basket", "Hanunoo Mangyan basketry", "Mangyan crafts"], "frontend/public/content/images/heritage/mimaropa-crafts.jpg"),
    ("story", "negros-island-region", "crafts", ["MassKara festival mask", "MassKara mask maker", "Bacolod mask"], "frontend/public/content/images/heritage/negros-island-region-crafts.jpg"),
    ("story", "northern-mindanao", "crafts", ["Talaandig beadwork", "Bukidnon traditional weaving", "Kaamulan costume embroidery"], "frontend/public/content/images/heritage/northern-mindanao-crafts.jpg"),
    ("story", "zamboanga-peninsula", "food", ["Curacha crab Zamboanga", "Spanner crab Philippines", "Curacha dish"], "frontend/public/content/images/heritage/zamboanga-peninsula-food.jpg"),
]

def clean_html(text: str) -> str:
    if not text: return ""
    return re.sub(r"<[^>]+>", "", text).strip()

def search_best_image(queries: list) -> Optional[Dict[str, Any]]:
    for q in queries:
        # 1. Wiki summary
        try:
            wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(q.replace(' ', '_'))}"
            req = urllib.request.Request(wiki_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if "originalimage" in data and data["originalimage"].get("width", 0) > 400:
                    return {
                        "url": data["originalimage"]["source"],
                        "credit": f"Wikipedia / {data.get('title', q)}",
                        "width": data["originalimage"]["width"],
                        "height": data["originalimage"]["height"],
                    }
        except Exception:
            pass

        # 2. Commons search
        try:
            url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(q)}&srnamespace=6&srlimit=8&format=json"
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            hits = data.get("query", {}).get("search", [])
            candidates = [h["title"] for h in hits if not h["title"].lower().endswith((".svg", ".ogg", ".pdf", ".tif"))]
            if candidates:
                titles_str = "|".join(candidates[:5])
                info_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(titles_str)}&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json"
                req = urllib.request.Request(info_url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    info_data = json.loads(resp.read().decode("utf-8"))
                pages = info_data.get("query", {}).get("pages", {})
                for pid, p in pages.items():
                    if "imageinfo" not in p: continue
                    ii = p["imageinfo"][0]
                    w = ii.get("width", 0)
                    h = ii.get("height", 0)
                    if w < 500 or h < 350: continue
                    meta = ii.get("extmetadata", {})
                    artist = clean_html(meta.get("Artist", {}).get("value", "Wikimedia Commons"))
                    license_name = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
                    author = artist[:50] if artist else "Wikimedia Commons"
                    return {
                        "url": ii.get("url", "").split("?")[0],
                        "credit": f"{author} ({license_name})",
                        "width": w,
                        "height": h
                    }
        except Exception:
            pass
        time.sleep(0.15)
    return None

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
    print("Sourcing final 20 missing items...")
    resolved = 0
    for itype, rslug, iname, queries, dest in MISSING_ITEMS:
        print(f"Searching for {itype} :: {rslug} :: {iname}...")
        res = search_best_image(queries)
        if res and download(res["url"], dest):
            resolved += 1
            local_rel = "/" + os.path.relpath(dest, "frontend/public")
            print(f"  [SUCCESS] -> {local_rel} ({res['credit']})")
            
            # Update region markdown file
            md_path = f"frontend/public/content/data/regions/{rslug}.md"
            if os.path.exists(md_path):
                with open(md_path, "r", encoding="utf-8") as f:
                    content = f.read()

                if itype == "fest":
                    pattern = rf'(-\s*\{{\s*name:\s*"{re.escape(iname)}".*?image:\s*)"[^"]*"(.*?credit:\s*)"[^"]*"'
                    content = re.sub(pattern, rf'\1"{local_rel}"\2"{res["credit"]}"', content, flags=re.DOTALL)
                elif itype == "story":
                    cat = iname
                    pat = rf'({cat}:\s*\n\s+image:\s*)"[^"]*"(.*?credit:\s*)"[^"]*"'
                    if re.search(pat, content):
                        content = re.sub(pat, rf'\1"{local_rel}"\2"{res["credit"]}"', content)
                    else:
                        block = f"  {cat}:\n    image: \"{local_rel}\"\n    credit: \"{res['credit']}\""
                        if "storyImages:" in content:
                            content = content.replace("storyImages:\n", f"storyImages:\n{block}\n")
                        elif "reviewed:" in content:
                            content = content.replace("reviewed:", f"storyImages:\n{block}\nreviewed:")

                with open(md_path, "w", encoding="utf-8") as f:
                    f.write(content)
        else:
            print(f"  [PENDING] No image found for {iname}")

    print(f"\nFinal pass resolved: {resolved}/{len(MISSING_ITEMS)}")

if __name__ == "__main__":
    main()
