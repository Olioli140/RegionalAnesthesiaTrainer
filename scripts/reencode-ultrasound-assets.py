from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
asset_dir = root / 'apps' / 'regional-anesthesia-trainer' / 'public' / 'assets' / 'ultrasound' / 'adductor-canal' / 'v0.1'
files = ['proximal.webp', 'proximal-mid.webp', 'mid.webp', 'mid-distal.webp', 'distal.webp']

for name in files:
    path = asset_dir / name
    tmp = path.with_suffix('.normalized.webp')
    with Image.open(path) as image:
        image.load()
        image.convert('L').save(tmp, 'WEBP', quality=88, method=6)
    tmp.replace(path)
    print(f'normalized {name}: {path.stat().st_size} bytes')
