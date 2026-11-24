// Sky map of the hero: a random sample of the catalog's bright objects as stars and the 11 quasars of the Cosmic
// Himalayas as glowing points, in a tangent-plane projection with right ascension increasing to the left.
// Colours come from the CSS variables --star and --qso, so the map follows the light and dark themes.
(() => {
  const canvas = document.getElementById('field');
  if (!canvas) return;
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let data = null;

  function rgb(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function project(points, quasars, width, height) {
    const all = points.concat(quasars.map((q) => [q[1], q[2]]));
    const ra0 = all.reduce((s, p) => s + p[0], 0) / all.length;
    const dec0 = all.reduce((s, p) => s + p[1], 0) / all.length;
    const cos0 = Math.cos((dec0 * Math.PI) / 180);
    const xs = all.map((p) => -(p[0] - ra0) * cos0);
    const ys = all.map((p) => p[1] - dec0);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const scale = (Math.min(width, height) * 0.9) / span;
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    return ([ra, dec]) => [width / 2 + (-(ra - ra0) * cos0 - cx) * scale, height / 2 - (dec - dec0 - cy) * scale];
  }

  // The stars are drawn once per size and theme into an offscreen layer; each frame only adds the quasar halos.
  let layer = null;
  function starLayer(width, height, ratio) {
    const key = `${width}x${height}@${ratio}:${rgb('--star')}:${rgb('--qso')}`;
    if (layer?.key === key) return layer;
    const toXY = project(data.points, data.quasars, width, height);
    const image = document.createElement('canvas');
    image.width = Math.round(width * ratio);
    image.height = Math.round(height * ratio);
    const ctx = image.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const star = rgb('--star');
    for (const [ra, dec, mag] of data.points) {
      const [x, y] = toXY([ra, dec]);
      const bright = Math.min(1, Math.max(0, (24 - mag) / 8)); // i = 16 brightest, i = 24 faintest
      ctx.fillStyle = `rgba(${star}, ${0.16 + 0.6 * bright})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.45 + 1.3 * bright * bright, 0, 2 * Math.PI);
      ctx.fill();
    }
    layer = { key, image, quasars: data.quasars.map(([, ra, dec]) => toXY([ra, dec])), qso: rgb('--qso') };
    return layer;
  }

  function draw(time) {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const { image, quasars, qso } = starLayer(width, height, ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const pulse = motion ? 0.5 + 0.5 * Math.sin(time / 900) : 0.6;
    for (const [x, y] of quasars) {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, 16 + 6 * pulse);
      halo.addColorStop(0, `rgba(${qso}, ${0.55 + 0.2 * pulse})`);
      halo.addColorStop(1, `rgba(${qso}, 0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = `rgb(${qso})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (motion) requestAnimationFrame(draw);
  }

  fetch('assets/field.json')
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.statusText))))
    .then((json) => {
      data = json;
      requestAnimationFrame(draw);
      if (!motion) window.addEventListener('resize', () => requestAnimationFrame(draw));
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => requestAnimationFrame(draw));
    })
    .catch((error) => {
      canvas.replaceWith(Object.assign(document.createElement('p'), { textContent: 'The sky map could not be loaded.' }));
      console.error('field map', error); // eslint-disable-line no-console
    });
})();
