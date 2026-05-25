// js/components/webgl-distortion.js - 1:1 WebGL image mask distortion effect
// Based on the original aristidebenoist.com technique:
// Two-texture overlay with procedurally distorted mask + independent UV distortion
(function(){
  'use strict';

  const WebGLDistortion={
    _instances:[],        // Track all active instances for cleanup

    // Create a distortion effect on a given container element
    // container: DOM element to attach canvas to
    // frontImage: URL or Image element for foreground
    // backImage: URL or Image element for background
    // options: { intensity, maskWidth, maskHeight, distortionFreq }
    create(container,frontSrc,backSrc,options={}){
      if(App.Utils.isTouch()||typeof THREE==='undefined')return null;

      const opts=Object.assign({
        intensity:1.0,
        maskWidth:0.35,
        maskHeight:0.55,
        distortionFreq:5.0,
        hoverIntensity:0
      },options);

      // Setup renderer
      const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      renderer.setClearColor(0x000000,0);
      container.appendChild(renderer.domElement);
      renderer.domElement.style.position='absolute';
      renderer.domElement.style.inset='0';
      renderer.domElement.style.width='100%';
      renderer.domElement.style.height='100%';

      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(45,1,0.1,10);
      camera.position.z=1.5;

      // Shader material with the core mask distortion technique
      const uniforms={
        uTime:{value:0},
        uMouse:{value:new THREE.Vector2(0.5,0.5)},
        uHoverIntensity:{value:0},
        uResolution:{value:new THREE.Vector2(1,1)},
        uMaskWidth:{value:opts.maskWidth},
        uMaskHeight:{value:opts.maskHeight},
        uDistortionFreq:{value:opts.distortionFreq},
        uFrontImage:{value:null},
        uBackImage:{value:null}
      };

      const material=new THREE.ShaderMaterial({
        uniforms:uniforms,
        vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:/*glsl*/`
          varying vec2 vUv;
          uniform float uTime,uHoverIntensity,uMaskWidth,uMaskHeight,uDistortionFreq;
          uniform vec2 uMouse,uResolution;
          uniform sampler2D uFrontImage,uBackImage;

          // Rectangle mask with smooth edges
          float rectangle(vec2 uv,vec2 center,vec2 size,float edge){
            vec2 d=abs(uv-center)-size*0.5;
            return 1.0-smoothstep(0.0,edge,length(max(d,0.0))+min(max(d.x,d.y),0.0));
          }

          void main(){
            vec2 uv=vUv;
            float aspect=uResolution.x/uResolution.y;

            // Distorted mask UVs
            vec2 maskUV=uv+vec2(
              sin(uv.y*uDistortionFreq+uTime*0.03)*0.08*uHoverIntensity,
              cos(uv.x*uDistortionFreq*2.0+uTime*0.04)*0.08*uHoverIntensity
            );

            // Mask position follows mouse, with organic wobble
            vec2 maskCenter=uMouse;
            maskCenter.x+=sin(uTime*0.02)*0.03*uHoverIntensity;
            maskCenter.y+=cos(uTime*0.025)*0.03*uHoverIntensity;

            // Mask size pulses slightly
            float pulse=1.0+sin(uTime*0.05)*0.05*uHoverIntensity;
            vec2 maskSize=vec2(uMaskWidth,uMaskHeight)*pulse;

            // Generate mask
            float mask=rectangle(maskUV,maskCenter,maskSize,0.03+uHoverIntensity*0.02);

            // Independent UV distortion for front image
            vec2 frontUV=uv+vec2(
              sin(uv.y*8.0+uTime*0.02)*0.02*uHoverIntensity,
              cos(uv.x*6.0+uTime*0.025)*0.025*uHoverIntensity
            );

            // Sample textures
            vec4 frontColor=texture2D(uFrontImage,frontUV);
            vec4 backColor=texture2D(uBackImage,uv);

            // Composite: front * mask + back * (1 - mask)
            float m=mask*uHoverIntensity;
            vec4 color=mix(backColor,frontColor,m);

            gl_FragColor=color;
          }
        `
      });

      const geometry=new THREE.PlaneGeometry(2,2);
      const mesh=new THREE.Mesh(geometry,material);
      scene.add(mesh);

      // Load textures
      const texLoader=new THREE.TextureLoader();
      const loadTex=(src)=>(typeof src==='string')?texLoader.load(src):new THREE.CanvasTexture(src);

      const frontTex=loadTex(frontSrc);
      const backTex=loadTex(backSrc);

      frontTex.minFilter=THREE.LinearFilter;
      frontTex.magFilter=THREE.LinearFilter;
      backTex.minFilter=THREE.LinearFilter;
      backTex.magFilter=THREE.LinearFilter;

      uniforms.uFrontImage.value=frontTex;
      uniforms.uBackImage.value=backTex;

      // Mouse tracking
      let mouseTarget={x:0.5,y:0.5};
      let hoverTarget=0;
      let currentHover=0;

      const onMouseMove=(e)=>{
        const r=renderer.domElement.getBoundingClientRect();
        mouseTarget.x=(e.clientX-r.left)/r.width;
        mouseTarget.y=1.0-(e.clientY-r.top)/r.height;
      };
      const onMouseEnter=()=>{hoverTarget=1.0};
      const onMouseLeave=()=>{hoverTarget=0};

      container.addEventListener('mousemove',onMouseMove,{passive:true});
      container.addEventListener('mouseenter',onMouseEnter);
      container.addEventListener('mouseleave',onMouseLeave);

      // Resize observer
      const resizeObserver=new ResizeObserver(()=>{
        const r=container.getBoundingClientRect();
        renderer.setSize(r.width,r.height,false);
        uniforms.uResolution.value.set(r.width,r.height);
      });
      resizeObserver.observe(container);

      // Render loop
      let rafId;
      const animate=(t)=>{
        rafId=requestAnimationFrame(animate);
        uniforms.uTime.value=t*0.001;

        // Smooth lerp for hover intensity
        currentHover+=((hoverTarget||0)-currentHover)*0.08;
        uniforms.uHoverIntensity.value=currentHover;

        // Smooth mouse following
        uniforms.uMouse.value.x+=((mouseTarget.x||0.5)-uniforms.uMouse.value.x)*0.1;
        uniforms.uMouse.value.y+=((mouseTarget.y||0.5)-uniforms.uMouse.value.y)*0.1;

        renderer.render(scene,camera);
      };
      rafId=requestAnimationFrame(animate);

      // Instance API
      const instance={
        container,renderer,scene,material,uniforms,rafId,mouseTarget,hoverTarget,currentHover,
        dispose(){
          cancelAnimationFrame(this.rafId);
          resizeObserver.disconnect();
          container.removeEventListener('mousemove',onMouseMove);
          container.removeEventListener('mouseenter',onMouseEnter);
          container.removeEventListener('mouseleave',onMouseLeave);
          if(frontTex.dispose)frontTex.dispose();
          if(backTex.dispose)backTex.dispose();
          material.dispose();
          geometry.dispose();
          renderer.dispose();
          if(renderer.domElement.parentNode)renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
      this._instances.push(instance);
      return instance;
    },

    // Destroy all instances
    destroyAll(){
      this._instances.forEach(inst=>inst.dispose());
      this._instances=[];
    }
  };

  window.App=window.App||{};window.App.WebGLDistortion=WebGLDistortion;
})();
