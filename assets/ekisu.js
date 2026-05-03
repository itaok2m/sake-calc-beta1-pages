(function(){
  'use strict';

  const DRAFT_KEY = 'sakeCalc.htmlSplit.ekisu.lastInputs.v1';
  const HISTORY_KEY = 'sakeCalc.htmlSplit.ekisu.history.v1';
  const HISTORY_RESTORE_KEY = 'sakeCalc.htmlSplit.ekisu.history.restore.v1';
  const $ = (id) => document.getElementById(id);
  const ED = [1.0000,.9985,.9970,.9956,.9942,.9929,.9916,.9903,.9891,.9878,.9867,.9855,.9844,.9833,.9822,.9812,.9802,.9792,.9782,.9773,.9763,.9753,.9742,.9732,.9721,.9711,.9700,.9690,.9679,.9668,.9657,.9645,.9633,.9621,.9608,.9594,.9581,.9567,.9553,.9538,.9523,.9507,.9491,.9474,.9457,.9440,.9422,.9404,.9386,.9367,.9348,.9329,.9309,.9289,.9269,.9248,.9227,.9206,.9185,.9163,.9141,.9119,.9096,.9073,.9050,.9027,.9004,.8980,.8956,.8932,.8907,.8882,.8857,.8831,.8805,.8779,.8753,.8726,.8699,.8672,.8645,.8617,.8589,.8560,.8531,.8502,.8472,.8442,.8411,.8379,.8346,.8312,.8278,.8242,.8200,.8168,.8128,.8086,.8042,.7996,.7947];
  const formulas = {
    sm:{main:'① エキス分 ＝ 日本酒度とアルコール分から算出', sub:'② 原エキス分 ＝ エキス分 ＋ アルコール分 × 1.5894', badge:'日本酒度入力'},
    bm:{main:'① ボーメ度を日本酒度に換算してエキス分を算出', sub:'② 原エキス分 ＝ エキス分 ＋ アルコール分 × 1.5894', badge:'ボーメ度入力'}
  };
  let activeMode = 'sm';
  let latestValidSnapshot = null;

  function setText(id, value){ const el = $(id); if(el) el.textContent = value; }
  function show(el){ if(typeof el === 'string') el = $(el); if(el) el.hidden = false; }
  function hide(el){ if(typeof el === 'string') el = $(el); if(el) el.hidden = true; }
  function readNumber(id){ const el = $(id); if(!el || el.value === '') return NaN; return Number(el.value); }
  function formatSigned(value){ return (value >= 0 ? '+' : '') + value.toFixed(1); }
  function truncatedFixed(value, digits){
    if(!Number.isFinite(value)) return '—';
    const factor = Math.pow(10, digits || 0);
    const truncated = value >= 0 ? Math.floor(value * factor) / factor : Math.ceil(value * factor) / factor;
    return truncated.toFixed(digits || 0);
  }
  function formatJst(date){
    try{
      return new Intl.DateTimeFormat('ja-JP', { timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(date).replace(/\//g,'-') + ' JST';
    }catch(_err){ return date.toISOString(); }
  }
  function densityFromSakeMeter(sm){ return Math.floor(10000 * (1443 / (1443 + sm)) + 0.5) / 10000; }
  function extractRaw(dal, d){ return ((d - dal) * 260 + 0.21); }
  function originalExtractRaw(dal, d, alcohol){ return extractRaw(dal, d) + 1.5894 * alcohol; }
  function extractDevRaw(d1, d0, dv, dev){ return dev * (extractRaw(d1, dv) - extractRaw(d0, dv)) + extractRaw(d0, dv); }
  function originalExtractDevRaw(d1, d0, dv, alcoholFloor, dev){ return dev * (originalExtractRaw(d1, dv, alcoholFloor + 1) - originalExtractRaw(d0, dv, alcoholFloor)) + originalExtractRaw(d0, dv, alcoholFloor); }

  function saveDraft(){
    try{
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        mode:activeMode,
        alcohol:($('ekisu-alcohol') || {}).value || '',
        sakeMeter:($('ekisu-sake-meter') || {}).value || '',
        baume:($('ekisu-baume') || {}).value || ''
      }));
    }catch(_err){}
  }

  function restoreDraft(){
    try{
      const raw = localStorage.getItem(DRAFT_KEY);
      if(!raw) return;
      const parsed = JSON.parse(raw);
      if(parsed && typeof parsed === 'object'){
        if($('ekisu-alcohol')) $('ekisu-alcohol').value = parsed.alcohol || '';
        if($('ekisu-sake-meter')) $('ekisu-sake-meter').value = parsed.sakeMeter || '';
        if($('ekisu-baume')) $('ekisu-baume').value = parsed.baume || '';
        setMode(parsed.mode === 'bm' ? 'bm' : 'sm', { skipSave:true });
      }
    }catch(_err){}
  }

  function updateFormula(){
    const f = formulas[activeMode] || formulas.sm;
    setText('ekisu-formula-main', f.main);
    setText('ekisu-formula-sub', f.sub);
    setText('ekisu-action-mode-badge', f.badge);
  }

  function updateConversions(){
    const bm = readNumber('ekisu-baume');
    if($('ekisu-bm-conv')){
      if(!Number.isFinite(bm)) setText('ekisu-bm-conv', 'ボーメ度を入力すると日本酒度に換算します');
      else{
        const smFromBm = -10 * bm;
        setText('ekisu-bm-conv', 'ボーメ ' + bm.toFixed(1) + ' °Bé　→　日本酒度 ' + formatSigned(smFromBm) + ' 度');
      }
    }
    const sm = readNumber('ekisu-sake-meter');
    if($('ekisu-sm-conv')){
      if(!Number.isFinite(sm)) setText('ekisu-sm-conv', '日本酒度を入力するとボーメ度に換算します');
      else{
        const bmFromSm = Math.abs(sm) < 0.0000001 ? 0 : (-sm / 10);
        setText('ekisu-sm-conv', '日本酒度 ' + formatSigned(sm) + ' 度　→　ボーメ ' + bmFromSm.toFixed(1) + ' °Bé');
      }
    }
  }

  function showError(message){
    const err = $('ekisu-error');
    setText('ekisu-error', message || '');
    if(err) err.hidden = !message;
    hide('ekisu-result');
    latestValidSnapshot = null;
    updateHistoryButton();
  }

  function clearError(){
    const err = $('ekisu-error');
    setText('ekisu-error', '');
    if(err) err.hidden = true;
  }

  function calculate(){
    clearError();
    hide('ekisu-result');
    latestValidSnapshot = null;
    updateHistoryButton();
    const alcohol = readNumber('ekisu-alcohol');
    if(!Number.isFinite(alcohol)) return;
    if(alcohol < 0 || alcohol >= 100){
      showError('アルコール分は 0〜99.9 の範囲で入力してください。');
      return;
    }
    let sakeMeter;
    let baumeUsed = false;
    if(activeMode === 'bm'){
      const baume = readNumber('ekisu-baume');
      if(!Number.isFinite(baume)) return;
      sakeMeter = -10 * baume;
      baumeUsed = true;
    }else{
      sakeMeter = readNumber('ekisu-sake-meter');
      if(!Number.isFinite(sakeMeter)) return;
    }
    const alcoholFloor = Math.floor(alcohol);
    const dev = alcohol - alcoholFloor;
    const density = densityFromSakeMeter(sakeMeter);
    const d0 = ED[alcoholFloor];
    const d1 = ED[alcoholFloor + 1] !== undefined ? ED[alcoholFloor + 1] : ED[alcoholFloor];
    if(!Number.isFinite(d0) || !Number.isFinite(d1)){
      showError('このアルコール分では計算できません。入力値を確認してください。');
      return;
    }
    const extract = extractDevRaw(d1, d0, density, dev);
    const originalExtract = originalExtractDevRaw(d1, d0, density, alcoholFloor, dev);
    setText('ekisu-extract', truncatedFixed(extract, 2));
    setText('ekisu-original-extract', truncatedFixed(originalExtract, 2));
    if(baumeUsed){
      setText('ekisu-conv-label', 'ボーメ度 → 日本酒度換算値');
      setText('ekisu-conv-value', formatSigned(sakeMeter));
      setText('ekisu-conv-unit', '度');
    }else{
      const baumeFromSm = Math.abs(sakeMeter) < 0.0000001 ? 0 : (-sakeMeter / 10);
      setText('ekisu-conv-label', '日本酒度 → ボーメ度換算値');
      setText('ekisu-conv-value', baumeFromSm.toFixed(1));
      setText('ekisu-conv-unit', '°Bé');
    }
    latestValidSnapshot = {
      mode:activeMode,
      modeLabel:(formulas[activeMode] || formulas.sm).badge,
      inputRows:[
        { label:'入力条件', values:[{label:'アルコール分', value:alcohol.toFixed(1) + '%'}, baumeUsed ? {label:'ボーメ度', value:readNumber('ekisu-baume').toFixed(1) + '°Bé'} : {label:'日本酒度', value:formatSigned(sakeMeter) + '度'}] }
      ],
      resultRows:[
        { label:'計算結果', values:[{label:'エキス分', value:truncatedFixed(extract, 2) + '%'}, {label:'全エキス分', value:truncatedFixed(originalExtract, 2) + '%'}, {label:'換算値', value:baumeUsed ? (formatSigned(sakeMeter) + '度') : (((Math.abs(sakeMeter) < 0.0000001 ? 0 : (-sakeMeter / 10))).toFixed(1) + '°Bé')}] }
      ]
    };
    show('ekisu-result');
    updateHistoryButton();
  }

  function setMode(mode, options){
    activeMode = mode === 'bm' ? 'bm' : 'sm';
    document.querySelectorAll('[data-ekisu-mode]').forEach(button => {
      button.classList.toggle('active', button.getAttribute('data-ekisu-mode') === activeMode);
    });
    if($('ekisu-row-sm')) $('ekisu-row-sm').hidden = activeMode !== 'sm';
    if($('ekisu-row-bm')) $('ekisu-row-bm').hidden = activeMode !== 'bm';
    updateFormula();
    updateConversions();
    calculate();
    if(!options || !options.skipSave) saveDraft();
  }

  function resetInputs(){
    ['ekisu-alcohol','ekisu-sake-meter','ekisu-baume'].forEach(id => { const el = $(id); if(el) el.value = ''; });
    clearError();
    hide('ekisu-result');
    latestValidSnapshot = null;
    updateHistoryButton();
    updateConversions();
    saveDraft();
  }


  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function historyModeLabel(mode){ return (formulas[mode] || formulas.sm).badge; }
  function loadHistoryItems(){ try{ const raw = localStorage.getItem(HISTORY_KEY); const parsed = JSON.parse(raw || '[]'); return Array.isArray(parsed) ? parsed : []; }catch(_err){ return []; } }
  function saveHistoryItems(items){ try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 80))); return true; }catch(_err){ return false; } }
  function flattenRows(rows){ return (rows || []).flatMap(row => (row.values || []).map(value => ({label:(row.label ? row.label + ' / ' : '') + value.label, value:value.value}))); }
  function currentHistoryFilter(){ const filter = $('ekisu-history-filter'); return filter ? filter.value : 'all'; }
  function collectHistoryFieldValues(){ return { 'ekisu-alcohol':($('ekisu-alcohol') || {}).value || '', 'ekisu-sake-meter':($('ekisu-sake-meter') || {}).value || '', 'ekisu-baume':($('ekisu-baume') || {}).value || '' }; }
  function setupHistoryFilter(){
    const filter = $('ekisu-history-filter');
    if(!filter || filter.options.length) return;
    filter.appendChild(new Option('すべての方式', 'all'));
    filter.appendChild(new Option(historyModeLabel('sm'), 'sm'));
    filter.appendChild(new Option(historyModeLabel('bm'), 'bm'));
  }
  function updateHistoryButton(){ const button = $('ekisu-save-history'); if(button) button.disabled = !latestValidSnapshot; }
  function setHistoryStatus(message, isError){ const status = $('ekisu-history-status'); if(!status) return; status.textContent = message || ''; status.classList.remove('is-success','is-info','is-error'); status.style.color = ''; if(isError) status.classList.add('is-error'); else if(message === '履歴に残しました。') status.classList.add('is-success'); else if(message) status.classList.add('is-info'); }
  function buildHistoryItem(){
    if(!latestValidSnapshot) return null;
    const now = new Date();
    const fieldValues = collectHistoryFieldValues();
    return { id:'ekisu-history-' + now.getTime() + '-' + Math.random().toString(16).slice(2), savedAtISO:now.toISOString(), savedAtJst:formatJst(now), toolName:'エキス分計算', mode:activeMode, modeLabel:historyModeLabel(activeMode), fieldValues, inputRows:latestValidSnapshot.inputRows || [], resultRows:latestValidSnapshot.resultRows || [] };
  }
  function saveCurrentHistory(){
    const item = buildHistoryItem();
    if(!item){ setHistoryStatus('計算結果が出てから履歴に残せます。', true); return; }
    const items = loadHistoryItems();
    const prev = items[0];
    if(prev && prev.mode === item.mode && JSON.stringify(prev.fieldValues) === JSON.stringify(item.fieldValues) && JSON.stringify(prev.resultRows) === JSON.stringify(item.resultRows)){ setHistoryStatus('直前と同じ計算結果のため、二重保存はしませんでした。'); return; }
    items.unshift(item);
    if(saveHistoryItems(items)){ setHistoryStatus('履歴に残しました。'); renderHistoryList(); }
    else setHistoryStatus('履歴を保存できませんでした。この端末の保存設定を確認してください。', true);
  }
  function restoreHistoryItem(id){
    const item = loadHistoryItems().find(entry => entry.id === id);
    if(!item) return;
    setMode(item.mode === 'bm' ? 'bm' : 'sm', {skipSave:true});
    Object.keys(item.fieldValues || {}).forEach(fieldId => { const el = $(fieldId); if(el) el.value = item.fieldValues[fieldId]; });
    updateConversions();
    calculate();
    saveDraft();
    setHistoryStatus('履歴の入力値を戻しました。履歴保存や2mm表候補作成は自動実行していません。');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function restorePendingHistoryItem(){
    let item = null;
    try{
      const raw = sessionStorage.getItem(HISTORY_RESTORE_KEY);
      if(!raw) return;
      sessionStorage.removeItem(HISTORY_RESTORE_KEY);
      item = JSON.parse(raw);
    }catch(_err){ return; }
    if(!item || !item.fieldValues) return;
    setMode(item.mode === 'bm' ? 'bm' : 'sm', { skipSave:true });
    Object.keys(item.fieldValues || {}).forEach(fieldId => {
      const el = $(fieldId);
      if(el) el.value = item.fieldValues[fieldId];
    });
    updateConversions();
    calculate();
    saveDraft();
    setHistoryStatus('履歴の入力値を戻しました。履歴保存や2mm表候補作成は自動実行していません。');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function deleteHistoryItem(id){ const next = loadHistoryItems().filter(entry => entry.id !== id); saveHistoryItems(next); setHistoryStatus('履歴を削除しました。'); renderHistoryList(); }
  function renderHistoryList(){
    const list = $('ekisu-history-list'); if(!list) return;
    const filter = currentHistoryFilter();
    const items = loadHistoryItems().filter(item => filter === 'all' || item.mode === filter);
    if(!items.length){ list.innerHTML = '<div class="dedicated-history-empty">この方式の履歴はまだありません。</div>'; return; }
    list.innerHTML = items.map(item => {
      const inputLines = flattenRows(item.inputRows).slice(0, 8).map(line => `<div class="dedicated-history-line"><strong>${escapeHtml(line.label)}</strong>：${escapeHtml(line.value)}</div>`).join('');
      const resultLines = flattenRows(item.resultRows).slice(0, 8).map(line => `<div class="dedicated-history-line"><strong>${escapeHtml(line.label)}</strong>：${escapeHtml(line.value)}</div>`).join('');
      return `<article class="dedicated-history-card"><div class="dedicated-history-meta"><span>${escapeHtml(item.savedAtJst || '')}</span><span>${escapeHtml(item.modeLabel || '')}</span></div><div class="dedicated-history-card-title">${escapeHtml(item.toolName || 'エキス分計算')}</div><div class="dedicated-history-lines">${inputLines}${resultLines}</div><div class="dedicated-history-card-actions"><button class="back-btn" data-history-restore="${escapeHtml(item.id)}" type="button">この履歴を入力欄に戻す</button><button class="back-btn danger-btn" data-history-delete="${escapeHtml(item.id)}" type="button">削除</button></div></article>`;
    }).join('');
  }
  function bindHistoryUI(){
    setupHistoryFilter();
    const saveButton = $('ekisu-save-history'); if(saveButton) saveButton.addEventListener('click', saveCurrentHistory);
    const toggleButton = $('ekisu-toggle-history'); const panel = $('ekisu-history-panel');
    if(toggleButton && panel){ toggleButton.addEventListener('click', () => { panel.hidden = !panel.hidden; toggleButton.textContent = panel.hidden ? 'エキス分履歴を見る' : 'エキス分履歴を閉じる'; if(!panel.hidden) renderHistoryList(); }); }
    const filter = $('ekisu-history-filter'); if(filter) filter.addEventListener('change', renderHistoryList);
    const list = $('ekisu-history-list'); if(list) list.addEventListener('click', (event) => { const restore = event.target.closest('[data-history-restore]'); if(restore) return restoreHistoryItem(restore.getAttribute('data-history-restore')); const del = event.target.closest('[data-history-delete]'); if(del) return deleteHistoryItem(del.getAttribute('data-history-delete')); });
    renderHistoryList();
    updateHistoryButton();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-ekisu-mode]').forEach(button => {
      button.addEventListener('click', () => setMode(button.getAttribute('data-ekisu-mode')));
    });
    ['ekisu-alcohol','ekisu-sake-meter','ekisu-baume'].forEach(id => {
      const el = $(id);
      if(el) el.addEventListener('input', () => { updateConversions(); calculate(); saveDraft(); });
    });
    const reset = $('ekisu-reset');
    if(reset) reset.addEventListener('click', resetInputs);
    restoreDraft();
    restorePendingHistoryItem();
    updateConversions();
    calculate();
    bindHistoryUI();
  });
})();
