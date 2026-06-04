(function(){
  'use strict';

  const STORAGE_KEYS = {
    hydrometers: 'sake_alcohol_conversion_hydrometer_master_v1',
    hydrometerBackup: 'sake_alcohol_conversion_hydrometer_backup_v1',
    lastHydrometer: 'sake_alcohol_conversion_last_hydrometer_v1',
    lastInputs: 'sake_alcohol_conversion_last_inputs_v1',
    uiState: 'sake_alcohol_conversion_ui_state_v1'
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
    txtExportCurrent: document.getElementById('alcohol-conversion-txt-export-current'),
    txtExportEmpty: document.getElementById('alcohol-conversion-txt-export-empty'),
    txtExportBackup: document.getElementById('alcohol-conversion-txt-export-backup'),
    txtFile: document.getElementById('alcohol-conversion-txt-file'),
    txtApply: document.getElementById('alcohol-conversion-txt-apply'),
    txtRestoreBackup: document.getElementById('alcohol-conversion-txt-restore-backup'),
    txtStatus: document.getElementById('alcohol-conversion-txt-status'),
    txtPreview: document.getElementById('alcohol-conversion-txt-preview'),
    txtPreviewSummary: document.getElementById('alcohol-conversion-txt-preview-summary'),
    txtPreviewList: document.getElementById('alcohol-conversion-txt-preview-list')
  };

  let hydrometers = loadHydrometers();
  let manualKisaTouched = false;
  let activeCandidateKey = '';
  let hydrometerRenderToken = 0;
  let txtReviewMode = false;
  let txtReviewSource = '';
  let txtPendingHydrometers = [];

  // 2026-05-28: 15℃補正後アルコール分の自動計算は停止中。
  // この画面では補正後示度までを出し、横田表画像へ確認位置を渡す。
  // 2026-05-30: 使用浮標と器差補正は、端末内の登録値として保持する。
  // 2026-05-30: 浮標・器差設定の.txt書き出し、.txt読み込み、確認後登録、変更前復元を追加。
  // 2026-06-04 reload1: リロード時は、測定入力と設定画面の開閉だけ復帰し、未登録の.txt読み込み確認状態は復帰しない。
  // 2026-06-04 txtfile1: アプリ内編集を通常導線から外し、.txtファイル読込・確認・登録・書き出しへ一本化。
  // 2026-06-04 kisanone1: 全浮標に器差補正なし（0.00%）を用意し、検定していない度数帯は補正なしで扱えるようにする。
  // 2026-06-04 kisamanual1: 器差補正の自動選択を停止し、人間が候補を選ぶまで補正後示度を出さないようにする。

  function safeGet(key){ try { return localStorage.getItem(key); } catch(_err){ return ''; } }
  function safeSet(key, value){ try { localStorage.setItem(key, value); } catch(_err){} }
  function safeRemove(key){ try { localStorage.removeItem(key); } catch(_err){} }
  function cloneDefaults(){ return JSON.parse(JSON.stringify(DEFAULT_HYDROMETERS)); }
  function cloneHydrometers(list){ return JSON.parse(JSON.stringify(Array.isArray(list) ? list : [])); }
  function nowStamp(){
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function todayYmd(){
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return String(d.getFullYear()) + pad(d.getMonth() + 1) + pad(d.getDate());
  }
  function clampString(value){ return String(value == null ? '' : value).trim(); }
  function normalizeNumberText(value){
    return String(value == null ? '' : value)
      .trim()
      .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .replace(/[＋]/g, '+')
      .replace(/[－−ー―]/g, '-')
      .replace(/[．。]/g, '.')
      .replace(/[，、]/g, '.')
      .replace(/[％]/g, '%')
      .replace(/\s+/g, '');
  }
  function parseNumberText(value){
    let raw = normalizeNumberText(value).replace(/%$/,'');
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
  function saveHydrometers(options){
    hydrometers = normalizeHydrometers(hydrometers);
    if (!hydrometers.length) hydrometers = cloneDefaults();
    if (!options || options.persist !== false) safeSet(STORAGE_KEYS.hydrometers, JSON.stringify(hydrometers));
  }
  function loadStoredHydrometers(){
    const raw = safeGet(STORAGE_KEYS.hydrometers);
    if (!raw) return cloneDefaults();
    try {
      const normalized = normalizeHydrometers(JSON.parse(raw));
      return normalized.length ? normalized : cloneDefaults();
    } catch(_err) {
      return cloneDefaults();
    }
  }
  function saveHydrometerBackup(reason, list){
    const normalized = normalizeHydrometers(cloneHydrometers(list));
    if (!normalized.length) return false;
    safeSet(STORAGE_KEYS.hydrometerBackup, JSON.stringify({
      createdAt: nowStamp(),
      reason: reason || '登録前',
      hydrometers: normalized
    }));
    return true;
  }
  function loadHydrometerBackup(){
    const raw = safeGet(STORAGE_KEYS.hydrometerBackup);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const normalized = normalizeHydrometers(parsed && parsed.hydrometers);
      if (!normalized.length) return null;
      return {
        createdAt: clampString(parsed.createdAt),
        reason: clampString(parsed.reason),
        hydrometers: normalized
      };
    } catch(_err) {
      return null;
    }
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
    if (el.hydrometer.value && !txtReviewMode) safeSet(STORAGE_KEYS.lastHydrometer, el.hydrometer.value);
  }
  function getRegisteredKisaPoints(hydrometer){
    if (!hydrometer || !Array.isArray(hydrometer.points) || !hydrometer.points.length) return [];
    return hydrometer.points.map(normalizePoint).filter(Boolean).sort((a,b) => a.degree - b.degree || a.kisa - b.kisa);
  }
  function getKisaCandidates(reading, hydrometer){
    if (!Number.isFinite(reading)) return [];
    const points = getRegisteredKisaPoints(hydrometer);
    if (!points.length) return [];
    const roundedReading = roundTo(reading, 1);
    return points
      .filter(p => Math.abs(roundTo(p.degree, 1) - roundedReading) < 1e-9)
      .sort((a,b) => a.degree - b.degree || a.kisa - b.kisa);
  }
  function noKisaCandidate(){ return {degree:null, kisa:0, isNoKisa:true}; }
  function candidateKey(c){
    if (c && c.isNoKisa) return 'none:0.00';
    return c ? String(c.degree) + ':' + roundTo(c.kisa, 2).toFixed(2) : '';
  }
  function candidateText(c){
    if (c && c.isNoKisa) return '器差補正なし：0.00%';
    return formatDegree(c.degree) + '%時：' + formatSigned(c.kisa, 2) + '%';
  }
  function setKisaCandidate(c){
    activeCandidateKey = candidateKey(c);
    manualKisaTouched = true;
    el.kisa.value = roundTo(c.kisa, 2).toFixed(2);
    updateAll();
  }
  function renderCandidates(points){
    el.candidates.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'candidate-list';
    [noKisaCandidate()].concat(Array.isArray(points) ? points : []).forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kisa-candidate-btn';
      const key = candidateKey(c);
      btn.dataset.kisa = String(c.kisa);
      btn.dataset.key = key;
      btn.textContent = candidateText(c);
      btn.classList.toggle('is-none', !!c.isNoKisa);
      btn.classList.toggle('is-active', key === activeCandidateKey);
      btn.addEventListener('click', () => setKisaCandidate(c));
      list.appendChild(btn);
    });
    el.candidates.appendChild(list);
    if (!points.length) {
      const div = document.createElement('div');
      div.className = 'candidate-empty';
      div.textContent = '登録済みの器差候補はありません。必要な場合は浮標・器差設定のtxtを更新してください。';
      el.candidates.appendChild(div);
    }
  }
  function clearKisaIfNotTouched(){
    if (manualKisaTouched) return;
    el.kisa.value = '';
    activeCandidateKey = '';
  }
  function saveInputs(){
    if (txtReviewMode) return;
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
  function loadUiState(){
    const raw = safeGet(STORAGE_KEYS.uiState);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch(_err) {
      return {};
    }
  }
  function saveUiState(){
    safeSet(STORAGE_KEYS.uiState, JSON.stringify({
      editorOpen: !!(el.editor && el.editor.open)
    }));
  }
  function restoreUiState(){
    const state = loadUiState();
    if (el.editor && typeof state.editorOpen === 'boolean') el.editor.open = state.editorOpen;
  }
  function clearTransientTxtState(){
    txtPendingHydrometers = [];
    if (el.txtFile) { try { el.txtFile.value = ''; } catch(_err) {} }
    setTxtReviewMode(false, '');
    renderTxtPreview([]);
    setTxtStatus('', '');
  }
  function showError(message){
    el.error.textContent = message || '';
    el.error.hidden = !message;
  }
  function setTxtStatus(message, type){
    if (!el.txtStatus) return;
    el.txtStatus.textContent = message || '';
    el.txtStatus.classList.remove('is-ok', 'is-error', 'is-warn');
    if (type) el.txtStatus.classList.add(type === 'error' ? 'is-error' : type === 'warn' ? 'is-warn' : 'is-ok');
  }
  function setTxtReviewMode(active, source){
    txtReviewMode = !!active;
    txtReviewSource = txtReviewMode ? (source || '.txt読込') : '';
    if (el.txtApply) el.txtApply.disabled = !txtReviewMode;
    if (el.editor) el.editor.classList.toggle('is-txt-review', txtReviewMode);
  }
  function renderTxtPreview(list){
    const hyds = normalizeHydrometers(list);
    if (el.txtPreview) el.txtPreview.hidden = !hyds.length;
    if (el.txtPreviewSummary) {
      el.txtPreviewSummary.textContent = hyds.length ? hyds.length + '本を読み取りました。登録すると現在の浮標一覧を丸ごと置き換えます。' : '';
    }
    if (!el.txtPreviewList) return;
    el.txtPreviewList.innerHTML = '';
    hyds.forEach((h) => {
      const card = document.createElement('div');
      card.className = 'alcohol-conversion-txt-preview-item';
      const title = document.createElement('div');
      title.className = 'alcohol-conversion-txt-preview-title';
      title.textContent = h.label + '（' + formatDegree(h.min) + '〜' + formatDegree(h.max) + '%）';
      const points = document.createElement('div');
      points.className = 'alcohol-conversion-txt-preview-points';
      const pointText = getRegisteredKisaPoints(h).map((p) => formatDegree(p.degree) + '%時 ' + formatSigned(p.kisa, 2) + '%').join(' / ');
      points.textContent = pointText || '器差候補なし';
      card.appendChild(title);
      card.appendChild(points);
      el.txtPreviewList.appendChild(card);
    });
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
    const hydrometerInRange = !!(hasReading && hydrometer && Number.isFinite(reading) && reading >= Number(hydrometer.min) && reading <= Number(hydrometer.max));
    if (hasReading && !Number.isFinite(reading)) return '測定度数を確認してください。';
    if (hasTemp && !Number.isFinite(temp)) return '測定温度を確認してください。';
    if (hasKisa && !Number.isFinite(kisa)) return '器差を確認してください。';
    if (hasReading && hydrometer && Number.isFinite(reading) && (reading < Number(hydrometer.min) || reading > Number(hydrometer.max))) {
      return '選択中の浮標範囲外です。';
    }
    if (hasReading && hasTemp && hydrometerInRange && !hasKisa) return '器差補正を選んでください。';
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
    clearKisaIfNotTouched();
    renderCandidates(points);
    const kisa = numberValue(el.kisa);
    const corrected = Number.isFinite(reading) && Number.isFinite(kisa) && hydrometerInRange ? reading - kisa : NaN;
    updateTableLink(corrected, temp);
    updateResult(corrected);
    showError(buildErrorMessage(reading, temp, kisa, hydrometer, corrected));
    saveInputs();
  }
  function txtNumber(n, digits, signed){
    if (!Number.isFinite(Number(n))) return '';
    const fixed = Number(n).toFixed(digits);
    return signed && Number(n) > 0 ? '+' + fixed : fixed;
  }
  function buildHydrometerTxt(list, options){
    const hyds = normalizeHydrometers(list);
    const empty = options && options.empty;
    const lines = [
      '# 浮標・器差設定',
      '# 浮標を増やす場合は、【浮標】のまとまりをコピーして下に追加します。',
      '# 浮標を消す場合は、その【浮標】のまとまりを削除します。',
      '# 浮標名、下限（%）、上限（%）は必須です。',
      '# 検定位置と器差補正はセットで入力します。使わない行は空欄のままでよいです。',
      '# 器差補正に「±」は使えません。+0.02 / -0.02 / 0.00 のように書いてください。',
      '# 検定していない度数帯は、アプリ画面で「器差補正なし」を選びます。',
      '# 読み込むと、現在の浮標一覧を丸ごと置き換える確認状態になります。',
      ''
    ];
    const source = empty ? [{label:'', min:'', max:'', points:[]}] : hyds;
    source.forEach((h) => {
      const points = getRegisteredKisaPoints(h);
      lines.push('【浮標】');
      lines.push('浮標名：' + (h.label || ''));
      lines.push('下限（%）：' + txtNumber(h.min, 1, false));
      lines.push('上限（%）：' + txtNumber(h.max, 1, false));
      for (let i = 0; i < 5; i += 1) {
        const p = points[i] || null;
        const mark = ['①','②','③','④','⑤'][i];
        lines.push('検定位置' + mark + '（%）：' + (p ? txtNumber(p.degree, 1, false) : ''));
        lines.push('器差補正' + mark + '（%）：' + (p ? txtNumber(p.kisa, 2, true) : ''));
      }
      lines.push('');
    });
    return lines.join('\n');
  }
  function txtFileName(){ return '浮標_器差設定_' + todayYmd() + '.txt'; }
  function downloadTextFile(text, fileName){
    if (!text) return;
    try {
      if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL && document.body) {
        const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || txtFileName();
        a.style.display = 'none';
        document.body.appendChild(a);
        if (typeof a.click === 'function') a.click();
        if (a.parentNode && a.parentNode.removeChild) a.parentNode.removeChild(a);
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch(_err){} }, 500);
        setTxtStatus((fileName || txtFileName()) + ' を作成しました。外部で編集してから「txtファイルを選ぶ」で読み込んでください。', 'ok');
        return;
      }
    } catch(_err) {}
    setTxtStatus('この環境では.txtファイルを作成できませんでした。PCのブラウザなどで再度試してください。', 'error');
  }
  function keyIndex(raw){
    const map = {'①':1,'②':2,'③':3,'④':4,'⑤':5,'１':1,'２':2,'３':3,'４':4,'５':5,'1':1,'2':2,'3':3,'4':4,'5':5};
    return map[String(raw || '')] || 0;
  }
  function parseTxtNumber(raw, label, errors, blockNo){
    const original = String(raw == null ? '' : raw).trim();
    if (!original) return null;
    if (/[±∓]/.test(original)) {
      errors.push(blockNo + '本目の' + label + 'に「±」があります。+ または - が分かる形で入力してください。');
      return NaN;
    }
    const normalized = normalizeNumberText(original).replace(/%$/,'');
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
      errors.push(blockNo + '本目の' + label + 'を数値として読めません。');
      return NaN;
    }
    const n = Number(normalized);
    if (!Number.isFinite(n)) errors.push(blockNo + '本目の' + label + 'を数値として読めません。');
    return n;
  }
  function parseHydrometerTxt(text){
    const errors = [];
    const rawText = String(text == null ? '' : text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (!rawText.trim()) return {errors:['.txtの内容が空です。']};
    const lines = rawText.split('\n');
    const blocks = [];
    let current = null;
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      if (trimmed === '【浮標】') {
        current = {line:idx + 1, rows:[]};
        blocks.push(current);
        return;
      }
      if (!current) {
        errors.push((idx + 1) + '行目：先に【浮標】を書いてください。');
        return;
      }
      current.rows.push({line:idx + 1, text:trimmed});
    });
    if (!blocks.length) errors.push('【浮標】のまとまりが見つかりません。');
    const hyds = [];
    blocks.forEach((block, blockIndex) => {
      const blockNo = blockIndex + 1;
      const fields = {label:'', min:'', max:'', points:{}};
      block.rows.forEach((row) => {
        const m = row.text.match(/^([^:：]+)[:：](.*)$/);
        if (!m) {
          errors.push(row.line + '行目：項目名と内容を「：」で分けてください。');
          return;
        }
        const key = m[1].trim();
        const value = m[2].trim();
        const simple = key.replace(/[\s　（）()％%]/g, '');
        if (simple === '浮標名') fields.label = value;
        else if (simple === '下限') fields.min = value;
        else if (simple === '上限') fields.max = value;
        else {
          const pos = simple.match(/^検定(?:位置|点)([①②③④⑤１２３４５1-5])$/);
          const kisa = simple.match(/^器差補正([①②③④⑤１２３４５1-5])$/);
          if (pos) {
            const idx = keyIndex(pos[1]);
            fields.points[idx] = fields.points[idx] || {};
            fields.points[idx].degree = value;
          } else if (kisa) {
            const idx = keyIndex(kisa[1]);
            fields.points[idx] = fields.points[idx] || {};
            fields.points[idx].kisa = value;
          } else {
            errors.push(row.line + '行目：読めない項目です。' + key);
          }
        }
      });
      const label = clampString(fields.label);
      if (!label) errors.push(blockNo + '本目の浮標名が空欄です。');
      if (!String(fields.min).trim()) errors.push(blockNo + '本目の下限（%）が空欄です。');
      if (!String(fields.max).trim()) errors.push(blockNo + '本目の上限（%）が空欄です。');
      const min = parseTxtNumber(fields.min, '下限（%）', errors, blockNo);
      const max = parseTxtNumber(fields.max, '上限（%）', errors, blockNo);
      const points = [];
      Object.keys(fields.points).sort((a,b) => Number(a) - Number(b)).forEach((idx) => {
        const row = fields.points[idx] || {};
        const pRaw = String(row.degree == null ? '' : row.degree).trim();
        const kRaw = String(row.kisa == null ? '' : row.kisa).trim();
        if (!pRaw && !kRaw) return;
        if (!pRaw || !kRaw) {
          errors.push(blockNo + '本目の検定位置' + idx + 'と器差補正' + idx + 'はセットで入力してください。');
          return;
        }
        const degree = parseTxtNumber(pRaw, '検定位置' + idx + '（%）', errors, blockNo);
        const kisa = parseTxtNumber(kRaw, '器差補正' + idx + '（%）', errors, blockNo);
        if (Number.isFinite(degree) && Number.isFinite(min) && Number.isFinite(max) && (degree < min || degree > max)) {
          errors.push(blockNo + '本目の検定位置' + idx + '（%）が浮標範囲外です。');
        }
        if (Number.isFinite(kisa) && (kisa < -5 || kisa > 5)) errors.push(blockNo + '本目の器差補正' + idx + '（%）を確認してください。');
        if (Number.isFinite(degree) && Number.isFinite(kisa)) points.push({degree:roundTo(degree, 1), kisa:roundTo(kisa, 2)});
      });
      if (Number.isFinite(min) && Number.isFinite(max) && min >= max) errors.push(blockNo + '本目の下限（%）と上限（%）を確認してください。');
      if (!points.length) errors.push(blockNo + '本目の検定位置と器差補正を1組以上入力してください。');
      if (!errors.length || (label && Number.isFinite(min) && Number.isFinite(max) && points.length)) {
        hyds.push({
          id: uniqueId(),
          label,
          min: roundTo(min, 1),
          max: roundTo(max, 1),
          inspectionDate:'',
          nextInspectionGuide:'',
          status:'using',
          points: sortPoints(points)
        });
      }
    });
    const seen = new Set();
    hyds.forEach((h) => {
      const key = h.label;
      if (seen.has(key)) errors.push('同じ浮標名が複数あります：' + key);
      seen.add(key);
    });
    if (errors.length) return {errors};
    return {hydrometers: normalizeHydrometers(hyds)};
  }
  function loadTxtIntoReview(text, sourceLabel){
    const parsed = parseHydrometerTxt(text);
    if (parsed.errors && parsed.errors.length) {
      txtPendingHydrometers = [];
      setTxtReviewMode(false, '');
      renderTxtPreview([]);
      setTxtStatus(parsed.errors.slice(0, 5).join(' / ') + (parsed.errors.length > 5 ? ' / ほか' + (parsed.errors.length - 5) + '件' : ''), 'error');
      return;
    }
    txtPendingHydrometers = normalizeHydrometers(parsed.hydrometers);
    setTxtReviewMode(true, sourceLabel || '.txt読込');
    renderTxtPreview(txtPendingHydrometers);
    if (el.editor) el.editor.open = true;
    setTxtStatus(txtPendingHydrometers.length + '本を読み取りました。まだ登録していません。内容を確認してから「このtxtの内容で登録する」を押してください。', 'warn');
  }
  function exportCurrentTxt(){
    downloadTextFile(buildHydrometerTxt(loadStoredHydrometers()), txtFileName());
  }
  function exportEmptyTxt(){
    downloadTextFile(buildHydrometerTxt([], {empty:true}), '浮標_器差入力用_' + todayYmd() + '.txt');
  }
  function exportBackupTxt(){
    const backup = loadHydrometerBackup();
    if (!backup) { setTxtStatus('変更前の登録内容がまだありません。', 'error'); return; }
    downloadTextFile(buildHydrometerTxt(backup.hydrometers), '浮標_器差設定_変更前_' + todayYmd() + '.txt');
  }
  function applyTxtHydrometers(){
    if (!txtReviewMode || !txtPendingHydrometers.length) { setTxtStatus('登録する読み込み内容がありません。', 'error'); return; }
    saveHydrometerBackup(txtReviewSource || '.txt登録前', loadStoredHydrometers());
    hydrometers = cloneHydrometers(txtPendingHydrometers);
    saveHydrometers();
    txtPendingHydrometers = [];
    setTxtReviewMode(false, '');
    renderTxtPreview([]);
    safeRemove(STORAGE_KEYS.lastHydrometer);
    populateHydrometerOptions(hydrometers[0] && hydrometers[0].id);
    resetSelectionState();
    updateAll();
    setTxtStatus('このtxtの内容で登録しました。変更前の登録内容はアプリ内に1件保存しています。', 'ok');
  }
  function restoreBackupHydrometers(){
    const backup = loadHydrometerBackup();
    if (!backup) { setTxtStatus('変更前の登録内容がまだありません。', 'error'); return; }
    hydrometers = cloneHydrometers(backup.hydrometers);
    saveHydrometers();
    txtPendingHydrometers = [];
    setTxtReviewMode(false, '');
    renderTxtPreview([]);
    safeRemove(STORAGE_KEYS.lastHydrometer);
    populateHydrometerOptions(hydrometers[0] && hydrometers[0].id);
    resetSelectionState();
    updateAll();
    setTxtStatus('変更前の登録内容に戻しました。保存日時：' + (backup.createdAt || '不明') + ' / 理由：' + (backup.reason || '不明'), 'ok');
  }
  function handleTxtFileChange(evt){
    const fileInput = evt && evt.target;
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (!file) return;
    if (typeof FileReader === 'undefined') { setTxtStatus('この環境ではtxtファイル読み込みを使えません。', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      loadTxtIntoReview(text, '.txt読込前');
      try { if (fileInput) fileInput.value = ''; } catch(_err) {}
    };
    reader.onerror = () => setTxtStatus('.txtファイルを読めませんでした。', 'error');
    reader.readAsText(file, 'UTF-8');
  }

  function resetSelectionState(){
    manualKisaTouched = false;
    activeCandidateKey = '';
    el.kisa.value = '';
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
      if (!txtReviewMode) safeSet(STORAGE_KEYS.lastHydrometer, el.hydrometer.value);
      resetSelectionState();
      updateAll();
    });
    el.reset.addEventListener('click', resetAll);
    if (el.txtExportCurrent) el.txtExportCurrent.addEventListener('click', exportCurrentTxt);
    if (el.txtExportEmpty) el.txtExportEmpty.addEventListener('click', exportEmptyTxt);
    if (el.txtExportBackup) el.txtExportBackup.addEventListener('click', exportBackupTxt);
    if (el.txtApply) el.txtApply.addEventListener('click', applyTxtHydrometers);
    if (el.txtRestoreBackup) el.txtRestoreBackup.addEventListener('click', restoreBackupHydrometers);
    if (el.txtFile) el.txtFile.addEventListener('change', handleTxtFileChange);
    if (el.editor) el.editor.addEventListener('toggle', saveUiState);
  }
  function init(){
    hydrometers = normalizeHydrometers(hydrometers);
    if (!hydrometers.length) hydrometers = cloneDefaults();
    saveHydrometers();
    populateHydrometerOptions();
    restoreInputs();
    setTxtReviewMode(false, '');
    clearTransientTxtState();
    restoreUiState();
    bindEvents();
    updateAll();
  }
  init();
})();
