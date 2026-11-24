// Day / night switch. Without a stored choice the page follows the system setting; a click stores the visitor's
// choice in this browser (localStorage, when available) and sets data-theme on <html>, which the style sheet reads.
// Loaded in <head> before the style sheet, so a stored choice applies before the first paint.
(() => {
  const KEY = 'chef-theme';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: light)');

  function stored() {
    try {
      const value = localStorage.getItem(KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  function store(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // private window or blocked storage: the choice lasts for this page view only
    }
  }

  const current = () => root.dataset.theme || (system.matches ? 'light' : 'dark');

  function showFavicon() {
    const icon = document.getElementById('favicon');
    if (icon) icon.href = current() === 'light' ? 'assets/favicon_day.png' : 'assets/favicon_night.png';
  }

  const choice = stored();
  if (choice) root.dataset.theme = choice;
  showFavicon();
  system.addEventListener('change', showFavicon);

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-switch');
    if (!button) return;
    button.addEventListener('click', () => {
      const next = current() === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      store(next);
      showFavicon();
    });
  });
})();
