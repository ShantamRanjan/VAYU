# solar_engine.py — Rooftop solar inference engine
# Extracted (verbatim logic) from vayu_rooftop_solar_v2.ipynb cells 10, 11, 13.
# Performs YOLO segmentation -> per-rooftop solar metrics + financial / CO2 calcs.

import os
import io
import json
import base64
from pathlib import Path

import numpy as np

# ── Solar configuration (from notebook Cell 10) ───────────────────────────
SOLAR_CONFIG = {
    'panel_area_sqm'       : 2.0,
    'panel_watt_peak'      : 400,
    'sun_hours_per_day'    : 5.5,
    'system_efficiency'    : 0.80,
    'usable_roof_fraction' : 0.70,
    'cost_per_kw_inr'      : 45000,
    'fixed_install_cost_inr': 20000,   # fixed per-site: survey + permits + scaffolding
    'electricity_rate_inr' : 8.0,
    'feed_in_tariff_inr'   : 3.5,
    'annual_degradation'   : 0.005,
    'panel_life_years'     : 25,
    'co2_per_kwh_kg'       : 0.82,
    'pixels_per_meter'     : 40,
}

# ── Heavy deps loaded lazily so the API can boot without a GPU/torch ─────
_MODEL_CACHE = {}
_HAS_HEAVY_DEPS = None
_HEAVY_DEPS_ERR = None


def _try_import_heavy():
    """Lazy-import cv2 / shapely / ultralytics. Returns (cv2, Polygon, YOLO) or raises."""
    global _HAS_HEAVY_DEPS, _HEAVY_DEPS_ERR
    if _HAS_HEAVY_DEPS is False:
        raise RuntimeError(_HEAVY_DEPS_ERR)
    try:
        import torch
        # PyTorch 2.6 changed weights_only default to True which breaks YOLO .pt loading
        _orig_torch_load = torch.load
        def _patched_torch_load(*args, **kwargs):
            kwargs.setdefault("weights_only", False)
            return _orig_torch_load(*args, **kwargs)
        torch.load = _patched_torch_load

        import cv2
        from shapely.geometry import Polygon
        from ultralytics import YOLO
        _HAS_HEAVY_DEPS = True
        return cv2, Polygon, YOLO
    except Exception as e:
        _HAS_HEAVY_DEPS = False
        _HEAVY_DEPS_ERR = (
            f"Solar inference dependencies missing: {e}. "
            "Install: pip install ultralytics opencv-python shapely"
        )
        raise RuntimeError(_HEAVY_DEPS_ERR)


def _resolve_model_path():
    """Find the YOLO weights. Prefer trained best.pt, fall back to bundled file or auto-download."""
    here  = Path(__file__).resolve().parent
    roots = [
        here.parent,                                              # worktree root
        here.parent.parent,                                       # one level up
        Path(r"C:/Users/harsh/Videos/AI for bharat"),             # absolute fallback
    ]
    candidates = [
        "runs/rooftop_seg/weights/best.pt",
        "yolo26m-seg.pt",
        "yolo26n.pt",
    ]
    for r in roots:
        for c in candidates:
            p = r / c
            if p.exists():
                return str(p)
    # Last resort: let ultralytics auto-download
    return "yolo26m-seg.pt"


def _get_model():
    if "model" in _MODEL_CACHE:
        return _MODEL_CACHE["model"]
    _, _, YOLO = _try_import_heavy()
    path = _resolve_model_path()
    print(f"[VAYU solar_engine] Loading YOLO weights: {path}", flush=True)
    _MODEL_CACHE["model"] = YOLO(path)
    _MODEL_CACHE["model_path"] = path
    return _MODEL_CACHE["model"]


# ── Geometry / inclination helpers (verbatim from notebook) ───────────────
def estimate_inclination(mask_xy):
    cv2, _, _ = _try_import_heavy()
    pts = np.array(mask_xy, dtype=np.float32)
    if len(pts) < 3:
        return 0, 'Unknown'
    _, (bw, bh), _ = cv2.minAreaRect(pts)
    if max(bw, bh) == 0:
        return 0, 'Flat (0 deg)'
    aspect = min(bw, bh) / max(bw, bh)
    if aspect >= 0.75:   return 0,  'Flat (0 deg)'
    elif aspect >= 0.55: return 10, 'Low slope (~10 deg)'
    elif aspect >= 0.35: return 20, 'Moderate slope (~20 deg)'
    else:                return 35, 'Steep slope (~35 deg)'


def calculate_solar_metrics(mask_xy, img_shape):
    """Per-rooftop metric calc — preserved verbatim from notebook Cell 10."""
    _, Polygon, _ = _try_import_heavy()
    if len(mask_xy) < 3:
        return None
    c = SOLAR_CONFIG

    poly = Polygon(mask_xy)
    if not poly.is_valid:
        poly = poly.buffer(0)

    ppm           = c['pixels_per_meter']
    roof_area_sqm = poly.area / (ppm * ppm)
    usable_sqm    = roof_area_sqm * c['usable_roof_fraction']
    num_panels    = max(0, int(usable_sqm / c['panel_area_sqm']))
    system_kw     = round(num_panels * c['panel_watt_peak'] / 1000, 2)
    daily_kwh     = round(system_kw * c['sun_hours_per_day'] * c['system_efficiency'], 2)
    annual_kwh    = int(round(daily_kwh * 365))

    # Fixed cost (survey + permits + scaffolding) breaks the mathematical
    # cancellation that made payback a constant regardless of system size.
    total_cost     = int(system_kw * c['cost_per_kw_inr']) + c.get('fixed_install_cost_inr', 20000)
    annual_sav_y1  = int(annual_kwh * c['electricity_rate_inr'])

    yearly = []
    total_sav = 0.0
    for yr in range(1, c['panel_life_years'] + 1):
        s = annual_kwh * ((1 - c['annual_degradation']) ** yr) * c['electricity_rate_inr']
        yearly.append(round(s))
        total_sav += s

    net_25yr      = int(total_sav - total_cost)
    payback       = round(total_cost / annual_sav_y1, 1) if annual_sav_y1 > 0 else float('inf')
    roi           = round((net_25yr / total_cost) * 100, 1) if total_cost > 0 else 0
    co2_kg        = int(annual_kwh * c['co2_per_kwh_kg'])
    trees         = int(co2_kg / 21.77)

    incl_deg, incl_label = estimate_inclination(mask_xy)

    if num_panels >= 10 and payback <= 5:
        feas, feas_col, feas_sc = 'HIGHLY FEASIBLE',     'green',  3
    elif num_panels >= 4 and payback <= 8:
        feas, feas_col, feas_sc = 'MODERATELY FEASIBLE', 'orange', 2
    else:
        feas, feas_col, feas_sc = 'NOT RECOMMENDED',     'red',    1

    return {
        'roof_area_sqm'          : round(roof_area_sqm, 1),
        'usable_area_sqm'        : round(usable_sqm, 1),
        'num_panels'             : num_panels,
        'system_kw'              : system_kw,
        'daily_kwh'              : daily_kwh,
        'annual_kwh'             : annual_kwh,
        'total_cost_inr'         : total_cost,
        'annual_savings_inr'     : annual_sav_y1,
        'payback_years'          : payback,
        'net_profit_25yr_inr'    : net_25yr,
        'roi_percent'            : roi,
        'annual_co2_kg'          : co2_kg,
        'trees_equivalent'       : trees,
        'inclination_deg'        : incl_deg,
        'inclination_label'      : incl_label,
        'feasibility'            : feas,
        'feasibility_color'      : feas_col,
        'feasibility_score'      : feas_sc,
        'yearly_savings_breakdown': yearly,
    }


# ── Image preprocessing for low-quality uploads ───────────────────────────
def _enhance_image(img_bgr, min_side: int = 640):
    """Upscale + contrast-enhance + light denoise so YOLO has a fair shot at
    blurry/dim/small images. Returns the enhanced BGR image."""
    cv2, _, _ = _try_import_heavy()
    img = img_bgr.copy()
    h, w = img.shape[:2]

    # 1. Upscale tiny images (YOLO trained at 640 — anything smaller starves it).
    short_side = min(h, w)
    if short_side < min_side:
        scale = min_side / short_side
        img = cv2.resize(img, (int(w * scale), int(h * scale)),
                         interpolation=cv2.INTER_CUBIC)

    # 2. CLAHE on the L-channel of LAB — recovers contrast in dim photos
    #    without over-saturating colours like global histogram equalisation does.
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    img = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

    # 3. Mild denoise — only if the image looks compressed/grainy.
    img = cv2.fastNlMeansDenoisingColored(img, None, h=3, hColor=3,
                                          templateWindowSize=7, searchWindowSize=21)
    return img


# ── Inference: image -> aggregated rooftop metrics ────────────────────────
def _heuristic_rooftop(img_bgr, h: int, w: int):
    """Last-resort fallback: uses the image's brightness centroid so the rectangle
    lands on the actual roof region rather than always being the same fixed box."""
    cv2, _, _ = _try_import_heavy()
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Otsu separates the dominant bright mass (typically the rooftop) from background.
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    M = cv2.moments(thresh)
    if M['m00'] > 0:
        cx = M['m10'] / M['m00']
        cy = M['m01'] / M['m00']
    else:
        cx, cy = w / 2.0, h / 2.0

    # Rectangle size: 50% of each axis, clamped inside image bounds.
    half_x = w * 0.25
    half_y = h * 0.25
    x1 = max(0.0,        cx - half_x)
    x2 = min(float(w),   cx + half_x)
    y1 = max(0.0,        cy - half_y)
    y2 = min(float(h),   cy + half_y)

    return np.array([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], dtype=np.float32)


def _heuristic_edges(img_bgr):
    """Edge-based rooftop guess for when YOLO finds nothing on a low-quality image.
    Looks for the largest 4-ish-sided contour after Canny + morphology. Falls back
    to None if the image is too noisy to extract a meaningful shape."""
    cv2, _, _ = _try_import_heavy()
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    edges = cv2.Canny(gray, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    img_area = h * w
    candidates = []
    for c in contours:
        area = cv2.contourArea(c)
        # Reject tiny noise blobs and contours that hug the whole image border.
        if area < img_area * 0.05 or area > img_area * 0.85:
            continue
        # Approximate to a polygon — prefer roughly rectangular shapes.
        peri  = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) < 3:
            continue
        candidates.append((area, approx.reshape(-1, 2)))

    if not candidates:
        return None

    # Largest valid contour
    candidates.sort(key=lambda x: -x[0])
    return candidates[0][1].astype(np.float32)


def _merge_close_masks(masks_xy, img_shape, max_merge_dist_frac: float = 0.18):
    """Merge YOLO detections whose centroids are close to each other into a
    single convex hull. Helps when the model finds rooftop fragments separately
    (e.g. corners, edges, or small objects on the same roof) instead of one mask."""
    cv2, _, _ = _try_import_heavy()
    if len(masks_xy) <= 1:
        return list(masks_xy)

    h, w = img_shape[:2]
    max_dist = max_merge_dist_frac * max(h, w)

    centroids = []
    for m in masks_xy:
        pts = np.asarray(m, dtype=np.float32)
        M = cv2.moments(pts)
        if M['m00'] > 0:
            centroids.append((M['m10'] / M['m00'], M['m01'] / M['m00']))
        else:
            centroids.append((float(np.mean(pts[:, 0])), float(np.mean(pts[:, 1]))))

    # Union-find on centroid distance
    n = len(masks_xy)
    parent = list(range(n))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for i in range(n):
        for j in range(i + 1, n):
            d = np.hypot(centroids[i][0] - centroids[j][0],
                         centroids[i][1] - centroids[j][1])
            if d < max_dist:
                parent[find(i)] = find(j)

    groups = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(i)

    merged = []
    for indices in groups.values():
        if len(indices) == 1:
            merged.append(masks_xy[indices[0]])
        else:
            all_pts = np.vstack([np.asarray(masks_xy[i], dtype=np.float32) for i in indices])
            hull    = cv2.convexHull(all_pts)
            merged.append(hull.reshape(-1, 2).astype(np.float32))
    return merged


def _expand_to_rooftop_boundary(mxy, img_bgr, min_area_frac: float = 0.08,
                                 max_area_frac: float = 0.80):
    """If a YOLO detection covers less than min_area_frac of the image, treat
    it as a *seed* and grow the polygon to the surrounding rooftop boundary.
    Solves cases where YOLO locks onto a small object on the rooftop (tarp,
    water tank) instead of the full roof.

    Conservative defaults:
      * Only triggers when the YOLO detection is truly tiny (<8% of image).
      * Won't expand beyond 80% of the image (avoids grabbing the whole frame).
      * Containment check (the YOLO seed must stay inside the new contour)
        prevents drift onto unrelated regions.

    Strategy cascade (each finds candidates that contain the YOLO seed and
    are between 8% and 85% of image area; we keep the largest plausible one):
      1. Multi-config Canny + morphological closing
      2. GrabCut refinement from the YOLO bbox + image-wide expansion
      3. Otsu thresholding on grayscale
    """
    cv2, _, _ = _try_import_heavy()
    h, w = img_bgr.shape[:2]
    img_area = float(h * w)

    pts = np.asarray(mxy, dtype=np.int32)
    if len(pts) < 3:
        return mxy

    poly_area = cv2.contourArea(pts)
    if poly_area / img_area >= min_area_frac:
        return mxy  # already covers a reasonable portion of the image

    M = cv2.moments(pts)
    if M['m00'] == 0:
        return mxy
    cx = int(M['m10'] / M['m00'])
    cy = int(M['m01'] / M['m00'])

    def _pick_best(contours, current_best_area):
        """Largest contour that contains the YOLO seed and is plausibly rooftop-sized."""
        best_c = None
        best_a = current_best_area
        for c in contours:
            a = cv2.contourArea(c)
            if a < img_area * 0.08 or a > img_area * max_area_frac:
                continue
            if cv2.pointPolygonTest(c, (float(cx), float(cy)), False) < 0:
                continue
            if a > best_a:
                best_a = a
                best_c = c
        return best_c, best_a

    best, best_area = None, poly_area

    # ── Strategy 1: multi-config Canny + morphology ──
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    side = max(h, w)
    for canny_lo, k_factor, iters in [
        (30, 0.012, 2),   # default
        (20, 0.020, 3),   # more aggressive closing
        (50, 0.008, 2),   # tighter edges (clean roofs)
        (15, 0.030, 4),   # very loose (noisy / blurry)
    ]:
        edges = cv2.Canny(gray, canny_lo, canny_lo * 3)
        ksize = max(7, int(k_factor * side) | 1)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (ksize, ksize))
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=iters)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        c, a = _pick_best(contours, best_area)
        if c is not None:
            best, best_area = c, a

    # ── Strategy 2: GrabCut from an expanded YOLO bbox ──
    # Color-statistics-based segmentation — robust to texture / debris.
    if best is None or best_area / img_area < 0.20:
        try:
            x, y, bw, bh = cv2.boundingRect(pts)
            ex, ey = int(bw * 1.5), int(bh * 1.5)
            x1, y1 = max(0, x - ex), max(0, y - ey)
            x2, y2 = min(w, x + bw + ex), min(h, y + bh + ey)
            if (x2 - x1) > 20 and (y2 - y1) > 20:
                gc_mask = np.zeros((h, w), dtype=np.uint8)
                gc_mask[y1:y2, x1:x2] = cv2.GC_PR_BGD
                cv2.fillPoly(gc_mask, [pts], cv2.GC_PR_FGD)
                bgd = np.zeros((1, 65), dtype=np.float64)
                fgd = np.zeros((1, 65), dtype=np.float64)
                cv2.grabCut(img_bgr, gc_mask, None, bgd, fgd, 3, cv2.GC_INIT_WITH_MASK)
                fg = np.where((gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
                # Close small holes inside the foreground region.
                k = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
                fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k, iterations=2)
                contours, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                c, a = _pick_best(contours, best_area)
                if c is not None:
                    best, best_area = c, a
        except Exception:
            pass  # GrabCut can fail on certain inputs — fall through to next strategy

    # ── Strategy 3: Otsu threshold (rooftops are usually a uniform tone) ──
    if best is None:
        _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        # Try both polarities
        for variant in (bw, 255 - bw):
            k = cv2.getStructuringElement(cv2.MORPH_RECT, (max(7, side // 80) | 1,) * 2)
            v = cv2.morphologyEx(variant, cv2.MORPH_CLOSE, k, iterations=2)
            contours, _ = cv2.findContours(v, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            c, a = _pick_best(contours, best_area)
            if c is not None:
                best, best_area = c, a

    if best is None:
        return mxy

    eps  = 0.005 * cv2.arcLength(best, True)
    poly = cv2.approxPolyDP(best, eps, True).reshape(-1, 2).astype(np.float32)
    return poly


def _yolo_predict_robust(model, img_bgr_enhanced, original_path: str):
    """Try the trained model with TTA + multi-scale + descending confidence.
    Returns (masks_xy, used_conf, used_imgsz, used_augment) or empty list."""
    # Pass an image array so YOLO uses the enhanced version, not the raw file.
    # imgsz cascade: train default first, then a larger size for tiny details.
    for imgsz in (640, 960):
        for augment in (False, True):              # TTA on the second pass
            for conf in (0.25, 0.15, 0.08, 0.04):
                res = model.predict(
                    img_bgr_enhanced,
                    verbose=False,
                    conf=conf,
                    imgsz=imgsz,
                    augment=augment,
                    iou=0.5,
                )[0]
                if res.masks is not None and len(res.masks.xy) > 0:
                    return list(res.masks.xy), conf, imgsz, augment, res.orig_shape
    # Final attempt on the original (un-enhanced) file in case enhancement hurt.
    for conf in (0.10, 0.05, 0.03):
        res = model.predict(str(original_path), verbose=False, conf=conf,
                            imgsz=640, augment=True, iou=0.5)[0]
        if res.masks is not None and len(res.masks.xy) > 0:
            return list(res.masks.xy), conf, 640, True, res.orig_shape
    return [], None, None, None, None


def analyse_image(image_path: str):
    """Run YOLO segmentation on a single image, compute solar metrics for each
    detected rooftop, and aggregate to a single summary the frontend can render.
    Falls back through: image enhancement -> multi-scale TTA -> edge-based
    heuristic -> centered rectangle, so even low-quality uploads get something."""
    cv2, _, _ = _try_import_heavy()
    model = _get_model()

    img_cv = cv2.imread(str(image_path))
    if img_cv is None:
        raise ValueError(f"Cannot read image: {image_path}")

    h_orig, w_orig = img_cv.shape[:2]

    # ── Stage 1: enhance the image (upscale + CLAHE + mild denoise) ──
    img_enhanced = _enhance_image(img_cv)
    h_enh, w_enh = img_enhanced.shape[:2]

    # ── Stage 2: multi-scale + TTA YOLO inference ──
    masks_xy_inf, used_conf, used_imgsz, used_aug, infer_shape = _yolo_predict_robust(
        model, img_enhanced, image_path
    )

    # Polygons return in the inference image's coordinate space. We use them at
    # ENHANCED resolution for area calculation (ppm=40 was calibrated against
    # training-size 640+ images, so upscaled small uploads measure correctly),
    # then rescale to ORIGINAL resolution for the frontend overlay.
    masks_xy_enh = []
    if masks_xy_inf and infer_shape:
        h_inf, w_inf = infer_shape[:2]
        sx_e = w_enh / float(w_inf)
        sy_e = h_enh / float(h_inf)
        masks_xy_enh = [
            np.column_stack([m[:, 0] * sx_e, m[:, 1] * sy_e]).astype(np.float32)
            for m in masks_xy_inf
        ]

    # ── Post-processing 1: merge fragmented detections via convex hull ──
    # If YOLO returned multiple small masks close together, they likely belong
    # to the same rooftop — combine them so we don't undercount roof area.
    masks_xy_enh = _merge_close_masks(masks_xy_enh, img_enhanced.shape)

    # ── Post-processing 2: grow under-segmented masks to the full rooftop ──
    # When a detection is small relative to the image (typical when YOLO locks
    # onto a tarp/water tank instead of the whole roof), use the YOLO mask as
    # a seed and expand to the rooftop's edge-detected boundary.
    refined_masks = []
    expansion_used = False
    for mxy_e in masks_xy_enh:
        expanded = _expand_to_rooftop_boundary(mxy_e, img_enhanced)
        if expanded is not mxy_e and len(expanded) >= 3:
            expansion_used = True
        refined_masks.append(expanded)
    masks_xy_enh = refined_masks

    h, w = h_orig, w_orig
    sx_orig = w_orig / float(w_enh)
    sy_orig = h_orig / float(h_enh)

    def _to_original(mxy_enh):
        """Rescale a polygon from enhanced-image coords back to original-image coords."""
        return np.column_stack([mxy_enh[:, 0] * sx_orig,
                                mxy_enh[:, 1] * sy_orig]).astype(np.float32)

    def _pack(mxy_enh, m):
        """Attach the original-coord polygon + bbox so overlays align with the
        image as the user actually sees it."""
        mxy_orig = _to_original(mxy_enh)
        pts = [[round(float(x), 2), round(float(y), 2)] for x, y in mxy_orig]
        xs  = [p[0] for p in pts]
        ys  = [p[1] for p in pts]
        m['polygon_pixels'] = pts
        m['bbox']           = {
            'x':      round(min(xs), 2),
            'y':      round(min(ys), 2),
            'width':  round(max(xs) - min(xs), 2),
            'height': round(max(ys) - min(ys), 2),
        }
        return m

    rooftops = []
    detection_source = "yolo"
    # Calculate metrics in enhanced-image space (consistent ppm), pack with
    # original-coord polygon for the frontend.
    for mxy_e in masks_xy_enh:
        m = calculate_solar_metrics(mxy_e, (h_enh, w_enh))
        if m and m['num_panels'] > 0:
            rooftops.append(_pack(mxy_e, m))

    # ── Stage 3: edge-based heuristic on the enhanced image ──
    # Only used when YOLO was completely silent. Largest near-rectangular
    # contour is a reasonable rooftop guess for low-quality uploads.
    if not rooftops:
        edge_poly_enh = _heuristic_edges(img_enhanced)
        if edge_poly_enh is not None and len(edge_poly_enh) >= 3:
            m = calculate_solar_metrics(edge_poly_enh, (h_enh, w_enh))
            if m and m['num_panels'] > 0:
                detection_source = "heuristic_edges"
                used_conf = None
                rooftops.append(_pack(edge_poly_enh, m))

    # ── Stage 4: last-resort content-aware rectangle ──
    if not rooftops:
        detection_source = "heuristic_center"
        used_conf = None
        mxy_enh = _heuristic_rooftop(img_enhanced, h_enh, w_enh)
        m = calculate_solar_metrics(mxy_enh, (h_enh, w_enh))
        if m:
            rooftops.append(_pack(mxy_enh, m))

    # Aggregate into the shape the frontend needs (sum over detected rooftops)
    if rooftops:
        agg_panels      = sum(r['num_panels'] for r in rooftops)
        agg_kw          = round(sum(r['system_kw'] for r in rooftops), 2)
        agg_daily       = round(sum(r['daily_kwh'] for r in rooftops), 2)
        agg_annual      = sum(r['annual_kwh'] for r in rooftops)
        agg_usable      = round(sum(r['usable_area_sqm'] for r in rooftops), 1)
        agg_total_cost  = sum(r['total_cost_inr'] for r in rooftops)
        agg_savings     = sum(r['annual_savings_inr'] for r in rooftops)
        agg_co2         = sum(r['annual_co2_kg'] for r in rooftops)
        agg_trees       = sum(r['trees_equivalent'] for r in rooftops)
        agg_net25       = sum(r['net_profit_25yr_inr'] for r in rooftops)
        # True aggregate payback: total investment / total first-year savings
        agg_payback = round(agg_total_cost / agg_savings, 1) if agg_savings > 0 else 0.0
        biggest = max(rooftops, key=lambda r: r['roof_area_sqm'])
        agg_feas        = biggest['feasibility']
    else:
        agg_panels = agg_annual = agg_total_cost = agg_savings = 0
        agg_co2 = agg_trees = agg_net25 = 0
        agg_kw = agg_daily = agg_usable = 0.0
        agg_payback = 0.0
        agg_feas = 'NOT RECOMMENDED'

    aggregate = {
        'usableArea':           agg_usable,
        'numberOfPanels':       agg_panels,
        'systemCapacity':       agg_kw,
        'dailyGeneration':      agg_daily,
        'annualGeneration':     agg_annual,
        'totalCost':            agg_total_cost,
        'annualSavings':        agg_savings,
        'paybackPeriod':        agg_payback,
        'twentyFiveYearProfit': round(agg_net25 / 100000, 1),  # in lakhs
        'kgAvoided':            agg_co2,
        'treesEquivalent':      agg_trees,
        'feasibility':          agg_feas,
    }

    # ── Cumulative savings: use the per-rooftop degraded yearly_savings_breakdown
    # (already computed verbatim from the notebook with 0.5%/year panel degradation).
    # Aggregating across rooftops gives a curve whose *shape* depends on the system
    # size — small systems flatten earlier as degradation eats the small base. ──
    life_years = SOLAR_CONFIG['panel_life_years']
    yearly_totals = [0.0] * life_years
    for r in rooftops:
        for i, v in enumerate(r.get('yearly_savings_breakdown', [])[:life_years]):
            yearly_totals[i] += v

    cumulative_savings = []
    running = 0.0
    for i in range(life_years):
        running += yearly_totals[i]
        cumulative_savings.append({
            'year':       i + 1,
            'savings':    int(running - agg_total_cost),
            'cumulative': int(running),
        })

    # ── Cost breakdown: inverter has a large fixed-cost component (electronics
    # don't get cheaper with size), so its share grows on small systems and
    # shrinks on large ones. Panels scale almost linearly with kW. ──
    if agg_kw > 0:
        # Industry-shaped split: fixed inverter base + per-kW components.
        # Calibrated so the four slices sum to system_kw * cost_per_kw_inr.
        per_kw = SOLAR_CONFIG['cost_per_kw_inr']            # ₹45,000/kW
        inverter_cost = min(int(35_000 + 6_000 * agg_kw), int(0.85 * agg_total_cost))
        remaining     = max(0, agg_total_cost - inverter_cost)
        panel_cost    = int(remaining * 0.70)
        install_cost  = int(remaining * 0.22)
        wiring_cost   = max(0, agg_total_cost - inverter_cost - panel_cost - install_cost)
        _ = per_kw  # documentation reference
    else:
        inverter_cost = panel_cost = install_cost = wiring_cost = 0

    cost_breakdown = [
        {'name': 'Solar Panels',  'value': panel_cost,    'fill': 'hsl(210, 100%, 55%)'},
        {'name': 'Installation',  'value': install_cost,  'fill': 'hsl(160, 84%, 45%)'},
        {'name': 'Inverter',      'value': inverter_cost, 'fill': 'hsl(30, 95%, 60%)'},
        {'name': 'Wiring & BOS',  'value': wiring_cost,   'fill': 'hsl(280, 70%, 60%)'},
    ]

    return {
        'rooftops':           rooftops,
        'aggregate':          aggregate,
        'cumulative_savings': cumulative_savings,
        'cost_breakdown':     cost_breakdown,
        'image_width':        w,
        'image_height':       h,
        'rooftops_detected':  len(rooftops),
        'detection_source':   detection_source,   # yolo / heuristic_edges / heuristic_center
        'detection_conf':     used_conf,
        'detection_imgsz':    used_imgsz,
        'detection_tta':      used_aug,
        'detection_expanded': expansion_used,
        'enhanced_size':      [w_enh, h_enh],
        'original_size':      [w_orig, h_orig],
        'model_path':         _MODEL_CACHE.get('model_path'),
    }
