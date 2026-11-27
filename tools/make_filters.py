"""Filter curves of the 24 CHEF imaging bands on a logarithmic wavelength axis, as an inline SVG fragment.

Input: the folder ANCILLARY/filter_curves of the CHEF2026 release (one file per band, wavelength in angstrom and total
response). Every curve is scaled to a peak of one. The dashed lines mark Lyman-alpha and H-alpha at z = 2.18.
Usage: python3 tools/make_filters.py <filter_curves folder> > assets/filters.svg.frag
"""
import math
import sys
from pathlib import Path

BANDS = [  # file stem, label, hue class
    ('galex_fuv', 'FUV', 'violet'), ('galex_nuv', 'NUV', 'violet'),
    ('cfht_u', 'u', 'blue'), ('hsc_g', 'g', 'blue'), ('hsc_r', 'r', 'blue'), ('hsc_i', 'i', 'blue'),
    ('hsc_z', 'z', 'blue'), ('hsc_y', 'y', 'blue'),
    ('hsc_nb387', 'NB387', 'sky'), ('moircs_nb2083', 'NB2083', 'sky'), ('newfirm_nb2096', 'NB2096', 'sky'),
    ('newfirm_jx', 'J', 'gold'), ('newfirm_kxs', 'Ks', 'gold'), ('moircs_ks', 'Ks', 'gold'),
    ('irac_ch1', '3.6', 'orchid'), ('irac_ch2', '4.5', 'orchid'),
    ('wise_w1', 'W1', 'orchid'), ('wise_w2', 'W2', 'orchid'), ('wise_w3', 'W3', 'orchid'), ('wise_w4', 'W4', 'orchid'),
    ('spire_250', '250', 'rose'), ('spire_350', '350', 'rose'), ('spire_500', '500', 'rose'), ('scuba2_850', '850', 'rose'),
]
L0, L1 = math.log10(0.12), math.log10(1100.0)      # micrometres
W, H, BASE, AMP = 1000, 246, 170, 110
Z = 2.18
x = lambda um: 30 + (W - 60) * (math.log10(um) - L0) / (L1 - L0)

def curve(path):
    pts = []
    for line in Path(path).read_text().splitlines():
        if line.startswith('#') or not line.strip():
            continue
        a, t = map(float, line.split()[:2])
        pts.append((a / 1e4, t))
    peak = max(t for _, t in pts)
    pts = [(l, t / peak) for l, t in pts]
    lo = next(i for i, (_, t) in enumerate(pts) if t > 0.01)
    hi = len(pts) - next(i for i, (_, t) in enumerate(reversed(pts)) if t > 0.01)
    pts = pts[max(lo - 1, 0):hi + 1]
    step = max(1, len(pts) // 90)
    return pts[::step] + [pts[-1]]

folder = Path(sys.argv[1])
out = [f'<svg class="filters" viewBox="0 0 {W} {H}" role="img" aria-labelledby="filters-title">',
       '<title id="filters-title">Filter curves of the 24 imaging bands of CHEF, from the far-ultraviolet to 850 micrometres, '
       'with Lyman-alpha and H-alpha at z = 2.18</title>']
for stem, label, hue in BANDS:
    pts = curve(folder / f'{stem}.dat')
    d = 'M' + ' L'.join(f'{x(l):.1f},{BASE - AMP * t:.1f}' for l, t in pts)
    nb = ' filter-nb' if stem.split('_')[1].startswith('nb') else ''
    out.append(f'<path class="filter hue-{hue}{nb}" d="{d} L{x(pts[-1][0]):.1f},{BASE} L{x(pts[0][0]):.1f},{BASE} Z"/>')
for name, rest in (('Ly&#945;', 0.121567), ('H&#945;', 0.656461)):
    lx = x(rest * (1 + Z))
    out.append(f'<line class="filter-line" x1="{lx:.1f}" y1="{BASE - AMP - 22}" x2="{lx:.1f}" y2="{BASE}"/>')
    out.append(f'<text class="filter-line-label" x="{lx + 5:.1f}" y="{BASE - AMP - 12}">{name} at z = {Z}</text>')
out.append(f'<line class="filter-axis" x1="30" y1="{BASE}" x2="{W - 30}" y2="{BASE}"/>')
for um in (0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000):
    out.append(f'<line class="filter-axis" x1="{x(um):.1f}" y1="{BASE}" x2="{x(um):.1f}" y2="{BASE + 5}"/>')
    out.append(f'<text class="filter-tick" x="{x(um):.1f}" y="{BASE + 20}" text-anchor="middle">{um:g}</text>')
out.append(f'<text class="filter-tick" x="{x(40):.1f}" y="{BASE + 44}" text-anchor="middle">observed wavelength (&#956;m)</text>')
groups = (('ultraviolet', 0.15, 0.25), ('optical', 0.35, 1.0), ('near-infrared', 1.2, 2.3), ('mid-infrared', 3.4, 22),
          ('far-infrared', 250, 850))
for name, a, b in groups:
    out.append(f'<text class="filter-group" x="{x(math.sqrt(a * b)):.1f}" y="{BASE + 44}" text-anchor="middle">{name}</text>')
out.append('</svg>')
print('\n'.join(out))
