"""
Pixel Lab — image processing kernels.

Runs inside Pyodide (Python compiled to WebAssembly) in the browser.
The JS side hands us a raw 1-channel (grayscale) byte buffer + width/height
+ method id + params (as a JSON string), and we return processed 1-channel bytes.

The luma conversion (0.299R + 0.587G + 0.114B) is applied by the JS client
before sending, so every operation receives a true single-channel (H, W) float32
array. All filter functions must return an (H, W) array; process() clips and
encodes it to uint8 bytes before returning to JS.

Add a new operation:
    1. Write a function `my_op(arr, params) -> ndarray (H, W) float32`.
    2. Register it in OPERATIONS below under the method id used in the UI.
"""

import json
import numpy as np
from PIL import Image, ImageFilter


# ─── helpers ─────────────────────────────────────────────────────────────

def _to_gray(buf, w, h):
    return np.frombuffer(buf, dtype=np.uint8).reshape(h, w).astype(np.float32)


def _dist_grid(h, w):
    yy, xx = np.indices((h, w))
    return np.sqrt((yy - h / 2.0) ** 2 + (xx - w / 2.0) ** 2)


def _fft_single(g, H):
    F = np.fft.fftshift(np.fft.fft2(g))
    return np.real(np.fft.ifft2(np.fft.ifftshift(F * H)))


# ─── point processing & misc ─────────────────────────────────────────────

def negative(arr, params):
    return 255.0 - arr


def grayscale(arr, params):
    return arr


def threshold(arr, params):
    method = str(params.get("method", "manual"))
    invert = bool(params.get("invert", False))
    if method == "otsu":
        hist, _ = np.histogram(arr.astype(np.uint8), bins=256, range=(0, 256))
        total = arr.size
        sum_total = np.dot(np.arange(256), hist)
        sum_b, w_b, max_var, t = 0.0, 0.0, -1.0, 128
        for i in range(256):
            w_b += hist[i]
            if w_b == 0:
                continue
            w_f = total - w_b
            if w_f == 0:
                break
            sum_b += i * hist[i]
            m_b = sum_b / w_b
            m_f = (sum_total - sum_b) / w_f
            var = w_b * w_f * (m_b - m_f) ** 2
            if var > max_var:
                max_var, t = var, i
    elif method == "adaptive":
        win = max(3, int(params.get("t", 25)) | 1)
        img = Image.fromarray(arr.astype(np.uint8), "L")
        local = np.asarray(img.filter(ImageFilter.BoxBlur(radius=(win - 1) // 2))).astype(np.float32)
        bw = (arr >= local).astype(np.float32) * 255.0
        return 255.0 - bw if invert else bw
    else:
        t = int(params.get("t", 128))
    bw = (arr >= t).astype(np.float32) * 255.0
    return 255.0 - bw if invert else bw


def log_transform(arr, params):
    c = float(params.get("c", 45.99))
    return c * np.log1p(arr)


def gamma(arr, params):
    g = float(params.get("gamma", 1.0))
    gain = float(params.get("gain", 1.0))
    return 255.0 * gain * np.power(arr / 255.0, g)


def bit_plane(arr, params):
    planes = list(params.get("planes", [0]))
    combine = str(params.get("combine", "or"))
    g = arr.astype(np.uint8)
    if combine == "sum":
        out = np.zeros_like(g, dtype=np.float32)
        for p in planes:
            out += ((g >> int(p)) & 1).astype(np.float32) * (1 << int(p))
    elif combine == "and":
        mask = np.ones_like(g, dtype=bool)
        for p in planes:
            mask &= ((g >> int(p)) & 1).astype(bool)
        out = mask.astype(np.float32) * 255.0
    else:  # "or"
        mask = np.zeros_like(g, dtype=bool)
        for p in planes:
            mask |= ((g >> int(p)) & 1).astype(bool)
        out = mask.astype(np.float32) * 255.0
    return out


def contrast_stretch(arr, params):
    low_pct  = float(params.get("lowPct", 1))
    high_pct = float(params.get("highPct", 99))
    lo = np.percentile(arr, low_pct)
    hi = np.percentile(arr, high_pct)
    if hi <= lo:
        return arr
    return np.clip((arr - lo) * (255.0 / (hi - lo)), 0, 255)


def piecewise(arr, params):
    r1 = float(params.get("r1", 70))
    s1 = float(params.get("s1", 30))
    r2 = float(params.get("r2", 180))
    s2 = float(params.get("s2", 220))
    if r2 <= r1:
        r2 = r1 + 1
    lut = np.zeros(256, dtype=np.float32)
    rr = np.arange(256, dtype=np.float32)
    m1 = rr <= r1
    m2 = (rr > r1) & (rr <= r2)
    m3 = rr > r2
    lut[m1] = (s1 / max(r1, 1e-9)) * rr[m1]
    lut[m2] = s1 + (s2 - s1) * (rr[m2] - r1) / max(r2 - r1, 1e-9)
    lut[m3] = s2 + (255.0 - s2) * (rr[m3] - r2) / max(255.0 - r2, 1e-9)
    return lut[np.clip(arr, 0, 255).astype(np.uint8)]


def gray_slice(arr, params):
    a_lo    = int(params.get("a", 100))
    b_hi    = int(params.get("b", 170))
    s1      = int(params.get("s1", 230))
    s2      = int(params.get("s2", 20))
    with_bg = bool(params.get("withBg", True))
    invert  = bool(params.get("invert", False))
    in_band = (arr >= a_lo) & (arr <= b_hi)
    if invert:
        in_band = ~in_band
    return np.where(in_band, s1, arr if with_bg else s2)


# ─── spatial filters ─────────────────────────────────────────────────────

def gaussian(arr, params):
    sigma = float(params.get("sigma", 1.4))
    img = Image.fromarray(arr.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(radius=sigma))
    return np.asarray(img).astype(np.float32)


def mean_filter(arr, params):
    k = max(3, int(params.get("k", 3)))
    radius = (k - 1) // 2
    img = Image.fromarray(arr.astype(np.uint8), "L").filter(ImageFilter.BoxBlur(radius=int(radius)))
    return np.asarray(img).astype(np.float32)


def median(arr, params):
    k = int(params.get("k", 3))
    if k % 2 == 0:
        k += 1
    img = Image.fromarray(arr.astype(np.uint8), "L").filter(ImageFilter.MedianFilter(size=k))
    return np.asarray(img).astype(np.float32)


def laplacian(arr, params):
    gain     = float(params.get("gain", 1.0))
    eight    = str(params.get("kernel", "4")) == "8"
    add_back = bool(params.get("addBack", False))
    if eight:
        lap = (
            -8 * arr
            + np.roll(arr, 1, 0) + np.roll(arr, -1, 0)
            + np.roll(arr, 1, 1) + np.roll(arr, -1, 1)
            + np.roll(arr, (1, 1),  (0, 1)) + np.roll(arr, (1, -1),  (0, 1))
            + np.roll(arr, (-1, 1), (0, 1)) + np.roll(arr, (-1, -1), (0, 1))
        )
    else:
        lap = (
            -4 * arr
            + np.roll(arr, 1, 0) + np.roll(arr, -1, 0)
            + np.roll(arr, 1, 1) + np.roll(arr, -1, 1)
        )
    return gain * (arr - lap) if add_back else gain * np.abs(lap)


def sobel(arr, params):
    direction = str(params.get("dir", "mag"))
    gx = (
        -np.roll(arr, (1, 1),   (0, 1)) + np.roll(arr, (1, -1),   (0, 1))
        - 2 * np.roll(arr, 1, 1)        + 2 * np.roll(arr, -1, 1)
        - np.roll(arr, (-1, 1), (0, 1)) + np.roll(arr, (-1, -1), (0, 1))
    )
    gy = (
        -np.roll(arr, (1, 1),   (0, 1)) - 2 * np.roll(arr, 1, 0) - np.roll(arr, (1, -1), (0, 1))
        + np.roll(arr, (-1, 1), (0, 1)) + 2 * np.roll(arr, -1, 0) + np.roll(arr, (-1, -1), (0, 1))
    )
    if direction == "x":
        return np.abs(gx)
    elif direction == "y":
        return np.abs(gy)
    elif direction == "angle":
        return (np.arctan2(gy, gx) + np.pi) / (2 * np.pi) * 255.0
    else:
        return np.sqrt(gx * gx + gy * gy)


def unsharp(arr, params):
    radius = float(params.get("radius", 1.4))
    amount = float(params.get("amount", 100)) / 100.0
    thresh = float(params.get("threshold", 0))
    img = Image.fromarray(arr.astype(np.uint8), "L")
    blurred = np.asarray(img.filter(ImageFilter.GaussianBlur(radius=int(round(radius))))).astype(np.float32)
    diff = arr - blurred
    if thresh > 0:
        diff = np.where(np.abs(diff) >= thresh, diff, 0.0)
    return arr + amount * diff


# ─── histogram processing ────────────────────────────────────────────────

def global_eq(arr, params):
    blend = float(params.get("blend", 100)) / 100.0
    g = arr.astype(np.uint8)
    hist, _ = np.histogram(g, bins=256, range=(0, 256))
    cdf = hist.cumsum().astype(np.float32)
    lo = cdf.min()
    cdf = (cdf - lo) / (cdf[-1] - lo + 1e-9) * 255.0
    return (1 - blend) * arr + blend * cdf[g]


def clahe(arr, params):
    tr   = max(1, int(params.get("tileR", 8)))
    tc   = max(1, int(params.get("tileC", 8)))
    clip = float(params.get("clipLimit", 4.0))
    g = arr.astype(np.uint8)
    h, w = g.shape
    th, tw = h / tr, w / tc

    luts = np.empty((tr, tc, 256), dtype=np.float32)
    for ty in range(tr):
        for tx in range(tc):
            y0, y1 = int(round(ty * th)), int(round((ty + 1) * th))
            x0, x1 = int(round(tx * tw)), int(round((tx + 1) * tw))
            tile = g[y0:y1, x0:x1]
            n_pix = max(tile.size, 1)
            hist, _ = np.histogram(tile, bins=256, range=(0, 256))
            clip_count = int(clip * n_pix / 256.0)
            excess = max(int(np.maximum(hist - clip_count, 0).sum()), 0)
            hist = np.minimum(hist, clip_count)
            hist += excess // 256
            cdf = hist.cumsum().astype(np.float32)
            luts[ty, tx] = cdf / max(cdf[-1], 1) * 255.0

    yy = np.arange(h)
    xx = np.arange(w)
    ty_f = yy / th - 0.5
    tx_f = xx / tw - 0.5
    ty0 = np.clip(np.floor(ty_f).astype(int), 0, tr - 1)
    ty1 = np.clip(ty0 + 1,                    0, tr - 1)
    tx0 = np.clip(np.floor(tx_f).astype(int), 0, tc - 1)
    tx1 = np.clip(tx0 + 1,                    0, tc - 1)
    wy = (ty_f - ty0).astype(np.float32)
    wx = (tx_f - tx0).astype(np.float32)

    out = np.empty_like(g, dtype=np.float32)
    for r in range(h):
        v00 = luts[ty0[r], tx0, g[r]]
        v01 = luts[ty0[r], tx1, g[r]]
        v10 = luts[ty1[r], tx0, g[r]]
        v11 = luts[ty1[r], tx1, g[r]]
        top    = v00 * (1 - wx) + v01 * wx
        bottom = v10 * (1 - wx) + v11 * wx
        out[r] = top * (1 - wy[r]) + bottom * wy[r]
    return out


def match_hist(arr, params):
    return global_eq(arr, params)


def linear_stretch(arr, params):
    low_pct  = float(params.get("lowPct", 0))
    high_pct = float(params.get("highPct", 100))
    lo = np.percentile(arr, low_pct)
    hi = np.percentile(arr, high_pct)
    if hi <= lo:
        return arr
    return np.clip((arr - lo) * (255.0 / (hi - lo)), 0, 255)


# ─── frequency-domain filters ────────────────────────────────────────────

def ideal_lp(arr, params):
    d0 = float(params.get("d0", 36))
    h, w = arr.shape
    H = (_dist_grid(h, w) <= d0).astype(np.float32)
    return _fft_single(arr, H)


def butter_lp(arr, params):
    d0 = float(params.get("d0", 40))
    n  = float(params.get("order", 4))
    h, w = arr.shape
    D = _dist_grid(h, w)
    H = 1.0 / (1.0 + (D / max(d0, 1e-9)) ** (2 * n))
    return _fft_single(arr, H)


def gaussian_lp(arr, params):
    d0 = float(params.get("d0", 42))
    h, w = arr.shape
    D = _dist_grid(h, w)
    H = np.exp(-(D ** 2) / (2 * d0 * d0))
    return _fft_single(arr, H)


def ideal_hp(arr, params):
    d0 = float(params.get("d0", 24))
    h, w = arr.shape
    H = (_dist_grid(h, w) > d0).astype(np.float32)
    return _fft_single(arr, H) + 128.0


def butter_hp(arr, params):
    d0    = float(params.get("d0", 28))
    n     = float(params.get("order", 3))
    boost = float(params.get("boost", 1.0))
    h, w = arr.shape
    D = _dist_grid(h, w)
    H = (1.0 - 1.0 / (1.0 + (D / max(d0, 1e-9)) ** (2 * n))) * boost
    return _fft_single(arr, H) + 128.0


def notch_reject(arr, params):
    u0 = float(params.get("u0", 42))
    v0 = float(params.get("v0", -18))
    d0 = float(params.get("d0", 8))
    h, w = arr.shape
    yy, xx = np.indices((h, w))
    cy, cx = h / 2.0, w / 2.0
    d1 = np.sqrt((yy - (cy + v0)) ** 2 + (xx - (cx + u0)) ** 2)
    d2 = np.sqrt((yy - (cy - v0)) ** 2 + (xx - (cx - u0)) ** 2)
    H = ((d1 > d0) & (d2 > d0)).astype(np.float32)
    return _fft_single(arr, H)


def homomorphic(arr, params):
    gL = float(params.get("gammaL", 0.4))
    gH = float(params.get("gammaH", 1.8))
    d0 = float(params.get("d0", 30))
    c  = float(params.get("c",  1.0))
    h, w = arr.shape
    D = _dist_grid(h, w)
    H = (gH - gL) * (1.0 - np.exp(-c * (D ** 2) / max(d0 * d0, 1e-9))) + gL
    L = np.log(arr + 1.0)
    F = np.fft.fftshift(np.fft.fft2(L))
    return np.exp(np.real(np.fft.ifft2(np.fft.ifftshift(F * H)))) - 1.0


# ─── dispatch ────────────────────────────────────────────────────────────

OPERATIONS = {
    # histogram
    "global-eq":   global_eq,
    "clahe":       clahe,
    "match-hist":  match_hist,
    "stretch":     linear_stretch,
    # point
    "negative":    negative,
    "log":         log_transform,
    "gamma":       gamma,
    "threshold":   threshold,
    "bit-plane":   bit_plane,
    "contrast":    contrast_stretch,
    "piecewise":   piecewise,
    "gray-slice":  gray_slice,
    # spatial
    "mean":        mean_filter,
    "gaussian":    gaussian,
    "median":      median,
    "laplacian":   laplacian,
    "sobel":       sobel,
    "unsharp":     unsharp,
    # frequency
    "ideal-lp":    ideal_lp,
    "butter-lp":   butter_lp,
    "gaussian-lp": gaussian_lp,
    "ideal-hp":    ideal_hp,
    "butter-hp":   butter_hp,
    "notch":       notch_reject,
    "homomorphic": homomorphic,
    # misc
    "grayscale":   grayscale,
}


def process(buf, w, h, method, params_json):
    """Entry point called from the JS worker."""
    if hasattr(buf, "to_py"):
        buf = buf.to_py()
    params = json.loads(params_json) if params_json else {}
    arr = _to_gray(buf, w, h)
    fn = OPERATIONS.get(method)
    out = fn(arr, params) if fn else arr
    return np.clip(out, 0, 255).astype(np.uint8).tobytes()
