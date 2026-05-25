// js/core/theme.js - Section color theming
(function(){
  'use strict';
  const Theme={
    _observer:null,

    init(config){
      this._config=config;
      this._observeSections();
    },

    _observeSections(){
      const sections=document.querySelectorAll('section[id]');
      if(!sections.length)return;
      this._observer=new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            const id=e.target.id;
            const color=this._config.sections[id]?.themeColor||'var(--color-accent)';
            document.documentElement.style.setProperty('--color-accent-current',color);
            e.target.style.setProperty('--section-accent',color);
          }
        });
      },{threshold:0.3});
      sections.forEach(s=>this._observer.observe(s));
    },

    destroy(){
      if(this._observer)this._observer.disconnect();
    }
  };
  window.App=window.App||{};window.App.Theme=Theme;
})();
