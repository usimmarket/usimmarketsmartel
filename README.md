
# SMARTEL Netlify Project (GitHub-ready)

- **index.html** at repo root (your form page)
- **pdf-client.js** loaded by the page; it calls `/.netlify/functions/generate_pdf`
- **netlify/functions/generate_pdf/** contains the serverless PDF generator
- **netlify.toml** is at the repo root to configure publish/functions

## Deploy
1. Push this folder as a GitHub repo.
2. On Netlify: *Import from GitHub* → this repo.
3. Build settings:
   - Publish directory: `.`
   - Build command: *(empty)*
   - Functions directory: `netlify/functions`
4. After deploy, open the site and use **PDF 저장**/**인쇄**.

