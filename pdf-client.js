
(function(){
  function qs(s){return document.querySelector(s);}
  function qsa(s){return Array.prototype.slice.call(document.querySelectorAll(s));}
  function onlyDigits(v){return String(v||'').replace(/\D+/g,'');}

  // Toggle card expiry fields visibility/requiredness
  function syncCardFields(){
    var method = (document.querySelector('input[name="autopay_method"]:checked')||{}).value;
    var isCard = method === 'card';
    var yy = qs('#card_exp_year');
    var mm = qs('#card_exp_month');
    var box = qs('#card_fields') || (yy && yy.closest('.row')) || null;
    if (box) box.style.display = isCard ? 'block' : 'none';
    [yy,mm].forEach(function(el){
      if(!el) return;
      if(isCard){
        el.disabled = false;
      }else{
        el.value = '';
        el.disabled = true;
      }
    });
  }

  function collectFormJSON(){
    var form = qs('#form') || document.querySelector('form');
    var data = Object.fromEntries(new FormData(form).entries());

    // Normalize birth numbers if present
    if(data.birth_in){ data.birth = onlyDigits(data.birth_in); }
    if(data.autopay_birth){ data.pay_birth = onlyDigits(data.autopay_birth); }

    // Compose YY/MM for card only
    var method = (document.querySelector('input[name="autopay_method"]:checked')||{}).value;
    if(method === 'card'){
      var yy = (qs('#card_exp_year')||{}).value||'';
      var mm = (qs('#card_exp_month')||{}).value||'';
      if(yy && mm) data.autopay_exp = yy + '/' + mm;
    }else{
      delete data.autopay_exp;
    }
    return data;
  }

  async function callPdfFunction(payload){
    const resp = await fetch('/.netlify/functions/generate_pdf', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload||{})
    });
    if(!resp.ok){
      const t = await resp.text().catch(()=>'');
      throw new Error('FN ' + resp.status + ' ' + t);
    }
    const buf = await resp.arrayBuffer();
    return new Blob([buf], {type:'application/pdf'});
  }

  async function onSave(ev){
    ev && ev.preventDefault && ev.preventDefault();
    try{
      // run existing page validator if present
      if(typeof window.__smartelValidate === 'function'){
        if(!window.__smartelValidate()){ window.scrollTo({top:0, behavior:'smooth'}); return; }
      }
      const blob = await callPdfFunction(collectFormJSON());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'smartel_form.pdf';
      document.body.appendChild(a);
      a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    }catch(e){
      alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
      console.error(e);
    }
  }

  async function onPrint(ev){
    ev && ev.preventDefault && ev.preventDefault();
    try{
      if(typeof window.__smartelValidate === 'function'){
        if(!window.__smartelValidate()){ window.scrollTo({top:0, behavior:'smooth'}); return; }
      }
      const blob = await callPdfFunction(collectFormJSON());
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
      iframe.addEventListener('load', ()=>{
        try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }
        catch(_){ w.focus(); w.print(); }
      });
      w.addEventListener('afterprint', ()=> setTimeout(()=>w.close(), 400));
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    }catch(e){
      alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
      console.error(e);
    }
  }

  function bind(){
    var save = document.getElementById('saveBtn') || document.getElementById('pdfBtn') || document.querySelector('[data-action="save-pdf"]');
    var print = document.getElementById('printBtn') || document.querySelector('[data-action="print-pdf"]');
    if(save)  save.addEventListener('click', onSave);
    if(print) print.addEventListener('click', onPrint);
    qsa('input[name="autopay_method"]').forEach(r=> r.addEventListener('change', syncCardFields));
    syncCardFields();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
