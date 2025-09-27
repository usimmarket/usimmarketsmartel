# smartel-netlify-functions-site

Netlify Functions 기반 PDF 생성 샘플입니다.
- 루트: `index.html`, `pdf-client.js`, `netlify.toml`
- 함수: `netlify/functions/generate_pdf/`

배포 후 `index.html`의 저장/인쇄 버튼은 `/.netlify/functions/generate_pdf`를 호출합니다.

### 템플릿/폰트
`netlify/functions/generate_pdf/assets/` 폴더에
- `template.pdf` (선택)
- `NotoSansKR.ttf` (선택)
- `mapping.json` (선택)
을 두면 반영됩니다. 없으면 빈 PDF에 키:값을 프린트합니다.
