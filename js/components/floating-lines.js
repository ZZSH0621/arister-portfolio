// React Bits FloatingLines adapted for this vanilla JavaScript site.
(function(){
  'use strict';

  const vertexShader=`
    precision highp float;
    void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
  `;

  const fragmentShader=`
    precision highp float;
    uniform float iTime;
    uniform vec3 iResolution;
    uniform float animationSpeed;
    uniform int topLineCount;
    uniform int middleLineCount;
    uniform int bottomLineCount;
    uniform float topLineDistance;
    uniform float middleLineDistance;
    uniform float bottomLineDistance;
    uniform vec3 topWavePosition;
    uniform vec3 middleWavePosition;
    uniform vec3 bottomWavePosition;
    uniform vec2 iMouse;
    uniform float bendRadius;
    uniform float bendStrength;
    uniform float bendInfluence;
    uniform float parallaxStrength;
    uniform vec2 parallaxOffset;
    uniform vec3 lineGradient[3];

    mat2 rotate2d(float r){return mat2(cos(r),sin(r),-sin(r),cos(r));}

    vec3 gradientColor(float t){
      float scaled=clamp(t,0.0,0.9999)*2.0;
      int idx=int(floor(scaled));
      float f=fract(scaled);
      return idx==0?mix(lineGradient[0],lineGradient[1],f):mix(lineGradient[1],lineGradient[2],f);
    }

    float wave(vec2 uv,float offset,vec2 screenUv,vec2 mouseUv){
      float time=iTime*animationSpeed;
      float amp=sin(offset+time*0.2)*0.3;
      float y=sin(uv.x+offset+time*0.1)*amp;
      vec2 d=screenUv-mouseUv;
      float influence=exp(-dot(d,d)*bendRadius);
      y+=(mouseUv.y-screenUv.y)*influence*bendStrength*bendInfluence;
      float m=uv.y-y;
      return 0.0175/max(abs(m)+0.01,0.001)+0.01;
    }

    void addWave(inout vec3 col,vec2 baseUv,vec2 mouseUv,int count,float distance,vec3 position,float seed,float weight,bool flipX){
      for(int i=0;i<32;i++){
        if(i>=count)break;
        float fi=float(i);
        float t=fi/max(float(count-1),1.0);
        float angle=position.z*log(length(baseUv)+1.0);
        vec2 ruv=baseUv*rotate2d(angle);
        if(flipX)ruv.x*=-1.0;
        float strength=wave(ruv+vec2(distance*fi+position.x,position.y),seed+0.2*fi,baseUv,mouseUv);
        col+=gradientColor(t)*strength*weight;
      }
    }

    void main(){
      vec2 baseUv=(2.0*gl_FragCoord.xy-iResolution.xy)/iResolution.y;
      baseUv.y*=-1.0;
      baseUv+=parallaxOffset*parallaxStrength;
      vec2 mouseUv=(2.0*iMouse-iResolution.xy)/iResolution.y;
      mouseUv.y*=-1.0;
      vec3 col=vec3(0.0);
      addWave(col,baseUv,mouseUv,bottomLineCount,bottomLineDistance,bottomWavePosition,1.5,0.2,false);
      addWave(col,baseUv,mouseUv,middleLineCount,middleLineDistance,middleWavePosition,2.0,1.0,false);
      addWave(col,baseUv,mouseUv,topLineCount,topLineDistance,topWavePosition,1.0,0.1,true);
      gl_FragColor=vec4(col,1.0);
    }
  `;

  const FloatingLines={
    _root:null,_section:null,_renderer:null,_raf:null,_observer:null,

    init(options){
      if(typeof THREE==='undefined')return;
      this._root=document.getElementById('floatingLines');
      this._section=document.getElementById('about');
      if(!this._root||!this._section)return;
      const config=Object.assign({
        lineCount:[10,15,20],lineDistance:[8,6,4],animationSpeed:1,
        bendRadius:5,bendStrength:-0.5,mouseDamping:0.05,
        parallaxStrength:0.2,colors:['#0061ff','#444343','#c40000']
      },options||{});

      const scene=new THREE.Scene();
      const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
      camera.position.z=1;
      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
      renderer.setClearColor(0x000000,1);
      renderer.domElement.setAttribute('aria-hidden','true');
      this._root.appendChild(renderer.domElement);
      this._renderer=renderer;

      const toColor=hex=>new THREE.Color(hex);
      const targetMouse=new THREE.Vector2(-1000,-1000);
      const currentMouse=new THREE.Vector2(-1000,-1000);
      const targetParallax=new THREE.Vector2(0,0);
      const currentParallax=new THREE.Vector2(0,0);
      let targetInfluence=0;
      let currentInfluence=0;

      const uniforms={
        iTime:{value:0},iResolution:{value:new THREE.Vector3(1,1,1)},
        animationSpeed:{value:config.animationSpeed},
        topLineCount:{value:config.lineCount[0]},middleLineCount:{value:config.lineCount[1]},bottomLineCount:{value:config.lineCount[2]},
        topLineDistance:{value:config.lineDistance[0]*0.01},middleLineDistance:{value:config.lineDistance[1]*0.01},bottomLineDistance:{value:config.lineDistance[2]*0.01},
        topWavePosition:{value:new THREE.Vector3(10,0.5,-0.4)},
        middleWavePosition:{value:new THREE.Vector3(5,0,0.2)},
        bottomWavePosition:{value:new THREE.Vector3(2,-0.7,-1)},
        iMouse:{value:new THREE.Vector2(-1000,-1000)},
        bendRadius:{value:config.bendRadius},bendStrength:{value:config.bendStrength},bendInfluence:{value:0},
        parallaxStrength:{value:config.parallaxStrength},parallaxOffset:{value:new THREE.Vector2(0,0)},
        lineGradient:{value:config.colors.map(toColor)}
      };

      const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader});
      const geometry=new THREE.PlaneGeometry(2,2);
      scene.add(new THREE.Mesh(geometry,material));

      const resize=()=>{
        const width=this._root.clientWidth||1;
        const height=this._root.clientHeight||1;
        renderer.setSize(width,height,false);
        uniforms.iResolution.value.set(renderer.domElement.width,renderer.domElement.height,1);
      };
      resize();
      if(typeof ResizeObserver!=='undefined'){
        this._observer=new ResizeObserver(resize);
        this._observer.observe(this._root);
      }else window.addEventListener('resize',resize);

      const pointerMove=event=>{
        const rect=renderer.domElement.getBoundingClientRect();
        const dpr=renderer.getPixelRatio();
        const x=event.clientX-rect.left;
        const y=event.clientY-rect.top;
        targetMouse.set(x*dpr,(rect.height-y)*dpr);
        targetInfluence=1;
        targetParallax.set((x/rect.width-0.5)*config.parallaxStrength,(0.5-y/rect.height)*config.parallaxStrength);
      };
      const pointerLeave=()=>{targetInfluence=0;targetParallax.set(0,0)};
      this._section.addEventListener('pointermove',pointerMove);
      this._section.addEventListener('pointerleave',pointerLeave);

      const start=performance.now();
      const render=now=>{
        uniforms.iTime.value=(now-start)/1000;
        currentMouse.lerp(targetMouse,config.mouseDamping);
        uniforms.iMouse.value.copy(currentMouse);
        currentInfluence+=(targetInfluence-currentInfluence)*config.mouseDamping;
        uniforms.bendInfluence.value=currentInfluence;
        currentParallax.lerp(targetParallax,config.mouseDamping);
        uniforms.parallaxOffset.value.copy(currentParallax);
        renderer.render(scene,camera);
        this._raf=requestAnimationFrame(render);
      };
      this._raf=requestAnimationFrame(render);
    }
  };

  window.App=window.App||{};
  window.App.FloatingLines=FloatingLines;
})();