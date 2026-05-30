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
    tableLink: document.getElementById('alcohol-conversion-open-table')
  };

  let hydrometers = loadHydrometers();
  let manualKisaTouched = false;
  let activeCandidateKey = '';

  // 2026-05-28: 15℃補正後アルコール分の自動計算は停止中。
  // この画面では補正後示度までを出し、横田表画像へ確認位置を渡す。

  function safeSet(key, value){ try { localStorage.setItem(key, value); } catch(_err){} }
  function cloneDefaults(){ return JSON.parse(JSON.stringify(DEFAULT_HYDROMETERS)); }
  function loadHydrometers(){
    const raw = safeGet(STORAGE_KEYS.hydrometers);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch(_err) {}
    }
    const defaults = cloneDefaults();
    safeSet(STORAGE_KEYS.hydrometers, JSON.stringify(defaults));
    return defaults;
  }
  function numberValue(input){
    const raw = String(input && input.value || '').trim().replace(/,/g,'.');
    if (!raw) return NaN;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }
  function formatSigned(n, digits){
    if (!Number.isFinite(n)) return '—';
    const fixed = n.toFixed(digits);
    return n > 0 ? '+' + fixed : fixed;
  }
  function formatPlain(n, digits){ return Number.isFinite(n) ? n.toFixed(digits) : '—'; }
  function roundTo(n, digits){
    const m = Math.pow(10, digits);
    return Math.round((n + Number.EPSILON) * m) / m;
  }
  function selectedHydrometer(){
    return hydrometers.find(h => h.id === el.hydrometer.value) || hydrometers[0] || null;
  }
  function populateHydrometerOptions(){
    el.hydrometer.innerHTML = '';
    hydrometers.forEach((h) => {
      const opt = document.createElement('option');
      opt.value = h.id;
      opt.textContent = h.label;
      el.hydrometer.appendChild(opt);
    });
    const last = safeGet(STORAGE_KEYS.lastHydrometer);
    if (last && hydrometers.some(h => h.id === last)) el.hydrometer.value = last;
  }
  function getRegisteredKisaPoints(hydrometer){
    if (!hydrometer || !Array.isArray(hydrometer.points) || !hydrometer.points.length) return [];
    return hydrometer.points.map((p) => ({ degree:Number(p.degree), kisa:Number(p.kisa) }))
      .filter(p => Number.isFinite(p.degree) && Number.isFinite(p.kisa))
      .sort((a,b) => a.degree - b.degree);
  }
  function getKisaCandidates(reading, hydrometer){
    if (!Number.isFinite(reading)) return [];
    const points = getRegisteredKisaPoints(hydrometer);
    if (!points.length) return [];
    const withDistance = points.map((p) => ({ degree:p.degree, kisa:p.kisa, distance:Math.abs(reading - p.degree) }));
    const min = Math.min.apply(null, withDistance.map(p => p.distance));
    return withDistance.filter(p => Math.abs(p.distance - min) < 1e-9).sort((a,b) => a.degree - b.degree);
  }
  function candidateKey(c){ return c ? String(c.degree) + ':' + c.kisa.toFixed(2) : ''; }
  function renderCandidates(points){
    el.candidates.innerHTML = '';
    if (!points.length) {
      const div = document.createElement('div');
      div.className = 'candidate-empty';
      div.textContent = '—';
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
      btn.textContent = formatPlain(c.degree, Number.isInteger(c.degree) ? 0 : 1) + '%時：' + formatSigned(c.kisa, 2) + '%';
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
  function resetAll(){
    manualKisaTouched = false;
    activeCandidateKey = '';
    el.reading.value = '';
    el.temp.value = '';
    el.kisa.value = '';
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
      manualKisaTouched = false;
      activeCandidateKey = '';
      el.kisa.value = '';
      updateAll();
    });
    el.reset.addEventListener('click', resetAll);
  }
  function init(){
    populateHydrometerOptions();
    restoreInputs();
    bindEvents();
    updateAll();
  }
  init();
})();
