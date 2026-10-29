(function () {
  'use strict';

  // 氷投入量計算専用。既存履歴キーを継続し、旧履歴も削除しない。
  const DRAFT_KEY = 'sakeCalc.htmlSplit.ice.lastInputs.v4';
  const OLD_DRAFT_KEY = 'sakeCalc.htmlSplit.ice.lastInputs.v3';
  const HISTORY_KEY = 'sakeCalc.htmlSplit.ice.history.v1';
  const HISTORY_RESTORE_KEY = 'sakeCalc.htmlSplit.ice.history.restore.v1';
  const modeLabels = {water:'汲水を冷やす',koji:'水麹温度から計算',dilution:'成分と品温を調整'};
  const components = {
    alc:{label:'アルコール度数',unit:'％'},
    ta:{label:'酸度',unit:''},
    aa:{label:'アミノ酸度',unit:''},
    be:{label:'ボーメ（簡易）',unit:''}
  };
  const ids = [
    'ice-water-way','ice-water-volume','ice-water-current-temp','ice-water-target-temp',
    'ice-koji-volume','ice-koji-water-temp','ice-koji-before-temp','ice-koji-target-temp',
    'ice-dilution-component','ice-dilution-volume','ice-dilution-current','ice-dilution-target',
    'ice-dilution-mash-temp','ice-dilution-water-temp','ice-dilution-target-temp','ice-ice-temp'
  ];
  const $ = (id) => document.getElementById(id);
  const numeral = (value) => Number(value).toFixed(2);
  const readable = (value) => Number(value.toFixed(5)).toString();
  let activeMode = 'water';
  let draftReady = false;
  // 氷温の補正：氷の比熱約2.1、水の比熱約4.2 kJ/(kg・℃)。
  function iceCoolingOffset() { return Math.abs(input('ice-ice-temp')) * 0.5; }
  function iceDenom(waterTemperature) { return waterTemperature + 80 + iceCoolingOffset(); }
  function iceTempLabel() { return readable(input('ice-ice-temp'))+'℃'; }
  let latestValidSnapshot = null;

  function input(id) { const el=$(id); return el && el.value !== '' ? Number(el.value) : NaN; }
  function present(idsToCheck) { return idsToCheck.every(id => Number.isFinite(input(id))); }
  function readInputValues() { return Object.fromEntries(ids.map(id => [id, $(id).value])); }
  function saveDraft() {
    if(!draftReady) return;
    try { localStorage.setItem(DRAFT_KEY,JSON.stringify({activeMode,values:readInputValues()})); } catch(_err) {}
  }
  function fillValues(values) {
    ids.forEach(id => { if(Object.prototype.hasOwnProperty.call(values,id) && values[id] != null) $(id).value=values[id]; });
  }
  function importLegacy(state) {
    const values = state.values || state.fieldValues || {};
    const sourceMode = state.activeMode || state.mode;
    if(sourceMode === 'forward') {
      return {mode:'water',values:{'ice-water-way':'add', 'ice-water-volume':values['ice-current-volume'], 'ice-water-current-temp':values['ice-current-temp'], 'ice-water-target-temp':values['ice-target-temp']}};
    }
    if(sourceMode === 'final') {
      return {mode:'water',values:{'ice-water-way':'replace', 'ice-water-volume':values['ice-final-volume'], 'ice-water-current-temp':values['ice-final-current-temp'], 'ice-water-target-temp':values['ice-final-target-temp']}};
    }
    return {mode:modeLabels[sourceMode] ? sourceMode : 'water',values};
  }
  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const old = !raw ? localStorage.getItem(OLD_DRAFT_KEY) : null;
      if(!raw && !old) return;
      const parsed = JSON.parse(raw || old);
      const state = raw ? parsed : importLegacy(parsed);
      activeMode = modeLabels[state.activeMode || state.mode] ? (state.activeMode || state.mode) : 'water';
      fillValues(state.values || {});
    }catch(_err) {}
  }
  function setMode(mode) {
    activeMode = modeLabels[mode] ? mode : 'water';
    document.querySelectorAll('[data-mode]').forEach(button => {
      const selected=button.dataset.mode===activeMode;
      button.classList.toggle('is-active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden=panel.dataset.panel!==activeMode; });
    calculate();
    saveDraft();
  }
  function setWaterWay() {
    $('ice-water-volume-label').textContent = $('ice-water-way').value==='replace' ? '必要な汲水総量（水＋氷）' : 'すでにある水量（氷は別に追加）';
  }
  function setComponentText() {
    const part=components[$('ice-dilution-component').value] || components.alc;
    const unit=part.unit ? '（'+part.unit+'）' : '';
    $('ice-dilution-unit-before').textContent=unit;
    $('ice-dilution-unit-target').textContent=unit;
    $('ice-dilution-current').placeholder=part.unit==='％' ? '例：11.5' : '現在の分析値';
    $('ice-dilution-target').placeholder=part.unit==='％' ? '例：8' : '目標の値';
  }
  function displayError(message) {
    $('ice-result').hidden=true;
    $('ice-error').hidden=false;
    $('ice-error').textContent=message;
    latestValidSnapshot=null;
    $('ice-save-history').disabled=true;
  }
  function clearResult() {
    $('ice-result').hidden=true;
    $('ice-error').hidden=true;
    $('ice-error').textContent='';
    latestValidSnapshot=null;
    $('ice-save-history').disabled=true;
  }
  function checkWaterTemperature(waterTemp,goal) {
    if(waterTemp < 0 || goal < 0) return '水温の計算は0℃以上の条件で入力してください。';
    if(goal > waterTemp) return '現在の水温より高い目標温度です。氷では温められません。';
    return '';
  }
  function checkIceResult(iceKg, total, mode) {
    if(!Number.isFinite(iceKg)) return '計算できませんでした。入力値を確認してください。';
    if(iceKg < -1e-8) return 'この条件では水を入れるだけで目標より冷たくなる計算です。氷の追加では合わせられません。水温または目標を見直してください。';
    if(mode !== 'add' && iceKg > total + 1e-8) return '必要な氷が割水・汲水の総量を超えます。水の一部を氷に置き換える方法では、この目標にできません。';
    return '';
  }
  function resultValues({water,ice,summary,note,steps,inputRows,resultRows}) {
    $('ice-result').hidden=false;
    $('ice-error').hidden=true;
    $('ice-error').textContent='';
    $('ice-result-water').textContent=numeral(water);
    $('ice-result-ice').textContent=numeral(ice);
    $('ice-result-summary').textContent=summary;
    $('ice-result-note').textContent=note;
    const stepsBox=$('ice-result-steps');
    stepsBox.replaceChildren();
    steps.forEach(line=>{ const p=document.createElement('p');p.textContent=line;stepsBox.appendChild(p); });
    latestValidSnapshot={mode:activeMode,modeLabel:modeLabels[activeMode],inputRows,resultRows};
    $('ice-save-history').disabled=false;
  }
  function mkrow(label, pairs) { return {label,values:pairs.map(([key,value])=>({label:key,value:String(value)}))}; }
  function calcWater() {
    const required=['ice-water-volume','ice-water-current-temp','ice-water-target-temp'];
    if(!present(required)) return clearResult();
    const amount=input(required[0]),waterTemp=input(required[1]),target=input(required[2]);
    const isAdd=$('ice-water-way').value==='add';
    if(amount<=0) return displayError('水量は0Lより大きい数値を入力してください。');
    const error=checkWaterTemperature(waterTemp,target);
    if(error) return displayError(error);
    const ice=isAdd ? amount*(waterTemp-target)/(target+80+iceCoolingOffset()) : amount*(waterTemp-target)/iceDenom(waterTemp);
    const warning=checkIceResult(ice,amount,isAdd?'add':'replace');
    if(warning) return displayError(warning);
    const water=amount;
    const actualWater=isAdd?water:water-ice;
    const finalAmount=isAdd?amount+ice:amount;
    const caption=isAdd?'氷追加後の概算総量：'+numeral(finalAmount)+'L':'汲水総量（水＋氷）：'+numeral(amount)+'L';
    $('ice-result-water-label').textContent=isAdd?'すでにある水（追加しない）':'投入する水';
    const formula=isAdd ? `氷量 ＝ ${readable(amount)} × (${readable(waterTemp)} − ${readable(target)}) ÷ (${readable(target)} ＋ 80 ＋ ${readable(iceCoolingOffset())}) ＝ ${numeral(ice)}kg` :
      `氷量 ＝ ${readable(amount)} × (${readable(waterTemp)} − ${readable(target)}) ÷ (${readable(waterTemp)} ＋ 80 ＋ ${readable(iceCoolingOffset())}) ＝ ${numeral(ice)}kg`;
    const steps=[formula];
    if(isAdd){steps.push(`氷投入後の概算総量 ＝ ${readable(amount)} ＋ ${numeral(ice)} ＝ ${numeral(finalAmount)}L`);}
    else{steps.push(`入れる水量 ＝ ${readable(amount)} − ${numeral(ice)} ＝ ${numeral(actualWater)}L`);}
    resultValues({water:actualWater,ice,summary:caption,note:isAdd?'水はすでにある数量です。氷を追加した分だけ合計量が増えます。':'必要な総量を変えず、水の一部を氷に置き換える計算です。',steps,
      inputRows:[mkrow('条件',[['水と氷の入れ方',isAdd?'すでにある水へ氷追加':'汲水総量を固定'],['水量',readable(amount)+'L'],['現在の水温',readable(waterTemp)+'℃'],['目標の水温',readable(target)+'℃'],['氷温',iceTempLabel()]])],
      resultRows:[mkrow('計算結果',[[isAdd?'すでにある水':'投入する水',numeral(actualWater)+'L'],['投入する氷',numeral(ice)+'kg'],['仕上がりの概算量',numeral(finalAmount)+'L']])]});
  }
  function calcKoji() {
    const keys=['ice-koji-volume','ice-koji-water-temp','ice-koji-before-temp','ice-koji-target-temp'];
    if(!present(keys)) return clearResult();
    const total=input(keys[0]),waterTemp=input(keys[1]),before=input(keys[2]),target=input(keys[3]);
    if(total<=0) return displayError('汲水総量は0Lより大きい値を入力してください。');
    const needed=target*2-before;
    if(needed<0) return displayError('必要な汲水温度が0℃未満です。氷と水の置き換え計算では対応できません。');
    const error=checkWaterTemperature(waterTemp,needed);
    if(error) return displayError('必要な汲水温度は'+readable(needed)+'℃です。'+error);
    const ice=total*(waterTemp-needed)/iceDenom(waterTemp);
    const warning=checkIceResult(ice,total,'replace');
    if(warning) return displayError(warning);
    const water=total-ice;
    $('ice-result-water-label').textContent='投入する水';
    resultValues({water,ice,summary:'必要な汲水温度：'+readable(needed)+'℃／総汲水量：'+readable(total)+'L',
      note:'水麹前品温×1、目標水麹温度×2の教本簡易式を採用。麹の温度や投入後の実測との差はここでは扱いません。',
      steps:[`必要な汲水温度 ＝ ${readable(target)} × 2 − ${readable(before)} ＝ ${readable(needed)}℃`,
        `氷量 ＝ ${readable(total)} × (${readable(waterTemp)} − ${readable(needed)}) ÷ (${readable(waterTemp)} ＋ 80 ＋ ${readable(iceCoolingOffset())}) ＝ ${numeral(ice)}kg`,
        `投入する水量 ＝ ${readable(total)} − ${numeral(ice)} ＝ ${numeral(water)}L`],
      inputRows:[mkrow('条件',[['汲水総量',readable(total)+'L'],['現在の水温',readable(waterTemp)+'℃'],['水麹前品温',readable(before)+'℃'],['目標水麹温度',readable(target)+'℃'],['氷温',iceTempLabel()]])],
      resultRows:[mkrow('計算結果',[['必要汲水温度',readable(needed)+'℃'],['投入する水',numeral(water)+'L'],['投入する氷',numeral(ice)+'kg']])]});
  }
  function calcDilution() {
    const keys=['ice-dilution-volume','ice-dilution-current','ice-dilution-target','ice-dilution-mash-temp','ice-dilution-water-temp','ice-dilution-target-temp'];
    if(!present(keys)) return clearResult();
    const volume=input(keys[0]),current=input(keys[1]),goal=input(keys[2]),mashTemp=input(keys[3]),waterTemp=input(keys[4]),targetTemp=input(keys[5]);
    const item=components[$('ice-dilution-component').value] || components.alc;
    if(volume<=0) return displayError('追い水前の数量は0Lより大きい数値を入力してください。');
    if(current<=0 || goal<=0) return displayError('現在の成分値と目標成分値は0より大きい数値を入力してください。');
    if(goal>current) return displayError('この画面は水で成分値を下げる計算です。目標の成分値は現在値以下にしてください。');
    if(waterTemp<0 || targetTemp<0) return displayError('水温・目標品温は0℃以上で入力してください。');
    const total=volume*current/goal-volume;
    // 氷0℃を水−80℃相当とした近似熱収支。氷も割水総量に含める。
    if(total<1e-9) return displayError('必要割水量が0Lです。この計算では冷却用の氷を追加できません。');
    const numerator=volume*(mashTemp-targetTemp)+total*(waterTemp-targetTemp);
    const ice=numerator/iceDenom(waterTemp);
    const warning=checkIceResult(ice,total,'replace');
    if(warning) return displayError(warning);
    const water=total-ice;
    const finalVol=volume+total;
    $('ice-result-water-label').textContent='投入する水';
    resultValues({water,ice,summary:'割水総量（水＋氷）：'+numeral(total)+'L ／ 割水後の概算数量：'+numeral(finalVol)+'L',
      note:`${item.label}から割水量を概算し、品温の熱収支で氷を配分しています。${$('ice-dilution-component').value==='be'?'Beは濃度に比例すると仮定した現場用の簡易加重平均です。':'容積の加算・比熱の近似を含みます。'} 最終の成分・品温は実測で確認してください。`,
      steps:[`割水総量 ＝ ${readable(volume)} × ${readable(current)} ÷ ${readable(goal)} − ${readable(volume)} ＝ ${numeral(total)}L`,
        `氷量 ＝ [${readable(volume)} × (${readable(mashTemp)} − ${readable(targetTemp)}) ＋ ${numeral(total)} × (${readable(waterTemp)} − ${readable(targetTemp)})] ÷ (${readable(waterTemp)} ＋ 80 ＋ ${readable(iceCoolingOffset())}) ＝ ${numeral(ice)}kg`,
        `投入する水量 ＝ ${numeral(total)} − ${numeral(ice)} ＝ ${numeral(water)}L`],
      inputRows:[mkrow('条件',[["調整する成分",item.label],["追い水前の数量",readable(volume)+'L'],["現在値",readable(current)+item.unit],["目標値",readable(goal)+item.unit],['追い水前品温',readable(mashTemp)+'℃'],['投入水温',readable(waterTemp)+'℃'],['目標品温',readable(targetTemp)+'℃'],['氷温',iceTempLabel()]])],
      resultRows:[mkrow('計算結果',[['割水総量',numeral(total)+'L'],['投入する水',numeral(water)+'L'],['投入する氷',numeral(ice)+'kg'],['割水後概算数量',numeral(finalVol)+'L']])]});
  }
  function calculate() {
    if(activeMode==='koji') calcKoji();
    else if(activeMode==='dilution') calcDilution();
    else calcWater();
  }
  const exampleValues = {
    water:{'ice-water-way':'replace','ice-water-volume':'100','ice-water-current-temp':'18','ice-water-target-temp':'10'},
    koji:{'ice-koji-volume':'100','ice-koji-water-temp':'18','ice-koji-before-temp':'12','ice-koji-target-temp':'10'},
    dilution:{'ice-dilution-component':'alc','ice-dilution-volume':'184','ice-dilution-current':'11.5','ice-dilution-target':'8','ice-dilution-mash-temp':'25','ice-dilution-water-temp':'18','ice-dilution-target-temp':'20'}
  };
  const modeFields={water:ids.slice(0,4),koji:ids.slice(4,8),dilution:ids.slice(8,15)};
  function resetCurrent() {
    modeFields[activeMode].forEach(id=>{$(id).value='';});
    if(activeMode==='water') $('ice-water-way').value='replace';
    if(activeMode==='dilution') $('ice-dilution-component').value='alc';
    $('ice-ice-temp').value='0';
    setWaterWay();setComponentText();calculate();saveDraft();
  }
  function applyExample() {
    fillValues(exampleValues[activeMode]);
    setWaterWay();setComponentText();calculate();saveDraft();
  }
  function historyItems() {
    try{const parsed=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(parsed)?parsed:[];}catch(_err){return [];}
  }
  function setStatus(message,ok=false) {
    const area=$('ice-history-status');area.textContent=message;
    area.classList.toggle('is-success',ok);
  }
  function saveHistory() {
    if(!latestValidSnapshot) {setStatus('計算結果が出ていません。');return;}
    const now=new Date();
    const item={
      id:'ice-history-'+Date.now()+'-'+Math.random().toString(16).slice(2),
      savedAtISO:now.toISOString(),
      savedAtJst:new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now),
      toolName:'氷・汲水温度調整',mode:activeMode,modeLabel:modeLabels[activeMode],fieldValues:readInputValues(),
      inputRows:latestValidSnapshot.inputRows,resultRows:latestValidSnapshot.resultRows
    };
    const items=historyItems();
    if(items[0] && items[0].mode===item.mode && JSON.stringify(items[0].fieldValues)===JSON.stringify(item.fieldValues)) {
      setStatus('直前と同じ入力値なので二重保存しませんでした。');return;
    }
    items.unshift(item);
    try {localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,80)));setStatus('この計算結果を履歴に保存しました。',true);}
    catch(_err) {setStatus('保存できませんでした。端末の保存設定を確認してください。');}
  }
  function restorePendingHistory() {
    try {
      const raw=sessionStorage.getItem(HISTORY_RESTORE_KEY);
      if(!raw)return;
      sessionStorage.removeItem(HISTORY_RESTORE_KEY);
      const state=importLegacy(JSON.parse(raw));
      fillValues(state.values);
      setWaterWay();setComponentText();setMode(state.mode);
      saveDraft();
      setStatus('履歴の入力値を復元しました。自動保存・2mm表候補への送信はしていません。');
    }catch(_err){setStatus('履歴の入力値を戻せませんでした。');}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    restoreDraft();
    setWaterWay();setComponentText();
    document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
    ids.forEach(id=>{$(id).addEventListener('input',()=>{setWaterWay();setComponentText();calculate();saveDraft();});$(id).addEventListener('change',()=>{setWaterWay();setComponentText();calculate();saveDraft();});});
    $('ice-reset').addEventListener('click',resetCurrent);
    $('ice-example').addEventListener('click',applyExample);
    $('ice-save-history').addEventListener('click',saveHistory);
    draftReady=true;
    setMode(activeMode);
    restorePendingHistory();
  });
  window.SakeCalcIce={calculate,setMode};
})();
