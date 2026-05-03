(function(){
  'use strict';

  const HISTORY_KEY = 'sakeCalc.htmlSplit.mix.history.v1';
  const RESTORE_KEY = 'sakeCalc.htmlSplit.mix.restore.v1';
  const COMPARE_KEY = 'sakeCalc.htmlSplit.mix.compareSelection.v1';
  const FILTER_KEY = 'sakeCalc.htmlSplit.mix.historyFilterMode.v1';
  const COMPARE_LIMIT = 3;
  const MODES = [2,3,4,5];

  const $ = (id) => document.getElementById(id);
  const mark = (index) => ['①','②','③','④','⑤'][Number(index)-1] || String(index);
  let selectedIds = [];
  let selectedMode = null;
  let currentMode = null;

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

  function readFilterMode(){
    try{
      const raw = localStorage.getItem(FILTER_KEY);
      const n = Number(raw);
      return MODES.includes(n) ? n : null;
    }catch(_err){
      return null;
    }
  }

  function writeFilterMode(mode){
    try{ localStorage.setItem(FILTER_KEY, String(getMode({ mode }))); }catch(_err){}
  }

  function ensureCurrentMode(){
    if(!currentMode) currentMode = readFilterMode() || 2;
    currentMode = getMode({ mode: currentMode });
    return currentMode;
  }

  function setCurrentMode(mode){
    currentMode = getMode({ mode });
    writeFilterMode(currentMode);
    selectedIds = [];
    selectedMode = null;
    render();
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

  function findRecordIn(records, id){
    return records.find(record => record && record.id === id) || null;
  }

  function inputSummary(record){
    const inputs = Array.isArray(record.inputs) ? record.inputs : [];
    return inputs.map(item => {
      const label = mark(item.index);
      const component = Number.isFinite(Number(item.component)) ? Number(item.component) : '';
      const volume = Number.isFinite(Number(item.volume)) ? Number(item.volume) : '';
      return `<div>${label} 成分：${escapeHtml(component)} / 数量：${escapeHtml(volume)}L</div>`;
    }).join('');
  }

  function cumulativeSummary(record){
    const rows = Array.isArray(record.cumulative) ? record.cumulative : [];
    if(!rows.length) return '';
    const text = rows.map(row => `${row.label || ''} ${row.litersText || row.liters}L（途中成分：${row.componentText || row.component}）`).join(' / ');
    return `<div class="history-cumulative">途中：${escapeHtml(text)}</div>`;
  }

  function refreshSelectedMode(records){
    const selectedRecords = selectedIds.map(id => findRecordIn(records, id)).filter(Boolean);
    selectedMode = selectedRecords.length ? getMode(selectedRecords[0]) : null;
    selectedIds = selectedRecords.filter(record => getMode(record) === selectedMode).map(record => record.id);
  }

  function updateCompareControls(){
    const status = $('mix-compare-select-status');
    const start = $('mix-compare-start');
    const mode = ensureCurrentMode();
    if(status){
      status.textContent = selectedIds.length
        ? `比較対象：${selectedIds.length}件（2〜${COMPARE_LIMIT}件で比較）`
        : '比較対象：0件';
    }
    if(start) start.disabled = selectedIds.length < 2;
    document.querySelectorAll('[data-compare-select-id]').forEach(input => {
      const id = input.getAttribute('data-compare-select-id');
      const itemMode = Number(input.getAttribute('data-compare-mode')) || 2;
      input.checked = selectedIds.includes(id);
      input.disabled = itemMode !== mode;
    });
  }

  function renderRecord(record){
    const title = modeLabel(getMode(record));
    const result = record.result || {};
    const component = result.mixedComponentText || '';
    const volume = result.totalVolumeText || '';
    const checked = selectedIds.includes(record.id) ? ' checked' : '';
    const disabled = selectedMode && getMode(record) !== selectedMode ? ' disabled' : '';
    return `<article class="history-item" data-history-id="${escapeHtml(record.id)}">
      <div class="history-item-main">
        <div class="history-item-head">
          <div>
            <label class="history-compare-check">
              <input type="checkbox" data-compare-select-id="${escapeHtml(record.id)}" data-compare-mode="${getMode(record)}"${checked}${disabled}>
              <span>比較対象にする</span>
            </label>
            <div class="history-item-title">${escapeHtml(title)}</div>
          </div>
          <div class="history-item-time">${escapeHtml(record.savedAtJST || record.savedAtISO || '')}</div>
        </div>
        <div class="history-result-line">
          <div><div class="history-small-label">混合後の値</div><div class="history-big-value">${escapeHtml(component)}</div></div>
          <div><div class="history-small-label">合計数量</div><div class="history-big-value">${escapeHtml(volume)}L</div></div>
        </div>
        <div class="history-inputs">${inputSummary(record)}</div>
        ${cumulativeSummary(record)}
        <div class="history-actions">
          <button class="calc-btn" type="button" data-restore-id="${escapeHtml(record.id)}">この履歴を入力欄に戻す</button>
          <button class="back-btn history-delete-btn" type="button" data-delete-id="${escapeHtml(record.id)}">この履歴を削除</button>
        </div>
      </div>
    </article>`;
  }

  function countSummary(records, mode){
    if(!records.length) return '履歴はありません。';
    const selectedCount = records.filter(record => getMode(record) === mode).length;
    return `${modeLabel(mode)} ${selectedCount}件 / 全${records.length}件`;
  }

  function syncFilterUi(records, mode){
    const filter = $('mix-history-mode-filter');
    const status = $('mix-history-filter-status');
    const title = $('mix-history-list-title');
    const selectedCount = records.filter(record => getMode(record) === mode).length;
    if(filter) filter.value = String(mode);
    if(status) status.textContent = `表示中：${modeLabel(mode)} ${selectedCount}件`;
    if(title) title.textContent = `${modeLabel(mode)}の履歴`;
  }

  function render(){
    const list = $('mix-history-list');
    const empty = $('mix-history-empty');
    const count = $('mix-history-count');
    const records = readHistory();
    const mode = ensureCurrentMode();
    const existingIds = new Set(records.map(record => record && record.id).filter(Boolean));
    selectedIds = selectedIds.filter(id => existingIds.has(id));
    selectedIds = selectedIds.filter(id => {
      const record = findRecordIn(records, id);
      return record && getMode(record) === mode;
    });
    selectedMode = selectedIds.length ? mode : null;
    const modeRecords = records.filter(record => getMode(record) === mode);
    syncFilterUi(records, mode);
    if(count) count.textContent = countSummary(records, mode);
    if(empty) empty.hidden = records.length > 0;
    if(!list) return;
    if(!records.length){
      list.innerHTML = '';
      updateCompareControls();
      return;
    }
    if(!modeRecords.length){
      list.innerHTML = `<div class="history-mode-empty">${escapeHtml(modeLabel(mode))}の履歴はまだありません。表示する方式を切り替えてください。</div>`;
      updateCompareControls();
      return;
    }
    list.innerHTML = `<div class="history-list-group">${modeRecords.map(renderRecord).join('')}</div>`;
    updateCompareControls();
  }

  function findRecord(id){
    return readHistory().find(record => record && record.id === id) || null;
  }

  function restoreRecord(id){
    const record = findRecord(id);
    if(!record) return;
    try{
      sessionStorage.setItem(RESTORE_KEY, JSON.stringify(record));
      location.href = './mix.html';
    }catch(_err){
      alert('履歴を入力欄へ戻せませんでした。この端末の保存設定を確認してください。');
    }
  }

  function deleteRecord(id){
    const record = findRecord(id);
    if(!record) return;
    const ok = confirm('この混合計算履歴を削除します。よろしいですか？');
    if(!ok) return;
    const next = readHistory().filter(item => item && item.id !== id);
    try{
      writeHistory(next);
      selectedIds = selectedIds.filter(selectedId => selectedId !== id);
      render();
    }catch(_err){
      alert('履歴の削除に失敗しました。この端末の保存設定を確認してください。');
    }
  }

  function toggleSelection(id, checked){
    if(!id) return;
    const records = readHistory();
    const record = findRecordIn(records, id);
    if(!record) return;
    const mode = getMode(record);
    const visibleMode = ensureCurrentMode();
    if(mode !== visibleMode){
      alert(`現在は${modeLabel(visibleMode)}の履歴だけを表示しています。別の方式を比較する場合は、プルダウンで表示を切り替えてください。`);
      updateCompareControls();
      return;
    }
    if(checked){
      if(selectedIds.includes(id)) return;
      if(selectedMode && mode !== selectedMode){
        alert(`${modeLabel(selectedMode)}の履歴を選択中です。別の分類を比較する場合は、プルダウンで表示を切り替えてください。`);
        updateCompareControls();
        return;
      }
      if(selectedIds.length >= COMPARE_LIMIT){
        alert(`比較できる履歴は最大${COMPARE_LIMIT}件までです。`);
        updateCompareControls();
        return;
      }
      selectedIds.push(id);
      selectedMode = mode;
    }else{
      selectedIds = selectedIds.filter(selectedId => selectedId !== id);
      if(!selectedIds.length) selectedMode = null;
    }
    refreshSelectedMode(records);
    updateCompareControls();
  }

  function startCompare(){
    if(selectedIds.length < 2 || !selectedMode){
      alert('同じ分類の履歴を2件以上選んでください。');
      return;
    }
    const mode = selectedMode || ensureCurrentMode();
    try{
      sessionStorage.setItem(COMPARE_KEY, JSON.stringify({
        ids: selectedIds.slice(0, COMPARE_LIMIT),
        mode: mode,
        modeLabel: modeLabel(mode)
      }));
      location.href = './mix-compare.html';
    }catch(_err){
      alert('比較画面へ進めませんでした。この端末の保存設定を確認してください。');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    const filter = $('mix-history-mode-filter');
    if(filter) filter.addEventListener('change', () => setCurrentMode(filter.value));
    const start = $('mix-compare-start');
    if(start) start.addEventListener('click', startCompare);
    document.addEventListener('change', event => {
      const checkbox = event.target.closest('[data-compare-select-id]');
      if(checkbox){
        toggleSelection(checkbox.getAttribute('data-compare-select-id'), checkbox.checked);
      }
    });
    document.addEventListener('click', event => {
      const restoreButton = event.target.closest('[data-restore-id]');
      if(restoreButton){
        restoreRecord(restoreButton.getAttribute('data-restore-id'));
        return;
      }
      const deleteButton = event.target.closest('[data-delete-id]');
      if(deleteButton){
        deleteRecord(deleteButton.getAttribute('data-delete-id'));
      }
    });
  });
})();
