(function(){
  'use strict';

  const DRAFT_KEY = 'sakeCalc.htmlSplit.ice.lastInputs.v3';
  const HISTORY_KEY = 'sakeCalc.htmlSplit.ice.history.v1';
  const HISTORY_RESTORE_KEY = 'sakeCalc.htmlSplit.ice.history.restore.v1';
  const modeLabels = { forward:'現在水量から計算', final:'仕上がり水量から計算' };
  const C_WATER = 4.186;
  const C_ICE = 2.1;
  const LATENT_HEAT = 334;
  let draftReady = false;
  let activeMode = 'forward';
  let latestValidSnapshot = null;
  const $ = (id) => document.getElementById(id);

  function readNumber(id){
    const el = $(id);
    if(!el || el.value === '') return NaN;
    return Number(el.value);
  }
  function setText(id, value){
    const el = $(id);
    if(el) el.textContent = value;
  }
  function truncatedFixed(value, decimals){
    const num = Number(value);
    const digits = Math.max(0, Math.min(4, Number(decimals) || 0));
    if(!Number.isFinite(num)) return '';
    const scale = 10 ** digits;
    const out = num >= 0 ? Math.trunc(num * scale) / scale : Math.ceil(num * scale) / scale;
    return out.toFixed(digits);
  }
  function formatJst(date){
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone:'Asia/Tokyo',
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit',
      hour12:false
    }).format(date).replace(/\//g, '-');
  }
  function iceHeatPerKg(iceTemp, targetTemp){
    return C_ICE * (0 - iceTemp) + LATENT_HEAT + C_WATER * targetTemp;
  }
  function iceRatio(currentTemp, targetTemp, iceTemp){
    const denom = iceHeatPerKg(iceTemp, targetTemp);
    if(denom <= 0) return NaN;
    return C_WATER * (currentTemp - targetTemp) / denom;
  }
  function validateTemp(currentTemp, targetTemp, iceTemp){
    if(!Number.isFinite(iceTemp)) return '氷温を選択してください。';
    if(targetTemp < 0) return '目標水温は0℃以上で入力してください。';
    if(targetTemp >= currentTemp) return '氷投入量計算は水を冷やす計算です。目標水温は現在水温より低い値にしてください。';
    if(iceTemp > 0) return '氷温は0℃以下で入力してください。';
    if(iceTemp < -30) return '氷温は-30℃以上で確認してください。';
    const heat = iceHeatPerKg(iceTemp, targetTemp);
    if(heat <= 0) return '計算条件が成立しません。入力値を確認してください。';
    return '';
  }
  function showResult(resultId, errorId, values){
    const result = $(resultId);
    const error = $(errorId);
    if(error){ error.textContent = ''; error.hidden = true; }
    if(result) result.hidden = false;
    Object.keys(values || {}).forEach(id => setText(id, values[id]));
  }
  function showError(resultId, errorId, message){
    const result = $(resultId);
    const error = $(errorId);
    if(result) result.hidden = true;
    if(error){ error.textContent = message; error.hidden = false; }
    latestValidSnapshot = null;
    updateHistoryButton();
  }
  function clearBlock(resultId, errorId){
    const result = $(resultId);
    const error = $(errorId);
    if(result) result.hidden = true;
    if(error){ error.textContent = ''; error.hidden = true; }
    latestValidSnapshot = null;
    updateHistoryButton();
  }
  function setDetailError(boxId, message){
    const el = $(boxId);
    if(!el) return;
    el.classList.add('is-error');
    el.textContent = message;
  }
  function ensureForwardDetailMarkup(){
    const el = $('ice-forward-temp-detail');
    if(!el) return;
    if(!$('ice-forward-selected-kg')){
      el.classList.add('ice-temp-result-box');
      el.innerHTML = '<div class="ice-temp-result-title"><span id="ice-forward-selected-temp-label">0℃</span>の目安</div><div class="ice-temp-result-grid"><div><span class="ice-mini-label">必要氷量</span><strong><span id="ice-forward-selected-kg">—</span>kg</strong></div><div><span class="ice-mini-label">氷投入後</span><strong><span id="ice-forward-selected-volume">—</span>L</strong></div></div><div class="ice-temp-result-note" id="ice-forward-selected-diff">—</div>';
    }
    el.classList.remove('is-error');
  }
  function ensureFinalDetailMarkup(){
    const el = $('ice-final-temp-detail');
    if(!el) return;
    if(!$('ice-final-selected-kg')){
      el.classList.add('ice-temp-result-box');
      el.innerHTML = '<div class="ice-temp-result-title"><span id="ice-final-selected-temp-label">0℃</span>の目安</div><div class="ice-temp-result-grid"><div><span class="ice-mini-label">最初の水量</span><strong><span id="ice-final-selected-water">—</span>L</strong></div><div><span class="ice-mini-label">必要氷量</span><strong><span id="ice-final-selected-kg">—</span>kg</strong></div></div><div class="ice-temp-result-note" id="ice-final-selected-diff">—</div>';
    }
    el.classList.remove('is-error');
  }
  function readTempView(scope){
    const select = $(scope + '-temp-view');
    const raw = select ? select.value : '0';
    return Number(raw);
  }
  function tempLabel(temp){
    return truncatedFixed(temp, temp % 1 === 0 ? 0 : 1) + '℃';
  }
  function diffText(diff){
    if(Math.abs(diff) < 0.005) return '0℃基準と同じです。';
    return '0℃基準との差：' + (diff > 0 ? '+' : '') + truncatedFixed(diff, 2) + 'kg';
  }
  function setActiveMode(mode){
    activeMode = mode === 'final' ? 'final' : 'forward';
    const forwardPanel = $('ice-forward-panel');
    const finalPanel = $('ice-final-panel');
    if(forwardPanel) forwardPanel.hidden = activeMode !== 'forward';
    if(finalPanel) finalPanel.hidden = activeMode !== 'final';
    document.querySelectorAll('.ice-mode-card').forEach((button) => {
      const isActive = button.dataset.mode === activeMode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    latestValidSnapshot = null;
    calculate();
    saveInputDraft();
  }
  function calculateForward(){
    const currentVolume = readNumber('ice-current-volume');
    const currentTemp = readNumber('ice-current-temp');
    const targetTemp = readNumber('ice-target-temp');
    if([currentVolume, currentTemp, targetTemp].some(value => !Number.isFinite(value))){
      clearBlock('ice-result', 'ice-error');
      return;
    }
    if(currentVolume <= 0) return showError('ice-result', 'ice-error', '現在水量は0より大きい値を入力してください。');
    const baseTemp = 0;
    const tempError = validateTemp(currentTemp, targetTemp, baseTemp);
    if(tempError) return showError('ice-result', 'ice-error', tempError);
    const ratio = iceRatio(currentTemp, targetTemp, baseTemp);
    if(!Number.isFinite(ratio) || ratio <= 0) return showError('ice-result', 'ice-error', '計算条件が成立しません。入力値を確認してください。');
    const iceKg = currentVolume * ratio;
    const finalVolume = currentVolume + iceKg;
    latestValidSnapshot = { mode:'forward', modeLabel:modeLabels.forward, inputRows:[{label:'現在の水', values:[{label:'現在水量', value:truncatedFixed(currentVolume, 2) + 'L'}, {label:'現在水温', value:truncatedFixed(currentTemp, 2) + '℃'}]}, {label:'目標', values:[{label:'目標水温', value:truncatedFixed(targetTemp, 2) + '℃'}, {label:'氷温標準', value:'0℃'}]}], resultRows:[{label:'計算結果', values:[{label:'必要氷量', value:truncatedFixed(iceKg, 2) + 'kg'}, {label:'氷投入後概算L', value:truncatedFixed(finalVolume, 2) + 'L'}]}] };
    showResult('ice-result', 'ice-error', {
      'ice-result-kg':truncatedFixed(iceKg, 2),
      'ice-result-volume':truncatedFixed(finalVolume, 2),
      'ice-result-note':'標準条件：水1L≒1kg、氷温0℃、氷の融解熱334kJ/kg、水の比熱4.186kJ/kg℃。氷投入後Lは「現在L＋必要氷kg」の概算です。'
    });
    updateHistoryButton();
    updateForwardTempDetail({currentVolume, currentTemp, targetTemp, baseIceKg:iceKg, baseFinalVolume:finalVolume});
  }
  function updateForwardTempDetail(base){
    ensureForwardDetailMarkup();
    const detailTemp = readTempView('ice-forward');
    const detailId = 'ice-forward-temp-detail';
    const tempError = validateTemp(base.currentTemp, base.targetTemp, detailTemp);
    if(tempError) return setDetailError(detailId, tempError);
    const ratio = iceRatio(base.currentTemp, base.targetTemp, detailTemp);
    if(!Number.isFinite(ratio) || ratio <= 0) return setDetailError(detailId, '計算条件が成立しません。入力値を確認してください。');
    const iceKg = base.currentVolume * ratio;
    const finalVolume = base.currentVolume + iceKg;
    setText('ice-forward-selected-temp-label', tempLabel(detailTemp));
    setText('ice-forward-selected-kg', truncatedFixed(iceKg, 2));
    setText('ice-forward-selected-volume', truncatedFixed(finalVolume, 2));
    setText('ice-forward-selected-diff', diffText(iceKg - base.baseIceKg));
  }
  function calculateFinal(){
    const finalVolume = readNumber('ice-final-volume');
    const currentTemp = readNumber('ice-final-current-temp');
    const targetTemp = readNumber('ice-final-target-temp');
    if([finalVolume, currentTemp, targetTemp].some(value => !Number.isFinite(value))){
      clearBlock('ice-final-result', 'ice-final-error');
      return;
    }
    if(finalVolume <= 0) return showError('ice-final-result', 'ice-final-error', '氷投入後の仕上がり水量は0より大きい値を入力してください。');
    const baseTemp = 0;
    const tempError = validateTemp(currentTemp, targetTemp, baseTemp);
    if(tempError) return showError('ice-final-result', 'ice-final-error', tempError);
    const ratio = iceRatio(currentTemp, targetTemp, baseTemp);
    if(!Number.isFinite(ratio) || ratio <= 0) return showError('ice-final-result', 'ice-final-error', '計算条件が成立しません。入力値を確認してください。');
    const initialWater = finalVolume / (1 + ratio);
    const iceKg = finalVolume - initialWater;
    latestValidSnapshot = { mode:'final', modeLabel:modeLabels.final, inputRows:[{label:'仕上がり条件', values:[{label:'仕上がり水量', value:truncatedFixed(finalVolume, 2) + 'L'}, {label:'現在水温', value:truncatedFixed(currentTemp, 2) + '℃'}, {label:'目標水温', value:truncatedFixed(targetTemp, 2) + '℃'}, {label:'氷温標準', value:'0℃'}]}], resultRows:[{label:'計算結果', values:[{label:'最初の水量', value:truncatedFixed(initialWater, 2) + 'L'}, {label:'必要氷量', value:truncatedFixed(iceKg, 2) + 'kg'}, {label:'氷投入後概算L', value:truncatedFixed(finalVolume, 2) + 'L'}]}] };
    showResult('ice-final-result', 'ice-final-error', {
      'ice-final-water':truncatedFixed(initialWater, 2),
      'ice-final-kg':truncatedFixed(iceKg, 2),
      'ice-final-result-volume':truncatedFixed(finalVolume, 2),
      'ice-final-note':'標準条件：仕上がりLから、必要氷量で増える分を差し引いて最初に入れる水量を出しています。氷温0℃、水1L≒1kgの概算です。'
    });
    updateHistoryButton();
    updateFinalTempDetail({finalVolume, currentTemp, targetTemp, baseInitialWater:initialWater, baseIceKg:iceKg});
  }
  function updateFinalTempDetail(base){
    ensureFinalDetailMarkup();
    const detailTemp = readTempView('ice-final');
    const detailId = 'ice-final-temp-detail';
    const tempError = validateTemp(base.currentTemp, base.targetTemp, detailTemp);
    if(tempError) return setDetailError(detailId, tempError);
    const ratio = iceRatio(base.currentTemp, base.targetTemp, detailTemp);
    if(!Number.isFinite(ratio) || ratio <= 0) return setDetailError(detailId, '計算条件が成立しません。入力値を確認してください。');
    const initialWater = base.finalVolume / (1 + ratio);
    const iceKg = base.finalVolume - initialWater;
    setText('ice-final-selected-temp-label', tempLabel(detailTemp));
    setText('ice-final-selected-water', truncatedFixed(initialWater, 2));
    setText('ice-final-selected-kg', truncatedFixed(iceKg, 2));
    setText('ice-final-selected-diff', diffText(iceKg - base.baseIceKg));
  }
  function calculate(){
    if(activeMode === 'final') calculateFinal();
    else calculateForward();
  }
  function collectDraftInputs(){
    const out = { activeMode, values:{} };
    [
      'ice-current-volume','ice-current-temp','ice-target-temp',
      'ice-final-volume','ice-final-current-temp','ice-final-target-temp',
      'ice-forward-temp-view','ice-final-temp-view'
    ].forEach(id => {
      const el = $(id);
      if(el) out.values[id] = el.value;
    });
    return out;
  }
  function saveInputDraft(){
    if(!draftReady) return;
    try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraftInputs())); }catch(_err){}
  }
  function restoreInputDraft(){
    try{
      const raw = localStorage.getItem(DRAFT_KEY);
      if(!raw) return;
      const parsed = JSON.parse(raw);
      if(parsed && parsed.values){
        Object.keys(parsed.values).forEach(id => { const el = $(id); if(el) el.value = parsed.values[id] || ''; });
      }
      if(parsed && parsed.activeMode) activeMode = parsed.activeMode === 'final' ? 'final' : 'forward';
    }catch(_err){}
  }
  function resetInputs(){
    [
      'ice-current-volume','ice-current-temp','ice-target-temp',
      'ice-final-volume','ice-final-current-temp','ice-final-target-temp'
    ].forEach(id => { const el = $(id); if(el) el.value = ''; });
    const forwardView = $('ice-forward-temp-view');
    const finalView = $('ice-final-temp-view');
    if(forwardView) forwardView.value = '0';
    if(finalView) finalView.value = '0';
    clearBlock('ice-result', 'ice-error');
    clearBlock('ice-final-result', 'ice-final-error');
    ensureForwardDetailMarkup();
    ensureFinalDetailMarkup();
    setText('ice-forward-selected-temp-label', '0℃');
    setText('ice-forward-selected-kg', '—');
    setText('ice-forward-selected-volume', '—');
    setText('ice-forward-selected-diff', '—');
    setText('ice-final-selected-temp-label', '0℃');
    setText('ice-final-selected-water', '—');
    setText('ice-final-selected-kg', '—');
    setText('ice-final-selected-diff', '—');
    latestValidSnapshot = null;
    updateHistoryButton();
    calculate();
    saveInputDraft();
  }
  function bindInputs(){
    document.querySelectorAll('#ice-current-volume,#ice-current-temp,#ice-target-temp,#ice-final-volume,#ice-final-current-temp,#ice-final-target-temp').forEach(input => {
      input.addEventListener('input', () => { calculate(); saveInputDraft(); });
    });
    document.querySelectorAll('#ice-forward-temp-view,#ice-final-temp-view').forEach(select => {
      select.addEventListener('change', () => { calculate(); saveInputDraft(); });
    });
    document.querySelectorAll('.ice-mode-card').forEach(button => {
      button.addEventListener('click', () => setActiveMode(button.dataset.mode));
    });
    const reset = $('ice-reset');
    if(reset) reset.addEventListener('click', resetInputs);
  }


  function escapeHtml(value){ return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function loadHistoryItems(){ try{ const raw = localStorage.getItem(HISTORY_KEY); const parsed = JSON.parse(raw || '[]'); return Array.isArray(parsed) ? parsed : []; }catch(_err){ return []; } }
  function saveHistoryItems(items){ try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 80))); return true; }catch(_err){ return false; } }
  function flattenRows(rows){ return (rows || []).flatMap(row => (row.values || []).map(value => ({label:(row.label ? row.label + ' / ' : '') + value.label, value:value.value}))); }
  function currentHistoryFilter(){ const filter = $('ice-history-filter'); return filter ? filter.value : 'all'; }
  function setupHistoryFilter(){ const filter = $('ice-history-filter'); if(!filter || filter.options.length) return; filter.appendChild(new Option('すべての方式', 'all')); filter.appendChild(new Option(modeLabels.forward, 'forward')); filter.appendChild(new Option(modeLabels.final, 'final')); }
  function updateHistoryButton(){ const button = $('ice-save-history'); if(button) button.disabled = !latestValidSnapshot; }
  function setHistoryStatus(message, isError){ const status = $('ice-history-status'); if(!status) return; status.textContent = message || ''; status.classList.remove('is-success','is-info','is-error'); status.style.color = ''; if(isError) status.classList.add('is-error'); else if(message === '履歴に残しました。') status.classList.add('is-success'); else if(message) status.classList.add('is-info'); }
  function buildHistoryItem(){ if(!latestValidSnapshot) return null; const now = new Date(); const fieldValues = collectDraftInputs().values || {}; return { id:'ice-history-' + now.getTime() + '-' + Math.random().toString(16).slice(2), savedAtISO:now.toISOString(), savedAtJst:formatJst(now), toolName:'氷投入量計算', mode:activeMode, modeLabel:modeLabels[activeMode] || '氷投入量計算', fieldValues, inputRows:latestValidSnapshot.inputRows || [], resultRows:latestValidSnapshot.resultRows || [] }; }
  function saveCurrentHistory(){ const item = buildHistoryItem(); if(!item){ setHistoryStatus('計算結果が出てから履歴に残せます。', true); return; } const items = loadHistoryItems(); const prev = items[0]; if(prev && prev.mode === item.mode && JSON.stringify(prev.fieldValues) === JSON.stringify(item.fieldValues) && JSON.stringify(prev.resultRows) === JSON.stringify(item.resultRows)){ setHistoryStatus('直前と同じ計算結果のため、二重保存はしませんでした。'); return; } items.unshift(item); if(saveHistoryItems(items)){ setHistoryStatus('履歴に残しました。'); renderHistoryList(); } else setHistoryStatus('履歴を保存できませんでした。この端末の保存設定を確認してください。', true); }
  function restoreHistoryItem(id){ const item = loadHistoryItems().find(entry => entry.id === id); if(!item) return; Object.keys(item.fieldValues || {}).forEach(fieldId => { const el = $(fieldId); if(el) el.value = item.fieldValues[fieldId]; }); activeMode = item.mode === 'final' ? 'final' : 'forward'; setActiveMode(activeMode); saveInputDraft(); setHistoryStatus('履歴の入力値を戻しました。履歴保存や2mm表候補作成は自動実行していません。'); window.scrollTo({top:0, behavior:'smooth'}); }

  function restorePendingHistoryItem(){
    let item = null;
    try{
      const raw = sessionStorage.getItem(HISTORY_RESTORE_KEY);
      if(!raw) return;
      sessionStorage.removeItem(HISTORY_RESTORE_KEY);
      item = JSON.parse(raw);
    }catch(_err){ return; }
    if(!item || !item.fieldValues) return;
    Object.keys(item.fieldValues || {}).forEach(fieldId => {
      const el = $(fieldId);
      if(el) el.value = item.fieldValues[fieldId];
    });
    activeMode = item.mode === 'final' ? 'final' : 'forward';
    setActiveMode(activeMode);
    saveInputDraft();
    setHistoryStatus('履歴の入力値を戻しました。履歴保存や2mm表候補作成は自動実行していません。');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function deleteHistoryItem(id){ const next = loadHistoryItems().filter(entry => entry.id !== id); saveHistoryItems(next); setHistoryStatus('履歴を削除しました。'); renderHistoryList(); }
  function renderHistoryList(){ const list = $('ice-history-list'); if(!list) return; const filter = currentHistoryFilter(); const items = loadHistoryItems().filter(item => filter === 'all' || item.mode === filter); if(!items.length){ list.innerHTML = '<div class="dedicated-history-empty">この方式の履歴はまだありません。</div>'; return; } list.innerHTML = items.map(item => { const inputLines = flattenRows(item.inputRows).slice(0,8).map(line => `<div class="dedicated-history-line"><strong>${escapeHtml(line.label)}</strong>：${escapeHtml(line.value)}</div>`).join(''); const resultLines = flattenRows(item.resultRows).slice(0,8).map(line => `<div class="dedicated-history-line"><strong>${escapeHtml(line.label)}</strong>：${escapeHtml(line.value)}</div>`).join(''); return `<article class="dedicated-history-card"><div class="dedicated-history-meta"><span>${escapeHtml(item.savedAtJst || '')}</span><span>${escapeHtml(item.modeLabel || '')}</span></div><div class="dedicated-history-card-title">${escapeHtml(item.toolName || '氷投入量計算')}</div><div class="dedicated-history-lines">${inputLines}${resultLines}</div><div class="dedicated-history-card-actions"><button class="back-btn" data-history-restore="${escapeHtml(item.id)}" type="button">この履歴を入力欄に戻す</button><button class="back-btn danger-btn" data-history-delete="${escapeHtml(item.id)}" type="button">削除</button></div></article>`; }).join(''); }
  function bindHistoryUI(){ setupHistoryFilter(); const saveButton = $('ice-save-history'); if(saveButton) saveButton.addEventListener('click', saveCurrentHistory); const toggleButton = $('ice-toggle-history'); const panel = $('ice-history-panel'); if(toggleButton && panel){ toggleButton.addEventListener('click', () => { panel.hidden = !panel.hidden; toggleButton.textContent = panel.hidden ? '氷投入量履歴を見る' : '氷投入量履歴を閉じる'; if(!panel.hidden) renderHistoryList(); }); } const filter = $('ice-history-filter'); if(filter) filter.addEventListener('change', renderHistoryList); const list = $('ice-history-list'); if(list) list.addEventListener('click', (event) => { const restore = event.target.closest('[data-history-restore]'); if(restore) return restoreHistoryItem(restore.getAttribute('data-history-restore')); const del = event.target.closest('[data-history-delete]'); if(del) return deleteHistoryItem(del.getAttribute('data-history-delete')); }); renderHistoryList(); updateHistoryButton(); }

  document.addEventListener('DOMContentLoaded', () => {
    restoreInputDraft();
    bindInputs();
    bindHistoryUI();
    draftReady = true;
    setActiveMode(activeMode);
    restorePendingHistoryItem();
  });

  window.SakeCalcIce = {
    calculate,
    calculateForward,
    calculateFinal,
    setActiveMode
  };
})();
