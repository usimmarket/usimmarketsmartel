
(function(){
  const FN_PATH = '/.netlify/functions/generate_pdf';
  function isCardSelected(){
    const m = document.querySelector('input[name="autopay_method"]:checked');
    return m && m.value === 'card';
  }
  function toggleCardFields(){
    const box = document.getElementById('card_fields');
    if (box) box.style.display = isCardSelected() ? 'block' : 'none';
    const yy = document.getElementById('card_exp_year');
    const mm = document.getElementById('card_exp_month');
    [yy, mm].forEach(el => { if(!el) return; if (isCardSelected()){ el.removeAttribute('disabled'); } else { el.setAttribute('disabled','disabled'); } });
  }
  function collectFormJSON(){
    const f = document.getElementById('form') || document.querySelector('form');
    const data = Object.fromEntries(new FormData(f).entries());
    const rawBirth = (document.getElementById('birth_in')?.value || '').replace(/\D/g,'');
    if (rawBirth) data.birth = rawBirth;
    if (isCardSelected()){
      const yy = (document.getElementById('card_exp_year')?.value || '').trim();
      const mm = (document.getElementById('card_exp_month')?.value || '').trim();
      if (yy && mm) data.autopay_exp = `${yy}/${mm}`;
      data.autopay_method = 'card';
    } else {
      data.autopay_exp = '';
      data.autopay_method = 'bank';
    }
    return data;
  }
  async function callFunction(data){
    const resp = await fetch(FN_PATH, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
    if(!resp.ok){ throw new Error('HTTP '+resp.status+' '+(await resp.text())); }
    return await resp.blob();
  }
  async function onSave(e){
    e && e.preventDefault();
    try{
      const blob = await callFunction(collectFormJSON());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'smartel_form.pdf'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    }catch(err){ alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.\n'+err.message); console.error(err); }
  }
  async function onPrint(e){
    e && e.preventDefault();
    try{
      const blob = await callFunction(collectFormJSON());
      const url = URL.createObjectURL(blob);
      const w = window.open('', '_blank'); const doc = w.document;
      doc.open(); doc.write('<!doctype html><html><head><meta charset="utf-8"><title>SMARTEL 신청서</title></head><body style="margin:0;background:#111"></body></html>'); doc.close();
      const iframe = doc.createElement('iframe'); iframe.style.cssText='border:0;width:100vw;height:100vh'; iframe.src=url; doc.body.appendChild(iframe);
      iframe.addEventListener('load', ()=>{ try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }catch(e){ w.focus(); w.print(); } });
      w.addEventListener('afterprint', ()=> setTimeout(()=> w.close(), 400));
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    }catch(err){ alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.\n'+err.message); console.error(err); }
  }
  document.addEventListener('DOMContentLoaded', function(){
    const save = document.getElementById('saveBtn') || document.getElementById('pdfBtn') || document.querySelector('[data-action="save-pdf"]');
    const print = document.getElementById('printBtn') || document.querySelector('[data-action="print-pdf"]');
    if (save) save.addEventListener('click', onSave, {passive:false});
    if (print) print.addEventListener('click', onPrint, {passive:false});
    document.querySelectorAll('input[name="autopay_method"]').forEach(r=> r.addEventListener('change', toggleCardFields));
    toggleCardFields();
  });
})();
