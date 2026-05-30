(function(){
  'use strict';

  const STORAGE_KEY = 'sakeCalc.htmlSplit.jumai.lastInputs.v1';
  const $ = (id) => document.getElementById(id);

  function truncateFixed(value, digits){
    const number = Number(value);
    const scale = 10 ** digits;
    if(!Number.isFinite(number)) return '';
    return (Math.trunc(number * scale) / scale).toFixed(digits);
  }

  function saveInputs(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        waterKojiTemp: $('jumai-water-koji-temp')?.value || '',
        factor: $('jumai-factor')?.value || '5'
      }));
    } catch(_err) {}
  }

  function calculate(){
    const input = $('jumai-water-koji-temp');
    const factorSelect = $('jumai-factor');
    const result = $('jumai-result');
    const error = $('jumai-error');
    const body = $('jumai-body');

    if(!input || !factorSelect || !result || !error || !body) return;

    error.hidden = true;
    error.textContent = '';
    body.innerHTML = '';

    const raw = input.value;
    if(raw === ''){
      result.hidden = true;
      saveInputs();
      return;
    }

    const waterKojiTemp = Number(raw);
    const factor = Number(factorSelect.value);
    if(!Number.isFinite(waterKojiTemp) || !Number.isFinite(factor)){
      result.hidden = true;
      error.textContent = '水麹温度と工程を確認してください。';
      error.hidden = false;
      return;
    }

    let html = '';
    for(let targetTemp = 6.0; targetTemp <= 15.0001; targetTemp += 0.5){
      const steamedRiceTemp = (targetTemp - waterKojiTemp) * factor + waterKojiTemp;
      html += `<tr><td>${targetTemp.toFixed(1)}℃</td><td>${truncateFixed(steamedRiceTemp, 2)}℃</td></tr>`;
    }

    body.innerHTML = html;
    result.hidden = false;
    saveInputs();
  }

  function reset(){
    const input = $('jumai-water-koji-temp');
    const factorSelect = $('jumai-factor');
    if(input) input.value = '';
    if(factorSelect) factorSelect.value = '5';
    calculate();
  }

  function restoreInputs(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const input = $('jumai-water-koji-temp');
      const factorSelect = $('jumai-factor');
      const waterKojiTemp = saved.waterKojiTemp || saved.wk;
      const factor = saved.factor || saved.f;
      if(waterKojiTemp && input) input.value = waterKojiTemp;
      if(factor && factorSelect) factorSelect.value = factor;
    } catch(_err) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    restoreInputs();
    $('jumai-water-koji-temp')?.addEventListener('input', calculate);
    $('jumai-factor')?.addEventListener('change', calculate);
    $('jumai-reset')?.addEventListener('click', reset);
    calculate();
  });
})();
