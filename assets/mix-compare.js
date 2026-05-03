(function(){
  'use strict';

  const HISTORY_KEY = 'sakeCalc.htmlSplit.mix.history.v1';
  const COMPARE_KEY = 'sakeCalc.htmlSplit.mix.compareSelection.v1';
  const RESTORE_KEY = 'sakeCalc.htmlSplit.mix.restore.v1';
  const COMPARE_LIMIT = 3;
  const mark = (index) => ['①','②','③','④','⑤'][Number(index)-1] || String(index);
  const $ = (id) => document.getElementById(id);

  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>'"]/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
    }[ch]));
  }

  function getMode(record){
    const n = Number(record && record.mode);
    if(!Number.isFinite(n)) return 2;
    return Math.min(5, Math.max(2, Math.trunc(n)));
  }

  function modeLabel(mode){
    return `${getMode({ mode })}混合`;
  }

  function readJson(key, fallback){
    try{
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : fallback;
      return parsed == null ? fallback : parsed;
    }catch(_err){
      return fallback;
    }
  }

  function readCompareSelection(){
    const parsed = readJson(COMPARE_KEY, []);
    if(Array.isArray(parsed)){
      const ids = parsed.slice(0, COMPARE_LIMIT);
      return { ids, mode: null, baseId: ids[0] || null };
    }
    if(parsed && Array.isArray(parsed.ids)){
      const ids = parsed.ids.slice(0, COMPARE_LIMIT);
      return {
        ids,
        mode: parsed.mode == null ? null : getMode({ mode: parsed.mode }),
        baseId: parsed.baseId || ids[0] || null
      };
    }
    return { ids: [], mode: null, baseId: null };
  }

  function writeCompareSelection(ids, mode, baseId){
    const safeIds = Array.isArray(ids) ? ids.slice(0, COMPARE_LIMIT) : [];
    const safeBaseId = safeIds.includes(baseId) ? baseId : (safeIds[0] || null);
    try{
      sessionStorage.setItem(COMPARE_KEY, JSON.stringify({
        ids: safeIds,
        mode: getMode({ mode }),
        modeLabel: modeLabel(mode),
        baseId: safeBaseId
      }));
      return true;
    }catch(_err){
      return false;
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

  function asNumber(value){
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function fixed(value, decimals){
    const n = asNumber(value);
    if(n === null) return '—';
    const scale = 10 ** decimals;
    return (Math.trunc(n * scale) / scale).toFixed(decimals);
  }

  function almostSame(a, b){
    const na = asNumber(a);
    const nb = asNumber(b);
    if(na === null && nb === null) return true;
    if(na === null || nb === null) return false;
    return Math.abs(na - nb) < 0.000001;
  }

  function signedDiff(value, base, decimals, unit){
    const v = asNumber(value);
    const b = asNumber(base);
    if(v === null || b === null) return '';
    const diff = v - b;
    if(Math.abs(diff) < 0.000001) return '±0' + (unit || '');
    const sign = diff > 0 ? '+' : '';
    return `${sign}${fixed(diff, decimals)}${unit || ''}`;
  }

  function selectedRecords(){
    const selection = readCompareSelection();
    const ids = selection.ids;
    if(!Array.isArray(ids) || !ids.length) return { records: [], mode: null, baseId: null, baseRecord: null };
    const history = readHistory();
    const records = ids.map(id => history.find(record => record && record.id === id)).filter(Boolean);
    const mode = selection.mode || (records[0] ? getMode(records[0]) : null);
    const sameModeRecords = records.filter(record => !mode || getMode(record) === mode).slice(0, COMPARE_LIMIT);
    const baseRecord = sameModeRecords.find(record => record && record.id === selection.baseId) || sameModeRecords[0] || null;
    return { records: sameModeRecords, mode, baseId: baseRecord ? baseRecord.id : null, baseRecord };
  }

  function recordTitle(record, index, baseId){
    const isBase = record && record.id === baseId;
    const prefix = isBase ? '基準' : `${index + 1}件目`;
    return `${prefix}：${modeLabel(getMode(record))}`;
  }

  function splitTime(text){
    const raw = String(text || '');
    const parts = raw.split(' ');
    if(parts.length >= 2){
      return { date:parts[0], time:parts.slice(1).join(' ') };
    }
    return { date:raw, time:'' };
  }

  function inputFor(record, index){
    const inputs = Array.isArray(record.inputs) ? record.inputs : [];
    return inputs.find(item => Number(item.index) === index) || null;
  }

  function cumulativeFor(record, index){
    const rows = Array.isArray(record.cumulative) ? record.cumulative : [];
    return rows.find(item => Number(item.index) === index) || null;
  }

  function headCells(records, baseId){
    return records.map((record, index) => {
      const isBase = record && record.id === baseId;
      const t = splitTime(record.savedAtJST || record.savedAtISO || '');
      const action = isBase
        ? '<span class="history-compare-base-badge">基準中</span>'
        : `<button class="history-compare-set-base" type="button" data-set-base-id="${escapeHtml(record.id)}">基準にする</button>`;
      return `<th class="history-compare-table-col${isBase ? ' is-base' : ''}">
        <div class="history-compare-table-headcell">
          <div class="history-compare-head-actions">${action}</div>
          <span class="history-compare-table-headlabel">${escapeHtml(recordTitle(record, index, baseId))}</span>
          <span class="history-compare-table-date">${escapeHtml(t.date || '—')}</span>
          ${t.time ? `<span class="history-compare-table-clock">${escapeHtml(t.time)}</span>` : ''}
        </div>
      </th>`;
    }).join('');
  }

  function valueCell(value, opts){
    const options = opts || {};
    const isBase = !!options.isBase;
    const baseValue = options.baseValue;
    const numericValue = options.numericValue;
    const diffText = options.diffText || '';
    const changed = !isBase && !almostSame(numericValue, baseValue);
    return `<td class="history-compare-table-cell${isBase ? ' is-base' : ''}${changed ? ' is-changed' : ''}">
      <span class="history-compare-table-value">${escapeHtml(value || '—')}</span>
      ${isBase ? '<span class="history-compare-table-subvalue">基準</span>' : `<span class="history-compare-table-subvalue">${changed && diffText ? `<span class="history-compare-table-diff-tag">差</span>${escapeHtml(diffText)}` : '差なし'}</span>`}
    </td>`;
  }

  function textCell(value, opts){
    const options = opts || {};
    const isBase = !!options.isBase;
    const changed = !!options.changed;
    return `<td class="history-compare-table-cell${isBase ? ' is-base' : ''}${changed ? ' is-changed' : ''}">
      <span class="history-compare-table-value">${escapeHtml(value || '—')}</span>
      ${isBase ? '<span class="history-compare-table-subvalue">基準</span>' : ''}
    </td>`;
  }

  function row(group, label, cells, isFirstInGroup, rowspan){
    return `<tr>
      ${isFirstInGroup ? `<th class="history-compare-table-group-cell" rowspan="${rowspan}">${escapeHtml(group)}</th>` : ''}
      <th class="history-compare-table-row-label">${escapeHtml(label)}</th>
      ${cells}
    </tr>`;
  }

  function finalRows(records, baseRecord){
    const base = baseRecord || records[0] || {};
    const baseResult = base.result || {};
    const rows = [];
    rows.push(row('結果', '混合後の値', records.map((record) => {
      const isBase = baseRecord && record && record.id === baseRecord.id;
      const result = record.result || {};
      return valueCell(result.mixedComponentText || fixed(result.mixedComponent, 2), {
        isBase, numericValue:result.mixedComponent, baseValue:baseResult.mixedComponent, diffText:signedDiff(result.mixedComponent, baseResult.mixedComponent, 2, '')
      });
    }).join(''), true, 2));
    rows.push(row('結果', '合計数量', records.map((record) => {
      const isBase = baseRecord && record && record.id === baseRecord.id;
      const result = record.result || {};
      return valueCell(`${result.totalVolumeText || fixed(result.totalVolume, 2)}L`, {
        isBase, numericValue:result.totalVolume, baseValue:baseResult.totalVolume, diffText:signedDiff(result.totalVolume, baseResult.totalVolume, 2, 'L')
      });
    }).join(''), false, 2));
    return rows.join('');
  }

  function inputRows(records, baseRecord, mode){
    const safeMode = getMode({ mode: mode || getMode(records[0] || {}) });
    const rows = [];
    for(let i=1; i<=safeMode; i++){
      const baseInput = inputFor(baseRecord || records[0] || {}, i);
      rows.push(row('投入', `${mark(i)} 成分 / 数量`, records.map((record) => {
        const isBase = baseRecord && record && record.id === baseRecord.id;
        const input = inputFor(record, i);
        if(!input) return textCell('—', { isBase, changed:!isBase && !!baseInput });
        const baseChanged = !baseInput || !almostSame(input.component, baseInput.component) || !almostSame(input.volume, baseInput.volume);
        return textCell(`${fixed(input.component, 2)} / ${fixed(input.volume, 2)}L`, { isBase, changed:!isBase && baseChanged });
      }).join(''), i === 1, safeMode));
    }
    return rows.join('');
  }

  function cumulativeRows(records, baseRecord, mode){
    const max = Math.max(0, getMode({ mode: mode || getMode(records[0] || {}) }) - 1);
    if(max < 1) return '';
    const rows = [];
    for(let i=1; i<=max; i++){
      const baseRow = cumulativeFor(baseRecord || records[0] || {}, i);
      rows.push(row('途中', `${mark(i)}投入後`, records.map((record) => {
        const isBase = baseRecord && record && record.id === baseRecord.id;
        const item = cumulativeFor(record, i);
        if(!item) return textCell('—', { isBase, changed:!isBase && !!baseRow });
        const liters = item.litersText || fixed(item.liters, 2);
        const component = item.componentText || fixed(item.component, 2);
        const changed = !baseRow || !almostSame(item.liters, baseRow.liters) || !almostSame(item.component, baseRow.component);
        return textCell(`${liters}L / 成分 ${component}`, { isBase, changed:!isBase && changed });
      }).join(''), i === 1, max));
    }
    return rows.join('');
  }

  function actionRows(records){
    return row('操作', '入力欄へ戻す', records.map(record => `<td class="history-compare-table-cell">
      <div class="history-compare-table-actions">
        <button class="history-compare-table-action-btn" type="button" data-compare-restore-id="${escapeHtml(record.id)}">この履歴を入力欄に戻す</button>
      </div>
    </td>`).join(''), true, 1);
  }

  function setBaseRecord(id){
    const selection = selectedRecords();
    const records = selection.records;
    const target = records.find(record => record && record.id === id);
    if(!target) return;
    const ids = records.map(record => record.id);
    if(!writeCompareSelection(ids, getMode(target), target.id)){
      alert('基準を変更できませんでした。この端末の保存設定を確認してください。');
      return;
    }
    render();
  }

  function restoreRecord(id){
    const selection = selectedRecords();
    const record = selection.records.find(item => item && item.id === id);
    if(!record) return;
    try{
      sessionStorage.setItem(RESTORE_KEY, JSON.stringify(record));
      location.href = './mix.html';
    }catch(_err){
      alert('履歴を入力欄へ戻せませんでした。この端末の保存設定を確認してください。');
    }
  }

  function render(){
    const selection = selectedRecords();
    const records = selection.records;
    const mode = selection.mode;
    const baseId = selection.baseId;
    const baseRecord = selection.baseRecord;
    const empty = $('mix-compare-empty');
    const root = $('mix-compare-root');
    if(!root) return;
    if(records.length < 2){
      if(empty) empty.hidden = false;
      root.innerHTML = '';
      return;
    }
    if(empty) empty.hidden = true;
    root.innerHTML = `
      <section class="history-compare-screen-table-card" aria-label="混合計算比較表">
        <div class="history-compare-screen-table-head">
          <h2>${escapeHtml(modeLabel(mode))}の比較表</h2>
          <p>基準は太枠、差分は黄色です。</p>
        </div>
        <div class="history-compare-table-scroll">
          <table class="history-compare-table" style="--history-compare-item-count:${records.length};">
            <thead>
              <tr>
                <th class="history-compare-table-sticky-group">区分</th>
                <th class="history-compare-table-sticky">項目</th>
                ${headCells(records, baseId)}
              </tr>
            </thead>
            <tbody>
              ${finalRows(records, baseRecord)}
              ${inputRows(records, baseRecord, mode)}
              ${cumulativeRows(records, baseRecord, mode)}
              ${actionRows(records)}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    document.addEventListener('click', event => {
      const baseButton = event.target.closest('[data-set-base-id]');
      if(baseButton){
        setBaseRecord(baseButton.getAttribute('data-set-base-id'));
        return;
      }
      const restoreButton = event.target.closest('[data-compare-restore-id]');
      if(restoreButton){
        restoreRecord(restoreButton.getAttribute('data-compare-restore-id'));
      }
    });
  });
})();
