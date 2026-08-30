from pathlib import Path
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 640, 720
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'apps' / 'regional-anesthesia-trainer' / 'public' / 'assets' / 'ultrasound' / 'adductor-canal' / 'v0.1'
OUT.mkdir(parents=True, exist_ok=True)

STATIONS = [
    ('proximal', dict(ax=0.53, ay=0.48, ar=0.055, vx=0.63, vy=0.50, vrx=0.055, vry=0.035, nx=0.46, ny=0.43, nw=0.085, nh=0.048, sart_y=0.30, sart_rot=-13, fascia_y=0.405)),
    ('proximal-mid', dict(ax=0.52, ay=0.50, ar=0.052, vx=0.61, vy=0.515, vrx=0.052, vry=0.032, nx=0.46, ny=0.455, nw=0.082, nh=0.046, sart_y=0.315, sart_rot=-10, fascia_y=0.420)),
    ('mid', dict(ax=0.50, ay=0.525, ar=0.049, vx=0.595, vy=0.535, vrx=0.050, vry=0.030, nx=0.455, ny=0.478, nw=0.078, nh=0.044, sart_y=0.335, sart_rot=-7, fascia_y=0.445)),
    ('mid-distal', dict(ax=0.485, ay=0.55, ar=0.046, vx=0.575, vy=0.558, vrx=0.046, vry=0.028, nx=0.445, ny=0.505, nw=0.074, nh=0.041, sart_y=0.355, sart_rot=-4, fascia_y=0.468)),
    ('distal', dict(ax=0.47, ay=0.575, ar=0.043, vx=0.555, vy=0.580, vrx=0.043, vry=0.026, nx=0.43, ny=0.535, nw=0.070, nh=0.038, sart_y=0.375, sart_rot=-1, fascia_y=0.49)),
]


def smooth_noise(seed: int, sigma: float, strength: float) -> np.ndarray:
    rng = np.random.default_rng(seed)
    values = rng.normal(0, 1, (H, W)).astype(np.float32)
    image = Image.fromarray(np.uint8(np.clip((values + 3) * 42.5, 0, 255)), 'L').filter(ImageFilter.GaussianBlur(sigma))
    arr = np.asarray(image, dtype=np.float32)
    arr = (arr - arr.mean()) / (arr.std() + 1e-6)
    return arr * strength


def ellipse_mask(cx: float, cy: float, rx: float, ry: float) -> np.ndarray:
    yy, xx = np.mgrid[0:H, 0:W]
    x = (xx / W - cx) / rx
    y = (yy / H - cy) / ry
    return (x * x + y * y) <= 1


def rotated_ellipse_mask(cx: float, cy: float, rx: float, ry: float, theta_deg: float) -> np.ndarray:
    yy, xx = np.mgrid[0:H, 0:W]
    x = xx / W - cx
    y = yy / H - cy
    theta = np.deg2rad(theta_deg)
    xr = np.cos(theta) * x + np.sin(theta) * y
    yr = -np.sin(theta) * x + np.cos(theta) * y
    return (xr / rx) ** 2 + (yr / ry) ** 2 <= 1


def draw_frame(name: str, idx: int, p: dict[str, float]) -> None:
    yy, xx = np.mgrid[0:H, 0:W]
    yn = yy / (H - 1)
    xn = xx / (W - 1)
    rng = np.random.default_rng(3000 + idx)

    base = 50 - 28 * yn
    img = base + smooth_noise(1000 + idx, 14, 7) + smooth_noise(2000 + idx, 3.2, 9)
    img += rng.normal(0, 9, (H, W)).astype(np.float32)

    subcut = yn < 0.19
    lobulation = 18 * np.sin(xn * 15 * np.pi + idx * 0.4) * np.exp(-((yn - 0.11) / 0.08) ** 2)
    img[subcut] += 24 + lobulation[subcut]

    skin = np.exp(-((yn - 0.022) / 0.008) ** 2)
    superficial_fascia = np.exp(-((yn - (0.185 + 0.006 * np.sin(xn * 6 * np.pi))) / 0.006) ** 2)
    img += 150 * skin + 72 * superficial_fascia

    sartorius = rotated_ellipse_mask(0.52, p['sart_y'], 0.39, 0.115, p['sart_rot'])
    vastus_medialis = rotated_ellipse_mask(0.28, 0.47 + 0.018 * idx, 0.28, 0.24, 7)
    adductor = rotated_ellipse_mask(0.67, 0.66 - 0.005 * idx, 0.37, 0.26, -4)
    for mask, offset in [(sartorius, -14), (vastus_medialis, -10), (adductor, -12)]:
        img[mask] += offset

    fascicles_a = 11 * (np.sin((xn * 72 + yn * 18 + idx * 0.7) * np.pi) > 0.82)
    fascicles_b = 8 * (np.sin((xn * 46 - yn * 34 + idx * 0.45) * np.pi) > 0.88)
    img[sartorius] += fascicles_a[sartorius]
    img[vastus_medialis] += fascicles_b[vastus_medialis]
    img[adductor] += (0.6 * fascicles_a + 0.6 * fascicles_b)[adductor]

    fascia_curve = p['fascia_y'] + 0.018 * np.sin((xn - 0.5) * np.pi * 2)
    canal_fascia = np.exp(-((yn - fascia_curve) / 0.0055) ** 2)
    anisotropy = 0.72 + 0.28 * np.cos((xn - 0.5) * np.pi * 1.6 + idx * 0.16) ** 2
    img += 90 * canal_fascia + 23 * canal_fascia * anisotropy

    artery = ellipse_mask(p['ax'], p['ay'], p['ar'], p['ar'] * 0.92)
    artery_outer = ellipse_mask(p['ax'], p['ay'], p['ar'] * 1.20, p['ar'] * 1.12)
    artery_wall = artery_outer & (~artery)
    vein = ellipse_mask(p['vx'], p['vy'], p['vrx'], p['vry'])
    vein_outer = ellipse_mask(p['vx'], p['vy'], p['vrx'] * 1.15, p['vry'] * 1.18)
    vein_wall = vein_outer & (~vein)
    img[artery] = 5 + rng.normal(0, 1.8, artery.sum())
    img[artery_wall] += 96
    img[vein] = 8 + rng.normal(0, 2.2, vein.sum())
    img[vein_wall] += 62

    for cx, cy, width, gain in [(p['ax'], p['ay'], 0.095, 18), (p['vx'], p['vy'], 0.085, 11)]:
        band = np.exp(-((xn - cx) / width) ** 2) * (1 / (1 + np.exp(-(yn - cy - 0.03) * 45)))
        img += gain * band

    nerve_outer = rotated_ellipse_mask(p['nx'], p['ny'], p['nw'], p['nh'], -9 + idx)
    nerve_inner = rotated_ellipse_mask(p['nx'], p['ny'], p['nw'] * 0.82, p['nh'] * 0.75, -9 + idx)
    nerve_rim = nerve_outer & (~nerve_inner)
    img[nerve_inner] += 20
    img[nerve_rim] += 62
    for ox, oy, rr in [(-0.035, -0.010, 0.010), (-0.010, 0.012, 0.009), (0.020, -0.010, 0.010), (0.040, 0.012, 0.008), (-0.025, 0.024, 0.007), (0.010, -0.025, 0.008)]:
        fascicle = ellipse_mask(p['nx'] + ox, p['ny'] + oy, rr, rr * 0.80) & nerve_inner
        ring = ellipse_mask(p['nx'] + ox, p['ny'] + oy, rr * 1.22, rr * 1.02) & (~fascicle) & nerve_inner
        img[fascicle] -= 20
        img[ring] += 15

    edge = 1 - 0.24 * np.clip(np.abs(xn - 0.5) / 0.5, 0, 1) ** 1.7
    depth = np.exp(-yn * 0.38)
    img *= edge * depth
    img[rng.random((H, W)) > 0.9975] += 55

    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.45))
    draw = ImageDraw.Draw(pil)
    draw.line([(0, 12), (W - 1, 12)], fill=225, width=2)
    draw.line([(0, 16), (W - 1, 16)], fill=135, width=1)

    path = OUT / f'{name}.webp'
    pil.save(path, 'WEBP', quality=88, method=6)
    data = path.read_bytes()
    print(f'{name}: {pil.width}x{pil.height} {len(data)} bytes sha256={hashlib.sha256(data).hexdigest()}')


for index, (station, params) in enumerate(STATIONS):
    draw_frame(station, index, params)
