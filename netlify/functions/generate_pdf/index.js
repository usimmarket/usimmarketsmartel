const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const fontkit = require('@pdf-lib/fontkit');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try{
    const data = JSON.parse(event.body||'{}');

    const templatePath = path.join(__dirname, 'template.pdf');
    const fontPath = path.join(__dirname, 'NotoSansKR.ttf');
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(templateBytes, { updateMetadata:false });
    pdfDoc.registerFontkit(fontkit);

    // Try custom font; fallback to Helvetica
    let font;
    try{
      const fontBytes = fs.readFileSync(fontPath);
      font = await pdfDoc.embedFont(fontBytes, { subset: true });
    }catch(e){
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    const pages = pdfDoc.getPages();
    const p = pages[0];

    // Simple proof text at top
    const title = 'SMARTEL 신청서 미리보기';
    p.drawText(title, { x: 50, y: p.getHeight() - 60, size: 14, font, color: rgb(0,0,0) });

    // Example: place a few fields to verify font & pipeline
    const line1 = `이름: ${data.subscriber||''}`;
    const line2 = `주소: ${data.addr||''}`;
    const line3 = `생년월일: ${data.birth||''}`;
    const line4 = `자동이체: ${data.autopay_method||''}  만료:${data.autopay_exp||''}`;

    let y = p.getHeight() - 90;
    [line1, line2, line3, line4].forEach(txt => {
      p.drawText(txt, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
      y -= 16;
    });

    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="smartel.pdf"'
      },
      body: Buffer.from(pdfBytes).toString('base64'),
      isBase64Encoded: true
    };
  }catch(err){
    return { statusCode: 500, body: 'Server error: ' + (err && err.message ? err.message : String(err)) };
  }
};