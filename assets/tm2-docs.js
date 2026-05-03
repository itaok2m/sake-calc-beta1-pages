(function(){
  const params = new URLSearchParams(window.location.search || '');
  const $ = sel => document.querySelector(sel);
  const titleEl = $('[data-tm2-docs-role="tank-title"]');
  const statusNoteEl = $('[data-tm2-docs-role="status-note"]');
  const summaryGrid = $('[data-tm2-docs-role="summary-grid"]');
  const methodGrid = $('[data-tm2-docs-role="method-grid"]');
  const segmentsCard = $('[data-tm2-docs-role="segments-card"]');
  const segmentsBody = $('[data-tm2-docs-role="segments-body"]');
  const alertsCard = $('[data-tm2-docs-role="alerts-card"]');
  const alertsList = $('[data-tm2-docs-role="alerts-list"]');
  const returnLinks = document.querySelectorAll('[data-tm2-docs-role="return-link"], [data-tm2-docs-role="return-link-2"]');

  function getParam(name){ return params.get(name) || ''; }
  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] || char));
  }
  function numberText(value, suffix){
    if(value === undefined || value === null || String(value).trim() === '') return '—';
    const num = Number(value);
    if(!Number.isFinite(num)) return '—';
    return `${num}${suffix || ''}`;
  }
  function fixedText(value, digits, suffix){
    if(value === undefined || value === null || String(value).trim() === '') return '—';
    const num = Number(value);
    if(!Number.isFinite(num)) return '—';
    return `${num.toFixed(digits)}${suffix || ''}`;
  }
  function decodeMaybe(value){
    if(!value) return '';
    try{ return decodeURIComponent(value); }catch{ return value; }
  }
  function parseSegments(raw){
    if(!raw) return [];
    return String(raw).split('|').map(row => {
      const parts = row.split(',').map(item => Number(item));
      if(parts.length < 5 || parts.some(num => !Number.isFinite(num))) return null;
      const [startDepth, endDepth, startL, endL, recordedPerMm] = parts;
      const span = endDepth - startDepth;
      const calculatedPerMm = span > 0 ? (endL - startL) / span : NaN;
      return { startDepth, endDepth, startL, endL, recordedPerMm, calculatedPerMm };
    }).filter(Boolean);
  }
  function parseAlerts(){
    const alerts = [];
    const rawSegmentAlerts = decodeMaybe(getParam('segmentAlerts'));
    if(rawSegmentAlerts){
      try{
        const parsed = JSON.parse(rawSegmentAlerts);
        if(Array.isArray(parsed)){
          parsed.forEach(item => {
            const note = item && typeof item === 'object' ? String(item.note || '') : '';
            if(note) alerts.push(note);
          });
        }
      }catch{}
    }
    ['auditStatusNote','auditNote','sourceNote'].forEach(key => {
      const value = getParam(key);
      if(value) alerts.push(value);
    });
    return [...new Set(alerts.map(item => String(item).trim()).filter(Boolean))];
  }
  function setReturnLinks(){
    const returnUrl = getParam('returnUrl') || './tm2.html';
    returnLinks.forEach(link => {
      link.setAttribute('href', returnUrl);
    });
  }
  function row(label, value){
    return `<div class="tm2-docs-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }
  function calcModeLabel(calcMode, hasSegments){
    if(calcMode === 'segment_linear') return '区間の始点Lと終点Lから1mm当を再計算';
    if(calcMode === 'segment_recorded') return '区間の記載1mm当をそのまま使う';
    if(hasSegments) return '区間別タンク';
    return '固定1mm当たり計算';
  }
  function boundaryLabel(boundaryMode, hasSegments){
    if(!hasSegments) return '区間切替なし';
    if(boundaryMode === 'next') return '区間の終わりで次の1mm当へ切り替え';
    if(boundaryMode === 'inclusive') return '区間の端も同じ区間値として扱う';
    return '区間別登録に従う';
  }
  function render(){
    setReturnLinks();
    const tankLabel = getParam('tankLabel') || (getParam('tankNo') ? `No.${getParam('tankNo')}` : 'タンク未指定');
    const fullL = getParam('fullL');
    const bottomL = getParam('bottomL');
    const centerMm = getParam('centerMm');
    const perMm = getParam('perMm');
    const calcMode = getParam('calcMode');
    const boundaryMode = getParam('boundaryMode');
    const segments = parseSegments(getParam('segments'));
    const hasSegments = segments.length > 0;

    if(titleEl) titleEl.textContent = tankLabel;
    if(statusNoteEl){
      statusNoteEl.textContent = getParam('tankNo')
        ? '2mm表で選択したタンクの登録値です。確認専用で、保存・記録・タンク現在値更新は行いません。'
        : 'タンク情報が見つかりません。2mm表画面からタンクを選んで開いてください。';
    }

    if(summaryGrid){
      summaryGrid.innerHTML = [
        row('タンク番号', tankLabel),
        row('全容量', numberText(fullL, 'L')),
        row('底板面以下', numberText(bottomL, 'L')),
        row('中心深', numberText(centerMm, 'mm')),
        row('登録方式', hasSegments ? '区間別タンク' : '単一区間タンク'),
        row('記載1mm当', hasSegments ? '区間表を参照' : fixedText(perMm, Math.max(0, Math.min(6, String(perMm || '').split('.')[1]?.length || 0)), 'L'))
      ].join('');
    }

    if(methodGrid){
      methodGrid.innerHTML = [
        row('採用計算', calcModeLabel(calcMode, hasSegments)),
        row('区間境界', boundaryLabel(boundaryMode, hasSegments)),
        row('表示L', '切り捨て表示'),
        row('入力元', '2mm表のタンク選択状態から表示')
      ].join('');
    }

    if(segmentsCard && segmentsBody){
      segmentsCard.hidden = !hasSegments;
      segmentsBody.innerHTML = segments.map(segment => `
        <tr>
          <td>${escapeHtml(`${segment.startDepth}〜${segment.endDepth}mm`)}</td>
          <td>${escapeHtml(`${segment.startL}L`)}</td>
          <td>${escapeHtml(`${segment.endL}L`)}</td>
          <td>${escapeHtml(fixedText(segment.recordedPerMm, 6, 'L'))}</td>
          <td>${escapeHtml(fixedText(segment.calculatedPerMm, 6, 'L'))}</td>
        </tr>
      `).join('');
    }

    const alerts = parseAlerts();
    if(alertsCard && alertsList){
      alertsCard.hidden = alerts.length === 0;
      alertsList.innerHTML = alerts.map(text => `<div class="tm2-docs-alert">${escapeHtml(text)}</div>`).join('');
    }
  }

  render();
})();
