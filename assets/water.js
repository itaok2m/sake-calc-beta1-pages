(function(){
  'use strict';

  const TM2_CANDIDATE_KEY = 'sakeCalc.htmlSplit.tm2Candidate.v2.session';
  const HISTORY_KEY = 'sakeCalc.htmlSplit.water.history.v1';
  const HISTORY_RESTORE_KEY = 'sakeCalc.htmlSplit.water.history.restore.v1';
  const DRAFT_KEY = 'sakeCalc.htmlSplit.water.inputDraft.v1';

  const formulas = [
    { main:'① 目標数量   ＝ 現在数量 × 現在成分 ÷ 目標成分', sub:'② 割水量     ＝ 目標数量 − 現在数量' },
    { main:'① 割水前数量 ＝ 目標数量 × 目標成分 ÷ 現在成分', sub:'② 割水量     ＝ 目標数量 − 割水前数量' },
    { main:'① 割水前成分 ＝ 目標成分 × 目標数量 ÷ 現在数量', sub:'② 割水量     ＝ 目標数量 − 現在数量' },
    { main:'① 割水後成分 ＝ 現在成分 × 現在数量 ÷ 目標数量', sub:'② 割水量     ＝ 目標数量 − 現在数量' }
  ];

  const modeLabels = [
    '割水量・目標数量',
    '割水前の必要数量',
    '割水前の成分値',
    '割水後の成分値・割水量'
  ];

  let activeMode = 0;
  let latestValidSnapshot = null;
  let draftReady = false;

  const $ = (id) => document.getElementById(id);

  function readNumber(id){
    const el = $(id);
    if(!el || el.value === '') return NaN;
    return Number(el.value);
  }

  function truncatedFixed(value, decimals){
    const num = Number(value);
    const digits = Math.max(0, Math.min(4, Number(decimals) || 0));
    if(!Number.isFinite(num)) return '';
    const scale = 10 ** digits;
    return (Math.trunc(num * scale) / scale).toFixed(digits);
  }

  function formatJst(date){
    try{
      return new Intl.DateTimeFormat('ja-JP', {
        timeZone:'Asia/Tokyo',
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit',
        hour12:false
      }).format(date).replace(/\//g,'-') + ' JST';
    }catch(_err){
      return date.toISOString();
    }
  }

  function setText(id, value){
    const el = $(id);
    if(el) el.textContent = value;
  }

  function showResult(mode, values){
    const result = $('water-result-' + mode);
    const error = $('water-error-' + mode);
    if(error){
      error.textContent = '';
      error.hidden = true;
    }
    if(result) result.hidden = false;
    Object.keys(values || {}).forEach(id => setText(id, values[id]));
  }

  function showError(mode, message){
    const result = $('water-result-' + mode);
    const error = $('water-error-' + mode);
    if(result) result.hidden = true;
    if(error){
      error.textContent = message;
      error.hidden = false;
    }
    latestValidSnapshot = null;
    updateCandidateButton();
  }

  function clearResult(mode){
    const result = $('water-result-' + mode);
    const error = $('water-error-' + mode);
    if(result) result.hidden = true;
    if(error){
      error.textContent = '';
      error.hidden = true;
    }
    latestValidSnapshot = null;
    updateCandidateButton();
  }

  function setCandidateStatus(message, isError){
    const status = $('water-tm2-candidate-status');
    if(!status) return;
    status.textContent = message || '';
    status.style.color = isError ? '#9f2d2d' : '';
    status.dataset.autoHint = message ? '0' : '';
  }

  function updateCandidateButton(){
    const hasResult = !!latestValidSnapshot;
    const button = $('water-open-tm2-candidate');
    if(button) button.disabled = !hasResult;
    const status = $('water-tm2-candidate-status');
    if(!status) return;
    if(!hasResult){
      status.textContent = '入力がそろうと2mm表候補を確認できます。';
      status.style.color = '';
      status.dataset.autoHint = '1';
      updateHistoryButton();
      return;
    }
    if(status.dataset.autoHint === '1'){
      status.textContent = '';
      status.dataset.autoHint = '';
    }
    updateHistoryButton();
  }

  function snapshotForMode0(cc, cv, tc, tv, wv){
    return {
      mode:0,
      modeLabel:modeLabels[0],
      inputs:{ currentComponent:cc, currentVolume:cv, targetComponent:tc },
      results:{ waterVolume:wv, targetVolume:tv, targetComponent:tc, sourceVolume:cv, sourceComponent:cc },
      inputRows:[
        { label:'割水前（現在）', values:[{label:'成分', value:truncatedFixed(cc, 2)}, {label:'数量', value:truncatedFixed(cv, 2) + 'L'}] },
        { label:'割水後（目標）', values:[{label:'目標成分', value:truncatedFixed(tc, 2)}] }
      ],
      resultRows:[
        { label:'計算結果', values:[{label:'割水量', value:truncatedFixed(wv, 2) + 'L'}, {label:'割水後の合計数量', value:truncatedFixed(tv, 2) + 'L'}] }
      ]
    };
  }

  function snapshotForMode1(cc, tc, tv, cv, wv){
    return {
      mode:1,
      modeLabel:modeLabels[1],
      inputs:{ currentComponent:cc, targetComponent:tc, targetVolume:tv },
      results:{ sourceVolume:cv, waterVolume:wv, targetVolume:tv, sourceComponent:cc, targetComponent:tc },
      inputRows:[
        { label:'割水前（現在）', values:[{label:'成分', value:truncatedFixed(cc, 2)}] },
        { label:'割水後（目標）', values:[{label:'目標成分', value:truncatedFixed(tc, 2)}, {label:'目標数量', value:truncatedFixed(tv, 2) + 'L'}] }
      ],
      resultRows:[
        { label:'計算結果', values:[{label:'割水前の必要数量', value:truncatedFixed(cv, 2) + 'L'}, {label:'割水量', value:truncatedFixed(wv, 2) + 'L'}] }
      ]
    };
  }

  function snapshotForMode2(cv, tc, tv, cc, wv){
    return {
      mode:2,
      modeLabel:modeLabels[2],
      inputs:{ currentVolume:cv, targetComponent:tc, targetVolume:tv },
      results:{ sourceComponent:cc, waterVolume:wv, targetVolume:tv, sourceVolume:cv, targetComponent:tc },
      inputRows:[
        { label:'割水前（現在）', values:[{label:'数量', value:truncatedFixed(cv, 2) + 'L'}] },
        { label:'割水後（目標）', values:[{label:'目標成分', value:truncatedFixed(tc, 2)}, {label:'目標数量', value:truncatedFixed(tv, 2) + 'L'}] }
      ],
      resultRows:[
        { label:'計算結果', values:[{label:'必要な割水前の成分値', value:truncatedFixed(cc, 2)}, {label:'割水量', value:truncatedFixed(wv, 2) + 'L'}] }
      ]
    };
  }

  function snapshotForMode3(cc, cv, tv, tc, wv){
    return {
      mode:3,
      modeLabel:modeLabels[3],
      inputs:{ currentComponent:cc, currentVolume:cv, targetVolume:tv },
      results:{ targetComponent:tc, waterVolume:wv, targetVolume:tv, sourceVolume:cv, sourceComponent:cc },
      inputRows:[
        { label:'割水前（現在）', values:[{label:'成分', value:truncatedFixed(cc, 2)}, {label:'数量', value:truncatedFixed(cv, 2) + 'L'}] },
        { label:'割水後（目標）', values:[{label:'目標数量', value:truncatedFixed(tv, 2) + 'L'}] }
      ],
      resultRows:[
        { label:'計算結果', values:[{label:'割水後の成分値', value:truncatedFixed(tc, 2)}, {label:'割水量', value:truncatedFixed(wv, 2) + 'L'}] }
      ]
    };
  }

  function calcMode0(){
    const cc = readNumber('water-0-current-component');
    const cv = readNumber('water-0-current-volume');
    const tc = readNumber('water-0-target-component');
    if([cc, cv, tc].some(value => !Number.isFinite(value))) return clearResult(0);
    if(cv <= 0) return showError(0, '数量は0より大きい値を入力してください。');
    if(tc === 0) return showError(0, '目標成分に 0 は入力できません（0 除算になります）。');
    const tv = cc * cv / tc;
    const wv = tv - cv;
    if(tc === cc){
      latestValidSnapshot = snapshotForMode0(cc, cv, tc, cv, 0);
      showResult(0, {'water-0-water-volume':'0.00', 'water-0-total-volume':truncatedFixed(cv, 2)});
      return updateCandidateButton();
    }
    if(wv < 0) return showError(0, '割水量がマイナスになりました。目標成分が現在成分より大きい場合、水を加えて薄めることはできません。');
    latestValidSnapshot = snapshotForMode0(cc, cv, tc, tv, wv);
    showResult(0, {'water-0-water-volume':truncatedFixed(wv, 2), 'water-0-total-volume':truncatedFixed(tv, 2)});
    updateCandidateButton();
  }

  function calcMode1(){
    const cc = readNumber('water-1-current-component');
    const tc = readNumber('water-1-target-component');
    const tv = readNumber('water-1-target-volume');
    if([cc, tc, tv].some(value => !Number.isFinite(value))) return clearResult(1);
    if(tv <= 0 || cc === 0) return showError(1, '数量・成分に正しい数値を入力してください。');
    const cv = tc * tv / cc;
    const wv = tv - cv;
    if(tc === cc){
      latestValidSnapshot = snapshotForMode1(cc, tc, tv, tv, 0);
      showResult(1, {'water-1-current-volume':truncatedFixed(tv, 2), 'water-1-water-volume':'0.00'});
      return updateCandidateButton();
    }
    if(wv < 0) return showError(1, '割水量がマイナスになりました。入力値を確認してください。');
    latestValidSnapshot = snapshotForMode1(cc, tc, tv, cv, wv);
    showResult(1, {'water-1-current-volume':truncatedFixed(cv, 2), 'water-1-water-volume':truncatedFixed(wv, 2)});
    updateCandidateButton();
  }

  function calcMode2(){
    const cv = readNumber('water-2-current-volume');
    const tc = readNumber('water-2-target-component');
    const tv = readNumber('water-2-target-volume');
    if([cv, tc, tv].some(value => !Number.isFinite(value))) return clearResult(2);
    if(tv <= 0 || cv <= 0) return showError(2, '数量は0より大きい値を入力してください。');
    if(cv > tv) return showError(2, '現在数量は目標数量以下にしてください。');
    const cc = tc * tv / cv;
    const wv = tv - cv;
    latestValidSnapshot = snapshotForMode2(cv, tc, tv, cc, wv);
    showResult(2, {'water-2-current-component':truncatedFixed(cc, 2), 'water-2-water-volume':truncatedFixed(wv, 2)});
    updateCandidateButton();
  }

  function calcMode3(){
    const cc = readNumber('water-3-current-component');
    const cv = readNumber('water-3-current-volume');
    const tv = readNumber('water-3-target-volume');
    if([cc, cv, tv].some(value => !Number.isFinite(value))) return clearResult(3);
    if(cv <= 0) return showError(3, '数量は0より大きい値を入力してください。');
    if(tv < cv) return showError(3, '目標数量は現在数量以上の値にしてください。');
    const tc = cc * cv / tv;
    const wv = tv - cv;
    latestValidSnapshot = snapshotForMode3(cc, cv, tv, tc, wv);
    showResult(3, {'water-3-target-component':truncatedFixed(tc, 2), 'water-3-water-volume':truncatedFixed(wv, 2)});
    updateCandidateButton();
  }

  function calculateActiveMode(){
    if(activeMode === 0) return calcMode0();
    if(activeMode === 1) return calcMode1();
    if(activeMode === 2) return calcMode2();
    return calcMode3();
  }

  function collectDraftInputs(){
    const out = {mode:activeMode, values:{}};
    document.querySelectorAll('input[id^="water-"]').forEach(input => {
      out.values[input.id] = input.value;
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
      if(parsed && parsed.values && typeof parsed.values === 'object'){
        Object.keys(parsed.values).forEach(id => {
          const input = $(id);
          if(input) input.value = parsed.values[id];
        });
      }
      if(Number.isInteger(Number(parsed && parsed.mode))){
        setMode(Number(parsed.mode), {skipSave:true});
      }
    }catch(_err){}
  }

  function resetModeInputs(mode){
    document.querySelectorAll('#water-panel-' + mode + ' input').forEach(input => { input.value = ''; });
    clearResult(mode);
    saveInputDraft();
  }

  function normalizeMode(mode){
    const n = Number(mode);
    return [0,1,2,3].includes(n) ? n : 0;
  }

  function setMode(mode, options){
    activeMode = normalizeMode(mode);
    document.querySelectorAll('[data-water-mode]').forEach(button => {
      button.classList.toggle('active', Number(button.getAttribute('data-water-mode')) === activeMode);
    });
    document.querySelectorAll('[data-water-panel]').forEach(panel => {
      panel.hidden = Number(panel.getAttribute('data-water-panel')) !== activeMode;
    });
    const f = formulas[activeMode] || formulas[0];
    setText('water-formula-main', f.main);
    setText('water-formula-sub', f.sub);
    setText('water-action-mode-badge', modeLabels[activeMode] || modeLabels[0]);
    latestValidSnapshot = null;
    calculateActiveMode();
    if(!options || !options.skipSave) saveInputDraft();
  }

  function createCandidate(role, roleLabel, label, liters, component, details, priority){
    const num = Number(liters);
    if(!Number.isFinite(num) || num < 0) return null;
    const comp = Number(component);
    return {
      role,
      roleLabel,
      label,
      stageLabel:label,
      liters:num,
      component:Number.isFinite(comp) ? comp : null,
      displayValue:truncatedFixed(num, 2) + 'L',
      componentText:Number.isFinite(comp) ? truncatedFixed(comp, 2) : '',
      mode:activeMode,
      modeLabel:modeLabels[activeMode] || '割水計算',
      priority:Number(priority) || 50,
      details:(details || []).filter(item => item && item.value !== '')
    };
  }

  function buildCandidateList(snapshot){
    if(!snapshot) return [];
    const r = snapshot.results || {};
    const i = snapshot.inputs || {};
    const items = [];
    const waterDetail = Number.isFinite(Number(r.waterVolume)) ? { label:'割水量', value:truncatedFixed(r.waterVolume, 2) + 'L' } : null;
    if(activeMode === 0){
      items.push(createCandidate('primary', '割水後', '割水後（仕上がり量）', r.targetVolume, r.targetComponent, [
        { label:'仕上がり成分', value:truncatedFixed(r.targetComponent, 2) },
        waterDetail,
        { label:'割水前数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 30));
      items.push(createCandidate('source', '割水前', '割水前（現在量）', i.currentVolume, i.currentComponent, [
        { label:'成分', value:truncatedFixed(i.currentComponent, 2) },
        { label:'数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 10));
    }else if(activeMode === 1){
      items.push(createCandidate('primary', '割水後', '割水後（目標数量）', i.targetVolume, i.targetComponent, [
        { label:'目標成分', value:truncatedFixed(i.targetComponent, 2) },
        waterDetail,
        { label:'割水前必要量', value:truncatedFixed(r.sourceVolume, 2) + 'L' }
      ], 30));
      items.push(createCandidate('source', '割水前', '割水前（必要量）', r.sourceVolume, i.currentComponent, [
        { label:'成分', value:truncatedFixed(i.currentComponent, 2) },
        { label:'必要量', value:truncatedFixed(r.sourceVolume, 2) + 'L' }
      ], 10));
    }else if(activeMode === 2){
      items.push(createCandidate('primary', '割水後', '割水後（目標数量）', i.targetVolume, i.targetComponent, [
        { label:'目標成分', value:truncatedFixed(i.targetComponent, 2) },
        waterDetail,
        { label:'割水前数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 30));
      items.push(createCandidate('source', '割水前', '割水前（現在量）', i.currentVolume, r.sourceComponent, [
        { label:'必要成分', value:truncatedFixed(r.sourceComponent, 2) },
        { label:'数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 10));
    }else{
      items.push(createCandidate('primary', '割水後', '割水後（目標数量）', i.targetVolume, r.targetComponent, [
        { label:'仕上がり成分', value:truncatedFixed(r.targetComponent, 2) },
        waterDetail,
        { label:'割水前数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 30));
      items.push(createCandidate('source', '割水前', '割水前（現在量）', i.currentVolume, i.currentComponent, [
        { label:'成分', value:truncatedFixed(i.currentComponent, 2) },
        { label:'数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 10));
    }
    const seen = new Set();
    return items.filter(Boolean).sort((a,b) => a.priority - b.priority).filter(item => {
      const key = item.role + '|' + item.label + '|' + item.liters;
      if(seen.has(key)) return false;
      seen.add(key);
      delete item.priority;
      return true;
    }).slice(0, 8);
  }

  function buildTm2CandidateDraft(){
    if(!latestValidSnapshot) return null;
    const candidates = buildCandidateList(latestValidSnapshot);
    if(!candidates.length) return null;
    const now = new Date();
    return {
      type:'tank2mm-v2-draft',
      version:'html-split-water-v1',
      status:'preview-only-no-save-no-history',
      builtAtISO:now.toISOString(),
      builtAtJst:formatJst(now),
      source:{
        scope:'water-current-calculation',
        toolKey:'water:wari:' + activeMode,
        toolLabel:'割水計算：' + (modeLabels[activeMode] || modeLabels[0]),
        calcType:'water-' + activeMode,
        calcTypeLabel:modeLabels[activeMode] || '割水計算',
        returnLabel:'← 元の計算画面へ戻る',
        returnHref:'./water.html',
        returnToolLabel:'割水計算'
      },
      allowedPayload:{
        literCandidates:candidates,
        inputRows:latestValidSnapshot.inputRows || [],
        resultRows:latestValidSnapshot.resultRows || [],
        note:'割水計算から、割水前・割水後の確認に使う候補Lだけを渡します。割水量そのものは候補Lにしません。'
      },
      guard:{
        save:false,
        history:false,
        share:false,
        restore:false,
        legacyTank2mmSend:false,
        memoWrite:false,
        tankCurrentUpdate:false
      }
    };
  }

  function openTm2CandidatePreview(){
    const draft = buildTm2CandidateDraft();
    if(!draft){
      setCandidateStatus('計算結果が出てから候補確認へ進めます。', true);
      return;
    }
    try{
      sessionStorage.setItem(TM2_CANDIDATE_KEY, JSON.stringify(draft));
      setCandidateStatus('2mm表候補確認へ一時候補を渡しました。');
      location.href = './tm2-candidate.html';
    }catch(_err){
      setCandidateStatus('候補確認へ渡せませんでした。この端末の一時保存設定を確認してください。', true);
    }
  }


  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function loadHistoryItems(){
    try{ const raw = localStorage.getItem(HISTORY_KEY); const parsed = JSON.parse(raw || '[]'); return Array.isArray(parsed) ? parsed : []; }catch(_err){ return []; }
  }
  function saveHistoryItems(items){
    try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 80))); return true; }catch(_err){ return false; }
  }
  function flattenRows(rows){
    return (rows || []).flatMap(row => (row.values || []).map(value => ({ label:(row.label ? row.label + ' / ' : '') + value.label, value:value.value })));
  }
  function currentHistoryFilter(){
    const filter = $('water-history-filter');
    return filter ? filter.value : 'all';
  }
  function setupHistoryFilter(){
    const filter = $('water-history-filter');
    if(!filter || filter.options.length) return;
    filter.appendChild(new Option('すべての方式', 'all'));
    modeLabels.forEach((label, index) => filter.appendChild(new Option(label, String(index))));
  }
  function updateHistoryButton(){
    const button = $('water-save-history');
    if(button) button.disabled = !latestValidSnapshot;
  }
  function setHistoryStatus(message, isError){
    const status = $('water-history-status');
    if(!status) return;
    status.textContent = message || '';
    status.classList.remove('is-success','is-info','is-error');
    status.style.color = '';
    if(isError) status.classList.add('is-error');
    else if(message === '履歴に残しました。') status.classList.add('is-success');
    else if(message) status.classList.add('is-info');
  }
  function buildHistoryItem(){
    if(!latestValidSnapshot) return null;
    const now = new Date();
    const fieldValues = collectDraftInputs().values || {};
    return {
      id:'water-' + now.getTime() + '-' + Math.random().toString(36).slice(2,8),
      savedAtISO:now.toISOString(),
      savedAtJst:formatJst(now),
      toolName:'割水計算',
      mode:activeMode,
      modeLabel:modeLabels[activeMode] || '割水計算',
      fieldValues,
      inputRows:latestValidSnapshot.inputRows || [],
      resultRows:latestValidSnapshot.resultRows || []
    };
  }
  function saveCurrentHistory(){
    const item = buildHistoryItem();
    if(!item){ setHistoryStatus('計算結果が出てから履歴に残せます。', true); return; }
    const items = loadHistoryItems();
    const prev = items[0];
    if(prev && prev.mode === item.mode && JSON.stringify(prev.fieldValues) === JSON.stringify(item.fieldValues) && JSON.stringify(prev.resultRows) === JSON.stringify(item.resultRows)){
      setHistoryStatus('直前と同じ計算結果のため、二重保存はしませんでした。');
      return;
    }
    items.unshift(item);
    if(saveHistoryItems(items)){ setHistoryStatus('履歴に残しました。'); renderHistoryList(); }
    else setHistoryStatus('履歴を保存できませんでした。この端末の保存設定を確認してください。', true);
  }
  function restoreHistoryItem(id){
    const item = loadHistoryItems().find(entry => entry.id === id);
    if(!item) return;
    setMode(item.mode, {skipSave:true});
    Object.keys(item.fieldValues || {}).forEach(fieldId => { const el = $(fieldId); if(el) el.value = item.fieldValues[fieldId]; });
    calculateActiveMode();
    saveInputDraft();
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

  function deleteHistoryItem(id){
    const next = loadHistoryItems().filter(entry => entry.id !== id);
    saveHistoryItems(next);
    renderHistoryList();
  }
  function renderHistoryList(){
    setupHistoryFilter();
    const list = $('water-history-list');
    if(!list) return;
    const filter = currentHistoryFilter();
    const items = loadHistoryItems().filter(item => filter === 'all' || String(item.mode) === filter);
    if(!items.length){
      list.innerHTML = '<div class="dedicated-history-empty">この方式の履歴はまだありません。</div>';
      return;
    }
    list.innerHTML = items.map(item => {
      const inputLines = flattenRows(item.inputRows).slice(0, 8).map(line => `<div class="dedicated-history-line"><strong>${escapeHtml(line.label)}</strong>：${escapeHtml(line.value)}</div>`).join('');
      const resultLines = flattenRows(item.resultRows).slice(0, 8).map(line => `<div class="dedicated-history-line"><strong>${escapeHtml(line.label)}</strong>：${escapeHtml(line.value)}</div>`).join('');
      return `<article class="dedicated-history-card"><div class="dedicated-history-meta"><span>${escapeHtml(item.savedAtJst || '')}</span><span>${escapeHtml(item.modeLabel || '')}</span></div><div class="dedicated-history-card-title">${escapeHtml(item.toolName || '割水計算')}</div><div class="dedicated-history-lines">${inputLines}${resultLines}</div><div class="dedicated-history-card-actions"><button class="back-btn" data-history-restore="${escapeHtml(item.id)}" type="button">この履歴を入力欄に戻す</button><button class="back-btn danger-btn" data-history-delete="${escapeHtml(item.id)}" type="button">削除</button></div></article>`;
    }).join('');
  }
  function bindHistoryUI(){
    setupHistoryFilter();
    const saveButton = $('water-save-history');
    if(saveButton) saveButton.addEventListener('click', saveCurrentHistory);
    const toggleButton = $('water-toggle-history');
    const panel = $('water-history-panel');
    if(toggleButton && panel){
      toggleButton.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        toggleButton.textContent = panel.hidden ? '割水計算履歴を見る' : '割水計算履歴を閉じる';
        if(!panel.hidden) renderHistoryList();
      });
    }
    const filter = $('water-history-filter');
    if(filter) filter.addEventListener('change', renderHistoryList);
    const list = $('water-history-list');
    if(list) list.addEventListener('click', (event) => {
      const restore = event.target.closest('[data-history-restore]');
      if(restore) return restoreHistoryItem(restore.getAttribute('data-history-restore'));
      const del = event.target.closest('[data-history-delete]');
      if(del) return deleteHistoryItem(del.getAttribute('data-history-delete'));
    });
    renderHistoryList();
    updateHistoryButton();
  }


  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-water-mode]').forEach(button => {
      button.addEventListener('click', () => setMode(button.getAttribute('data-water-mode')));
    });
    document.querySelectorAll('[data-water-reset]').forEach(button => {
      button.addEventListener('click', () => resetModeInputs(normalizeMode(button.getAttribute('data-water-reset'))));
    });
    document.querySelectorAll('input[id^="water-"]').forEach(input => {
      input.addEventListener('input', () => {
        calculateActiveMode();
        saveInputDraft();
      });
    });
    const candidateButton = $('water-open-tm2-candidate');
    if(candidateButton) candidateButton.addEventListener('click', openTm2CandidatePreview);
    setMode(0, {skipSave:true});
    draftReady = true;
    restoreInputDraft();
    restorePendingHistoryItem();
    calculateActiveMode();
    updateCandidateButton();
    bindHistoryUI();
  });

  window.SakeCalcWater = {
    setMode,
    calculateActiveMode,
    _buildTm2CandidateDraft:buildTm2CandidateDraft
  };
})();
