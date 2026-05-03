(function(){
  'use strict';

  const TM2_CANDIDATE_KEY = 'sakeCalc.htmlSplit.tm2Candidate.v2.session';
  const $ = (id) => document.getElementById(id);

  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  }

  function readDraft(){
    try{
      const raw = sessionStorage.getItem(TM2_CANDIDATE_KEY);
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      return normalizeDraft(parsed);
    }catch(_err){
      return null;
    }
  }

  function normalizeValueItems(items){
    if(!Array.isArray(items)) return [];
    return items.map(item => {
      if(!item || typeof item !== 'object') return null;
      const label = String(item.label || '');
      const value = String(item.value || '');
      if(!label && !value) return null;
      return { label, value };
    }).filter(Boolean).slice(0, 8);
  }

  function normalizeDetailRows(rows){
    if(!Array.isArray(rows)) return [];
    return rows.map((row, rowIndex) => {
      if(!row || typeof row !== 'object') return null;
      const values = normalizeValueItems(row.values);
      if(!values.length) return null;
      return {
        index:rowIndex,
        label:String(row.label || '確認項目' + (rowIndex + 1)),
        values
      };
    }).filter(Boolean).slice(0, 24);
  }

  function normalizeDraft(raw){
    if(!raw || typeof raw !== 'object') return null;
    if(String(raw.type || '') !== 'tank2mm-v2-draft') return null;
    const source = raw.source && typeof raw.source === 'object' ? raw.source : {};
    const payload = raw.allowedPayload && typeof raw.allowedPayload === 'object' ? raw.allowedPayload : {};
    const rawCandidates = Array.isArray(payload.literCandidates) ? payload.literCandidates : [];
    const candidates = rawCandidates.map((item, index) => {
      const liters = Number(item && item.liters);
      if(!Number.isFinite(liters) || liters < 0) return null;
      const component = Number(item && item.component);
      const details = normalizeValueItems((item && (item.details || item.detailItems)) || []);
      return {
        index,
        role:String((item && item.role) || 'reference'),
        roleLabel:String((item && item.roleLabel) || (item && item.role_label) || (item && item.role) || '参考'),
        label:String((item && item.label) || '候補L'),
        stageLabel:String((item && item.stageLabel) || (item && item.label) || ''),
        liters,
        displayValue:formatCandidateLiterDisplay((item && item.displayValue) || liters),
        componentText:Number.isFinite(component) ? String((item && item.componentText) || component) : String((item && item.componentText) || ''),
        modeLabel:String((item && item.modeLabel) || source.calcTypeLabel || ''),
        details
      };
    }).filter(Boolean).slice(0, 8);
    if(!candidates.length) return null;
    return {
      type:'tank2mm-v2-draft',
      status:String(raw.status || 'preview-only-no-save-no-history'),
      builtAtJst:String(raw.builtAtJst || ''),
      source:{
        toolLabel:String(source.toolLabel || '計算画面'),
        calcTypeLabel:String(source.calcTypeLabel || ''),
        toolKey:String(source.toolKey || ''),
        returnHref:normalizeReturnHref(source),
        returnLabel:withBackArrow(source.returnLabel || '元の計算画面へ戻る'),
        returnToolLabel:getReturnToolLabel(source)
      },
      guard:raw.guard && typeof raw.guard === 'object' ? raw.guard : {},
      candidates,
      inputRows:normalizeDetailRows(payload.inputRows),
      resultRows:normalizeDetailRows(payload.resultRows),
      payloadNote:String(payload.note || '')
    };
  }

  const SOURCE_RETURN_FALLBACK = {
    mix:'./mix.html',
    water:'./water.html',
    alcohol:'./alcohol.html'
  };

  function withBackArrow(label){
    const text = String(label || '元の計算画面へ戻る').trim();
    return text.startsWith('←') ? text : '← ' + text;
  }

  const ALLOWED_RETURN_HREFS = new Set(['./mix.html', './water.html', './alcohol.html', './index.html']);


  function formatLiterTruncatedText(value, decimals=2){
    const raw = String(value == null ? '' : value).replace(/,/g, '').trim();
    const match = raw.match(/-?\d+(?:\.\d+)?/);
    if(match){
      const text = match[0];
      const negative = text.startsWith('-') ? '-' : '';
      const unsigned = negative ? text.slice(1) : text;
      const parts = unsigned.split('.');
      const whole = parts[0] || '0';
      const fraction = (parts[1] || '').slice(0, decimals).padEnd(decimals, '0');
      return decimals > 0 ? `${negative}${whole}.${fraction}` : `${negative}${whole}`;
    }
    const num = Number(value);
    if(!Number.isFinite(num)) return '';
    const scale = 10 ** decimals;
    return (Math.trunc(num * scale) / scale).toFixed(decimals);
  }
  function formatCandidateLiterDisplay(value){
    const text = formatLiterTruncatedText(value, 2);
    return text ? `${text}L` : '';
  }

  function normalizeReturnHref(source){
    if(!source || typeof source !== 'object') return '';
    const explicit = String(source.returnHref || '').trim();
    if(ALLOWED_RETURN_HREFS.has(explicit)) return explicit;
    const toolKey = String(source.toolKey || '');
    const prefix = toolKey.split(':')[0];
    return SOURCE_RETURN_FALLBACK[prefix] || '';
  }

  function getReturnToolLabel(source){
    if(!source || typeof source !== 'object') return '';
    return String(source.returnToolLabel || source.toolName || source.toolLabel || '').replace(/：.*$/, '');
  }


  function normalizeCompareText(value){
    return String(value == null ? '' : value)
      .replace(/\s+/g, '')
      .replace(/[：:]/g, '')
      .trim();
  }

  function normalizeLiterText(value){
    const num = Number(String(value == null ? '' : value).replace(/L/g, '').replace(/,/g, ''));
    if(!Number.isFinite(num)) return '';
    return String(Math.trunc(num * 100) / 100);
  }

  function isQuantityDetailLabel(label){
    return /数量|必要量|合計数量|現在量|仕上がり量|目標数量|投入後累計|割水前数量|添加前数量|添加前必要量/.test(String(label || ''));
  }

  function getDisplayDetailItems(candidate){
    const rawItems = candidate.details && candidate.details.length ? candidate.details : [];
    const seen = new Set();
    const mainLiter = normalizeLiterText(candidate.displayValue || candidate.liters);
    return rawItems.filter(item => {
      if(!item) return false;
      const label = String(item.label || '');
      const value = String(item.value || '');
      if(!label && !value) return false;
      const key = normalizeCompareText(label + '|' + value);
      if(seen.has(key)) return false;
      seen.add(key);
      if(isQuantityDetailLabel(label) && mainLiter && normalizeLiterText(value) === mainLiter) return false;
      if(normalizeCompareText(value) && normalizeCompareText(value) === normalizeCompareText(candidate.label)) return false;
      return true;
    }).slice(0, 8);
  }

  function setMessage(message, isError){
    const el = $('tm2-candidate-message');
    if(!el) return;
    el.textContent = message || '';
    el.style.color = isError ? '#9f2d2d' : '';
  }

  function renderCandidate(candidate){
    const component = candidate.componentText ? '<div class="tm2-candidate-component">その時点の成分：' + escapeHtml(candidate.componentText) + '</div>' : '';
    const mode = candidate.modeLabel ? '<div class="tm2-candidate-mode">' + escapeHtml(candidate.modeLabel) + '</div>' : '';
    const detailItems = getDisplayDetailItems(candidate);
    const details = detailItems.length
      ? '<div class="tm2-candidate-chips">' + detailItems.map(item => '<span class="tm2-candidate-chip"><span>' + escapeHtml(item.label) + '</span><strong>' + escapeHtml(item.value) + '</strong></span>').join('') + '</div>'
      : '';
    return '<article class="tm2-candidate-row is-' + escapeHtml(candidate.role) + '">' +
      '<div class="tm2-candidate-main">' +
        '<div class="tm2-candidate-head"><span class="tm2-candidate-role">' + escapeHtml(candidate.roleLabel) + '</span>' + mode + '</div>' +
        '<strong class="tm2-candidate-liter">' + escapeHtml(candidate.displayValue) + '</strong>' +
        '<div class="tm2-candidate-label">' + escapeHtml(candidate.label) + '</div>' + component + details +
      '</div>' +
    '</article>';
  }

  function updateSourceReturnButton(draft){
    const button = $('tm2-candidate-return-source');
    if(!button) return;
    const href = draft && draft.source ? draft.source.returnHref : '';
    if(!href){
      button.hidden = true;
      button.removeAttribute('href');
      button.textContent = '← 元の計算画面へ戻る';
      return;
    }
    button.hidden = false;
    button.href = href;
    button.textContent = withBackArrow(draft.source.returnLabel || '元の計算画面へ戻る');
    const toolLabel = draft.source.returnToolLabel || '';
    button.setAttribute('aria-label', toolLabel ? toolLabel + 'へ画面移動します。入力復元や保存は行いません。' : '元の計算画面へ画面移動します。入力復元や保存は行いません。');
  }

  function render(){
    const draft = readDraft();
    const card = $('tm2-candidate-card');
    const empty = $('tm2-candidate-empty');
    const list = $('tm2-candidate-list');
    const source = $('tm2-candidate-source');
    if(!card || !empty || !list || !source) return;
    if(!draft){
      card.hidden = true;
      empty.hidden = false;
      list.innerHTML = '';
      source.textContent = '—';
      updateSourceReturnButton(null);
      return;
    }
    card.hidden = false;
    empty.hidden = true;
    const timeText = draft.builtAtJst ? ' / ' + draft.builtAtJst : '';
    const returnText = draft.source.returnToolLabel ? ' / 候補元：' + draft.source.returnToolLabel : '';
    source.textContent = draft.source.toolLabel + timeText + returnText;
    list.innerHTML = draft.candidates.map(renderCandidate).join('');
    updateSourceReturnButton(draft);
  }

  function clearDraft(){
    try{ sessionStorage.removeItem(TM2_CANDIDATE_KEY); }catch(_err){}
    render();
    setMessage('2mm表候補の一時候補を消しました。');
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    const clear = $('tm2-candidate-clear');
    if(clear) clear.addEventListener('click', clearDraft);
  });

  window.SakeCalcTm2Candidate = { render, clearDraft, _readDraft:readDraft };
})();
