// pdf-client.js — wires Save/Print buttons to the Netlify Function
(function(){
  const FN_URL = '/.netlify/functions/generate_pdf';

  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function updateCardFields(){
    const method = (document.querySelector('input[name="autopay_method"]:checked')||{}).value;
    const isCard = method === 'card';
    const ids = ['card_exp_year','card_exp_month','autopay_exp'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      if(isCard){
        el.removeAttribute('disabled');
      } else {
        el.setAttribute('disabled', 'disabled');
        el.value = '';
      }
    });
  }
  $all('input[name="autopay_method"]').forEach(r => r.addEventListener('change', updateCardFields));
  updateCardFields();

  function formToJSON(form){
    const data = Object.fromEntries(new FormData(form).entries());
    if(data.birth_in && !data.birth){
      data.birth = String(data.birth_in).replace(/\D+/g,'');
    }
    const yy = (document.getElementById('card_exp_year')||{}).value||'';
    const mm = (document.getElementById('card_exp_month')||{}).value||'';
    if(yy && mm){ data.autopay_exp = yy + '/' + mm; }
    return data;
  }

  async function callFn(payload){
    const resp = await fetch(FN_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!resp.ok){
      const t = await resp.text().catch(()=>'');
      throw new Error('Function error ' + resp.status + ' ' + t);
    }
    const blob = await resp.blob();
    return blob;
  }

  async function onSave(e){
    e.preventDefault();
    const form = document.getElementById('form') || document.querySelector('form');
    if(!form){ return alert('폼을 찾을 수 없습니다.'); }
    if(typeof window.validate === 'function'){
      if(!window.validate()){ window.scrollTo({top:0, behavior:'smooth'}); return; }
    } else if(typeof window.__smartelValidate === 'function'){
      if(!window.__smartelValidate()){ window.scrollTo({top:0, behavior:'smooth'}); return; }
    }
    try{
      updateCardFields();
      const data = formToJSON(form);
      const blob = await callFn(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'smartel_form.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    }catch(err){
      alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
      console.error(err);
    }
  }

  async function onPrint(e){
    e.preventDefault();
    const form = document.getElementById('form') || document.querySelector('form');
    if(!form){ return alert('폼을 찾을 수 없습니다.'); }
    if(typeof window.validate === 'function'){
      if(!window.validate()){ window.scrollTo({top:0, behavior:'smooth'}); return; }
    } else if(typeof window.__smartelValidate === 'function'){
      if(!window.__smartelValidate()){ window.scrollTo({top:0, behavior:'smooth'}); return; }
    }
    try{
      updateCardFields();
      const data = formToJSON(form);
      const blob = await callFn(data);
      const url = URL.createObjectURL(blob);
      const w = window.open('', '_blank','noopener');
      w.document.write('<!doctype html><title>PDF</title><style>html,body{margin:0;height:100%}iframe{border:0;width:100vw;height:100vh}</style>');
      w.document.body.innerHTML = '<iframe id="pv" src="'+url+'"></iframe>';
      const f = w.document.getElementById('pv');
      f.addEventListener('load', () => { try{ f.contentWindow.print(); }catch(_){ w.print(); } });
      w.addEventListener('afterprint', () => setTimeout(()=>w.close(), 400));
      setTimeout(()=>URL.revokeObjectURL(url), 600000);
    }catch(err){
      alert('PDF 생성 중 오류가 발생했습니다. Netlify Functions 배포/경로를 확인해주세요.');
      console.error(err);
    }
  }

  function bind(){
    const save = document.getElementById('saveBtn') || document.getElementById('pdfBtn') || document.querySelector('[data-action="save-pdf"]');
    const printBtn = document.getElementById('printBtn') || document.querySelector('[data-action="print-pdf"]');
    if(save) save.addEventListener('click', onSave, {passive:false});
    if(printBtn) printBtn.addEventListener('click', onPrint, {passive:false});
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', bind); } else bind();
})();