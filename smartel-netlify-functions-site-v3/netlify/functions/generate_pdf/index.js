
const path = require('path');
const fs = require('fs').promises;

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      };
    }
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const tplPath = path.join(__dirname, 'assets', 'template.pdf');
    const pdf = await fs.readFile(tplPath);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="smartel_form.pdf"',
        'Access-Control-Allow-Origin': '*'
      },
      body: pdf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('[generate_pdf] error:', err);
    return { statusCode: 500, body: 'PDF generation failed' };
  }
};
