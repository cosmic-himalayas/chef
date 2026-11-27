// Sky map of the hero: the HSC-SSP PDR3 g, r, i image of the CHEF field with the 11 quasars of the Cosmic Himalayas
// marked by rings, placed with the image's gnomonic (TAN) projection. The image is the same in both themes; the rings
// pulse gently unless the reader prefers reduced motion.
(() => {
  const canvas = document.getElementById('field');
  if (!canvas) return;
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAD = Math.PI / 180;

  // Right ascension and declination (degrees) to 0-based image pixels, x to the right and y downwards.
  function toPixel(wcs, ra, dec) {
    const a = ra * RAD, d = dec * RAD, a0 = wcs.crval1 * RAD, d0 = wcs.crval2 * RAD;
    const den = Math.sin(d) * Math.sin(d0) + Math.cos(d) * Math.cos(d0) * Math.cos(a - a0);
    const xi = (Math.cos(d) * Math.sin(a - a0)) / den / RAD;
    const eta = (Math.sin(d) * Math.cos(d0) - Math.cos(d) * Math.sin(d0) * Math.cos(a - a0)) / den / RAD;
    const x = wcs.crpix1 + xi / wcs.cdelt1; // FITS pixel, 1-based, y upwards
    const y = wcs.crpix2 + eta / wcs.cdelt2;
    return [x - 0.5, wcs.naxis2 - (y - 0.5)];
  }

  function rgb(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function start(data, image) {
    const wcs = data.image;
    canvas.style.aspectRatio = `${wcs.naxis1} / ${wcs.naxis2}`;
    const quasars = data.quasars.map(([name, ra, dec]) => ({ name, xy: toPixel(wcs, ra, dec) }));

    function draw(time) {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      const ctx = canvas.getContext('2d');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      const sx = width / wcs.naxis1;
      const sy = height / wcs.naxis2;
      const ring = rgb('--ring');
      const pulse = motion ? 0.5 + 0.5 * Math.sin(time / 1100) : 0.6;
      for (const { xy } of quasars) {
        const x = xy[0] * sx, y = xy[1] * sy;
        const r = Math.max(7, width / 70);
        ctx.strokeStyle = `rgba(${ring}, ${0.55 + 0.35 * pulse})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${ring}, ${0.18 * (1 - pulse)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r * (1.5 + 0.6 * pulse), 0, 2 * Math.PI);
        ctx.stroke();
      }
      if (motion) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    if (!motion) window.addEventListener('resize', () => requestAnimationFrame(draw));
  }

  function fail(error) {
    canvas.replaceWith(Object.assign(document.createElement('p'), { textContent: 'The sky map could not be loaded.' }));
    console.error('field map', error); // eslint-disable-line no-console
  }

  fetch('assets/field.json')
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.statusText))))
    .then((data) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve([data, image]);
      image.onerror = () => reject(new Error(`image ${data.image.src}`));
      image.src = data.image.src;
    }))
    .then(([data, image]) => start(data, image))
    .catch(fail);
})();
