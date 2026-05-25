// js/core/i18n.js - Bilingual engine
(function(){
  'use strict';
  const I18n={
    _lang:null,
    _translations:{},

    init(config){
      this._translations=window.__I18N;
      const stored=localStorage.getItem('lang');
      const browserLang=navigator.language||'';
      const def=config.defaultLanguage||'zh-CN';
      if(stored&&this._translations[stored]){this._lang=stored}
      else if(browserLang.startsWith('zh')){this._lang='zh-CN'}
      else{this._lang=def}
      document.documentElement.lang=this._lang;
      this._bindDOM();
      this._updateToggle();
    },

    t(key){return this._translations[this._lang]?.[key]??this._translations['en']?.[key]??key},
    lang(){return this._lang},

    toggle(){
      const langs=Object.keys(this._translations);
      const idx=langs.indexOf(this._lang);
      this._lang=langs[(idx+1)%langs.length];
      localStorage.setItem('lang',this._lang);
      document.documentElement.lang=this._lang;
      this._bindDOM();
      this._updateToggle();
      document.dispatchEvent(new CustomEvent('languageChanged',{detail:{lang:this._lang}}));
    },

    setLanguage(lang){
      if(!this._translations[lang])return;
      this._lang=lang;
      localStorage.setItem('lang',lang);
      document.documentElement.lang=lang;
      this._bindDOM();
      this._updateToggle();
      document.dispatchEvent(new CustomEvent('languageChanged',{detail:{lang}}));
    },

    _bindDOM(){
      document.querySelectorAll('[data-i18n]').forEach(el=>{
        el.innerHTML=this.t(el.dataset.i18n);
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
        el.placeholder=this.t(el.dataset.i18nPlaceholder);
      });
    },

    _updateToggle(){
      const btn=document.querySelector('[data-lang-toggle]');
      if(btn)btn.textContent=this.t('lang.switch');
    }
  };
  window.App=window.App||{};window.App.I18n=I18n;
})();
