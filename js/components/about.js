// js/components/about.js - Accordion with FLIP animation
(function(){
  'use strict';
  const About={
    init(){
      document.querySelectorAll('.accordion__trigger').forEach(trigger=>{
        trigger.addEventListener('click',()=>this._toggle(trigger));
      });
    },

    _toggle(trigger){
      const content=trigger.nextElementSibling;
      if(!content)return;
      const isOpen=trigger.getAttribute('aria-expanded')==='true';

      if(isOpen){
        this._collapse(trigger,content);
      }else{
        this._expand(trigger,content);
      }
    },

    _expand(trigger,content){
      const first=content.getBoundingClientRect();
      content.classList.add('expanded');
      const last=content.getBoundingClientRect();
      const deltaY=first.height-last.height;

      content.style.transform=`translateY(${deltaY}px)`;
      content.style.transition='none';
      content.offsetHeight;

      content.style.transition='transform 0.45s cubic-bezier(0.16,1,0.3,1)';
      content.style.transform='';
      trigger.setAttribute('aria-expanded','true');

      const onEnd=()=>{
        content.style.transform='';
        content.style.transition='';
        content.removeEventListener('transitionend',onEnd);
      };
      content.addEventListener('transitionend',onEnd,{once:true});
    },

    _collapse(trigger,content){
      const first=content.getBoundingClientRect();
      content.style.transition='transform 0.35s cubic-bezier(0.16,1,0.3,1)';
      content.classList.remove('expanded');
      const last=content.getBoundingClientRect();
      const deltaY=first.top-last.top;

      content.style.transform=`translateY(${deltaY}px)`;
      content.offsetHeight;
      content.style.transform='';
      trigger.setAttribute('aria-expanded','false');

      const onEnd=()=>{
        content.style.transform='';
        content.style.transition='';
        content.removeEventListener('transitionend',onEnd);
      };
      content.addEventListener('transitionend',onEnd,{once:true});
    }
  };
  window.App=window.App||{};window.App.About=About;
})();
