(function(){
  'use strict';

  const STORAGE_KEY = 'sakeCalc.htmlSplit.moto.lastInputs.v1';
  const $ = (id) => document.getElementById(id);

  function truncateFixed(value, digits){
    const number = Number(value);
    const scale = 10 ** digits;
    if(!Number.isFinite(number)) return '';
    return (Math.trunc(number * scale) / scale).toFixed(digits);
  }

  function buildRow(targetTemp, waterKojiTemp){
    const steamedRiceTemp = (targetTemp - waterKojiTemp) * 3.5 + waterKojiTemp;
    return `<tr><td>${targetTemp}℃</td><td>${truncateFixed(steamedRiceTemp, 2)}℃</td></tr>`;
  }

  function saveInputs(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        waterKojiTemp: $('moto-water-koji-temp')?.value || ''
      }));
    } catch(_err) {}
  }

  function calculate(){
    const input = $('moto-water-koji-temp');
    const result = $('moto-result');
    const error = $('moto-error');
    const body = $('moto-body');
    const yodanBody = $('moto-yodan-body');
    const yodanDetails = $('moto-yodan');

    if(!input || !result || !error || !body || !yodanBody) return;

    error.hidden = true;
    error.textContent = '';
    body.innerHTML = '';
    yodanBody.innerHTML = '';

    const raw = input.value;
    if(raw === ''){
      result.hidden = true;
      if(yodanDetails) yodanDetails.open = false;
      saveInputs();
      return;
    }

    const waterKojiTemp = Number(raw);
    if(!Number.isFinite(waterKojiTemp)){
      result.hidden = true;
      error.textContent = '水麹温度を数値で入力してください。';
      error.hidden = false;
      return;
    }

    body.innerHTML = [18,19,20,21,22,23,24,25,26,27,28,29,30]
      .map((targetTemp) => buildRow(targetTemp, waterKojiTemp))
      .join('');

    yodanBody.innerHTML = [55,56,57,58,59,60]
      .map((targetTemp) => buildRow(targetTemp, waterKojiTemp))
      .join('');

    result.hidden = false;
    saveInputs();
  }

  function reset(){
    const input = $('moto-water-koji-temp');
    if(input) input.value = '';
    calculate();
  }

  function restoreInputs(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const input = $('moto-water-koji-temp');
      if(saved.waterKojiTemp && input) input.value = saved.waterKojiTemp;
      // 旧キー互換: 以前の圧縮JSでは wk で保存していた。
      if(!saved.waterKojiTemp && saved.wk && input) input.value = saved.wk;
    } catch(_err) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    restoreInputs();
    $('moto-water-koji-temp')?.addEventListener('input', calculate);
    $('moto-reset')?.addEventListener('click', reset);
    calculate();
  });
})();
