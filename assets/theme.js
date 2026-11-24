// Theme switch with three modes: auto (the default, follows the system setting), day and night. A click moves to the
// next mode, the first step away from auto being the theme that differs from the one shown. Only day and night are
// stored (localStorage, when available); data-theme on <html> carries them to the style sheet and data-mode to the icon.
// Loaded in <head> before the style sheet, so a stored choice applies before the first paint.
(() => {
  const KEY = 'chef-theme-mode';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: light)');
  const LABEL = { auto: 'Theme: automatic (follows the system)', light: 'Theme: day', dark: 'Theme: night' };
  let mode = 'auto';

  try {
    const value = localStorage.getItem(KEY);
    if (value === 'light' || value === 'dark') mode = value;
  } catch {
    // private window or blocked storage: the page starts in auto
  }

  const shown = () => (mode === 'auto' ? (system.matches ? 'light' : 'dark') : mode);

  function apply() {
    if (mode === 'auto') delete root.dataset.theme;
    else root.dataset.theme = mode;
    root.dataset.mode = mode;
    const icon = document.getElementById('favicon');
    if (icon) icon.href = shown() === 'light' ? 'assets/favicon_day.png' : 'assets/favicon_night.png';
    const button = document.getElementById('theme-switch');
    if (button) {
      button.title = LABEL[mode];
      button.setAttribute('aria-label', `${LABEL[mode]}. Click to change.`);
    }
  }

  function next() {
    const opposite = system.matches ? 'dark' : 'light';
    const same = system.matches ? 'light' : 'dark';
    if (mode === 'auto') return opposite;
    return mode === opposite ? same : 'auto';
  }

  apply();
  system.addEventListener('change', apply);

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const button = document.getElementById('theme-switch');
    if (!button) return;
    button.addEventListener('click', () => {
      mode = next();
      try {
        if (mode === 'auto') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, mode);
      } catch {
        // storage unavailable: the choice lasts for this page view
      }
      apply();
    });
  });
})();
