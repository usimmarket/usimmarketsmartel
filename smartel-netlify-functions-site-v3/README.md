
# SMARTEL — Netlify Functions site (ready to upload)

**What you upload**: the whole folder at the root of your repo.

- `public/index.html` — your existing form page (I injected one line to load `pdf-client.js`).
- `public/pdf-client.js` — hooks up the Save/Print buttons and calls the function.
- `netlify/functions/generate_pdf/index.js` — returns `template.pdf` right now (no dependencies).
- `netlify/functions/generate_pdf/assets/template.pdf` — your PDF template (replace later).
- `netlify.toml` — tells Netlify to publish `public/` and bundle functions from `netlify/functions`.

After connecting this repo on Netlify, you *don't* need to set custom build settings.  
Netlify will read the `netlify.toml` and deploy correctly.

If you see 404 after deploy, it means Netlify is still publishing from the wrong folder.  
Open **Site settings → Build & deploy → Build settings → Edit settings**, and set:

- **Base directory**: *(leave empty)*
- **Publish directory**: `public`
- **Functions directory**: `netlify/functions`
