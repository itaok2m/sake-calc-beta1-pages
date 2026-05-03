(function(){
  'use strict';

  const HISTORY_KEY = 'sakeCalc.htmlSplit.mix.history.v1';
  const RESTORE_KEY = 'sakeCalc.htmlSplit.mix.restore.v1';
  const DRAFT_KEY = 'sakeCalc.htmlSplit.mix.inputDraft.v1';
  const TM2_CANDIDATE_KEY = 'sakeCalc.htmlSplit.tm2Candidate.v2.session';

  const formulas = {
    2:{main:'① 合計数量   ＝ 数量① ＋ 数量②', sub:'② 混合後成分 ＝ ( 数量① × 成分① ＋ 数量② × 成分② ) ÷ 合計数量'},
    3:{main:'① 合計数量   ＝ 数量① ＋ 数量② ＋ 数量③', sub:'② 混合後成分 ＝ ( 数量① × 成分① ＋ 数量② × 成分② ＋ 数量③ × 成分③ ) ÷ 合計数量'},
    4:{main:'① 合計数量   ＝ 数量① ＋ 数量② ＋ 数量③ ＋ 数量④', sub:'② 混合後成分 ＝ ( 数量① × 成分① ＋ 数量② × 成分② ＋ 数量③ × 成分③ ＋ 数量④ × 成分④ ) ÷ 合計数量'},
    5:{main:'① 合計数量   ＝ 数量① ＋ 数量② ＋ 数量③ ＋ 数量④ ＋ 数量⑤', sub:'② 混合後成分 ＝ ( 数量① × 成分① ＋ 数量② × 成分② ＋ 数量③ × 成分③ ＋ 数量④ × 成分④ ＋ 数量⑤ × 成分⑤ ) ÷ 合計数量'}
  };

  let mixMode = 2;
  let latestValidSnapshot = null;
  let draftReady = false;

  const $ = (id) => document.getElementById(id);
  const readNumber = (id) => {
    const el = $(id);
    if(!el || el.value === '') return NaN;
    return Number(el.value);
  };
  const mark = (index) => ['①','②','③','④','⑤'][Number(index)-1] || String(index);

  function modeLabel(mode){
    const n = Math.min(5, Math.max(2, Number(mode)||2));
    return `${n}混合`;
  }

  function truncatedFixed(value, decimals){
    const num = Number(value);
    const digits = Math.max(0, Math.min(4, Number(decimals)||0));
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

  function setHidden(id, hidden){
    const el = $(id);
    if(el) el.hidden = !!hidden;
  }

  function showError(message){
    const error = $('mix-error');
    if(!error) return;
    error.textContent = message;
    error.hidden = false;
    setHidden('mix-result', true);
    latestValidSnapshot = null;
    updateSaveButton();
  }

  function clearError(){
    const error = $('mix-error');
    if(!error) return;
    error.textContent = '';
    error.hidden = true;
  }

  function collectPairs(){
    const pairs = [];
    for(let i=1; i<=mixMode; i++){
      pairs.push({ index:i, component:readNumber('mix-c'+i), volume:readNumber('mix-v'+i) });
    }
    return pairs;
  }

  function calcWeightedAverage(pairs){
    if(pairs.some(item => !Number.isFinite(item.component) || !Number.isFinite(item.volume))){
      return null;
    }
    if(pairs.some(item => item.volume < 0)){
      return { error:'数量にマイナスは入力できません。' };
    }
    const totalVolume = pairs.reduce((sum,item)=>sum+item.volume,0);
    if(totalVolume <= 0){
      return { error:'少なくとも1つの数量を入力してください。' };
    }
    const weightedSum = pairs.reduce((sum,item)=>sum+(item.volume*item.component),0);
    return { totalVolume, mixedComponent: weightedSum / totalVolume };
  }

  function buildCumulativeRows(pairs){
    let runningVolume = 0;
    let runningWeighted = 0;
    const rows = [];
    for(const item of pairs){
      if(!Number.isFinite(item.component) || !Number.isFinite(item.volume)) return null;
      runningVolume += item.volume;
      runningWeighted += item.volume * item.component;
      if(runningVolume > 0 && item.index < mixMode){
        rows.push({
          index:item.index,
          label:`${mark(item.index)}投入後`,
          liters:runningVolume,
          component:runningWeighted / runningVolume
        });
      }
    }
    return rows;
  }

  function renderCumulative(pairs){
    const box = $('mix-cumulative-box');
    const list = $('mix-cumulative-list');
    if(!box || !list) return [];
    const rows = buildCumulativeRows(pairs);
    if(!rows || !rows.length){
      box.hidden = true;
      list.innerHTML = '';
      return [];
    }
    box.hidden = false;
    list.innerHTML = rows.map(row =>
      `<div class="mix-cumulative-row"><div class="result-label">${row.label}</div><div class="result-value">${truncatedFixed(row.liters,2)}L<span class="result-subvalue">途中成分：${truncatedFixed(row.component,2)}</span></div></div>`
    ).join('');
    return rows;
  }

  function createSnapshot(pairs, result, cumulativeRows){
    return {
      mode: mixMode,
      inputs: pairs.map(item => ({ index:item.index, component:item.component, volume:item.volume })),
      result: {
        mixedComponent: result.mixedComponent,
        totalVolume: result.totalVolume,
        mixedComponentText: truncatedFixed(result.mixedComponent, 2),
        totalVolumeText: truncatedFixed(result.totalVolume, 2)
      },
      cumulative: (cumulativeRows || []).map(row => ({
        index: row.index,
        label: row.label,
        liters: row.liters,
        component: row.component,
        litersText: truncatedFixed(row.liters, 2),
        componentText: truncatedFixed(row.component, 2)
      })),
      formula: formulas[mixMode] || formulas[2]
    };
  }

  function updateSaveButton(){
    const hasResult = !!latestValidSnapshot;
    const button = $('mix-save-history');
    if(button) button.disabled = !hasResult;
    const candidateButton = $('mix-open-tm2-candidate');
    if(candidateButton) candidateButton.disabled = !hasResult;
    const historyStatus = $('mix-history-status');
    const candidateStatus = $('mix-tm2-candidate-status');
    if(!hasResult){
      if(historyStatus){
        historyStatus.textContent = '入力がそろうと履歴に残せます。';
        historyStatus.style.color = '';
        historyStatus.dataset.autoHint = '1';
      }
      if(candidateStatus){
        candidateStatus.textContent = '計算結果が出ると2mm表候補を確認できます。';
        candidateStatus.style.color = '';
        candidateStatus.dataset.autoHint = '1';
      }
      return;
    }
    if(historyStatus && historyStatus.dataset.autoHint === '1'){
      historyStatus.textContent = '';
      historyStatus.dataset.autoHint = '';
    }
    if(candidateStatus && candidateStatus.dataset.autoHint === '1'){
      candidateStatus.textContent = '';
      candidateStatus.dataset.autoHint = '';
    }
  }

  function setHistoryStatus(message, isError){
    const status = $('mix-history-status');
    if(!status) return;
    status.textContent = message || '';
    status.classList.remove('is-success','is-info','is-error');
    status.style.color = '';
    if(isError) status.classList.add('is-error');
    else if(message === '履歴に残しました。') status.classList.add('is-success');
    else if(message) status.classList.add('is-info');
    status.dataset.autoHint = '';
  }

  function setTm2CandidateStatus(message, isError){
    const status = $('mix-tm2-candidate-status');
    if(!status) return;
    status.textContent = message || '';
    status.style.color = isError ? '#9f2d2d' : '';
    status.dataset.autoHint = '';
  }

  function buildTm2CandidateDraft(){
    if(!latestValidSnapshot) return null;
    const now = new Date();
    const mode = Number(latestValidSnapshot.mode) || mixMode;
    const candidates = [];
    const inputsByIndex = {};
    (latestValidSnapshot.inputs || []).forEach(item => {
      inputsByIndex[Number(item.index)] = item;
    });
    (latestValidSnapshot.cumulative || []).forEach(row => {
      const liters = Number(row.liters);
      const component = Number(row.component);
      if(!Number.isFinite(liters) || liters < 0) return;
      const input = inputsByIndex[Number(row.index)] || {};
      const inputVolume = Number(input.volume);
      const inputComponent = Number(input.component);
      candidates.push({
        role:'intermediate',
        roleLabel:'途中候補',
        label:`${row.label || '途中投入後'} 累計`,
        stageLabel:row.label || '途中投入後',
        liters,
        component:Number.isFinite(component) ? component : null,
        displayValue:`${row.litersText || truncatedFixed(liters, 2)}L`,
        componentText:Number.isFinite(component) ? (row.componentText || truncatedFixed(component, 2)) : '',
        mode,
        modeLabel:modeLabel(mode),
        order:Number(row.index) || candidates.length + 1,
        details:[
          { label:'今回投入', value:Number.isFinite(inputVolume) ? truncatedFixed(inputVolume, 2) + 'L' : '' },
          { label:'入力成分', value:Number.isFinite(inputComponent) ? truncatedFixed(inputComponent, 2) : '' },
          { label:'投入後累計', value:(row.litersText || truncatedFixed(liters, 2)) + 'L' },
          { label:'その時点の成分', value:Number.isFinite(component) ? (row.componentText || truncatedFixed(component, 2)) : '' }
        ].filter(item => item.value !== '')
      });
    });
    const finalLiters = Number(latestValidSnapshot.result && latestValidSnapshot.result.totalVolume);
    const finalComponent = Number(latestValidSnapshot.result && latestValidSnapshot.result.mixedComponent);
    if(Number.isFinite(finalLiters) && finalLiters >= 0){
      candidates.push({
        role:'final',
        roleLabel:'最終候補',
        label:'混合後合計',
        stageLabel:'混合後合計',
        liters:finalLiters,
        component:Number.isFinite(finalComponent) ? finalComponent : null,
        displayValue:`${latestValidSnapshot.result.totalVolumeText || truncatedFixed(finalLiters, 2)}L`,
        componentText:Number.isFinite(finalComponent) ? (latestValidSnapshot.result.mixedComponentText || truncatedFixed(finalComponent, 2)) : '',
        mode,
        modeLabel:modeLabel(mode),
        order:mode,
        details:[
          { label:'合計数量', value:(latestValidSnapshot.result.totalVolumeText || truncatedFixed(finalLiters, 2)) + 'L' },
          { label:'混合後成分', value:Number.isFinite(finalComponent) ? (latestValidSnapshot.result.mixedComponentText || truncatedFixed(finalComponent, 2)) : '' }
        ].filter(item => item.value !== '')
      });
    }
    if(!candidates.length) return null;
    return {
      type:'tank2mm-v2-draft',
      version:'html-split-mix-v1',
      status:'preview-only-no-save-no-history',
      builtAtISO:now.toISOString(),
      builtAtJst:formatJst(now),
      source:{
        scope:'mix-current-calculation',
        toolKey:`mix:${mode}`,
        toolLabel:`混合計算：${modeLabel(mode)}`,
        calcType:`mix-${mode}`,
        calcTypeLabel:modeLabel(mode),
        returnLabel:'← 元の計算画面へ戻る',
        returnHref:'./mix.html',
        returnToolLabel:'混合計算'
      },
      allowedPayload:{
        literCandidates:candidates.slice(0, 8),
        inputRows:(latestValidSnapshot.inputs || []).map(item => ({
          label:mark(item.index) + '投入目',
          values:[
            { label:'数量', value:truncatedFixed(item.volume, 2) + 'L' },
            { label:'成分', value:truncatedFixed(item.component, 2) }
          ]
        })),
        resultRows:[
          ...((latestValidSnapshot.cumulative || []).map(row => ({
            label:(row.label || '途中投入後') + ' 累計',
            values:[
              { label:'累計数量', value:(row.litersText || truncatedFixed(row.liters, 2)) + 'L' },
              { label:'その時点の成分', value:row.componentText || truncatedFixed(row.component, 2) }
            ]
          }))),
          {
            label:'混合後の最終結果',
            values:[
              { label:'合計数量', value:(latestValidSnapshot.result.totalVolumeText || truncatedFixed(finalLiters, 2)) + 'L' },
              { label:'混合後成分', value:latestValidSnapshot.result.mixedComponentText || truncatedFixed(finalComponent, 2) }
            ]
          }
        ],
        note:'最新1件の中に、元入力・途中結果・最終結果を含めます。'
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
      setTm2CandidateStatus('計算結果が出てから候補確認へ進めます。', true);
      return;
    }
    try{
      sessionStorage.setItem(TM2_CANDIDATE_KEY, JSON.stringify(draft));
      setTm2CandidateStatus('2mm表候補確認へ一時候補を渡しました。');
      location.href = './tm2-candidate.html';
    }catch(_err){
      setTm2CandidateStatus('候補確認へ渡せませんでした。この端末の一時保存設定を確認してください。', true);
    }
  }

  function readHistory(){
    try{
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    }catch(_err){
      return [];
    }
  }

  function writeHistory(records){
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  }

  function normalizedHistorySignature(snapshot){
    if(!snapshot) return '';
    const inputs = Array.isArray(snapshot.inputs) ? snapshot.inputs : [];
    const cumulative = Array.isArray(snapshot.cumulative) ? snapshot.cumulative : [];
    const result = snapshot.result || {};
    return JSON.stringify({
      mode: Number(snapshot.mode) || 2,
      inputs: inputs.map(item => ({
        index: Number(item.index) || 0,
        component: Number(item.component),
        volume: Number(item.volume)
      })),
      result: {
        mixedComponentText: String(result.mixedComponentText || truncatedFixed(result.mixedComponent, 2)),
        totalVolumeText: String(result.totalVolumeText || truncatedFixed(result.totalVolume, 2))
      },
      cumulative: cumulative.map(row => ({
        index: Number(row.index) || 0,
        litersText: String(row.litersText || truncatedFixed(row.liters, 2)),
        componentText: String(row.componentText || truncatedFixed(row.component, 2))
      }))
    });
  }

  function isImmediateDuplicateHistory(snapshot, records){
    if(!snapshot || !Array.isArray(records) || !records.length) return false;
    return normalizedHistorySignature(snapshot) === normalizedHistorySignature(records[0]);
  }


  function readInputDraft(){
    try{
      const raw = localStorage.getItem(DRAFT_KEY);
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && Array.isArray(parsed.values) ? parsed : null;
    }catch(_err){
      return null;
    }
  }

  function writeInputDraft(){
    if(!draftReady) return;
    try{
      const details = $('mix-extra-details');
      const values = [];
      for(let i=1; i<=5; i++){
        const c = $('mix-c'+i);
        const v = $('mix-v'+i);
        values.push({ index:i, component:c ? c.value : '', volume:v ? v.value : '' });
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        mode: mixMode,
        detailsOpen: !!(details && details.open),
        values,
        savedAtISO: new Date().toISOString()
      }));
    }catch(_err){
      // 検証補助の入力保持なので、保存できない環境では通常入力のまま続行する。
    }
  }

  function clearInputDraft(){
    try{ localStorage.removeItem(DRAFT_KEY); }catch(_err){}
  }

  function applyInputDraft(){
    const draft = readInputDraft();
    if(!draft) return false;
    const nextMode = Math.min(5, Math.max(2, Number(draft.mode)||2));
    setMixMode(nextMode);
    draft.values.forEach(item => {
      const index = Number(item.index);
      if(index < 1 || index > 5) return;
      const c = $('mix-c'+index);
      const v = $('mix-v'+index);
      if(c) c.value = item.component == null ? '' : String(item.component);
      if(v) v.value = item.volume == null ? '' : String(item.volume);
    });
    const details = $('mix-extra-details');
    if(details && nextMode > 2){
      details.open = draft.detailsOpen !== false;
    }
    syncDetailsLabel();
    calculate();
    setHistoryStatus('前回入力を復元しました。');
    return true;
  }

  function saveCurrentHistory(){
    if(!latestValidSnapshot){
      setHistoryStatus('計算結果が出てから履歴に残せます。', true);
      return;
    }
    try{
      const now = new Date();
      const records = readHistory();
      if(isImmediateDuplicateHistory(latestValidSnapshot, records)){
        setHistoryStatus('直前と同じ内容のため、二重押しとして保存しませんでした。');
        return;
      }
      const record = Object.assign({}, latestValidSnapshot, {
        id: 'mix_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
        savedAtISO: now.toISOString(),
        savedAtJST: formatJst(now),
        type: 'mix',
        calcType: 'mix-' + mixMode,
        calcTypeLabel: modeLabel(mixMode)
      });
      records.unshift(record);
      writeHistory(records);
      setHistoryStatus('混合計算履歴に保存しました。');
    }catch(_err){
      setHistoryStatus('履歴保存に失敗しました。この端末の保存設定を確認してください。', true);
    }
  }

  function applyRestorePayload(payload){
    if(!payload || !Array.isArray(payload.inputs)) return;
    const nextMode = Math.min(5, Math.max(2, Number(payload.mode)||2));
    setMixMode(nextMode);
    payload.inputs.forEach(item => {
      const index = Number(item.index);
      if(index < 1 || index > 5) return;
      const c = $('mix-c'+index);
      const v = $('mix-v'+index);
      if(c) c.value = Number.isFinite(Number(item.component)) ? String(item.component) : '';
      if(v) v.value = Number.isFinite(Number(item.volume)) ? String(item.volume) : '';
    });
    calculate();
    writeInputDraft();
    setHistoryStatus('履歴から入力欄へ戻しました。');
  }

  function consumeRestorePayload(){
    try{
      const raw = sessionStorage.getItem(RESTORE_KEY);
      if(!raw) return null;
      sessionStorage.removeItem(RESTORE_KEY);
      return JSON.parse(raw);
    }catch(_err){
      return null;
    }
  }

  function calculate(){
    const pairs = collectPairs();
    const result = calcWeightedAverage(pairs);
    if(result === null){
      clearError();
      setHidden('mix-result', true);
      renderCumulative(pairs);
      latestValidSnapshot = null;
      updateSaveButton();
      return;
    }
    if(result.error){
      renderCumulative(pairs);
      showError(result.error);
      return;
    }
    clearError();
    $('mix-result-component').textContent = truncatedFixed(result.mixedComponent,2);
    $('mix-result-volume').textContent = truncatedFixed(result.totalVolume,2);
    setHidden('mix-result', false);
    const cumulativeRows = renderCumulative(pairs);
    latestValidSnapshot = createSnapshot(pairs, result, cumulativeRows);
    updateSaveButton();
  }

  function syncDetailsLabel(){
    const details = $('mix-extra-details');
    const summaryText = $('mix-extra-summary-text');
    const currentMode = $('mix-current-mode');
    const summaryAction = $('mix-extra-summary-action');
    const extraNote = $('mix-extra-note');
    if(summaryText) summaryText.textContent = '3〜5種混合を使う';
    if(summaryAction) summaryAction.textContent = details && details.open ? '閉じる' : '開く';
    if(currentMode) currentMode.textContent = `現在：${mixMode}種混合`;
    if(extraNote){
      extraNote.textContent = mixMode > 2
        ? `${mixMode}種混合を選択中です。履歴は${modeLabel(mixMode)}として分類保存します。`
        : '3種以上を使う時だけ選びます。履歴は方式別に分かれます。';
    }
  }

  function setMixMode(nextMode){
    setHistoryStatus('');
    setTm2CandidateStatus('');
    const n = Math.min(5, Math.max(2, Number(nextMode)||2));
    mixMode = n;
    [2,3,4,5].forEach(i => {
      const button = $('mix-mode-'+i);
      if(button) button.classList.toggle('active', i === n);
    });
    document.querySelectorAll('#mix-body [data-mix-row]').forEach(row => {
      const index = Number(row.getAttribute('data-mix-row') || 0);
      row.classList.toggle('mix-row-hidden', index > n);
    });
    const formula = formulas[n] || formulas[2];
    $('mix-formula-main').textContent = formula.main;
    $('mix-formula-sub').textContent = formula.sub;
    const details = $('mix-extra-details');
    if(details) details.open = n > 2;
    const actionModeBadge = $('mix-action-mode-badge');
    if(actionModeBadge) actionModeBadge.textContent = `${n}種`;
    syncDetailsLabel();
    calculate();
    writeInputDraft();
  }

  function resetInputs(){
    document.querySelectorAll('#mix-body input').forEach(input => { input.value = ''; });
    clearError();
    setHidden('mix-result', true);
    setHidden('mix-cumulative-box', true);
    const list = $('mix-cumulative-list');
    if(list) list.innerHTML = '';
    latestValidSnapshot = null;
    updateSaveButton();
    setHistoryStatus('');
    setTm2CandidateStatus('');
    clearInputDraft();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-mix-mode]').forEach(button => {
      button.addEventListener('click', () => setMixMode(button.getAttribute('data-mix-mode')));
    });
    document.querySelectorAll('#mix-body input').forEach(input => {
      input.addEventListener('input', () => { setHistoryStatus(''); setTm2CandidateStatus(''); calculate(); writeInputDraft(); });
    });
    const details = $('mix-extra-details');
    if(details) details.addEventListener('toggle', () => { syncDetailsLabel(); writeInputDraft(); });
    const reset = $('mix-reset');
    if(reset) reset.addEventListener('click', resetInputs);
    const save = $('mix-save-history');
    if(save) save.addEventListener('click', saveCurrentHistory);
    const tm2Candidate = $('mix-open-tm2-candidate');
    if(tm2Candidate) tm2Candidate.addEventListener('click', openTm2CandidatePreview);
    setMixMode(2);
    const restorePayload = consumeRestorePayload();
    if(restorePayload){
      draftReady = true;
      applyRestorePayload(restorePayload);
    }else{
      applyInputDraft();
      draftReady = true;
    }
  });

  window.SakeCalcMix = { calculate, setMixMode, resetInputs, saveCurrentHistory, openTm2CandidatePreview, _collectPairs:collectPairs, _buildTm2CandidateDraft:buildTm2CandidateDraft };
})();
