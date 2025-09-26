
# Smartel — Netlify Full Bundle

## Deploy (GitHub or manual)
- Publish directory: `.`
- Functions directory: `netlify/functions`
- Build command: *(leave empty)*

## After deploy
- Test the function: open `/.netlify/functions/generate_pdf` in the browser → should show `Method Not Allowed (405)`.
- Open the site root and click **PDF 저장** or **인쇄**.

## Edit the form later
- You can freely edit `index.html` or `pdf-client.js`.
- For PDF mapping, edit `netlify/functions/generate_pdf/index.js` (drawText positions) or extend to read a mapping file.
