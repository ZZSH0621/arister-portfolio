// Hand-drawn ink ripples layered above FloatingLines.
(function(){
  'use strict';

  const InkRipples={
    _section:null,_canvas:null,_ctx:null,_ripples:[],_raf:null,_lastFrame:0,
    _lastPoint:null,_resizeHandler:null,_observer:null,_reducedMotion:false,

    init(options){
      this._section=document.getElementById('about');
      this._canvas=document.getElementById('inkRipples');
      if(!this._section||!this._canvas)return;
      this._ctx=this._canvas.getContext('2d');
      if(!this._ctx)return;
      this._options=Object.assign({
        colors:['#356dff','#dce5ff'],
        duration:1450,
        spawnDistance:54,
        maxRipples:12
      },options||{});
      this._reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._resizeHandler=App.Utils.debounce(()=>this._resize(),100);
      window.addEventListener('resize',this._resizeHandler);
      if(typeof ResizeObserver!=='undefined'){
        this._observer=new ResizeObserver(this._resizeHandler);
        this._observer.observe(this._section);
      }
      this._section.addEventListener('pointermove',event=>this._onMove(event));
      this._section.addEventListener('pointerdown',event=>this._onPress(event));
      this._section.addEventListener('pointerleave',()=>{this._lastPoint=null});
      this._resize();
      this._seedInitialRipples();
      this._raf=requestAnimationFrame(time=>this._animate(time));
    },

    _resize(){
      const rect=this._section.getBoundingClientRect();
      const dpr=Math.min(window.devicePixelRatio||1,2);
      this._canvas.width=Math.max(1,Math.round(rect.width*dpr));
      this._canvas.height=Math.max(1,Math.round(rect.height*dpr));
      this._canvas.style.width=rect.width+'px';
      this._canvas.style.height=rect.height+'px';
      this._ctx.setTransform(dpr,0,0,dpr,0,0);
    },

    _point(event){
      const rect=this._section.getBoundingClientRect();
      return {x:event.clientX-rect.left,y:event.clientY-rect.top};
    },

    _onMove(event){
      if(this._reducedMotion)return;
      const point=this._point(event);
      if(!this._lastPoint||Math.hypot(point.x-this._lastPoint.x,point.y-this._lastPoint.y)>=this._options.spawnDistance){
        this._spawn(point.x,point.y,0.8);
        this._lastPoint=point;
      }
    },

    _onPress(event){
      const point=this._point(event);
      this._spawn(point.x,point.y,1.35);
      this._spawn(point.x+8,point.y-5,1.0,120);
    },

    _seedInitialRipples(){
      const rect=this._section.getBoundingClientRect();
      this._spawn(rect.width*0.23,rect.height*0.28,0.9,-420);
      this._spawn(rect.width*0.72,rect.height*0.58,1.05,-180);
      this._spawn(rect.width*0.48,rect.height*0.82,0.72,-650);
    },

    _spawn(x,y,energy,ageOffset){
      const now=performance.now()+(ageOffset||0);
      this._ripples.push({
        x,y,energy,born:now,seed:Math.random()*1000,
        rings:Math.round(5+energy*4),rotation:Math.random()*Math.PI*2
      });
      if(this._ripples.length>this._options.maxRipples){
        this._ripples.splice(0,this._ripples.length-this._options.maxRipples);
      }
    },

    _random(seed){return Math.abs(Math.sin(seed*12.9898)*43758.5453)%1},

    _drawRipple(ripple,now){
      const age=now-ripple.born;
      const progress=Math.max(0,age/this._options.duration);
      if(progress>=1)return false;
      const fade=Math.pow(1-progress,1.45);
      const baseRadius=10+progress*78*ripple.energy;
      const ctx=this._ctx;

      for(let ring=0;ring<ripple.rings;ring++){
        const ringFade=fade*(1-ring/(ripple.rings+3));
        const radius=baseRadius+ring*5.4;
        const segments=4+Math.floor(this._random(ripple.seed+ring)*4);
        ctx.strokeStyle=this._hexToRgba(this._options.colors[ring%this._options.colors.length],ringFade*(0.42+0.26*ripple.energy));
        ctx.lineWidth=0.65+this._random(ripple.seed+ring*3.1)*1.65;
        ctx.lineCap='round';

        for(let segment=0;segment<segments;segment++){
          const slot=Math.PI*2/segments;
          const gap=0.12+this._random(ripple.seed+ring*9+segment)*0.32;
          const start=ripple.rotation+segment*slot+gap;
          const end=ripple.rotation+(segment+1)*slot-gap*1.6;
          if(end<=start)continue;
          ctx.beginPath();
          const steps=10;
          for(let step=0;step<=steps;step++){
            const t=step/steps;
            const angle=start+(end-start)*t;
            const wobble=Math.sin(angle*(5+ring%4)+ripple.seed)*2.1+Math.sin(t*Math.PI*3+ring)*1.2;
            const r=radius+wobble;
            const x=ripple.x+Math.cos(angle)*r;
            const y=ripple.y+Math.sin(angle)*r*0.82;
            if(step===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          }
          ctx.stroke();
        }
      }
      return true;
    },

    _hexToRgba(hex,alpha){
      const value=hex.replace('#','');
      const r=parseInt(value.slice(0,2),16);
      const g=parseInt(value.slice(2,4),16);
      const b=parseInt(value.slice(4,6),16);
      return `rgba(${r},${g},${b},${Math.max(0,Math.min(1,alpha))})`;
    },

    _animate(now){
      if(now-this._lastFrame>=33){
        const rect=this._canvas.getBoundingClientRect();
        this._ctx.clearRect(0,0,rect.width,rect.height);
        this._ctx.globalCompositeOperation='screen';
        this._ripples=this._ripples.filter(ripple=>this._drawRipple(ripple,now));
        this._lastFrame=now;
      }
      this._raf=requestAnimationFrame(time=>this._animate(time));
    }
  };

  window.App=window.App||{};
  window.App.InkRipples=InkRipples;
})();