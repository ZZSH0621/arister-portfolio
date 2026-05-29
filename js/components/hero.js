// js/components/hero.js
// WebGL retro-TV effect with photo texture blended via shader
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

          // TV-style scanline distortion on UV
          float n1=noise(uv*8.0+uTime*0.08)*0.04;
          float n2=noise(uv*15.0-uTime*0.05)*0.02;
          vec2 uvDistorted=uv+vec2(n1,n2);

          // Sample photo with distorted UV
          vec4 photo=texture2D(uPhoto,uvDistorted);

          // Retro color shift (chromatic aberration)
          float rShift=noise(uv*12.0+uTime*0.06)*0.015;
          float bShift=noise(uv*12.0+uTime*0.07)*0.015;
          float r=texture2D(uPhoto,uvDistorted+vec2(rShift,0.0)).r;
          float b=texture2D(uPhoto,uvDistorted-vec2(bShift,0.0)).b;
          photo.r=mix(photo.r,r,0.4);
          photo.b=mix(photo.b,b,0.4);

          // Noise grain overlay
          float grain=noise(uv*80.0+uTime*0.5)*0.12-0.06;

          // Scanlines
          float scanline=sin(uv.y*800.0+uTime*0.2)*0.04;

          // Vignette
          float dist=distance(uv,vec2(0.5+sin(uTime*0.3)*0.15,0.5+cos(uTime*0.4)*0.15));
          float vignette=smoothstep(0.0,1.0,dist*1.6);

          // Blend: photo + noise grain + scanlines + color gradient overlay
          vec3 col=photo.rgb+grain+scanline;
          col=mix(col,uColor1,vignette*0.35);
          col*=0.9+vignette*0.1;

          // Slight brightness flicker
          col*=1.0+noise(vec2(uTime*0.3,0.0))*0.04;

          gl_FragColor=vec4(col,0.7+vignette*0.25);
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
