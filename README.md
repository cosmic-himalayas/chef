# CHEF survey page

Source of the information page of CHEF, the Cosmic Himalayas Extended Field, served by GitHub Pages from the `main`
branch at https://cosmic-himalayas.github.io/chef/. Plain HTML, CSS and one small script with no build step: `index.html` is the page; `assets/style.css` the
style; `assets/theme.js` the day / night switch (the visitor's choice is kept in localStorage, otherwise the system
setting applies); `assets/field.js` draws the sky map of the first screen from `assets/field.json`, a random sample of 7,000
bright objects shown by the public sky viewer and the positions of the 11 quasars of Liang et al. (2025). The sky viewer (https://chef-sky.yoemanastro.workers.dev/) is linked twice in `index.html`, from the two "Open the
sky viewer" buttons.

Local preview: `python3 -m http.server 8782`, then open http://127.0.0.1:8782/.
