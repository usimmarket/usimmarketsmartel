
(function(){
  const FN_PATH = '/.netlify/functions/generate_pdf';

  function collectFormJSON(){
    const form = document.getElementById('form') || document.querySelector('form');
    const data = Object.fromEntries(new FormData(form).entries());
    // compose card YY/MM if visible
    const method = (document.querySelector('input[name="autopay_method"]:checked')||{}).value;
    if(method==='card'){
      const yy = (document.getElementById('card_exp_year')||{}).value||'';
      const mm = (document.getElementById('card_exp_month')||{}).value||'';
      if(yy && mm) data.autopay_exp = yy + '/' + mm;
    }else{
      // bank chosen: make sure expiry not required
      if (data.autopay_exp) delete data.autopay_exp;
    }
    // copy birth_in -> birth (digits only)
    var rawBirth = (document.getElementById('birth_in')||{}).value||'';
    if (rawBirth) data.birth = rawBirth.replace(/\D+/g,'');
    return data;
  }

  async function callFn(data){
    const resp = await fetch(FN_PATH, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    if(!resp.ok){
      const t = await resp.text().catch(()=> '');
      throw new Error('FN_FAIL ' + resp.status + ' ' + t);
    }
    return await resp.blob();
  }

  async function onSave(e){
    if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
    try{
      // run page validator if present
      if (typeof window.__smartelValidate === 'function'){
        if (!window.__smartelValidate()) return;
      } else if (typeof window.validate === 'function'){
        if (!window.validate()) return;
      }
      const blob = await callFn(collectFormJSON());
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'smartel_form.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 5*60*1000);
    }catch(err){
      alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
      console.error(err);
    }
  }

  async function onPrint(e){
    if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
    try{
      if (typeof window.__smartelValidate === 'function'){
        if (!window.__smartelValidate()) return;
      } else if (typeof window.validate === 'function'){
        if (!window.validate()) return;
      }
      const blob = await callFn(collectFormJSON());
      const url  = URL.createObjectURL(blob);
      const w = window.open('', '_blank', 'noopener');
      const doc = w.document;
      doc.open();
      doc.write('<!doctype html><html><head><meta charset="utf-8"><title>SMARTEL 신청서</title><style>html,body{margin:0;height:100%}iframe{border:0;width:100vw;height:100vh}</style></head><body></body></html>');
      doc.close();
      const iframe = doc.createElement('iframe');
      iframe.src = url; iframe.style.cssText = 'border:0;width:100vw;height:100vh';
      doc.body.appendChild(iframe);
      iframe.addEventListener('load', function(){
        try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }catch(_){ w.focus(); w.print(); }
      });
      w.addEventListener('afterprint', () => setTimeout(()=>w.close(), 400));
      setTimeout(()=>URL.revokeObjectURL(url), 5*60*1000);
    }catch(err){
      alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
      console.error(err);
    }
  }

  function bindOnce(){
    const save = document.getElementById('saveBtn') || document.querySelector('#pdfBtn,[data-action="save-pdf"]');
    const print= document.getElementById('printBtn')|| document.querySelector('[data-action="print-pdf"]');
    if (save && !save.__pdfBound){ save.addEventListener('click', onSave, true); save.__pdfBound = true; }
    if (print && !print.__pdfBound){ print.addEventListener('click', onPrint, true); print.__pdfBound = true; }
  }
  document.addEventListener('DOMContentLoaded', bindOnce);
  setTimeout(bindOnce, 500); // in case late-rendered buttons
})();
