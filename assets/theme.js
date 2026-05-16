(function(){
  'use strict';

  var STORAGE_KEY = 'sake-calc-theme-mode';
  var DARK_CLASS = 'theme-dark';
  var DARK_MEDIA = '(prefers-color-scheme: dark)';
  var LIGHT_THEME_COLOR = '#2f4257';
  var DARK_THEME_COLOR = '#0b111c';

  function safeGet(key){
    try{return window.localStorage ? window.localStorage.getItem(key) : null;}catch(_err){return null;}
  }
  function safeSet(key, value){
    try{if(window.localStorage){window.localStorage.setItem(key, value);}}catch(_err){}
  }
  function prefersDark(){
    try{return window.matchMedia && window.matchMedia(DARK_MEDIA).matches;}catch(_err){return false;}
  }
  function readMode(){
    var saved = safeGet(STORAGE_KEY);
    if(saved === 'dark' || saved === 'light'){return saved;}
    return prefersDark() ? 'dark' : 'light';
  }
  function getThemeMeta(){
    return document.querySelector('meta[name="theme-color"]');
  }
  function applyMode(mode){
    var isDark = mode === 'dark';
    document.body.classList.toggle(DARK_CLASS, isDark);
    document.documentElement.classList.toggle(DARK_CLASS, isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    var meta = getThemeMeta();
    if(meta){meta.setAttribute('content', isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);}
    updateButtons(isDark);
  }
  function updateButtons(isDark){
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    buttons.forEach(function(btn){
      btn.textContent = isDark ? '明色' : '暗色';
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', isDark ? 'ライトテーマに切り替える' : 'ダークテーマに切り替える');
      btn.title = isDark ? 'ライトテーマに切り替える' : 'ダークテーマに切り替える';
    });
  }
  function buildButton(){
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle-btn';
    button.setAttribute('data-theme-toggle','');
    button.addEventListener('click', function(){
      var next = document.body.classList.contains(DARK_CLASS) ? 'light' : 'dark';
      safeSet(STORAGE_KEY, next);
      applyMode(next);
    });
    return button;
  }
  function insertToggle(){
    if(document.querySelector('[data-theme-toggle]')){return;}
    var nav = document.querySelector('.tool-nav');
    if(nav){
      nav.appendChild(buildButton());
      return;
    }
    var homeHeader = document.querySelector('.home-header');
    if(homeHeader){
      var row = document.createElement('div');
      row.className = 'home-theme-toggle-row';
      row.appendChild(buildButton());
      homeHeader.appendChild(row);
    }
  }

  function boot(){
    insertToggle();
    applyMode(readMode());
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  }else{
    boot();
  }
})();
