import urllib.request, urllib.parse, json, subprocess, os, re

HEADERS = {"User-Agent": "KulturaPH/1.0 (cultural-atlas@kulturaph.org)"}
file_title = "File:Hablon in the Kabilin Center.jpg"
info_url = "https://commons.wikimedia.org/w/api.php?action=query&titles=" + urllib.parse.quote(file_title) + "&prop=imageinfo&iiprop=url|extmetadata&format=json"
req2 = urllib.request.Request(info_url, headers=HEADERS)
with urllib.request.urlopen(req2) as resp2:
    d2 = json.loads(resp2.read().decode("utf-8"))
p = list(d2["query"]["pages"].values())[0]
raw_url = p["imageinfo"][0]["url"]
meta = p["imageinfo"][0].get("extmetadata", {})
artist = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "Wikimedia Commons")).strip() or "Wikimedia Commons"
license_name = re.sub(r"<[^>]+>", "", meta.get("LicenseShortName", {}).get("value", "CC BY-SA 4.0")).strip()
credit = f"{artist[:50]} ({license_name})"

dest = "frontend/public/content/images/heritage/western-visayas-crafts.jpg"
req3 = urllib.request.Request(raw_url, headers=HEADERS)
with urllib.request.urlopen(req3) as resp3, open(dest, "wb") as f:
    f.write(resp3.read())
subprocess.run(["sips", "-Z", "1920", dest])
print("Successfully downloaded:", dest, f"({credit})")

md_path = "frontend/public/content/data/regions/western-visayas.md"
with open(md_path, "r", encoding="utf-8") as f:
    c = f.read()

c = re.sub(r'(crafts:\s*\n\s+image:\s*)"[^"]*"(.*?credit:\s*)"[^"]*"', rf'\1"/content/images/heritage/western-visayas-crafts.jpg"\2"{credit}"', c)
with open(md_path, "w", encoding="utf-8") as f:
    f.write(c)
print("Updated western-visayas.md")
