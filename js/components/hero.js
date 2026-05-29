// js/components/hero.js
// WebGL CRT-TV effect: photo displayed on a vintage television screen
(function(){
  'use strict';
  const Hero={
    _canvas:null,_scene:null,_renderer:null,_cleanup:null,

    init(){
      this._canvas=document.getElementById('heroCanvas');
      if(!this._canvas||App.Utils.isTouch())return;
      this._setupWebGL();
    },

    _setupWebGL(){
      if(typeof THREE==='undefined')return;
      const self=this;
      const rect=this._canvas.parentElement.getBoundingClientRect();
      this._renderer=new THREE.WebGLRenderer({canvas:this._canvas,alpha:true,antialias:true});
      this._renderer.setSize(rect.width,rect.height,false);
      this._renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

      this._scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(45,rect.width/Math.max(rect.height,1),0.1,10);
      camera.position.z=2.5;

      // Load photo texture
      const loader=new THREE.TextureLoader();
      const photoTex=loader.load('hero-photo.png');

      const geo=new THREE.PlaneGeometry(2.2,2.2);
      const mat=new THREE.ShaderMaterial({
        uniforms:{
          uTime:{value:0},
          uResolution:{value:new THREE.Vector2(rect.width,rect.height)},
          uColor1:{value:new THREE.Color('#ff5e2c')},
          uColor2:{value:new THREE.Color('#1a1a2e')},
          uPhoto:{value:photoTex}
        },
        vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:`varying vec2 vUv;uniform float uTime;uniform vec3 uColor1,uColor2;uniform sampler2D uPhoto;
        float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        void main(){
          vec2 uv=vUv;

          // CRT barrel distortion (screen curvature)
          vec2 centered=uv-0.5;
          float r2=dot(centered,centered);
          float barrel=1.0+r2*0.08;
          vec2 uvCRT=0.5+centered*barrel;

          // Clamp to screen bounds
          if(uvCRT.x<0.0||uvCRT.x>1.0||uvCRT.y<0.0||uvCRT.y>1.0){
            gl_FragColor=vec4(0.0,0.0,0.0,1.0);
            return;
          }

          // Aggressive signal jitter — horizontal wobble
          float jitter=noise(vec2(uv.y*25.0,uTime*0.7))*0.012;
          jitter+=noise(vec2(uv.y*8.0,uTime*1.3))*0.006;
          uvCRT.x+=jitter;

          // Vertical jitter — V-hold glitch
          float vJitter=noise(vec2(uTime*0.9,0.0))*0.006;
          uvCRT.y+=vJitter;

          // Random horizontal glitch bands
          float glitchBand=step(0.92,noise(vec2(uv.y*2.0,uTime*1.5)));
          float glitchShift=glitchBand*noise(vec2(uv.y,uTime*2.0))*0.04;
          uvCRT.x+=glitchShift;

          // Sample photo
          vec4 photo=texture2D(uPhoto,uvCRT);

          // Stronger chromatic aberration at edges
          float edge=abs(centered.x)*2.0;
          float caShift=edge*0.012;
          float r=texture2D(uPhoto,uvCRT+vec2(caShift,0.0)).r;
          float b=texture2D(uPhoto,uvCRT-vec2(caShift,0.0)).b;
          photo.r=mix(photo.r,r,edge*0.5);
          photo.b=mix(photo.b,b,edge*0.5);

          // Phosphor glow: bright areas bleed
          float brightness=dot(photo.rgb,vec3(0.299,0.587,0.114));
          float glow=smoothstep(0.6,1.0,brightness)*0.08;
          photo.rgb+=glow;

          // CRT scanlines
          float scanY=uvCRT.y*600.0;
          float scanline=1.0-smoothstep(0.3,0.7,sin(scanY*3.14159)*0.5+0.5)*0.10;

          // Phosphor mask
          float maskP=1.0-smoothstep(0.4,0.6,sin(scanY*3.14159)*0.5+0.5)*0.04;

          // Aggressive film grain
          float grain=noise(uv*250.0+uTime*1.2)*0.12-0.06;
          grain+=noise(uv*80.0-uTime*0.6)*0.06-0.03;

          // Screen reflection sheen
          float sheen=(1.0-abs(centered.y))*0.08;
          sheen*=smoothstep(0.2,0.0,abs(centered.x-0.15));

          // Vignette
          float dist=length(centered)*1.3;
          float vignette=smoothstep(0.35,0.9,dist);

          // Assemble
          vec3 col=photo.rgb;
          col*=scanline;
          col*=maskP;
          col+=grain;
          col+=sheen;

          // Edge darkening
          col=mix(col,vec3(0.0),vignette*0.5);

          // Subtle warm color cast
          col*=vec3(1.02,0.98,0.94);

          // Aggressive brightness & color flicker
          float flicker=noise(vec2(uTime*0.4,0.0))*0.05;
          flicker+=noise(vec2(uTime*1.5,1.0))*0.03;
          col*=1.0+flicker;

          // Occasional color channel glitch
          float colorGlitch=step(0.94,noise(vec2(uTime*0.6,0.0)));
          if(colorGlitch>0.5){
            col.r+=noise(vec2(uv.y*10.0,uTime))*0.04;
            col.b-=noise(vec2(uv.y*10.0,uTime+1.0))*0.04;
          }

          // Outer bezel shadow (screen frame)
          float bezel=smoothstep(0.44,0.5,dist);
          col=mix(col,vec3(0.0),bezel*0.6);

          gl_FragColor=vec4(col,1.0);
        }`
      });
      const mesh=new THREE.Mesh(geo,mat);
      this._scene.add(mesh);

      // Resize handler
      const onResize=App.Utils.debounce(()=>{
        const r=this._canvas.parentElement.getBoundingClientRect();
        this._renderer.setSize(r.width,r.height,false);
        mat.uniforms.uResolution.value.set(r.width,r.height);
      },200);
      window.addEventListener('resize',onResize);

      this._cleanup=App.Utils.raf((t)=>{
        mat.uniforms.uTime.value=t*0.001;
        this._renderer.render(this._scene,camera);
      });
    },

    destroy(){if(this._cleanup)this._cleanup()}
  };
  window.App=window.App||{};window.App.Hero=Hero;
})();
