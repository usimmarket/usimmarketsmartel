// netlify/functions/generate_pdf/index.js
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

exports.handler = async function(event) {
  try{
    const data = JSON.parse(event.body || '{}');

    const here = __dirname;
    const assets = path.join(here, 'assets');
    const templatePath = path.join(assets, 'template.pdf');
    const fontPath = path.join(assets, 'NotoSansKR.ttf');

    let pdfDoc;
    if (fs.existsSync(templatePath)) {
      const tmpl = fs.readFileSync(templatePath);
      pdfDoc = await PDFDocument.load(tmpl);
    } else {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595, 842]);
    }

    pdfDoc.registerFontkit(fontkit);
    let font;
    if (fs.existsSync(fontPath)) {
      try {
        const fontBytes = fs.readFileSync(fontPath);
        font = await pdfDoc.embedFont(fontBytes, { subset: true });
      } catch (e) {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    let mapping = null;
    try {
      const m1 = path.join(assets, 'mapping.json');
      const m2 = path.join(process.cwd(), 'mapping.json');
      const m = fs.existsSync(m1) ? m1 : (fs.existsSync(m2) ? m2 : null);
      if (m) mapping = JSON.parse(fs.readFileSync(m, 'utf8'));
    } catch(_) {}

    if (mapping) {
      for (const [key, cfg] of Object.entries(mapping)) {
        const val = (data[key] ?? '').toString();
        if (!val) continue;
        const pIndex = Math.max(0, (cfg.p || 1) - 1);
        const page = pages[pIndex] || firstPage;
        page.drawText(val, {
          x: cfg.x || 30,
          y: cfg.y || 700,
          size: cfg.size || 11,
          font,
          color: rgb(0,0,0),
        });
      }
    } else {
      let y = 800;
      firstPage.drawText('SMARTEL FORM PREVIEW (no mapping.json found)', { x: 30, y, size: 12, font });
      y -= 18;
      const entries = Object.entries(data);
      for (const [k, v] of entries) {
        y -= 14;
        if (y < 40) break;
        const line = (k + ': ' + String(v)).slice(0, 120);
        firstPage.drawText(line, { x: 30, y, size: 10, font });
      }
    }

    const stamp = 'Generated ' + new Date().toISOString();
    firstPage.drawText(stamp, { x: 400, y: 20, size: 8, font });

    const bytes = await pdfDoc.save();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/pdf' },
      body: Buffer.from(bytes).toString('base64'),
      isBase64Encoded: true
    };
  }catch(err){
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};