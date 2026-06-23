// js/app.js - Entry point: initializes all modules in dependency order
(function(){
  'use strict';

  function init(){
    var C=window.__CONFIG;
    var App=window.App;

    // 1. Core systems
    if(App.I18n)App.I18n.init(C);
    if(App.Theme)App.Theme.init(C);

    // 2. UI components
    if(App.Navigation)App.Navigation.init();
    if(App.LetterGlitch)App.LetterGlitch.init({glitchSpeed:50,smooth:true});
    if(App.Hero)App.Hero.init();
    if(App.FloatingLines)App.FloatingLines.init({lineCount:[8,8,8],lineDistance:[8,6,4],bendRadius:5,bendStrength:-0.5,colors:['#0061ff','#444343','#c40000']});
    if(App.InkRipples)App.InkRipples.init({colors:['#356dff','#dce5ff']});
    if(App.About)App.About.init();
    if(App.Cursor)App.Cursor.init();
    if(App.Animations)App.Animations.init();

    // 3. Data-driven components
    if(App.Portfolio)App.Portfolio.init(window.__PROJECTS);
    if(App.BlogPreview)App.BlogPreview.init();
    if(App.Contact)App.Contact.init();

    // 4. Post-init
    document.getElementById('copyYear').textContent=new Date().getFullYear();

    // Mark as ready (hides loader)
    setTimeout(function(){
      document.documentElement.classList.add('app-ready');
    },600);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();
