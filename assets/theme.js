// Theme switch: the page opens in the night theme, and the button toggles between night and day. A reader's choice is
// stored (localStorage, when available); data-theme on <html> carries it to the style sheet and data-mode to the icon.
// Loaded in <head> before the style sheet, so the stored choice applies before the first paint.
(() => {
  const KEY = 'chef-theme';
  const root = document.documentElement;
  const LABEL = { light: 'Theme: day', dark: 'Theme: night' };
  let mode = 'dark';

  try {
    if (localStorage.getItem(KEY) === 'light') mode = 'light';
  } catch {
    // private window or blocked storage: the page opens in the night theme
  }

  function apply() {
    root.dataset.theme = mode;
    root.dataset.mode = mode;
    const icon = document.getElementById('favicon');
    if (icon) icon.href = mode === 'light' ? 'assets/favicon_day.png' : 'assets/favicon_night.png';
    const button = document.getElementById('theme-switch');
    if (button) {
      button.title = LABEL[mode];
      button.setAttribute('aria-label', `${LABEL[mode]}. Click to switch to the ${mode === 'light' ? 'night' : 'day'} theme.`);
    }
  }

  apply();

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const button = document.getElementById('theme-switch');
    if (!button) return;
    button.addEventListener('click', () => {
      mode = mode === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(KEY, mode);
      } catch {
        // storage unavailable: the choice lasts for this page view
      }
      apply();
    });
  });
})();
