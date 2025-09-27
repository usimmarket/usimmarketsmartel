
(function(){
  function getBtnByText(texts){
    const nodes = Array.from(document.querySelectorAll('button,a,[role="button"]'));
    return nodes.find(b=> texts.some(t => (b.textContent||'').trim() === t));
  }
  function pickButton(id, texts){
    return document.getElementById(id) || getBtnByText(texts);
  }
  function toJSON(form){
    try{
      const data = Object.fromEntries(new FormData(form).entries());
      return data;
    }catch(e){ return {}; }
  }
  async function callPDF(form){
    const payload = toJSON(form);
    const resp = await fetch('/.netlify/functions/generate_pdf', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload||{})
    });
    if(!resp.ok){
      const t = await resp.text().catch(()=>'');
      throw new Error('FN_FAIL '+resp.status+' '+t);
    }
    const blob = await resp.blob();
    return blob;
  }
  function toggleCardFields(){
    const method = document.querySelector('input[name="autopay_method"]:checked')?.value;
    const isCard = method === 'card';
    const year = document.getElementById('card_exp_year');
    const month = document.getElementById('card_exp_month');
    [year, month].forEach(el => {
      if (!el) return;
      el.required = !!isCard;
      el.disabled = !isCard;
      if (!isCard) el.value = '';
    });
    const box = document.getElementById('card_fields');
    if (box) box.style.display = isCard ? 'block' : 'none';
  }
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('input[name="autopay_method"]').forEach(r=>{
      r.addEventListener('change', toggleCardFields);
    });
    toggleCardFields();

    const form = document.getElementById('form') || document.querySelector('form');
    const saveBtn  = pickButton('saveBtn', ['PDF 저장','Save PDF']);
    const printBtn = pickButton('printBtn',['인쇄','Print']);

    async function onSave(ev){
      ev && ev.preventDefault && ev.preventDefault();
      try{
        if (typeof window.__smartelValidate === 'function' && !window.__smartelValidate()) return;
        if (typeof window.validate === 'function' && !window.validate()) return;
        const blob = await callPDF(form);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'smartel_form.pdf';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(url), 120000);
      }catch(e){
        alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
        console.error(e);
      }
    }

    async function onPrint(ev){
      ev && ev.preventDefault && ev.preventDefault();
      try{
        if (typeof window.__smartelValidate === 'function' && !window.__smartelValidate()) return;
        if (typeof window.validate === 'function' && !window.validate()) return;
        const blob = await callPDF(form);
        const url = URL.createObjectURL(blob);
        const w = window.open('about:blank','_blank','noopener,noreferrer');
        const doc = w.document;
        doc.open();
        doc.write('<!doctype html><html><head><meta charset="utf-8"><title>SMARTEL 신청서</title></head><body style="margin:0;background:#111"></body></html>');
        doc.close();
        const iframe = doc.createElement('iframe');
        iframe.style.cssText = 'border:0;width:100vw;height:100vh';
        iframe.src = url;
        doc.body.appendChild(iframe);
        iframe.addEventListener('load', () => {
          try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
          catch (e) { w.focus(); w.print(); }
        });
        w.addEventListener('afterprint', () => setTimeout(() => w.close(), 300));
        setTimeout(()=>URL.revokeObjectURL(url), 120000);
      }catch(e){
        alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
        console.error(e);
      }
    }

    if (saveBtn)  saveBtn.addEventListener('click', onSave,  {passive:false});
    if (printBtn) printBtn.addEventListener('click', onPrint, {passive:false});
  });
})();
