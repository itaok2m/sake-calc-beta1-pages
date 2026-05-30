(function(){
  'use strict';

  const STORAGE_KEYS = {
    hydrometers: 'sake_alcohol_conversion_hydrometer_master_v1',
    lastHydrometer: 'sake_alcohol_conversion_last_hydrometer_v1',
    lastInputs: 'sake_alcohol_conversion_last_inputs_v1'
  };

  const DEFAULT_HYDROMETERS = [
    {id:'h_0_5', label:'0〜5', min:0, max:5, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:0,kisa:-0.10},{degree:2,kisa:-0.05},{degree:5,kisa:-0.05}]},
    {id:'h_5_10', label:'5〜10', min:5, max:10, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:5,kisa:-0.10},{degree:8,kisa:-0.20},{degree:10,kisa:-0.20}]},
    {id:'h_8_13', label:'8〜13', min:8, max:13, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:8,kisa:+0.05},{degree:10,kisa:+0.20},{degree:13,kisa:+0.05}]},
    {id:'h_10_15', label:'10〜15', min:10, max:15, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:10,kisa:+0.05},{degree:12,kisa:0.00},{degree:15,kisa:0.00}]},
    {id:'h_13_18', label:'13〜18', min:13, max:18, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:13,kisa:-0.10},{degree:15,kisa:-0.05},{degree:18,kisa:-0.15}]},
    {id:'h_15_20', label:'15〜20', min:15, max:20, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:15,kisa:+0.15},{degree:18,kisa:+0.15},{degree:20,kisa:+0.10}]},
    {id:'h_18_23', label:'18〜23', min:18, max:23, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:18,kisa:-0.05},{degree:20,kisa:-0.05},{degree:23,kisa:0.00}]},
    {id:'h_25_30', label:'25〜30', min:25, max:30, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:25,kisa:+0.05},{degree:28,kisa:+0.10},{degree:30,kisa:+0.05}]},
    {id:'h_30_35', label:'30〜35', min:30, max:35, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:30,kisa:+0.15},{degree:32,kisa:0.00},{degree:35,kisa:+0.05}]},
    {id:'h_90_100', label:'90〜100', min:90, max:100, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:90,kisa:0.00},{degree:95,kisa:-0.05},{degree:100,kisa:+0.20}]}
  ];

  const el = {
    reading: document.getElementById('alcohol-conversion-reading'),
    temp: document.getElementById('alcohol-conversion-temp'),
    hydrometer: document.getElementById('alcohol-conversion-hydrometer'),
    candidates: document.getElementById('alcohol-conversion-kisa-candidates'),
    kisa: document.getElementById('alcohol-conversion-kisa'),
    correctedCard: document.getElementById('alcohol-conversion-corrected-card'),
    corrected: document.getElementById('alcohol-conversion-corrected'),
    error: document.getElementById('alcohol-conversion-error'),
    reset: document.getElementById('alcohol-conversion-reset'),
    tableLink: document.getElementById('alcohol-conversion-open-table'),
    editor: document.getElementById('alcohol-conversion-hydrometer-editor'),
    editorLabel: document.getElementById('alcohol-conversion-editor-label'),
    editorMin: document.getElementById('alcohol-conversion-editor-min'),
    editorMax: document.getElementById('alcohol-conversion-editor-max'),
    editorPoints: Array.prototype.slice.call(document.querySelectorAll('.alcohol-conversion-editor-point')),
    editorKisas: Array.prototype.slice.call(document.querySelectorAll('.alcohol-conversion-editor-kisa')),
    editorSave: document.getElementById('alcohol-conversion-editor-save'),
    editorAdd: document.getElementById('alcohol-conversion-editor-add'),
    editorDelete: document.getElementById('alcohol-conversion-editor-delete'),
    editorDefaults: document.getElementById('alcohol-conversion-editor-defaults'),
    editorStatus: document.getElementById('alcohol-conversion-editor-status')
  };

  let hydrometers = loadHydrometers();
  let manualKisaTouched = false;
  let activeCandidateKey = '';
  let hydrometerRenderToken = 0;

  // 2026-05-28: 15℃補正後アルコール分の自動計算は停止中。
  // この画面では補正後示度までを出し、横田表画像へ確認位置を渡す。
  // 2026-05-30: 使用浮標と器差補正は、浮標マスターとして端末内に登録・編集できる。

  function safeGet(key){ try { return localStorage.getItem(key); } catch(_err){ return ''; } }
  function safeSet(key, value){ try { localStorage.setItem(key, value); } catch(_err){} }
  function safeRemove(key){ try { localStorage.removeItem(key); } catch(_err){} }
  function cloneDefaults(){ return JSON.parse(JSON.stringify(DEFAULT_HYDROMETERS)); }
  function clampString(value){ return String(value == null ? '' : value).trim(); }
  function parseNumberText(value){
    const raw = String(value == null ? '' : value).trim().replace(/,/g,'.');
    if (!raw) return NaN;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }
  function normalizePoint(point){
    if (!point || typeof point !== 'object') return null;
    const degree = parseNumberText(point.degree);
    const kisa = parseNumberText(point.kisa);
    if (!Number.isFinite(degree) || !Number.isFinite(kisa)) return null;
    return {degree:roundTo(degree, 1), kisa:roundTo(kisa, 2)};
  }
  function uniqueId(){
    return 'h_custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }
  function normalizeHydrometer(item, fallbackIndex){
    if (!item || typeof item !== 'object') return null;
    const label = clampString(item.label) || '浮標' + String(fallbackIndex + 1);
    const min = parseNumberText(item.min);
    const max = parseNumberText(item.max);
    const points = Array.isArray(item.points) ? item.points.map(normalizePoint).filter(Boolean) : [];
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return null;
    return {
      id: clampString(item.id) || uniqueId(),
      label,
      min: roundTo(min, 1),
      max: roundTo(max, 1),
      inspectionDate: clampString(item.inspectionDate),
      nextInspectionGuide: clampString(item.nextInspectionGuide),
      status: clampString(item.status) || 'using',
      points: sortPoints(points)
    };
  }
  function normalizeHydrometers(list){
    const normalized = (Array.isArray(list) ? list : []).map(normalizeHydrometer).filter(Boolean);
    const used = new Set();
    normalized.forEach((h) => {
      if (used.has(h.id)) h.id = uniqueId();
      used.add(h.id);
    });
    return normalized;
  }
  function loadHydrometers(){
    const raw = safeGet(STORAGE_KEYS.hydrometers);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const normalized = normalizeHydrometers(parsed);
        if (normalized.length) {
          safeSet(STORAGE_KEYS.hydrometers, JSON.stringify(normalized));
          return normalized;
        }
      } catch(_err) {}
    }
    const defaults = cloneDefaults();
    safeSet(STORAGE_KEYS.hydrometers, JSON.stringify(defaults));
    return defaults;
  }
  function saveHydrometers(){
    hydrometers = normalizeHydrometers(hydrometers);
    if (!hydrometers.length) hydrometers = cloneDefaults();
    safeSet(STORAGE_KEYS.hydrometers, JSON.stringify(hydrometers));
  }
  function numberValue(input){ return parseNumberText(input && input.value); }
  function formatSigned(n, digits){
    if (!Number.isFinite(n)) return '—';
    const fixed = n.toFixed(digits);
    return n > 0 ? '+' + fixed : fixed;
  }
  function formatPlain(n, digits){ return Number.isFinite(n) ? n.toFixed(digits) : '—'; }
  function formatDegree(n){
    if (!Number.isFinite(n)) return '—';
    return Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1);
  }
  function roundTo(n, digits){
    const m = Math.pow(10, digits);
    return Math.round((n + Number.EPSILON) * m) / m;
  }
  function sortPoints(points){
    return (Array.isArray(points) ? points : []).slice().sort((a,b) => a.degree - b.degree || a.kisa - b.kisa);
  }
  function selectedHydrometer(){
    return hydrometers.find(h => h.id === el.hydrometer.value) || hydrometers[0] || null;
  }
  function populateHydrometerOptions(preferredId){
    const previous = preferredId || el.hydrometer.value || safeGet(STORAGE_KEYS.lastHydrometer);
    el.hydrometer.innerHTML = '';
    hydrometers.forEach((h) => {
      const opt = document.createElement('option');
      opt.value = h.id;
      opt.textContent = h.label + '（' + formatDegree(h.min) + '〜' + formatDegree(h.max) + '%）';
      el.hydrometer.appendChild(opt);
    });
    if (previous && hydrometers.some(h => h.id === previous)) {
      el.hydrometer.value = previous;
    } else if (hydrometers[0]) {
      el.hydrometer.value = hydrometers[0].id;
    }
    if (el.hydrometer.value) safeSet(STORAGE_KEYS.lastHydrometer, el.hydrometer.value);
  }
  function getRegisteredKisaPoints(hydrometer){
    if (!hydrometer || !Array.isArray(hydrometer.points) || !hydrometer.points.length) return [];
    return hydrometer.points.map(normalizePoint).filter(Boolean).sort((a,b) => a.degree - b.degree || a.kisa - b.kisa);
  }
  function getKisaCandidates(reading, hydrometer){
    if (!Number.isFinite(reading)) return [];
    const points = getRegisteredKisaPoints(hydrometer);
    if (!points.length) return [];
    const withDistance = points.map((p) => ({ degree:p.degree, kisa:p.kisa, distance:Math.abs(reading - p.degree) }));
    const min = Math.min.apply(null, withDistance.map(p => p.distance));
    return withDistance.filter(p => Math.abs(p.distance - min) < 1e-9).sort((a,b) => a.degree - b.degree || a.kisa - b.kisa);
  }
  function candidateKey(c){ return c ? String(c.degree) + ':' + roundTo(c.kisa, 2).toFixed(2) : ''; }
  function renderCandidates(points){
    el.candidates.innerHTML = '';
    if (!points.length) {
      const div = document.createElement('div');
      div.className = 'candidate-empty';
      div.textContent = 'この浮標には器差候補が登録されていません。';
      el.candidates.appendChild(div);
      activeCandidateKey = '';
      return;
    }
    const list = document.createElement('div');
    list.className = 'candidate-list';
    points.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kisa-candidate-btn';
      const key = candidateKey(c);
      btn.dataset.kisa = String(c.kisa);
      btn.dataset.key = key;
      btn.textContent = formatDegree(c.degree) + '%時：' + formatSigned(c.kisa, 2) + '%';
      btn.classList.toggle('is-active', key === activeCandidateKey);
      btn.addEventListener('click', () => {
        activeCandidateKey = key;
        manualKisaTouched = true;
        el.kisa.value = c.kisa.toFixed(2);
        updateAll();
      });
      list.appendChild(btn);
    });
    el.candidates.appendChild(list);
  }
  function pickDefaultCandidate(reading, candidates){
    if (!Number.isFinite(reading)) {
      if (!manualKisaTouched) {
        el.kisa.value = '';
        activeCandidateKey = '';
      }
      return;
    }
    if (manualKisaTouched) return;
    if (candidates.length === 1) {
      el.kisa.value = candidates[0].kisa.toFixed(2);
      activeCandidateKey = candidateKey(candidates[0]);
    } else {
      el.kisa.value = '';
      activeCandidateKey = '';
    }
  }
  function saveInputs(){
    safeSet(STORAGE_KEYS.lastInputs, JSON.stringify({
      reading: el.reading.value,
      temp: el.temp.value,
      kisa: el.kisa.value,
      candidateKey: activeCandidateKey,
      hydrometer: el.hydrometer.value
    }));
  }
  function restoreInputs(){
    const raw = safeGet(STORAGE_KEYS.lastInputs);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        if (saved.hydrometer && hydrometers.some(h => h.id === saved.hydrometer)) el.hydrometer.value = saved.hydrometer;
        if (saved.reading != null) el.reading.value = String(saved.reading);
        if (saved.temp != null) el.temp.value = String(saved.temp);
        if (saved.kisa != null) el.kisa.value = String(saved.kisa);
        if (saved.candidateKey != null) activeCandidateKey = String(saved.candidateKey);
        if (String(el.kisa.value || '').trim()) manualKisaTouched = true;
      }
    } catch(_err) {}
  }
  function showError(message){
    el.error.textContent = message || '';
    el.error.hidden = !message;
  }
  function setEditorStatus(message, type){
    if (!el.editorStatus) return;
    el.editorStatus.textContent = message || '';
    el.editorStatus.classList.remove('is-ok', 'is-error');
    if (type) el.editorStatus.classList.add(type === 'error' ? 'is-error' : 'is-ok');
  }
  function updateTableLink(corrected, temp){
    const params = new URLSearchParams();
    if (Number.isFinite(corrected)) params.set('abv', roundTo(corrected, 2).toFixed(2));
    if (Number.isFinite(temp)) params.set('temp', roundTo(temp, 1).toFixed(1));
    params.set('back', 'alcohol-conversion.html');
    el.tableLink.href = './docs-view.html?' + params.toString();
  }
  function updateResult(corrected){
    if (Number.isFinite(corrected)) {
      el.correctedCard.hidden = false;
      el.corrected.textContent = formatPlain(roundTo(corrected, 2), 2);
      return;
    }
    el.correctedCard.hidden = true;
    el.corrected.textContent = '—';
  }
  function valueEntered(input){ return !!String(input && input.value || '').trim(); }
  function buildErrorMessage(reading, temp, kisa, hydrometer, corrected){
    const hasReading = valueEntered(el.reading);
    const hasTemp = valueEntered(el.temp);
    const hasKisa = valueEntered(el.kisa);
    if (hasReading && !Number.isFinite(reading)) return '測定度数を確認してください。';
    if (hasTemp && !Number.isFinite(temp)) return '測定温度を確認してください。';
    if (hasKisa && !Number.isFinite(kisa)) return '器差を確認してください。';
    if (hasReading && hydrometer && Number.isFinite(reading) && (reading < Number(hydrometer.min) || reading > Number(hydrometer.max))) {
      return '選択中の浮標範囲外です。';
    }
    if (hasReading && hasTemp && hasKisa && (!Number.isFinite(corrected) || corrected < 0 || corrected > 100)) return '補正後示度が表の範囲外です。';
    if (hasTemp && Number.isFinite(temp) && (temp < 0 || temp > 35)) return '測定温度が表の範囲外です。';
    return '';
  }
  function updateAll(){
    const reading = numberValue(el.reading);
    const temp = numberValue(el.temp);
    const hydrometer = selectedHydrometer();
    const points = getRegisteredKisaPoints(hydrometer);
    const hydrometerInRange = !!(hydrometer && Number.isFinite(reading) && reading >= Number(hydrometer.min) && reading <= Number(hydrometer.max));
    const candidates = hydrometerInRange ? getKisaCandidates(reading, hydrometer) : [];
    if (hydrometerInRange) {
      pickDefaultCandidate(reading, candidates);
    } else if (!manualKisaTouched) {
      el.kisa.value = '';
      activeCandidateKey = '';
    }
    renderCandidates(points);
    const kisa = numberValue(el.kisa);
    const corrected = Number.isFinite(reading) && Number.isFinite(kisa) && hydrometerInRange ? reading - kisa : NaN;
    updateTableLink(corrected, temp);
    updateResult(corrected);
    showError(buildErrorMessage(reading, temp, kisa, hydrometer, corrected));
    saveInputs();
  }
  function fillEditorFromHydrometer(hydrometer){
    if (!hydrometer || !el.editorLabel) return;
    el.editorLabel.value = hydrometer.label || '';
    el.editorMin.value = Number.isFinite(Number(hydrometer.min)) ? String(hydrometer.min) : '';
    el.editorMax.value = Number.isFinite(Number(hydrometer.max)) ? String(hydrometer.max) : '';
    const points = getRegisteredKisaPoints(hydrometer);
    el.editorPoints.forEach((input, index) => {
      input.value = points[index] ? String(points[index].degree) : '';
    });
    el.editorKisas.forEach((input, index) => {
      input.value = points[index] ? points[index].kisa.toFixed(2) : '';
    });
    setEditorStatus('', '');
  }
  function readEditorHydrometer(existingId){
    const label = clampString(el.editorLabel.value);
    const min = numberValue(el.editorMin);
    const max = numberValue(el.editorMax);
    if (!label) return {error:'浮標名を入力してください。'};
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 100 || min >= max) return {error:'浮標の下限%・上限%を確認してください。'};
    const points = [];
    for (let i = 0; i < Math.max(el.editorPoints.length, el.editorKisas.length); i += 1) {
      const pRaw = el.editorPoints[i] ? String(el.editorPoints[i].value || '').trim() : '';
      const kRaw = el.editorKisas[i] ? String(el.editorKisas[i].value || '').trim() : '';
      if (!pRaw && !kRaw) continue;
      if (!pRaw || !kRaw) return {error:'検定点%と器差補正%はセットで入力してください。'};
      const degree = parseNumberText(pRaw);
      const kisa = parseNumberText(kRaw);
      if (!Number.isFinite(degree) || degree < min || degree > max) return {error:'検定点%は浮標の範囲内で入力してください。'};
      if (!Number.isFinite(kisa) || kisa < -5 || kisa > 5) return {error:'器差補正%を確認してください。'};
      points.push({degree:roundTo(degree, 1), kisa:roundTo(kisa, 2)});
    }
    if (!points.length) return {error:'検定点%と器差補正%を1組以上入力してください。'};
    return {hydrometer:{
      id: existingId || uniqueId(),
      label,
      min:roundTo(min, 1),
      max:roundTo(max, 1),
      inspectionDate:'',
      nextInspectionGuide:'',
      status:'using',
      points:sortPoints(points)
    }};
  }
  function resetSelectionState(){
    manualKisaTouched = false;
    activeCandidateKey = '';
    el.kisa.value = '';
  }
  function saveCurrentHydrometer(){
    const current = selectedHydrometer();
    if (!current) return;
    const result = readEditorHydrometer(current.id);
    if (result.error) { setEditorStatus(result.error, 'error'); return; }
    hydrometers = hydrometers.map(h => h.id === current.id ? result.hydrometer : h);
    saveHydrometers();
    populateHydrometerOptions(result.hydrometer.id);
    fillEditorFromHydrometer(selectedHydrometer());
    resetSelectionState();
    updateAll();
    setEditorStatus('保存しました。', 'ok');
  }
  function addHydrometerFromEditor(){
    const result = readEditorHydrometer(uniqueId());
    if (result.error) { setEditorStatus(result.error, 'error'); return; }
    let baseLabel = result.hydrometer.label;
    const labels = new Set(hydrometers.map(h => h.label));
    if (labels.has(baseLabel)) {
      let i = 2;
      while (labels.has(baseLabel + ' ' + i)) i += 1;
      result.hydrometer.label = baseLabel + ' ' + i;
    }
    hydrometers.push(result.hydrometer);
    saveHydrometers();
    populateHydrometerOptions(result.hydrometer.id);
    fillEditorFromHydrometer(selectedHydrometer());
    resetSelectionState();
    updateAll();
    setEditorStatus('新しい浮標として追加しました。', 'ok');
  }
  function deleteCurrentHydrometer(){
    const current = selectedHydrometer();
    if (!current) return;
    if (hydrometers.length <= 1) { setEditorStatus('最後の1本は削除できません。', 'error'); return; }
    hydrometers = hydrometers.filter(h => h.id !== current.id);
    saveHydrometers();
    safeRemove(STORAGE_KEYS.lastHydrometer);
    populateHydrometerOptions(hydrometers[0] && hydrometers[0].id);
    fillEditorFromHydrometer(selectedHydrometer());
    resetSelectionState();
    updateAll();
    setEditorStatus('削除しました。', 'ok');
  }
  function restoreDefaultHydrometers(){
    hydrometers = cloneDefaults();
    saveHydrometers();
    safeRemove(STORAGE_KEYS.lastHydrometer);
    populateHydrometerOptions(hydrometers[0] && hydrometers[0].id);
    fillEditorFromHydrometer(selectedHydrometer());
    resetSelectionState();
    updateAll();
    setEditorStatus('初期浮標に戻しました。', 'ok');
  }
  function resetAll(){
    resetSelectionState();
    el.reading.value = '';
    el.temp.value = '';
    updateAll();
  }
  function bindEvents(){
    el.reading.addEventListener('input', () => {
      manualKisaTouched = false;
      activeCandidateKey = '';
      updateAll();
    });
    el.reading.addEventListener('change', updateAll);
    el.temp.addEventListener('input', updateAll);
    el.temp.addEventListener('change', updateAll);
    if (el.kisa && el.kisa.type !== 'hidden') {
      el.kisa.addEventListener('input', () => { manualKisaTouched = true; activeCandidateKey = ''; updateAll(); });
      el.kisa.addEventListener('change', updateAll);
    }
    el.hydrometer.addEventListener('change', () => {
      safeSet(STORAGE_KEYS.lastHydrometer, el.hydrometer.value);
      resetSelectionState();
      fillEditorFromHydrometer(selectedHydrometer());
      updateAll();
    });
    el.reset.addEventListener('click', resetAll);
    if (el.editorSave) el.editorSave.addEventListener('click', saveCurrentHydrometer);
    if (el.editorAdd) el.editorAdd.addEventListener('click', addHydrometerFromEditor);
    if (el.editorDelete) el.editorDelete.addEventListener('click', deleteCurrentHydrometer);
    if (el.editorDefaults) el.editorDefaults.addEventListener('click', restoreDefaultHydrometers);
  }
  function init(){
    hydrometers = normalizeHydrometers(hydrometers);
    if (!hydrometers.length) hydrometers = cloneDefaults();
    saveHydrometers();
    populateHydrometerOptions();
    restoreInputs();
    fillEditorFromHydrometer(selectedHydrometer());
    bindEvents();
    updateAll();
  }
  init();
})();
