"""Ridgeline figure of the quasar surface density around the Cosmic Himalayas, written as an inline SVG fragment.

Input: a CSV of SDSS spectroscopic quasars with columns ra, dec, z, zWarning (here the table of quasars at
2.0 <= z <= 2.5 in the shared data pool, Data_Project/SDSS-eBOSS/QSO_z20-z25_AllSky.csv).
Each ridge is one strip of declination; its height is the number density of quasars at 2.16 <= z <= 2.20 along right
ascension, smoothed with a Gaussian. Usage: python3 tools/make_ridges.py <quasar csv> > assets/ridges.svg.frag
"""
import csv
import math
import sys

Z0, Z1 = 2.16, 2.20
RA0, RA1 = 8.0, 57.0          # degrees
DEC0, DEC1, STEP = -2.5, 4.5, 0.5
SIGMA = 0.2                   # degrees, Gaussian smoothing along the strip (on the sky)
W, H, TOP, GAP, AMP = 1000, 400, 150, 16.0, 30.0

rows = [r for r in csv.DictReader(open(sys.argv[1])) if r['ra'] and r['zWarning'] in ('0', '')]
qso = [(float(r['ra']), float(r['dec'])) for r in rows if Z0 <= float(r['z']) <= Z1]
n_strips = round((DEC1 - DEC0) / STEP)
grid = [RA0 + i * (RA1 - RA0) / 300 for i in range(301)]
profiles = []
for j in range(n_strips):
    d_lo = DEC1 - (j + 1) * STEP  # back (north) first
    members = [ra for ra, dec in qso if d_lo <= dec < d_lo + STEP]
    cosd = math.cos(math.radians(d_lo + STEP / 2))
    prof = [sum(math.exp(-0.5 * (((g - ra) * cosd) / SIGMA) ** 2) for ra in members if abs(g - ra) < 1.5) for g in grid]
    profiles.append((d_lo, prof))
peak = max(max(p) for _, p in profiles)
x = lambda ra: 40 + (W - 80) * (RA1 - ra) / (RA1 - RA0)  # right ascension increases to the left
out = [f'<svg class="ridges" viewBox="0 0 {W} {H}" role="img" aria-labelledby="ridges-title">',
       '<title id="ridges-title">Surface density of SDSS quasars at 2.16 &lt;= z &lt;= 2.20 in strips of declination; '
       'the highest peak is the Cosmic Himalayas</title>']
peak_xy = None
for j, (d_lo, prof) in enumerate(profiles):
    base = TOP + j * GAP
    pts = [(x(g), base - AMP * 6.0 * v / peak) for g, v in zip(grid, prof)]
    hot = d_lo <= 0.9 < d_lo + STEP
    path = 'M' + ' L'.join(f'{px:.0f},{py:.1f}' for px, py in pts)
    out.append(f'<path class="ridge-fill" d="{path} L{pts[-1][0]:.1f},{H} L{pts[0][0]:.1f},{H} Z"/>')
    out.append(f'<path class="ridge" style="--k:{j / (n_strips - 1):.3f}" d="{path}"/>')
    if hot:
        i = max(range(len(prof)), key=prof.__getitem__)
        peak_xy = pts[i]
        seg = [p for g, p in zip(grid, pts) if abs(g - grid[i]) <= 0.8]
        out.append('<path class="ridge-hot" d="M' + ' L'.join(f'{px:.0f},{py:.1f}' for px, py in seg) + '"/>')
px, py = peak_xy
out.append(f'<line class="ridge-lead" x1="{px:.1f}" y1="{py - 6:.1f}" x2="{px:.1f}" y2="{py - 44:.1f}"/>')
out.append(f'<text class="ridge-label" x="{px:.1f}" y="{py - 52:.1f}" text-anchor="middle">Cosmic Himalayas</text>')
for ra in range(10, 56, 5):
    out.append(f'<text class="ridge-tick" x="{x(ra):.1f}" y="{H - 26}" text-anchor="middle">{ra}&#176;</text>')
out.append(f'<text class="ridge-tick" x="{W / 2:.0f}" y="{H - 4}" text-anchor="middle">right ascension</text>')
out.append('</svg>')
print('\n'.join(out))
print(f'<!-- {len(qso)} quasars in {Z0}-{Z1}; strips {DEC0} to {DEC1} deg in {STEP} deg; sigma {SIGMA} deg; peak {peak:.2f} -->')
