/* Ultra-robust PDF client binder (save/print)
 * - Binds by #id, [data-action], and visible text (KR/EN)
 * - Works even if DOM changes or labels are translated
 * - Requires: /.netlify/functions/generate_pdf (Netlify Functions)
 */

(function () {
  const FN_URL = '/.netlify/functions/generate_pdf';

  // ---- helpers ---------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const onlyDigits = (v) => (v || '').replace(/\D+/g, '');

  function findForm() {
    return $('#form') || $('form') || document.forms[0] || document;
  }

  function collectFormJSON() {
    const form = findForm();
    const data = form instanceof HTMLFormElement
      ? Object.fromEntries(new FormData(form).entries())
      : {};

    // Common hidden/sanitized fields (safe if not present)
    const rawBirth = $('#birth_in')?.value;
    if (rawBirth) data.birth = onlyDigits(rawBirth);

    const method = $('input[name="autopay_method"]:checked')?.value;
    if (method === 'card') {
      const yy = ($('#card_exp_year')?.value || '').trim();
      const mm = ($('#card_exp_month')?.value || '').trim();
      if (yy && mm) data.autopay_exp = `${yy}/${mm}`;
    }
    return data;
  }

  async function callFn(payload) {
    const resp = await fetch(FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      throw new Error(`Function error ${resp.status}: ${t}`);
    }
    return await resp.blob(); // should be application/pdf
  }

  function openBlobInNewTab(blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'smartel_form.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  }

  function printBlob(blob) {
    const url = URL.createObjectURL(blob);
    const w = window.open('about:blank', '_blank', 'noopener,noreferrer');
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
    w.addEventListener('afterprint', () => setTimeout(() => w.close(), 400));
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  }

  function passesValidateIfAny() {
    try {
      if (typeof window.validate === 'function') {
        return !!window.validate();
      }
    } catch (_) {}
    return true; // no validate() means pass
  }

  // ---- action handlers -------------------------------------------------
  async function handleSave(ev) {
    ev.preventDefault();
    try {
      if (!passesValidateIfAny()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const blob = await callFn(collectFormJSON());
      downloadBlob(blob, 'smartel_form.pdf');
    } catch (err) {
      console.error('[PDF] save error:', err);
      alert('PDF 생성 중 오류가 발생했습니다.\n' + (err?.message || err));
    }
  }

  async function handlePrint(ev) {
    ev.preventDefault();
    try {
      if (!passesValidateIfAny()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const blob = await callFn(collectFormJSON());
      printBlob(blob);
    } catch (err) {
      console.error('[PDF] print error:', err);
      alert('PDF 생성 중 오류가 발생했습니다.\n' + (err?.message || err));
    }
  }

  // ---- robust binding --------------------------------------------------
  function isSaveButton(el) {
    if (!el) return false;
    if (el.matches('#savePdf, #saveBtn, #pdfBtn, [data-action="save-pdf"]')) return true;
    const t = (el.textContent || '').trim();
    return /^(PDF\s*저장|Save\s*PDF)$/i.test(t);
  }

  function isPrintButton(el) {
    if (!el) return false;
    if (el.matches('#printPdf, #printBtn, [data-action="print-pdf"]')) return true;
    const t = (el.textContent || '').trim();
    return /^(인쇄|Print)$/i.test(t);
  }

  function bindDirect() {
    // direct bind if present
    $$('#savePdf, #saveBtn, #pdfBtn, [data-action="save-pdf"]').forEach(b => {
      if (!b.__pdfBound) { b.addEventListener('click', handleSave, { passive: false }); b.__pdfBound = true; }
    });
    $$('#printPdf, #printBtn, [data-action="print-pdf"]').forEach(b => {
      if (!b.__pdfBound) { b.addEventListener('click', handlePrint, { passive: false }); b.__pdfBound = true; }
    });
  }

  function bindDelegation() {
    // event delegation covers translated labels and dynamic DOM
    document.addEventListener('click', function (e) {
      const el = e.target?.closest('button, a, [role="button"], .btn');
      if (!el) return;
      if (isSaveButton(el)) return handleSave(e);
      if (isPrintButton(el)) return handlePrint(e);
    }, true); // capture to run before other handlers
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function init() {
    bindDelegation();
    bindDirect();
    // heartbeat for quick manual check
    window.__PDF_BINDER_OK__ = true;
    console.log('[PDF] client ready: bindings installed');
  });
})();
