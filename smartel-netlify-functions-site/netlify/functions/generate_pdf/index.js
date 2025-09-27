
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {}

  try {
    const templatePath = path.join(__dirname, 'template.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    let fontBytes, font;
    try {
      fontBytes = fs.readFileSync(path.join(__dirname, 'NotoSansKR.ttf'));
      font = await pdfDoc.embedFont(fontBytes);
    } catch(e) {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    const pages = pdfDoc.getPages();
    const page = pages[0];

    const draw = (txt, x, y, size=12) => {
      if (txt === undefined || txt === null || txt === '') return;
      page.drawText(String(txt), { x, y, size, font });
    };

    // very small demo placement so you can confirm end-to-end
    draw(payload.subscriber || payload['subscriber_name'], 90, 740, 13);    // 가입자명
    draw(payload.birth || payload['birthdate'], 340, 740, 12);               // 생년월일
    draw(payload.addr || payload['address'], 90, 720, 12);                   // 주소

    const bytes = await pdfDoc.save();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="smartel.pdf"',
        'Cache-Control': 'no-store'
      },
      body: Buffer.from(bytes).toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('PDF generation error', err);
    return { statusCode: 500, body: 'PDF generation failed' };
  }
};
