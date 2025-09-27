
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

function loadAsset(...p){
  const tryPaths = [
    path.join(__dirname, ...p),
    path.join(__dirname, 'assets', ...p),
  ];
  for (const tp of tryPaths){
    if (fs.existsSync(tp)) return fs.readFileSync(tp);
  }
  throw new Error('ASSET_NOT_FOUND: '+p.join('/'));
}

exports.handler = async (event, context) => {
  try{
    let data = {};
    try{ data = JSON.parse(event.body||'{}'); } catch(_){}

    const templateBytes = loadAsset('template.pdf');
    let fontBytes = null;
    try { fontBytes = loadAsset('NotoSansKR.ttf'); } catch(_){}

    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    let noto = null;
    if (fontBytes){
      try { noto = await pdfDoc.embedFont(fontBytes); } catch(_){}
    }
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const font = noto || await pdfDoc.embedFont(StandardFonts.Helvetica);
    const stamp = (data && data.subscriber) ? String(data.subscriber) : 'SMARTEL';
    firstPage.drawText(stamp, { x: 40, y: 40, size: 10, font, color: rgb(0,0,0) });

    const pdfBytes = await pdfDoc.save();
    const base64 = Buffer.from(pdfBytes).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="smartel.pdf"'
      },
      isBase64Encoded: true,
      body: base64
    };
  }catch(err){
    console.error(err);
    return {
      statusCode: 500,
      headers: {'Content-Type':'text/plain; charset=utf-8'},
      body: 'Function error: '+String(err && err.message || err)
    };
  }
};
