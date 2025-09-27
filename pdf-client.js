const FN = '/.netlify/functions/generate_pdf';

async function call(payload) {
  const r = await fetch(FN, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload || {})
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.blob();
}

function formToJSON() {
  const form = document.getElementById('form') || document.querySelector('form');
  const data = form ? Object.fromEntries(new FormData(form).entries()) : {};

  // 선택: 숨김 생년월일/카드 유효기간 합치기 (은행 선택 시 카드 만료 필드는 무시)
  const rawBirth = document.getElementById('birth_in')?.value || '';
  if (rawBirth) data.birth = rawBirth.replace(/\D/g,'');

  const method = document.querySelector('input[name="autopay_method"]:checked')?.value;
  if (method === 'card') {
    const yy = document.getElementById('card_exp_year')?.value?.trim();
    const mm = document.getElementById('card_exp_month')?.value?.trim();
    if (yy && mm) data.autopay_exp = `${yy}/${mm}`;
  } else {
    // 은행 선택 시 카드 만료값 제거
    delete data.autopay_exp;
  }
  return data;
}

async function onSave(e){
  e.preventDefault();
  const blob = await call(formToJSON());
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'smartel_form.pdf'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

async function onPrint(e){
  e.preventDefault();
  const blob = await call(formToJSON());
  const url  = URL.createObjectURL(blob);
  const w = window.open('', '_blank', 'noopener');
  w.document.write(`<iframe src="${url}" style="border:0;width:100vw;height:100vh"></iframe>`);
  w.document.close();
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('saveBtn')?.addEventListener('click', onSave);
  document.getElementById('printBtn')?.addEventListener('click', onPrint);
});
