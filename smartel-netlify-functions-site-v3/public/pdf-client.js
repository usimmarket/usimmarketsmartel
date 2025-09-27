
// Lightweight client for Save/Print buttons -> Netlify Function call
(function(){
  function $(sel){ return document.querySelector(sel); }
  function collectFormJSON(){
    var form = document.getElementById('form') || document.querySelector('form');
    if(!form) return {};
    var obj = {};
    try {
      new FormData(form).forEach((v,k)=>{ obj[k]=v; });
    } catch(e){
      // older browsers fallback
      Array.prototype.forEach.call(form.elements, function(el){
        if(!el.name) return;
        if(el.type === 'radio' || el.type === 'checkbox'){
          if(!el.checked) return;
        }
        obj[el.name] = el.value;
      });
    }
    // Only include card expiry if method is 'card'
    if(obj.autopay_method !== 'card'){
      delete obj.autopay_exp;
      delete obj.card_exp_year;
      delete obj.card_exp_month;
    }
    return obj;
  }

  async function requestPDF(){
    var payload = collectFormJSON();
    var resp = await fetch('/.netlify/functions/generate_pdf', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!resp.ok){
      var t = await resp.text();
      throw new Error('Function error ' + resp.status + ': ' + t);
    }
    var blob = await resp.blob();
    return blob;
  }

  async function onSave(ev){
    ev && ev.preventDefault && ev.preventDefault();
    try{
      var blob = await requestPDF();
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'smartel_form.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    }catch(e){
      alert('PDF 생성 중 오류가 발생했습니다. ' + (e.message||''));
      console.error(e);
    }
  }

  async function onPrint(ev){
    ev && ev.preventDefault && ev.preventDefault();
    try{
      var blob = await requestPDF();
      var url = URL.createObjectURL(blob);
      var w = window.open('', '_blank', 'noopener');
      if(!w){ alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>SMARTEL 신청서</title></head><body style="margin:0;background:#111"></body></html>');
      w.document.close();
      var iframe = w.document.createElement('iframe');
      iframe.style.cssText='border:0;width:100vw;height:100vh';
      iframe.src = url;
      w.document.body.appendChild(iframe);
      iframe.addEventListener('load', function(){
        try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }catch(_){ w.focus(); w.print(); }
      });
      w.addEventListener('afterprint', function(){ setTimeout(function(){ try{ w.close(); }catch(_){ } }, 400); });
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    }catch(e){
      alert('PDF 생성 중 오류가 발생했습니다. ' + (e.message||''));
      console.error(e);
    }
  }

  function bind(){
    var save = document.getElementById('saveBtn') || document.querySelector('[data-action="save-pdf"]');
    var print = document.getElementById('printBtn') || document.querySelector('[data-action="print-pdf"]');
    if(save) save.addEventListener('click', onSave, {passive:false});
    if(print) print.addEventListener('click', onPrint, {passive:false});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bind);
  } else { bind(); }
})();
