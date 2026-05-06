"""
Fix Cell 11 in vayu_rooftop_solar_v2.ipynb by adding the build_3panel
function and its helper _draw_label (+ colour constants) that are
currently only defined later in Cell 13.
"""
import json, pathlib, sys

nb_path = pathlib.Path(r"C:\Users\harsh\Videos\AI for bharat\vayu_rooftop_solar_v2.ipynb")

# ── read notebook ─────────────────────────────────────────────────────────
nb = json.loads(nb_path.read_text(encoding="utf-8"))

# ── locate Cell 11 by its comment header ──────────────────────────────────
cell11_idx = None
for i, cell in enumerate(nb["cells"]):
    if cell["cell_type"] == "code":
        src = "".join(cell["source"])
        if "Cell 11: Save All Annotations" in src:
            cell11_idx = i
            break

if cell11_idx is None:
    print("ERROR: Could not find Cell 11.")
    sys.exit(1)

# ── check if already patched ──────────────────────────────────────────────
existing_src = "".join(nb["cells"][cell11_idx]["source"])
if "def build_3panel" in existing_src:
    print("Cell 11 already contains build_3panel – nothing to do.")
    sys.exit(0)

# ── new lines to prepend (colour constants + helpers) ─────────────────────
new_lines = [
    "# ── Cell 11: Save All Annotations — JSON + 3-panel images ───────────────\n",
    "\n",
    "# ── Colour constants ──────────────────────────────────────────────────────\n",
    "_GOLD  = (255, 178,   0)\n",
    "_BLUE  = (  0, 120, 255)\n",
    "_WHITE = (255, 255, 255)\n",
    "_BLACK = (  0,   0,   0)\n",
    "\n",
    "def _draw_label(img, lines, cx, cy, line_colors=None):\n",
    "    font       = cv2.FONT_HERSHEY_SIMPLEX\n",
    "    fscale, ft = 0.38, 1\n",
    "    pad, lh    = 5, 15\n",
    "    widths     = [cv2.getTextSize(l, font, fscale, ft)[0][0] for l in lines]\n",
    "    bw = max(widths) + pad * 2\n",
    "    bh = len(lines) * lh + pad * 2\n",
    "    lx = max(0, min(cx - bw // 2, img.shape[1] - bw - 1))\n",
    "    ly = max(0, min(cy - bh // 2, img.shape[0] - bh - 1))\n",
    "    cv2.rectangle(img, (lx, ly), (lx + bw, ly + bh), _BLACK, -1)\n",
    "    cv2.rectangle(img, (lx, ly), (lx + bw, ly + bh), _GOLD,   1)\n",
    "    for j, line in enumerate(lines):\n",
    "        col = line_colors[j] if line_colors and j < len(line_colors) else _WHITE\n",
    "        ty  = ly + pad + (j + 1) * lh\n",
    "        cv2.putText(img, line, (lx + pad, ty), font, fscale, col, ft, cv2.LINE_AA)\n",
    "\n",
    "def build_3panel(img_path, detections):\n",
    "    img_cv  = cv2.imread(str(img_path))\n",
    "    img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)\n",
    "    h, w    = img_rgb.shape[:2]\n",
    "    ppm     = SOLAR_CONFIG['pixels_per_meter']\n",
    "\n",
    "    mask_panel = np.zeros((h, w, 3), dtype=np.uint8)\n",
    "    annot      = (img_rgb * 0.55).astype(np.uint8)\n",
    "\n",
    "    for idx, (mask_xy, m) in enumerate(detections):\n",
    "        pts = np.array(mask_xy, dtype=np.int32)\n",
    "        cv2.fillPoly(mask_panel, [pts], _GOLD)\n",
    "\n",
    "        ov = annot.copy()\n",
    "        cv2.fillPoly(ov, [pts], _GOLD)\n",
    "        annot = cv2.addWeighted(annot, 0.45, ov, 0.55, 0)\n",
    "        cv2.polylines(annot, [pts], True, _GOLD, 2)\n",
    "\n",
    "        rect  = cv2.minAreaRect(pts.astype(np.float32))\n",
    "        box   = cv2.boxPoints(rect).astype(np.int32)\n",
    "        rw_m  = round(rect[1][0] / ppm, 1)\n",
    "        rh_m  = round(rect[1][1] / ppm, 1)\n",
    "        cv2.drawContours(annot, [box], 0, _BLUE, 2)\n",
    "\n",
    "        cx     = int(np.mean(pts[:, 0]))\n",
    "        cy     = int(np.mean(pts[:, 1]))\n",
    "        lines  = [f'Roof #{idx+1}',\n",
    "                  f'Area: {m[\"roof_area_sqm\"]} m2',\n",
    "                  f'{rw_m}m x {rh_m}m']\n",
    "        colors = [_GOLD, _WHITE, (180, 220, 180)]\n",
    "        if m.get('inclination_deg', 0) > 0:\n",
    "            lines.append(f'Incl: {m[\"inclination_label\"]}')\n",
    "            colors.append((255, 220, 100))\n",
    "        _draw_label(annot, lines, cx, cy, colors)\n",
    "\n",
    "    return img_rgb, mask_panel, annot\n",
    "\n",
]

# ── rebuild Cell 11 source: replace old header, prepend helpers ───────────
old_source = nb["cells"][cell11_idx]["source"]

# Drop the original first line (the comment header) since we include it in new_lines
if old_source and "Cell 11:" in old_source[0]:
    old_source = old_source[1:]

nb["cells"][cell11_idx]["source"] = new_lines + old_source

# Clear old outputs so the cell reruns cleanly
nb["cells"][cell11_idx]["outputs"] = []
nb["cells"][cell11_idx]["execution_count"] = None

# ── write notebook back ───────────────────────────────────────────────────
nb_path.write_text(json.dumps(nb, ensure_ascii=False, indent=1), encoding="utf-8")
print("SUCCESS: Cell 11 updated with build_3panel and helpers.")
