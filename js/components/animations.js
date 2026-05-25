// js/components/animations.js - Scroll reveal animations
(function(){
  'use strict';
  var Animations={
    _observer:null,

    init(){
      this.destroy();
      this._observeReveals();
    },

    _observeReveals(){
      var elements=document.querySelectorAll('[data-reveal]:not(.revealed),[data-reveal-stagger]:not(.revealed)');
      if(!elements.length)return;

      var self=this;
      this._observer=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){
            e.target.classList.add('revealed');
            self._observer.unobserve(e.target);
          }
        });
      },{threshold:0.15,rootMargin:'0px 0px -40px 0px'});

      elements.forEach(function(el){self._observer.observe(el)});
    },

    destroy(){if(this._observer){this._observer.disconnect();this._observer=null}}
  };
  window.App=window.App||{};window.App.Animations=Animations;
})();
