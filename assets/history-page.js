(function(){
  'use strict';

  const CONFIGS = {
    water: {
      historyKey:'sakeCalc.htmlSplit.water.history.v1',
      restoreKey:'sakeCalc.htmlSplit.water.history.restore.v1',
      filterKey:'sakeCalc.htmlSplit.water.historyFilter.v1',
      title:'割水計算履歴',
      actionTitle:'割水計算履歴の操作',
      toolLabel:'割水計算',
      badge:'割水計算',
      returnHref:'./water.html',
      emptyText:'まだ割水計算履歴はありません。',
      tm2RouteNote:true,
      modes:[
        {value:'0', label:'割水量・目標数量'},
        {value:'1', label:'割水前の必要数量'},
        {value:'2', label:'割水前の成分値'},
        {value:'3', label:'割水後の成分値・割水量'}
      ]
    },
    alcohol: {
      historyKey:'sakeCalc.htmlSplit.alcohol.history.v1',
      restoreKey:'sakeCalc.htmlSplit.alcohol.history.restore.v1',
      filterKey:'sakeCalc.htmlSplit.alcohol.historyFilter.v1',
      title:'アルコール添加履歴',
      actionTitle:'アルコール添加履歴の操作',
      toolLabel:'アルコール添加計算',
      badge:'アルコール添加',
      returnHref:'./alcohol.html',
      emptyText:'まだアルコール添加履歴はありません。',
      tm2RouteNote:true,
      modes:[
        {value:'0', label:'添加量・添加後数量'},
        {value:'1', label:'添加前の必要数量'},
        {value:'2', label:'添加後の成分値・数量'}
      ]
    },
    ekisu: {
      historyKey:'sakeCalc.htmlSplit.ekisu.history.v1',
      restoreKey:'sakeCalc.htmlSplit.ekisu.history.restore.v1',
      filterKey:'sakeCalc.htmlSplit.ekisu.historyFilter.v1',
      title:'エキス分履歴',
      actionTitle:'エキス分履歴の操作',
      toolLabel:'エキス分計算',
      badge:'エキス分',
      returnHref:'./ekisu.html',
      emptyText:'まだエキス分履歴はありません。',
      modes:[
        {value:'sm', label:'日本酒度入力'},
        {value:'bm', label:'ボーメ度入力'}
      ]
    },
    suion: {
      historyKey:'sakeCalc.htmlSplit.suion.history.v1',
      restoreKey:'sakeCalc.htmlSplit.suion.history.restore.v1',
      filterKey:'sakeCalc.htmlSplit.suion.historyFilter.v1',
      title:'水温温度履歴',
      actionTitle:'水温温度履歴の操作',
      toolLabel:'水温温度計算',
      badge:'水温温度',
      returnHref:'./suion.html',
      emptyText:'まだ水温温度履歴はありません。',
      modes:[
        {value:'0', label:'混合後の水温'},
        {value:'1', label:'追加水の条件'},
        {value:'2', label:'配合量の計算'}
      ]
    },
    ice: {
      historyKey:'sakeCalc.htmlSplit.ice.history.v1',
      restoreKey:'sakeCalc.htmlSplit.ice.history.restore.v1',
      filterKey:'sakeCalc.htmlSplit.ice.historyFilter.v1',
      title:'氷投入量履歴',
      actionTitle:'氷投入量履歴の操作',
      toolLabel:'氷投入量計算',
      badge:'氷投入量',
      returnHref:'./ice.html',
      emptyText:'まだ氷投入量履歴はありません。',
      modes:[
        {value:'forward', label:'現在水量から計算'},
        {value:'final', label:'仕上がり水量から計算'}
      ]
    }
  };

  const $ = (id) => document.getElementById(id);
  const body = document.body || {};
  const tool = body.dataset ? body.dataset.historyTool : '';
  const config = CONFIGS[tool];
  if(!config) return;

  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>'"]/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
    }[ch]));
  }

  function readHistory(){
    try{
      const raw = localStorage.getItem(config.historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    }catch(_err){ return []; }
  }

  function writeHistory(records){
    localStorage.setItem(config.historyKey, JSON.stringify(records));
  }

  function modeValue(record){
    const value = record && record.mode;
    return String(value == null ? config.modes[0].value : value);
  }

  function modeLabel(value){
    const found = config.modes.find(mode => String(mode.value) === String(value));
    return found ? found.label : String(value || config.toolLabel);
  }

  function readFilter(){
    try{
      const raw = localStorage.getItem(config.filterKey);
      if(String(raw) === 'all') return 'all';
      if(config.modes.some(mode => String(mode.value) === String(raw))) return String(raw);
    }catch(_err){}
    return 'all';
  }

  function writeFilter(value){
    try{ localStorage.setItem(config.filterKey, String(value)); }catch(_err){}
  }

  function flattenRows(rows){
    return (rows || []).flatMap(row => (row.values || []).map(value => ({
      label:(row.label ? row.label + ' / ' : '') + value.label,
      value:value.value
    })));
  }

  function firstResults(record){
    const rows = flattenRows(record.resultRows).filter(row => row.value !== undefined && row.value !== null && row.value !== '');
    return rows.slice(0, 2);
  }

  function allLines(record){
    const inputs = flattenRows(record.inputRows).map(row => ({...row, kind:'入力'}));
    const results = flattenRows(record.resultRows).map(row => ({...row, kind:'結果'}));
    return inputs.concat(results).slice(0, 12);
  }

  function renderRecord(record){
    const mode = modeValue(record);
    const primary = firstResults(record);
    const resultLine = primary.length ? `<div class="history-result-line">${primary.map(row => `<div><div class="history-small-label">${escapeHtml(row.label)}</div><div class="history-big-value">${escapeHtml(row.value)}</div></div>`).join('')}</div>` : '';
    const lines = allLines(record).map(row => `<div class="history-record-line"><strong>${escapeHtml(row.kind)} / ${escapeHtml(row.label)}</strong>：${escapeHtml(row.value)}</div>`).join('');
    return `<article class="history-item" data-history-id="${escapeHtml(record.id)}">
      <div class="history-item-main">
        <div class="history-item-head">
          <div>
            <div class="history-item-title">${escapeHtml(record.toolName || config.toolLabel)}</div>
            <div class="history-item-mode">${escapeHtml(record.modeLabel || modeLabel(mode))}</div>
          </div>
          <div class="history-item-time">${escapeHtml(record.savedAtJst || record.savedAtJST || record.savedAtISO || '')}</div>
        </div>
        ${resultLine}
        <div class="history-record-lines">${lines}</div>
        <div class="history-actions">
          <button class="calc-btn" type="button" data-restore-id="${escapeHtml(record.id)}">この履歴を入力欄に戻す</button>
          <button class="back-btn history-delete-btn" type="button" data-delete-id="${escapeHtml(record.id)}">この履歴を削除</button>
        </div>
      </div>
    </article>`;
  }

  function setupStaticText(){
    const title = $('history-page-title'); if(title) title.textContent = config.title;
    const actionTitle = $('history-action-title'); if(actionTitle) actionTitle.textContent = config.actionTitle;
    const lead = $('history-page-lead'); if(lead) lead.textContent = 'すべての方式、または方式別に絞り込んで保存履歴を確認します。比較機能は混合計算専用のため、この履歴画面には入れていません。';
    const badge = $('history-badge'); if(badge) badge.textContent = config.badge;
    const navTitle = $('history-nav-title'); if(navTitle) navTitle.textContent = config.title;
    const back = $('history-back-link'); if(back){ back.href = config.returnHref; back.textContent = '← ' + config.toolLabel + 'へ戻る'; }
    const panel = document.querySelector('.history-action-panel');
    if(panel && config.tm2RouteNote){
      const note = document.createElement('p');
      note.className = 'history-route-note';
      note.textContent = '2mm表候補を作る場合は、この履歴を入力欄に戻して計算結果を確認してから、結果下の「2mm表候補を確認する」を押してください。';
      const titleRow = panel.querySelector('.history-action-title-row');
      if(titleRow && titleRow.nextSibling) panel.insertBefore(note, titleRow.nextSibling);
      else panel.appendChild(note);
    }
  }

  function setupFilter(){
    const filter = $('history-mode-filter');
    if(!filter) return;
    filter.innerHTML = `<option value="all">すべての方式</option>` + config.modes.map(mode => `<option value="${escapeHtml(mode.value)}">${escapeHtml(mode.label)}</option>`).join('');
    filter.value = readFilter();
    filter.addEventListener('change', () => { writeFilter(filter.value); render(); });
  }

  function render(){
    const records = readHistory();
    const filter = $('history-mode-filter');
    const current = filter ? filter.value : readFilter();
    const modeRecords = current === 'all' ? records : records.filter(record => modeValue(record) === String(current));
    const status = $('history-filter-status');
    const title = $('history-list-title');
    const count = $('history-count');
    const empty = $('history-empty');
    const list = $('history-list');
    if(status) status.textContent = current === 'all' ? `表示中：すべての方式 ${modeRecords.length}件` : `表示中：${modeLabel(current)} ${modeRecords.length}件`;
    if(title) title.textContent = current === 'all' ? 'すべての方式の履歴' : `${modeLabel(current)}の履歴`;
    if(count) count.textContent = records.length ? `${modeRecords.length}件 / 全${records.length}件` : '履歴はありません。';
    if(!list) return;
    if(!records.length){
      if(empty){ empty.textContent = config.emptyText; empty.hidden = false; }
      list.innerHTML = '';
      return;
    }
    if(empty) empty.hidden = true;
    if(!modeRecords.length){
      const emptyLabel = current === 'all' ? 'すべての方式' : modeLabel(current);
      list.innerHTML = `<div class="history-mode-empty">${escapeHtml(emptyLabel)}の履歴はまだありません。表示する方式を切り替えてください。</div>`;
      return;
    }
    list.innerHTML = `<div class="history-list-group">${modeRecords.map(renderRecord).join('')}</div>`;
  }

  function findRecord(id){
    return readHistory().find(record => record && record.id === id) || null;
  }

  function restoreRecord(id){
    const record = findRecord(id);
    if(!record) return;
    try{
      sessionStorage.setItem(config.restoreKey, JSON.stringify(record));
      location.href = config.returnHref;
    }catch(_err){
      alert('履歴を入力欄へ戻せませんでした。この端末の一時保存設定を確認してください。');
    }
  }

  function deleteRecord(id){
    const record = findRecord(id);
    if(!record) return;
    const ok = confirm('この履歴を削除します。よろしいですか？');
    if(!ok) return;
    try{
      writeHistory(readHistory().filter(item => item && item.id !== id));
      render();
    }catch(_err){
      alert('履歴の削除に失敗しました。この端末の保存設定を確認してください。');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupStaticText();
    setupFilter();
    render();
    const list = $('history-list');
    if(list) list.addEventListener('click', event => {
      const restore = event.target.closest('[data-restore-id]');
      if(restore) return restoreRecord(restore.getAttribute('data-restore-id'));
      const del = event.target.closest('[data-delete-id]');
      if(del) return deleteRecord(del.getAttribute('data-delete-id'));
    });
  });
})();
