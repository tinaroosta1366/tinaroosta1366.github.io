# Tina Toodeh Roosta — personal portfolio

Static, bilingual (Persian RTL / English LTR) single-page site. No build step: open `index.html` or serve the folder.

- `index.html` – all content, both languages (`data-l="fa"` / `data-l="en"`)
- `css/style.css` – styles (accent `#6E0D25`)
- `js/main.js` – language toggle (saved in localStorage, `?lang=en` also works), mobile menu, project viewer, copy email
- `images/` – portrait, project screenshots (WebP), Open Graph image
- `fonts/` – self-hosted Vazirmatn, DM Sans, Fraunces (OFL)
- `previews/` – screenshots of the site; not needed for deployment

## Publish on GitHub Pages
1. Create a public repository named `tinaroosta1366.github.io`.
2. Upload the contents of this folder (you can leave out `previews/`).
3. Settings → Pages → Source: “Deploy from a branch”, branch `main`, folder `/ (root)`.
4. The site is served at https://tinaroosta.ir/ through the custom domain in the `CNAME` file (https://tinaroosta1366.github.io/ redirects there). The canonical, Open Graph and structured-data URLs in `index.html` use this address; change them if the domain changes.
