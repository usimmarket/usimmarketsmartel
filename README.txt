# Smartel Netlify Package (Full)

- 루트
  - index.html  ← 기존 파일에 `<script src="/pdf-client.js"></script>` 자동 삽입
  - pdf-client.js
  - netlify/functions/generate_pdf/
      - index.js
      - package.json
      - template.pdf
      - NotoSansKR.ttf

## 배포
Netlify → Site settings
- Publish directory: `.`
- Functions directory: `netlify/functions`
- Build command: _(none)_

## 확인
- 페이지에서 저장/인쇄 → `/.netlify/functions/generate_pdf` 로 POST 요청
- 브라우저에서 GET으로 열면 405 응답이면 **정상 배포**