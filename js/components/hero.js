// js/components/hero.js
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
      const rect=this._canvas.parentElement.getBoundingClientRect();
      this._renderer=new THREE.WebGLRenderer({canvas:this._canvas,alpha:true,antialias:true});
      this._renderer.setSize(rect.width,rect.height,false);
      this._renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

      this._scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(45,rect.width/Math.max(rect.height,1),0.1,10);
      camera.position.z=2.5;

      // Simple gradient-like shader
      const geo=new THREE.PlaneGeometry(2.2,2.2);
      const mat=new THREE.ShaderMaterial({
        uniforms:{
          uTime:{value:0},
          uResolution:{value:new THREE.Vector2(rect.width,rect.height)},
          uColor1:{value:new THREE.Color('#ff5e2c')},
          uColor2:{value:new THREE.Color('#1a1a2e')}
        },
        vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:`varying vec2 vUv;uniform float uTime;uniform vec3 uColor1,uColor2;
        float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        void main(){
          vec2 uv=vUv;
          float n=noise(uv*5.0+uTime*0.1)*0.3+noise(uv*10.0-uTime*0.05)*0.15;
          float dist=distance(uv,vec2(0.5+sin(uTime*0.3)*0.2,0.5+cos(uTime*0.4)*0.2));
          float gradient=smoothstep(0.0,1.2,dist+n);
          vec3 col=mix(uColor1,uColor2,gradient);
          gl_FragColor=vec4(col,0.6);
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
