
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function drawKV(page, font, x, y, label, value, size = 10) {
  const text = `${label}: ${value ?? ''}`;
  page.drawText(text, { x, y, size, font });
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  let data = {};
  try { data = JSON.parse(event.body || '{}'); } catch(e){ return {statusCode:400, body:'Bad JSON'}; }
  try {
    const templatePath = path.join(__dirname, 'template.pdf');
    const fontPath = path.join(__dirname, 'NotoSansKR.ttf');
    const templateBytes = await fs.readFile(templatePath);
    const fontBytes = await fs.readFile(fontPath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const page = pdfDoc.getPages()[0];
    let y = 760;
    const startX = 72;
    drawKV(page, customFont, startX, y, '신청일자', data.apply_date); y -= 14;
    drawKV(page, customFont, startX, y, '가입자명', data.subscriber); y -= 14;
    drawKV(page, customFont, startX, y, '생년월일', data.birth); y -= 14;
    drawKV(page, customFont, startX, y, '주소', data.addr); y -= 14;
    drawKV(page, customFont, startX, y, 'USIM 일련번호', data.sim2); y -= 14;
    drawKV(page, customFont, startX, y, '자동이체 방식', data.autopay_method); y -= 14;
    drawKV(page, customFont, startX, y, '예금주/카드주', data.autopay_holder); y -= 14;
    drawKV(page, customFont, startX, y, '은행/카드사', data.autopay_org); y -= 14;
    drawKV(page, customFont, startX, y, '계좌/카드번호', data.autopay_number); y -= 14;
    drawKV(page, customFont, startX, y, '카드 만료', data.autopay_exp); y -= 14;
    const pdfBytes = await pdfDoc.save();
    return { statusCode: 200,
      headers: { 'Content-Type':'application/pdf', 'Content-Disposition':'inline; filename="smartel_form.pdf"' },
      body: Buffer.from(pdfBytes).toString('base64'),
      isBase64Encoded: true
    };
  } catch(err){
    return { statusCode: 500, body: 'Function error: ' + (err && err.message ? err.message : String(err)) };
  }
}
