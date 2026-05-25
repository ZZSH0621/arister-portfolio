// js/core/utils.js
(function(){
  'use strict';
  const U={
    debounce(fn,ms){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms)}},
    throttle(fn,ms){let last=0;return function(...a){const now=Date.now();if(now-last>=ms){last=now;fn.apply(this,a)}}},
    lerp(a,b,t){return a+(b-a)*t},
    clamp(v,min,max){return Math.max(min,Math.min(max,v))},
    map(v,inMin,inMax,outMin,outMax){return(v-inMin)/(inMax-inMin)*(outMax-outMin)+outMin},
    isTouch(){return window.matchMedia('(pointer:coarse)').matches},
    raf(fn){let id;const loop=(t)=>{fn(t);id=requestAnimationFrame(loop)};id=requestAnimationFrame(loop);return()=>cancelAnimationFrame(id)},
    qs(s,p){return(p||document).querySelector(s)},
    qsa(s,p){return Array.from((p||document).querySelectorAll(s))}
  };
  window.App=window.App||{};window.App.Utils=U;
})();
