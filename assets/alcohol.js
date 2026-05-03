(function(){
  'use strict';

  const TM2_CANDIDATE_KEY = 'sakeCalc.htmlSplit.tm2Candidate.v2.session';
  const HISTORY_KEY = 'sakeCalc.htmlSplit.alcohol.history.v1';
  const HISTORY_RESTORE_KEY = 'sakeCalc.htmlSplit.alcohol.history.restore.v1';
  const DRAFT_KEY = 'sakeCalc.htmlSplit.alcohol.inputDraft.v1';

  const formulas = [
    { main:'① 添加量 ＝ 現在数量 ×（目標成分 − 現在成分）÷（添加アルコール濃度 − 目標成分）', sub:'② 添加後数量 ＝ 現在数量 ＋ 添加量' },
    { main:'① 添加前数量 ＝ 目標数量 ×（添加アルコール濃度 − 目標成分）÷（添加アルコール濃度 − 現在成分）', sub:'② 添加量 ＝ 目標数量 − 添加前数量' },
    { main:'① 添加後成分 ＝（現在数量 × 現在成分 ＋ 添加量 × アルコール濃度）÷ 添加後数量', sub:'② 添加後数量 ＝ 現在数量 ＋ 添加量' }
  ];

  const modeLabels = [
    '添加量・添加後数量',
    '添加前の必要数量',
    '添加後の成分値・数量'
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
    const result = $('alcohol-result-' + mode);
    const error = $('alcohol-error-' + mode);
    if(error){
      error.textContent = '';
      error.hidden = true;
    }
    if(result) result.hidden = false;
    Object.keys(values || {}).forEach(id => setText(id, values[id]));
  }

  function showError(mode, message){
    const result = $('alcohol-result-' + mode);
    const error = $('alcohol-error-' + mode);
    if(result) result.hidden = true;
    if(error){
      error.textContent = message;
      error.hidden = false;
    }
    latestValidSnapshot = null;
    updateCandidateButton();
  }

  function clearResult(mode){
    const result = $('alcohol-result-' + mode);
    const error = $('alcohol-error-' + mode);
    if(result) result.hidden = true;
    if(error){
      error.textContent = '';
      error.hidden = true;
    }
    latestValidSnapshot = null;
    updateCandidateButton();
  }

  function setCandidateStatus(message, isError){
    const status = $('alcohol-tm2-candidate-status');
    if(!status) return;
    status.textContent = message || '';
    status.style.color = isError ? '#9f2d2d' : '';
  }

  function updateCandidateButton(){
    const btn = $('alcohol-open-tm2-candidate');
    if(!btn) return;
    const enabled = !!latestValidSnapshot;
    btn.disabled = !enabled;
    setCandidateStatus(enabled ? 'この計算結果から2mm表候補を確認できます。' : '入力がそろうと2mm表候補を確認できます。');
    updateHistoryButton();
  }

  function snapshotForMode0(cc, cv, ac, tc, av, tv){
    return {
      mode:0,
      modeLabel:modeLabels[0],
      inputs:{ currentComponent:cc, currentVolume:cv, addComponent:ac, targetComponent:tc },
      results:{ addVolume:av, targetVolume:tv, sourceVolume:cv, sourceComponent:cc, addComponent:ac, targetComponent:tc },
      inputRows:[
        { label:'添加前（現在）', values:[{label:'成分', value:truncatedFixed(cc, 2)}, {label:'数量', value:truncatedFixed(cv, 2) + 'L'}] },
        { label:'添加するアルコール ／ 目標', values:[{label:'添加アルコール濃度', value:truncatedFixed(ac, 2)}, {label:'目標成分', value:truncatedFixed(tc, 2)}] }
      ],
      resultRows:[
        { label:'計算結果', values:[{label:'添加量', value:truncatedFixed(av, 2) + 'L'}, {label:'添加後の合計数量', value:truncatedFixed(tv, 2) + 'L'}] }
      ]
    };
  }

  function snapshotForMode1(cc, ac, tc, tv, cv, av){
    return {
      mode:1,
      modeLabel:modeLabels[1],
      inputs:{ currentComponent:cc, addComponent:ac, targetComponent:tc, targetVolume:tv },
      results:{ sourceVolume:cv, addVolume:av, targetVolume:tv, sourceComponent:cc, addComponent:ac, targetComponent:tc },
      inputRows:[
        { label:'添加前（現在）', values:[{label:'成分', value:truncatedFixed(cc, 2)}] },
        { label:'添加するアルコール ／ 目標', values:[{label:'添加アルコール濃度', value:truncatedFixed(ac, 2)}, {label:'目標成分', value:truncatedFixed(tc, 2)}, {label:'目標数量', value:truncatedFixed(tv, 2) + 'L'}] }
      ],
      resultRows:[
        { label:'計算結果', values:[{label:'添加前の必要数量', value:truncatedFixed(cv, 2) + 'L'}, {label:'添加量', value:truncatedFixed(av, 2) + 'L'}] }
      ]
    };
  }

  function snapshotForMode2(cc, cv, ac, av, tc, tv){
    return {
      mode:2,
      modeLabel:modeLabels[2],
      inputs:{ currentComponent:cc, currentVolume:cv, addComponent:ac, addVolume:av },
      results:{ targetComponent:tc, targetVolume:tv, sourceVolume:cv, sourceComponent:cc, addComponent:ac, addVolume:av },
      inputRows:[
        { label:'添加前（現在）', values:[{label:'成分', value:truncatedFixed(cc, 2)}, {label:'数量', value:truncatedFixed(cv, 2) + 'L'}] },
        { label:'添加するアルコール', values:[{label:'添加アルコール濃度', value:truncatedFixed(ac, 2)}, {label:'添加量', value:truncatedFixed(av, 2) + 'L'}] }
      ],
      resultRows:[
        { label:'計算結果', values:[{label:'添加後の成分値', value:truncatedFixed(tc, 2)}, {label:'添加後の合計数量', value:truncatedFixed(tv, 2) + 'L'}] }
      ]
    };
  }

  function calcMode0(){
    const cc = readNumber('alcohol-0-current-component');
    const cv = readNumber('alcohol-0-current-volume');
    const ac = readNumber('alcohol-0-add-component');
    const tc = readNumber('alcohol-0-target-component');
    if([cc, cv, ac, tc].some(value => !Number.isFinite(value))) return clearResult(0);
    if(cv <= 0) return showError(0, '数量は0より大きい値を入力してください。');
    if(ac <= tc) return showError(0, '添加アルコール濃度は目標成分より高い値を入力してください。');
    if(tc <= cc) return showError(0, '目標成分は現在成分より高い値を入力してください。');
    const av = cv * (tc - cc) / (ac - tc);
    const tv = cv + av;
    latestValidSnapshot = snapshotForMode0(cc, cv, ac, tc, av, tv);
    showResult(0, {'alcohol-0-add-volume':truncatedFixed(av, 2), 'alcohol-0-total-volume':truncatedFixed(tv, 2)});
    updateCandidateButton();
  }

  function calcMode1(){
    const cc = readNumber('alcohol-1-current-component');
    const ac = readNumber('alcohol-1-add-component');
    const tc = readNumber('alcohol-1-target-component');
    const tv = readNumber('alcohol-1-target-volume');
    if([cc, ac, tc, tv].some(value => !Number.isFinite(value))) return clearResult(1);
    if(tv <= 0) return showError(1, '数量は0より大きい値を入力してください。');
    if(ac <= tc) return showError(1, '添加アルコール濃度は目標成分より高い値を入力してください。');
    if(ac <= cc) return showError(1, '添加アルコール濃度は現在成分より高い値を入力してください。');
    const cv = tv * (ac - tc) / (ac - cc);
    const av = tv - cv;
    if(cv <= 0 || av < 0) return showError(1, '入力値の組み合わせが不正です。目標成分・現在成分・添加濃度の関係を確認してください。');
    latestValidSnapshot = snapshotForMode1(cc, ac, tc, tv, cv, av);
    showResult(1, {'alcohol-1-current-volume':truncatedFixed(cv, 2), 'alcohol-1-add-volume':truncatedFixed(av, 2)});
    updateCandidateButton();
  }

  function calcMode2(){
    const cc = readNumber('alcohol-2-current-component');
    const cv = readNumber('alcohol-2-current-volume');
    const ac = readNumber('alcohol-2-add-component');
    const av = readNumber('alcohol-2-add-volume');
    if([cc, cv, ac, av].some(value => !Number.isFinite(value))) return clearResult(2);
    if(cv <= 0 || av < 0) return showError(2, '数量に正しい数値を入力してください。');
    const tv = cv + av;
    if(tv <= 0) return showError(2, '添加後数量が0以下になりました。入力値を確認してください。');
    const tc = (cv * cc + av * ac) / tv;
    latestValidSnapshot = snapshotForMode2(cc, cv, ac, av, tc, tv);
    showResult(2, {'alcohol-2-target-component':truncatedFixed(tc, 2), 'alcohol-2-total-volume':truncatedFixed(tv, 2)});
    updateCandidateButton();
  }

  function calculateActiveMode(){
    if(activeMode === 0) return calcMode0();
    if(activeMode === 1) return calcMode1();
    return calcMode2();
  }

  function collectDraftInputs(){
    const out = {mode:activeMode, values:{}};
    document.querySelectorAll('input[id^="alcohol-"]').forEach(input => {
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
    document.querySelectorAll('#alcohol-panel-' + mode + ' input').forEach(input => { input.value = ''; });
    clearResult(mode);
    saveInputDraft();
  }

  function normalizeMode(mode){
    const n = Number(mode);
    return [0,1,2].includes(n) ? n : 0;
  }

  function setMode(mode, options){
    activeMode = normalizeMode(mode);
    document.querySelectorAll('[data-alcohol-mode]').forEach(button => {
      button.classList.toggle('active', Number(button.getAttribute('data-alcohol-mode')) === activeMode);
    });
    document.querySelectorAll('[data-alcohol-panel]').forEach(panel => {
      panel.hidden = Number(panel.getAttribute('data-alcohol-panel')) !== activeMode;
    });
    const f = formulas[activeMode] || formulas[0];
    setText('alcohol-formula-main', f.main);
    setText('alcohol-formula-sub', f.sub);
    setText('alcohol-action-mode-badge', modeLabels[activeMode] || modeLabels[0]);
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
      modeLabel:modeLabels[activeMode] || 'アルコール添加計算',
      priority:Number(priority) || 50,
      details:(details || []).filter(item => item && item.value !== '')
    };
  }

  function buildCandidateList(snapshot){
    if(!snapshot) return [];
    const r = snapshot.results || {};
    const i = snapshot.inputs || {};
    const items = [];
    if(activeMode === 0){
      items.push(createCandidate('source', '添加前', '添加前（現在量）', i.currentVolume, i.currentComponent, [
        { label:'成分', value:truncatedFixed(i.currentComponent, 2) },
        { label:'数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 10));
      items.push(createCandidate('primary', '添加後', '添加後（合計数量）', r.targetVolume, i.targetComponent, [
        { label:'目標成分', value:truncatedFixed(i.targetComponent, 2) },
        { label:'添加アルコール濃度', value:truncatedFixed(i.addComponent, 2) },
        { label:'添加量', value:truncatedFixed(r.addVolume, 2) + 'L' },
        { label:'添加前数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 30));
    }else if(activeMode === 1){
      items.push(createCandidate('source', '添加前', '添加前（必要量）', r.sourceVolume, i.currentComponent, [
        { label:'成分', value:truncatedFixed(i.currentComponent, 2) },
        { label:'必要量', value:truncatedFixed(r.sourceVolume, 2) + 'L' }
      ], 10));
      items.push(createCandidate('primary', '添加後', '添加後（目標数量）', i.targetVolume, i.targetComponent, [
        { label:'目標成分', value:truncatedFixed(i.targetComponent, 2) },
        { label:'添加アルコール濃度', value:truncatedFixed(i.addComponent, 2) },
        { label:'添加量', value:truncatedFixed(r.addVolume, 2) + 'L' },
        { label:'添加前必要量', value:truncatedFixed(r.sourceVolume, 2) + 'L' }
      ], 30));
    }else{
      items.push(createCandidate('source', '添加前', '添加前（現在量）', i.currentVolume, i.currentComponent, [
        { label:'成分', value:truncatedFixed(i.currentComponent, 2) },
        { label:'数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 10));
      items.push(createCandidate('primary', '添加後', '添加後（合計数量）', r.targetVolume, r.targetComponent, [
        { label:'添加後成分', value:truncatedFixed(r.targetComponent, 2) },
        { label:'添加アルコール濃度', value:truncatedFixed(i.addComponent, 2) },
        { label:'添加量', value:truncatedFixed(i.addVolume, 2) + 'L' },
        { label:'添加前数量', value:truncatedFixed(i.currentVolume, 2) + 'L' }
      ], 30));
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
      version:'html-split-alcohol-v1',
      status:'preview-only-no-save-no-history',
      builtAtISO:now.toISOString(),
      builtAtJst:formatJst(now),
      source:{
        scope:'alcohol-current-calculation',
        toolKey:'alcohol:add:' + activeMode,
        toolLabel:'アルコール添加計算：' + (modeLabels[activeMode] || modeLabels[0]),
        calcType:'alcohol-' + activeMode,
        calcTypeLabel:modeLabels[activeMode] || 'アルコール添加計算',
        returnLabel:'← 元の計算画面へ戻る',
        returnHref:'./alcohol.html',
        returnToolLabel:'アルコール添加計算'
      },
      allowedPayload:{
        literCandidates:candidates,
        inputRows:latestValidSnapshot.inputRows || [],
        resultRows:latestValidSnapshot.resultRows || [],
        note:'アルコール添加計算から、添加前・添加後の確認に使う主候補Lを渡します。添加アルコール濃度・添加量は添加後カード内の補足情報として表示します。'
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
    const filter = $('alcohol-history-filter');
    return filter ? filter.value : 'all';
  }
  function setupHistoryFilter(){
    const filter = $('alcohol-history-filter');
    if(!filter || filter.options.length) return;
    filter.appendChild(new Option('すべての方式', 'all'));
    modeLabels.forEach((label, index) => filter.appendChild(new Option(label, String(index))));
  }
  function updateHistoryButton(){
    const button = $('alcohol-save-history');
    if(button) button.disabled = !latestValidSnapshot;
  }
  function setHistoryStatus(message, isError){
    const status = $('alcohol-history-status');
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
      id:'alcohol-' + now.getTime() + '-' + Math.random().toString(36).slice(2,8),
      savedAtISO:now.toISOString(),
      savedAtJst:formatJst(now),
      toolName:'アルコール添加計算',
      mode:activeMode,
      modeLabel:modeLabels[activeMode] || 'アルコール添加計算',
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
    const list = $('alcohol-history-list');
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
      return `<article class="dedicated-history-card"><div class="dedicated-history-meta"><span>${escapeHtml(item.savedAtJst || '')}</span><span>${escapeHtml(item.modeLabel || '')}</span></div><div class="dedicated-history-card-title">${escapeHtml(item.toolName || 'アルコール添加計算')}</div><div class="dedicated-history-lines">${inputLines}${resultLines}</div><div class="dedicated-history-card-actions"><button class="back-btn" data-history-restore="${escapeHtml(item.id)}" type="button">この履歴を入力欄に戻す</button><button class="back-btn danger-btn" data-history-delete="${escapeHtml(item.id)}" type="button">削除</button></div></article>`;
    }).join('');
  }
  function bindHistoryUI(){
    setupHistoryFilter();
    const saveButton = $('alcohol-save-history');
    if(saveButton) saveButton.addEventListener('click', saveCurrentHistory);
    const toggleButton = $('alcohol-toggle-history');
    const panel = $('alcohol-history-panel');
    if(toggleButton && panel){
      toggleButton.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        toggleButton.textContent = panel.hidden ? 'アルコール添加履歴を見る' : 'アルコール添加履歴を閉じる';
        if(!panel.hidden) renderHistoryList();
      });
    }
    const filter = $('alcohol-history-filter');
    if(filter) filter.addEventListener('change', renderHistoryList);
    const list = $('alcohol-history-list');
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
    document.querySelectorAll('[data-alcohol-mode]').forEach(button => {
      button.addEventListener('click', () => setMode(button.getAttribute('data-alcohol-mode')));
    });
    document.querySelectorAll('[data-alcohol-reset]').forEach(button => {
      button.addEventListener('click', () => resetModeInputs(normalizeMode(button.getAttribute('data-alcohol-reset'))));
    });
    document.querySelectorAll('input[id^="alcohol-"]').forEach(input => {
      input.addEventListener('input', () => {
        calculateActiveMode();
        saveInputDraft();
      });
    });
    const candidateButton = $('alcohol-open-tm2-candidate');
    if(candidateButton) candidateButton.addEventListener('click', openTm2CandidatePreview);
    setMode(0, {skipSave:true});
    draftReady = true;
    restoreInputDraft();
    restorePendingHistoryItem();
    calculateActiveMode();
    updateCandidateButton();
    bindHistoryUI();
  });

  window.SakeCalcAlcohol = {
    setMode,
    calculateActiveMode,
    _buildTm2CandidateDraft:buildTm2CandidateDraft
  };
})();
