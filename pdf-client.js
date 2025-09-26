(function(){
  const FN_PATH = '/.netlify/functions/generate_pdf';
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function onlyDigits(el){ if(!el) return; el.addEventListener('input', ()=>{ el.value = (el.value||'').replace(/\D+/g,''); }); }

  // Autopay (bank/card) toggle -> enable/disable YY/MM and remove 'required' when hidden
  function updateCardFields(){
    const method = qs('input[name="autopay_method"]:checked');
    const isCard = !!method && method.value === 'card';
    const yy = qs('#card_exp_year');
    const mm = qs('#card_exp_month');
    const box = qs('#card_fields');
    if(box) box.style.display = isCard ? 'block' : 'none';
    [yy,mm].forEach(i=>{
      if(!i) return;
      if(isCard){
        i.removeAttribute('disabled'); 
      } else {
        i.setAttribute('disabled','disabled');
      }
    });
  }
  qsa('input[name="autopay_method"]').forEach(r=> r.addEventListener('change', updateCardFields));
  updateCardFields();

  // Simple validation wrapper: if a global validate() exists, call it; otherwise only check visible required inputs
  function runValidate(){
    if (typeof window.validate === 'function'){
      return !!window.validate();
    }
    const form = qs('#form') || qs('form');
    if(!form) return true;
    const required = qsa('input,select,textarea', form).filter(el => !el.disabled && !el.hidden && (el.offsetParent !== null) && el.hasAttribute('required'));
    let ok = true;
    required.forEach(el => {
      const v = (el.value||'').trim();
      if(!v){ ok = false; el.classList.add('is-invalid'); }
      else { el.classList.remove('is-invalid'); }
    });
    return ok;
  }

  function collectData(){
    const form = qs('#form') || qs('form');
    const data = Object.fromEntries(new FormData(form).entries());
    // birth clean-up
    if (data.birth_in && !data.birth) data.birth = (data.birth_in||'').replace(/\D/g,'');
    const method = qs('input[name="autopay_method"]:checked');
    if (method && method.value === 'card'){
      const yy = (qs('#card_exp_year')||{}).value||'';
      const mm = (qs('#card_exp_month')||{}).value||'';
      if(yy && mm) data.autopay_exp = yy + '/' + mm;
    } else {
      // bank mode -> ensure we don't fail server with empty exp
      delete data.autopay_exp;
    }
    return data;
  }

  async function callFnAndOpen(blobHandler){
    if(!runValidate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const payload = collectData();
    try{
      const resp = await fetch(FN_PATH, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if(!resp.ok){
        const t = await resp.text().catch(()=>'');
        throw new Error('Function error: ' + resp.status + ' ' + t);
      }
      const blob = await resp.blob();
      await blobHandler(blob);
    }catch(err){
      alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
      console.error('[PDF] error', err);
    }
  }

  function bind(idOrSel, handler){
    const el = qs(idOrSel) || qs('[data-action="'+idOrSel+'"]');
    if(!el) return;
    el.addEventListener('click', (e)=>{ e.preventDefault(); handler(); });
  }

  // Save: download
  bind('#saveBtn', async ()=>{
    await callFnAndOpen(async (blob)=>{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'smartel_form.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    });
  });

  // Print: open and print
  bind('#printBtn', async ()=>{
    await callFnAndOpen(async (blob)=>{
      const url = URL.createObjectURL(blob);
      const w = window.open('', '_blank', 'noopener');
      const doc = w.document;
      doc.open();
      doc.write('<!doctype html><html><head><meta charset="utf-8"><title>SMARTEL 신청서</title><style>html,body{margin:0;height:100%}iframe{border:0;width:100vw;height:100vh}</style></head><body></body></html>');
      doc.close();
      const iframe = doc.createElement('iframe');
      iframe.src = url; doc.body.appendChild(iframe);
      iframe.addEventListener('load', ()=>{
        try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }
        catch(e){ w.focus(); w.print(); }
      });
      w.addEventListener('afterprint', ()=> setTimeout(()=> w.close(), 400));
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    });
  });

  // Numeric-only helpers
  ['birth_in','subscriber_phone','wish4','autopay_number','card_exp_year','card_exp_month']
    .forEach(id=> onlyDigits(qs('#'+id)));
})();