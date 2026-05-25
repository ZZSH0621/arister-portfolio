// js/components/navigation.js
(function(){
  'use strict';
  const Navigation={
    _nav:null,_burger:null,_links:null,_lastScroll:0,

    init(){
      this._nav=document.getElementById('nav');
      this._burger=document.getElementById('navBurger');
      this._links=document.getElementById('navLinks');
      if(!this._nav)return;
      this._bindEvents();
      this._initScrollSpy();
    },

    _bindEvents(){
      if(this._burger){
        this._burger.addEventListener('click',()=>this._toggleMobile());
      }
      document.addEventListener('scroll',App.Utils.throttle(()=>this._onScroll(),80),{passive:true});

      const langToggle=document.querySelector('[data-lang-toggle]');
      if(langToggle){
        langToggle.addEventListener('click',()=>App.I18n.toggle());
      }

      // Close mobile menu on link click
      document.querySelectorAll('.nav__link').forEach(link=>{
        link.addEventListener('click',()=>this._closeMobile());
        // Update active on click
        link.addEventListener('click',()=>{
          document.querySelectorAll('.nav__link').forEach(l=>l.classList.remove('active'));
          link.classList.add('active');
        });
      });
    },

    _toggleMobile(){
      const isOpen=this._links.classList.toggle('open');
      this._burger.classList.toggle('active',isOpen);
      this._burger.setAttribute('aria-expanded',isOpen);
    },

    _closeMobile(){
      this._links.classList.remove('open');
      this._burger.classList.remove('active');
      this._burger.setAttribute('aria-expanded','false');
    },

    _onScroll(){
      const y=window.scrollY;
      if(!this._nav)return;

      // Add background on scroll
      this._nav.classList.toggle('nav--scrolled',y>50);

      // Hide on scroll down, show on scroll up
      if(y>300&&y>this._lastScroll+10){
        this._nav.classList.add('nav--hidden');
      }else if(y<this._lastScroll-5){
        this._nav.classList.remove('nav--hidden');
      }
      this._lastScroll=y;
    },

    _initScrollSpy(){
      const sections=document.querySelectorAll('section[id]');
      const navLinks=document.querySelectorAll('.nav__link');
      if(!sections.length)return;

      const observer=new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            navLinks.forEach(link=>{
              link.classList.toggle('active',link.getAttribute('href')==='#'+e.target.id);
            });
          }
        });
      },{rootMargin:'-50% 0px -50% 0px'});

      sections.forEach(s=>observer.observe(s));
    }
  };
  window.App=window.App||{};window.App.Navigation=Navigation;
})();
