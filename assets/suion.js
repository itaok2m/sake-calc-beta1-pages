(function(){
  'use strict';

  const DRAFT_KEY = 'sakeCalc.htmlSplit.suion.lastInputs.v1';
  const HISTORY_KEY = 'sakeCalc.htmlSplit.suion.history.v1';
  const HISTORY_RESTORE_KEY = 'sakeCalc.htmlSplit.suion.history.restore.v1';
  const formulas = [
    { main:'① 混合後水温 ＝（水温① × 水量① ＋ 水温② × 水量②）÷（水量① ＋ 水量②）', sub:'② 混合後水量 ＝ 水量① ＋ 水量②', badge:'混合後の水温' },
    { main:'① 追加水量 ＝ 目標水量 − 手持ち水量', sub:'② 追加水温 ＝（目標水温 × 目標水量 − 手持ち水温 × 手持ち水量）÷ 追加水量', badge:'追加水の条件' },
    { main:'① 水①使用量 ＝ 目標水量 ×（目標水温 − 水②水温）÷（水①水温 − 水②水温）', sub:'② 水②使用量 ＝ 目標水量 − 水①使用量', badge:'配合量の計算' }
  ];

  let activeMode = 0;
  let latestValidSnapshot = null;
  let draftReady = false;
  const $ = (id) => document.getElementById(id);

  function normalizeMode(value){
    const n = Number(value);
    return [0,1,2].includes(n) ? n : 0;
  }
  function readNumber(id){
    const el = $(id);
    if(!el || el.value === '') return NaN;
    return Number(el.value);
  }
  function setText(id, value){
    const el = $(id);
    if(el) el.textContent = value;
  }
  function formatJst(date){
    try{
      return new Intl.DateTimeFormat('ja-JP', { timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(date).replace(/\//g,'-') + ' JST';
    }catch(_err){ return date.toISOString(); }
  }
  function modeLabel(mode){ return (formulas[normalizeMode(mode)] || formulas[0]).badge; }
  function truncatedFixed(value, decimals){
    const num = Number(value);
    const digits = Math.max(0, Math.min(4, Number(decimals) || 0));
    if(!Number.isFinite(num)) return '';
    const scale = 10 ** digits;
    const out = num >= 0 ? Math.trunc(num * scale) / scale : Math.ceil(num * scale) / scale;
    return out.toFixed(digits);
  }
  function showResult(mode, values){
    const result = $('suion-result-' + mode);
    const error = $('suion-error-' + mode);
    if(error){ error.textContent = ''; error.hidden = true; }
    if(result) result.hidden = false;
    Object.keys(values || {}).forEach(id => setText(id, values[id]));
  }
  function showError(mode, message){
    const result = $('suion-result-' + mode);
    const error = $('suion-error-' + mode);
    if(result) result.hidden = true;
    if(error){ error.textContent = message; error.hidden = false; }
    latestValidSnapshot = null;
    updateHistoryButton();
  }
  function clearResult(mode){
    const result = $('suion-result-' + mode);
    const error = $('suion-error-' + mode);
    if(result) result.hidden = true;
    if(error){ error.textContent = ''; error.hidden = true; }
    latestValidSnapshot = null;
    updateHistoryButton();
  }
  function updateFormula(){
    const f = formulas[activeMode] || formulas[0];
    setText('suion-formula-main', f.main);
    setText('suion-formula-sub', f.sub);
    setText('suion-action-mode-badge', f.badge);
  }
  function calculateMode0(){
    const t1 = readNumber('suion-0-temp-1');
    const v1 = readNumber('suion-0-volume-1');
    const t2 = readNumber('suion-0-temp-2');
    const v2 = readNumber('suion-0-volume-2');
    if([t1, v1, t2, v2].some(value => !Number.isFinite(value))) return clearResult(0);
    if(v1 <= 0 || v2 <= 0) return showError(0, '数量は0より大きい値を入力してください。');
    const totalVolume = v1 + v2;
    const mixedTemp = (t1 * v1 + t2 * v2) / totalVolume;
    latestValidSnapshot = { mode:0, modeLabel:modeLabel(0), inputRows:[{label:'水①', values:[{label:'水温', value:truncatedFixed(t1, 2) + '℃'}, {label:'水量', value:truncatedFixed(v1, 2) + 'L'}]}, {label:'水②', values:[{label:'水温', value:truncatedFixed(t2, 2) + '℃'}, {label:'水量', value:truncatedFixed(v2, 2) + 'L'}]}], resultRows:[{label:'計算結果', values:[{label:'混合後水温', value:truncatedFixed(mixedTemp, 2) + '℃'}, {label:'混合後水量', value:truncatedFixed(totalVolume, 2) + 'L'}]}] };
    showResult(0, {
      'suion-0-result-temp':truncatedFixed(mixedTemp, 2),
      'suion-0-result-volume':truncatedFixed(totalVolume, 2)
    });
    updateHistoryButton();
  }
  function calculateMode1(){
    const t1 = readNumber('suion-1-current-temp');
    const v1 = readNumber('suion-1-current-volume');
    const targetTemp = readNumber('suion-1-target-temp');
    const targetVolume = readNumber('suion-1-target-volume');
    if([t1, v1, targetTemp, targetVolume].some(value => !Number.isFinite(value))) return clearResult(1);
    if(v1 <= 0) return showError(1, '手持ちの水量は0より大きい値を入力してください。');
    if(targetVolume <= v1) return showError(1, '目標水量は手持ちの水量より大きい値にしてください。');
    const addVolume = targetVolume - v1;
    const addTemp = (targetTemp * targetVolume - t1 * v1) / addVolume;
    if(addTemp < -10 || addTemp > 100){
      return showError(1, '追加水温が現実的な範囲を外れています（' + addTemp.toFixed(1) + '℃）。入力値を確認してください。');
    }
    latestValidSnapshot = { mode:1, modeLabel:modeLabel(1), inputRows:[{label:'手持ち水', values:[{label:'水温', value:truncatedFixed(t1, 2) + '℃'}, {label:'水量', value:truncatedFixed(v1, 2) + 'L'}]}, {label:'目標', values:[{label:'目標水温', value:truncatedFixed(targetTemp, 2) + '℃'}, {label:'目標水量', value:truncatedFixed(targetVolume, 2) + 'L'}]}], resultRows:[{label:'計算結果', values:[{label:'追加水温', value:truncatedFixed(addTemp, 2) + '℃'}, {label:'追加水量', value:truncatedFixed(addVolume, 2) + 'L'}]}] };
    showResult(1, {
      'suion-1-result-temp':truncatedFixed(addTemp, 2),
      'suion-1-result-volume':truncatedFixed(addVolume, 2)
    });
    updateHistoryButton();
  }
  function calculateMode2(){
    const t1 = readNumber('suion-2-temp-1');
    const t2 = readNumber('suion-2-temp-2');
    const targetTemp = readNumber('suion-2-target-temp');
    const targetVolume = readNumber('suion-2-target-volume');
    if([t1, t2, targetTemp, targetVolume].some(value => !Number.isFinite(value))) return clearResult(2);
    if(targetVolume <= 0) return showError(2, '目標水量は0より大きい値を入力してください。');
    if(t1 === t2) return showError(2, '水①と水②の水温が同じです。異なる水温を入力してください。');
    if(targetTemp < Math.min(t1, t2) || targetTemp > Math.max(t1, t2)) return showError(2, '目標水温は水①と水②の温度の間の値にしてください。');
    const volume1 = targetVolume * (targetTemp - t2) / (t1 - t2);
    const volume2 = targetVolume - volume1;
    latestValidSnapshot = { mode:2, modeLabel:modeLabel(2), inputRows:[{label:'水温条件', values:[{label:'水①水温', value:truncatedFixed(t1, 2) + '℃'}, {label:'水②水温', value:truncatedFixed(t2, 2) + '℃'}]}, {label:'目標', values:[{label:'目標水温', value:truncatedFixed(targetTemp, 2) + '℃'}, {label:'目標水量', value:truncatedFixed(targetVolume, 2) + 'L'}]}], resultRows:[{label:'計算結果', values:[{label:'水①使用量', value:truncatedFixed(volume1, 2) + 'L'}, {label:'水②使用量', value:truncatedFixed(volume2, 2) + 'L'}]}] };
    showResult(2, {
      'suion-2-result-volume-1':truncatedFixed(volume1, 2),
      'suion-2-result-volume-2':truncatedFixed(volume2, 2)
    });
    updateHistoryButton();
  }
  function calculateActiveMode(){
    if(activeMode === 0) return calculateMode0();
    if(activeMode === 1) return calculateMode1();
    return calculateMode2();
  }
  function collectDraftInputs(){
    const out = { mode:activeMode, values:{} };
    document.querySelectorAll('input[id^="suion-"]').forEach(input => { out.values[input.id] = input.value; });
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
        setMode(normalizeMode(parsed.mode), {skipSave:true});
      }
    }catch(_err){}
  }
  function setMode(mode, options){
    activeMode = normalizeMode(mode);
    document.querySelectorAll('[data-suion-mode]').forEach(button => {
      button.classList.toggle('active', normalizeMode(button.getAttribute('data-suion-mode')) === activeMode);
    });
    document.querySelectorAll('[data-suion-panel]').forEach(panel => {
      panel.hidden = normalizeMode(panel.getAttribute('data-suion-panel')) !== activeMode;
    });
    updateFormula();
    calculateActiveMode();
    if(!options || !options.skipSave) saveInputDraft();
  }
  function resetModeInputs(mode){
    const targetMode = normalizeMode(mode);
    document.querySelectorAll('#suion-panel-' + targetMode + ' input').forEach(input => { input.value = ''; });
    clearResult(targetMode);
    saveInputDraft();
  }


  function escapeHtml(value){ return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function loadHistoryItems(){ try{ const raw = localStorage.getItem(HISTORY_KEY); const parsed = JSON.parse(raw || '[]'); return Array.isArray(parsed) ? parsed : []; }catch(_err){ return []; } }
  function saveHistoryItems(items){ try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 80))); return true; }catch(_err){ return false; } }
  function flattenRows(rows){ return (rows || []).flatMap(row => (row.values || []).map(value => ({label:(row.label ? row.label + ' / ' : '') + value.label, value:value.value}))); }
  function currentHistoryFilter(){ const filter = $('suion-history-filter'); return filter ? filter.value : 'all'; }
  function setupHistoryFilter(){ const filter = $('suion-history-filter'); if(!filter || filter.options.length) return; filter.appendChild(new Option('すべての方式', 'all')); formulas.forEach((formula, index) => filter.appendChild(new Option(formula.badge, String(index)))); }
  function updateHistoryButton(){ const button = $('suion-save-history'); if(button) button.disabled = !latestValidSnapshot; }
  function setHistoryStatus(message, isError){ const status = $('suion-history-status'); if(!status) return; status.textContent = message || ''; status.classList.remove('is-success','is-info','is-error'); status.style.color = ''; if(isError) status.classList.add('is-error'); else if(message === '履歴に残しました。') status.classList.add('is-success'); else if(message) status.classList.add('is-info'); }
  function buildHistoryItem(){ if(!latestValidSnapshot) return null; const now = new Date(); const fieldValues = collectDraftInputs().values || {}; return { id:'suion-history-' + now.getTime() + '-' + Math.random().toString(16).slice(2), savedAtISO:now.toISOString(), savedAtJst:formatJst(now), toolName:'水温温度計算', mode:activeMode, modeLabel:modeLabel(activeMode), fieldValues, inputRows:latestValidSnapshot.inputRows || [], resultRows:latestValidSnapshot.resultRows || [] }; }
  function saveCurrentHistory(){ const item = buildHistoryItem(); if(!item){ setHistoryStatus('計算結果が出てから履歴に残せます。', true); return; } const items = loadHistoryItems(); const prev = items[0]; if(prev && prev.mode === item.mode && JSON.stringify(prev.fieldValues) === JSON.stringify(item.fieldValues) && JSON.stringify(prev.resultRows) === JSON.stringify(item.resultRows)){ setHistoryStatus('直前と同じ計算結果のため、二重保存はしませんでした。'); return; } items.unshift(item); if(saveHistoryItems(items)){ setHistoryStatus('履歴に残しました。'); renderHistoryList(); } else setHistoryStatus('履歴を保存できませんでした。この端末の保存設定を確認してください。', true); }
  function restoreHistoryItem(id){ const item = loadHistoryItems().find(entry => entry.id === id); if(!item) return; setMode(normalizeMode(item.mode), {skipSave:true}); Object.keys(item.fieldValues || {}).forEach(fieldId => { const el = $(fieldId); if(el) el.value = item.fieldValues[fieldId]; }); calculateActiveMode(); saveInputDraft(); setHistoryStatus('履歴の入力値を戻しました。履歴保存や2mm表候補作成は自動実行していません。'); window.scrollTo({top:0, behavior:'smooth'}); }

  function restorePendingHistoryItem(){
    let item = null;
    try{
      const raw = sessionStorage.getItem(HISTORY_RESTORE_KEY);
      if(!raw) return;
      sessionStorage.removeItem(HISTORY_RESTORE_KEY);
      item = JSON.parse(raw);
    }catch(_err){ return; }
    if(!item || !item.fieldValues) return;
    setMode(normalizeMode(item.mode), {skipSave:true});
    Object.keys(item.fieldValues || {}).forEach(fieldId => {
      const el = $(fieldId);
      if(el) el.value = item.fieldValues[fieldId];
    });
    calculateActiveMode();
    saveInputDraft();
    setHistoryStatus('履歴の入力値を戻しました。履歴保存や2mm表候補作成は自動実行していません。');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function deleteHistoryItem(id){ const next = loadHistoryItems().filter(entry => entry.id !== id); saveHistoryItems(next); setHistoryStatus('履歴を削除しました。'); renderHistoryList(); }
  function renderHistoryList(){ const list = $('suion-history-list'); if(!list) return; const filter = currentHistoryFilter(); const items = loadHistoryItems().filter(item => filter === 'all' || String(item.mode) === filter); if(!items.length){ list.innerHTML = '<div class="dedicated-history-empty">この方式の履歴はまだありません。</div>'; return; } list.innerHTML = items.map(item => { const inputLines = flattenRows(item.inputRows).slice(0,8).map(line => `<div class="dedicated-history-line"><strong>${escapeHtml(line.label)}</strong>：${escapeHtml(line.value)}</div>`).join(''); const resultLines = flattenRows(item.resultRows).slice(0,8).map(line => `<div class="dedicated-history-line"><strong>${escapeHtml(line.label)}</strong>：${escapeHtml(line.value)}</div>`).join(''); return `<article class="dedicated-history-card"><div class="dedicated-history-meta"><span>${escapeHtml(item.savedAtJst || '')}</span><span>${escapeHtml(item.modeLabel || '')}</span></div><div class="dedicated-history-card-title">${escapeHtml(item.toolName || '水温温度計算')}</div><div class="dedicated-history-lines">${inputLines}${resultLines}</div><div class="dedicated-history-card-actions"><button class="back-btn" data-history-restore="${escapeHtml(item.id)}" type="button">この履歴を入力欄に戻す</button><button class="back-btn danger-btn" data-history-delete="${escapeHtml(item.id)}" type="button">削除</button></div></article>`; }).join(''); }
  function bindHistoryUI(){ setupHistoryFilter(); const saveButton = $('suion-save-history'); if(saveButton) saveButton.addEventListener('click', saveCurrentHistory); const toggleButton = $('suion-toggle-history'); const panel = $('suion-history-panel'); if(toggleButton && panel){ toggleButton.addEventListener('click', () => { panel.hidden = !panel.hidden; toggleButton.textContent = panel.hidden ? '水温温度履歴を見る' : '水温温度履歴を閉じる'; if(!panel.hidden) renderHistoryList(); }); } const filter = $('suion-history-filter'); if(filter) filter.addEventListener('change', renderHistoryList); const list = $('suion-history-list'); if(list) list.addEventListener('click', (event) => { const restore = event.target.closest('[data-history-restore]'); if(restore) return restoreHistoryItem(restore.getAttribute('data-history-restore')); const del = event.target.closest('[data-history-delete]'); if(del) return deleteHistoryItem(del.getAttribute('data-history-delete')); }); renderHistoryList(); updateHistoryButton(); }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-suion-mode]').forEach(button => {
      button.addEventListener('click', () => setMode(button.getAttribute('data-suion-mode')));
    });
    document.querySelectorAll('[data-suion-reset]').forEach(button => {
      button.addEventListener('click', () => resetModeInputs(button.getAttribute('data-suion-reset')));
    });
    document.querySelectorAll('input[id^="suion-"]').forEach(input => {
      input.addEventListener('input', () => { calculateActiveMode(); saveInputDraft(); });
    });
    setMode(0, {skipSave:true});
    draftReady = true;
    restoreInputDraft();
    restorePendingHistoryItem();
    calculateActiveMode();
    bindHistoryUI();
  });

  window.SakeCalcSuion = {
    setMode,
    calculateActiveMode
  };
})();
