// js/components/cursor.js - Custom cursor with lerp trailing + arrow/cross morph
(function(){
  'use strict';
  var Cursor={
    _cursor:null,_pos:{x:-100,y:-100},_current:{x:-100,y:-100},_enabled:true,_rafId:null,
    _stageEl:null,

    init:function(){
      if(App.Utils.isTouch())return;
      this._cursor=document.querySelector('.custom-cursor');
      if(!this._cursor)return;
      this._stageEl=document.getElementById('portfolioStage');
      this._bindEvents();
      this._renderLoop();
    },

    _bindEvents:function(){
      var self=this;
      document.addEventListener('mousemove',function(e){
        self._pos.x=e.clientX;self._pos.y=e.clientY;
        self._detectShape(e);
      },{passive:true});

      document.addEventListener('mouseleave',function(){self._cursor.classList.add('custom-cursor--hidden')});
      document.addEventListener('mouseenter',function(){self._cursor.classList.remove('custom-cursor--hidden')});
      document.addEventListener('mousedown',function(){self._cursor.classList.add('custom-cursor--clicking')});
      document.addEventListener('mouseup',function(){self._cursor.classList.remove('custom-cursor--clicking')});

      // Hover effect on interactive elements
      var hoverSelector='a,button,.portfolio__card,[role="button"],.accordion__trigger,.social-link,.portfolio__strip,.portfolio__dot,.portfolio__gallery-item';
      document.addEventListener('mouseover',function(e){
        var target=e.target.closest(hoverSelector);
        if(target)self._cursor.classList.add('custom-cursor--hover');
        else self._cursor.classList.remove('custom-cursor--hover');
      });
    },

    // Detect whether cursor should show arrow or cross based on context
    _detectShape:function(e){
      var stage=this._stageEl;
      var isInStage=stage&&this._isInside(stage,e.clientX,e.clientY);
      var overStrip=e.target.closest('.portfolio__strip');
      var overGallery=e.target.closest('.portfolio__gallery-item');

      // Reset shapes
      this._cursor.classList.remove('custom-cursor--arrow','custom-cursor--cross');

      if(isInStage){
        if(overStrip){
          this._cursor.classList.add('custom-cursor--cross');
        }else{
          this._cursor.classList.add('custom-cursor--arrow');
        }
      }
    },

    _isInside:function(el,x,y){
      var r=el.getBoundingClientRect();
      return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
    },

    _renderLoop:function(){
      var l=0.12;
      this._current.x+=((this._pos.x||-100)-this._current.x)*l;
      this._current.y+=((this._pos.y||-100)-this._current.y)*l;

      var size=this._cursor.offsetWidth||28;
      this._cursor.style.transform='translate3d('+(this._current.x-size/2)+'px,'+(this._current.y-size/2)+'px,0)';

      this._rafId=requestAnimationFrame(this._renderLoop.bind(this));
    },

    destroy:function(){if(this._rafId)cancelAnimationFrame(this._rafId)}
  };
  window.App=window.App||{};window.App.Cursor=Cursor;
})();
