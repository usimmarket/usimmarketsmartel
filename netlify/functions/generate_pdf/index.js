
// Netlify function: generate_pdf
// CommonJS style to avoid ESM issues on Netlify
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

function loadAsset(p){ return fs.readFileSync(path.resolve(__dirname, p)); }

exports.handler = async (event, context) => {
  try{
    // Parse payload (not used yet — just a smoke test)
    let body = {};
    try{ body = event.body ? JSON.parse(event.body) : {}; } catch(_){}

    const templateBytes = loadAsset('./template.pdf');
    const fontBytes = loadAsset('./NotoSansKR.ttf');

    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const noto = await pdfDoc.embedFont(fontBytes, { subset: true });

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Simple text to prove it works. You can map fields later.
    const text = 'SMARTEL 신청서 테스트: ' + (body.subscriber || '이름 미입력');
    page.drawText(text, {
      x: 50,
      y: height - 80,
      size: 14,
      font: noto,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
      body: Buffer.from(pdfBytes).toString('base64'),
      isBase64Encoded: true,
    };
  }catch(err){
    console.error(err);
    return { statusCode: 500, body: 'PDF generation error' };
  }
};
