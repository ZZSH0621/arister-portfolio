// js/components/portfolio.js
// Strip-compression stack with wave-physics drag + focus expand + velocity pop
// Modes: "out" = strips | "focus" = one expanded with greyed neighbors | "in" = full detail
(function(){
  'use strict';
  var Portfolio={
    _projects:[],_mode:'out',_currentIdx:0,_focusIdx:-1,_webglInstances:[],
    _stageEl:null,_trackEl:null,_sidebarEl:null,
    _contentEl:null,_detailEl:null,_galleryEl:null,
    _arrowLeft:null,_arrowRight:null,
    _backBtn:null,
    _currentCnt:null,_totalCnt:null,
    _focusOverlay:null,
    _editMode:false,_projectEdits:{},

    // Strip system
    _stripEls:[],
    _stripPositions:[],
    _stripTargets:[],
    _stripBase:[],
    _scrollOffset:0,
    _stripWidth:110,
    _stripGap:6,
    _arcCurrents:[],          // per-strip rotateY (lerped toward target)
    _arcTarget:0,             // global arc intensity 0=flat 1=3D cylindrical

    // Drag physics
    _isDown:false,_isDragging:false,
    _dragStartX:0,_dragStartOffset:0,
    _lastMouseX:0,
    _velocity:0,
    _speedMag:0,              // smoothed speed magnitude for pop effect
    _lastScrollTime:0,

    init:function(projects){
      var self=this;
      this._projects=projects||window.__PROJECTS||[];
      this._stageEl=document.getElementById('portfolioStage');
      this._trackEl=document.getElementById('portfolioTrack');
      this._sidebarEl=document.getElementById('portfolioSidebar');
      this._contentEl=document.getElementById('portfolioContent');
      this._detailEl=document.getElementById('portfolioDetail');
      this._galleryEl=document.getElementById('portfolioGallery');
      this._arrowLeft=document.getElementById('portArrowLeft');
      this._arrowRight=document.getElementById('portArrowRight');
      this._backBtn=document.getElementById('portfolioBack');
      this._currentCnt=document.getElementById('portCurrent');
      this._totalCnt=document.getElementById('portTotal');
      if(!this._trackEl||!this._projects.length)return;

      this._totalCnt.textContent=String(this._projects.length).padStart(2,'0');
      this._renderStrips();
      this._renderSidebar();
      this._renderFocusOverlay();
      this._bindEvents();
      this._showStack();
      this._rafLoop();
    },

    // ─── Render compressed strips ──────────────────
    _renderStrips:function(){
      var self=this;
      var i18n=window.App.I18n;
      var lang=i18n.lang();
      var total=this._projects.length;
      var stripW=this._stripWidth;
      var gap=this._stripGap;
      var step=stripW+gap;
      var totalW=total*step-gap;
      var stageW=this._stageEl.offsetWidth||window.innerWidth;
      var startX=(stageW-totalW)/2;

      this._stripBase=[];this._stripPositions=[];this._stripTargets=[];this._stripEls=[];
      this._arcCurrents=[];this._arcTarget=0;
      this._scrollOffset=0;

      var html='';
      for(var i=0;i<total;i++){
        var p=this._projects[i];
        var baseX=startX+i*step;
        this._stripBase.push(baseX);
        this._stripPositions.push(baseX);
        this._stripTargets.push(baseX);
        this._arcCurrents.push(0);
        html+='<div class="portfolio__strip" data-strip-idx="'+i+'" style="width:'+stripW+'px">'+
          '<div class="portfolio__strip-inner">'+
            '<img src="'+p.thumbnail+'" alt="'+p.title[lang]+'" class="portfolio__strip-img" loading="'+(i<6?'eager':'lazy')+'">'+
            '<div class="portfolio__strip-number">'+String(i+1).padStart(2,'0')+'</div>'+
          '</div></div>';
      }
      this._trackEl.innerHTML=html;
      this._trackEl.style.width=totalW+'px';
      this._trackEl.style.left='0px';

      var strips=App.Utils.qsa('.portfolio__strip',this._trackEl);
      for(var j=0;j<strips.length;j++){
        this._stripEls.push(strips[j]);
        strips[j].style.transform='translateX('+this._stripBase[j]+'px)';
      }

      strips.forEach(function(strip,i){
        strip.addEventListener('click',function(e){
          if(!self._isDragging){
            if(self._mode==='out')self._enterFocus(i);
            else if(self._mode==='focus'&&i===self._focusIdx)self._openContent(i);
          }
        });
      });

      this._trackEl.addEventListener('mouseover',function(e){
        if(self._mode!=='out')return;
        var strip=e.target.closest('.portfolio__strip');
        self._stripEls.forEach(function(s){s.classList.remove('is-hovered')});
        if(strip)strip.classList.add('is-hovered');
      });
      this._trackEl.addEventListener('mouseleave',function(){
        self._stripEls.forEach(function(s){s.classList.remove('is-hovered')});
      });

      document.addEventListener('languageChanged',function(){self._renderStrips();self._renderSidebar();self._renderFocusOverlay()});
    },

    // ─── Focus overlay (title + view button on expanded strip) ──
    _renderFocusOverlay:function(){
      var self=this;
      var el=document.getElementById('portfolioFocusOverlay');
      if(!el){
        el=document.createElement('div');
        el.id='portfolioFocusOverlay';
        el.className='portfolio__focus-overlay';
        this._stageEl.appendChild(el);
      }
      this._focusOverlay=el;
      el.style.display='none';
      el.onclick=function(e){
        e.stopPropagation();
        if(self._mode==='focus'&&self._focusIdx>=0)self._openContent(self._focusIdx);
      };
    },

    // ─── Sidebar dots ─────────────────────────────
    _renderSidebar:function(){
      var self=this;
      this._sidebarEl.innerHTML=this._projects.map(function(p,i){
        return '<span class="portfolio__dot" data-dot-idx="'+i+'" title="'+p.title['en']+'"></span>';
      }).join('');
      App.Utils.qsa('.portfolio__dot',this._sidebarEl).forEach(function(dot,i){
        dot.addEventListener('click',function(e){
          e.stopPropagation();
          if(self._mode==='focus')self._exitFocus();
          self._centerStrip(i);
        });
      });
      this._updateDots(0);
    },

    _updateDots:function(idx){
      var dots=App.Utils.qsa('.portfolio__dot',this._sidebarEl);
      dots.forEach(function(d,i){d.classList.toggle('is-active',i===idx)});
    },

    _reflowStrips:function(){
      var total=this._projects.length;
      var stripW=this._stripWidth;
      var gap=this._stripGap;
      var step=stripW+gap;
      var totalW=total*step-gap;
      var stageW=this._stageEl.offsetWidth||window.innerWidth;
      var startX=(stageW-totalW)/2;
      for(var i=0;i<total;i++){
        this._stripBase[i]=startX+i*step;
        this._stripTargets[i]=this._stripBase[i]+this._scrollOffset;
      }
      this._trackEl.style.width=totalW+'px';
      this._centerStrip(this._currentIdx);
    },

    _centerStrip:function(idx){
      var stageW=this._stageEl.offsetWidth||window.innerWidth;
      var stripCenter=this._stripBase[idx]+this._stripWidth/2;
      var viewCenter=stageW/2;
      this._scrollOffset=viewCenter-stripCenter;
      for(var i=0;i<this._stripTargets.length;i++){
        this._stripTargets[i]=this._stripBase[i]+this._scrollOffset;
      }
      this._currentIdx=idx;
      this._updateCounter(idx);
      this._updateDots(idx);
    },

    // ─── FOCUS: click strip → expand + greyed neighbors ──
    _enterFocus:function(idx){
      if(idx<0||idx>=this._projects.length)return;
      if(this._mode==='focus')this._exitFocus();
      this._mode='focus';
      this._focusIdx=idx;
      this._currentIdx=idx;
      this._stageEl.style.overflow='visible';
      var p=this._projects[idx];
      var i18n=window.App.I18n;
      var lang=i18n.lang();
      var stripW=this._stripWidth;
      var stageW=this._stageEl.offsetWidth||window.innerWidth;

      // Calculate expanded focused width — wider & more rectangular
      var focusedWidth=Math.min(960,Math.max(460,stageW*0.75));
      var focusedLeft=(stageW-focusedWidth)/2;

      // Freeze all strips, then reposition focused + neighbors
      for(var i=0;i<this._stripTargets.length;i++){
        this._stripTargets[i]=this._stripPositions[i];
      }
      this._velocity=0;
      this._speedMag=0;

      // Reposition: focused strip centered, neighbors compressed to slivers
      if(this._stripEls[idx]){
        this._stripEls[idx].style.width=focusedWidth+'px';
        this._stripPositions[idx]=focusedLeft;
        this._stripTargets[idx]=focusedLeft;
        this._stripEls[idx].style.transform='translateX('+focusedLeft+'px)';
      }
      // Left neighbor: compressed sliver (~30px visible)
      if(idx>0&&this._stripEls[idx-1]){
        var lnPeek=30;
        var lnPos=focusedLeft-lnPeek;
        this._stripEls[idx-1].style.width=stripW+'px';
        this._stripPositions[idx-1]=lnPos;
        this._stripTargets[idx-1]=lnPos;
        this._stripEls[idx-1].style.transform='translateX('+lnPos+'px)';
      }
      // Right neighbor: compressed sliver (~30px visible)
      if(idx<this._projects.length-1&&this._stripEls[idx+1]){
        var rnPeek=30;
        var rnPos=focusedLeft+focusedWidth-(stripW-rnPeek);
        this._stripEls[idx+1].style.width=stripW+'px';
        this._stripPositions[idx+1]=rnPos;
        this._stripTargets[idx+1]=rnPos;
        this._stripEls[idx+1].style.transform='translateX('+rnPos+'px)';
      }

      // Overlay breaks out: full-stage width, letters with random spacing
      if(this._focusOverlay){
        this._focusOverlay.style.left='0';
        this._focusOverlay.style.width='100%';
        var enName=p.title['en'].replace(/\(.*?\)/g,'').trim();
        var words=enName.split(/\s+/);
        var seeded=idx*137+1;
        var wordsHtml=words.map(function(w){
          var chars=w.split('');
          var charSpans=chars.map(function(c,i){
            var rand=((Math.sin(seeded+i*31)+1)*0.18+0.12).toFixed(3);
            return '<span class="portfolio__focus-char" style="color:'+p.themeColor+';margin-right:'+rand+'em">'+c+'</span>';
          }).join('');
          return '<div class="portfolio__focus-word">'+charSpans+'</div>';
        }).join('');
        this._focusOverlay.innerHTML=
          wordsHtml+
          '<p class="portfolio__focus-zh">'+p.title['zh-CN']+'</p>'+
          '<span class="portfolio__focus-cta" data-i18n="portfolio.viewProject">View Project →</span>';
        this._focusOverlay.style.display='';
      }

      // Apply CSS classes
      var self=this;
      this._stripEls.forEach(function(strip,i){
        strip.classList.remove('is-focused','is-neighbor--left','is-neighbor--right','is-hidden');
        if(i===idx)strip.classList.add('is-focused');
        else if(i===idx-1)strip.classList.add('is-neighbor--left');
        else if(i===idx+1)strip.classList.add('is-neighbor--right');
        else strip.classList.add('is-hidden');
      });

      this._updateCounter(idx);
      this._updateDots(idx);
      if(i18n._bindDOM)i18n._bindDOM();
    },

    _exitFocus:function(){
      this._mode='out';
      this._focusIdx=-1;
      this._stageEl.style.overflow='hidden';
      if(this._focusOverlay)this._focusOverlay.style.display='none';
      var stripW=this._stripWidth;
      this._stripEls.forEach(function(strip,i){
        strip.classList.remove('is-focused','is-neighbor--left','is-neighbor--right','is-hidden');
        strip.style.width=stripW+'px';
      });
      // Restore all positions from targets
      for(var i=0;i<this._stripPositions.length;i++){
        this._stripTargets[i]=this._stripBase[i]+this._scrollOffset;
      }
      this._updateDots(this._currentIdx);
    },

    // ─── Mode switching (full detail → PPT slide view) ──
    _openContent:function(idx){
      if(idx<0||idx>=this._projects.length)return;
      this._exitFocus();
      this._mode='in';
      this._currentIdx=idx;
      this._currentSlide=0;
      var p=this._projects[idx];
      var i18n=window.App.I18n;
      var lang=i18n.lang();
      var self=this;

      // Load saved edits from localStorage (survives page refresh)
      try{var ls=JSON.parse(localStorage.getItem('portfolioEdits'));if(ls)for(var k in ls)this._projectEdits[k]=ls[k];}catch(e){}
      // Restore saved edits or build fresh
      var saved=this._projectEdits[idx];
      if(saved&&saved.detailHTML){
        this._detailEl.innerHTML=saved.detailHTML;
        this._savedDetailHTML=saved.detailHTML;
        this._slides=saved.slides?saved.slides.map(function(s){return Object.assign({},s);}):[{type:'image',src:p.images[0]||p.thumbnail}];
        this._currentSlide=saved.currentSlide||0;
      }else{
        this._slides=[{type:'image',src:p.images[0]||p.thumbnail}];
        for(var s=1;s<=5;s++){this._slides.push({type:'blank'});}
        this._currentSlide=0;
        var detailHTML=
          '<h3 class="portfolio__detail-title">'+p.title[lang]+'</h3>'+
          '<p class="portfolio__detail-meta">'+p.category[lang]+' · '+p.year+'</p>'+
          '<p class="portfolio__detail-desc">'+p.description[lang]+'</p>'+
          '<div class="portfolio__detail-tags">'+p.technologies.map(function(t){return '<span class="portfolio__detail-tag">'+t+'</span>'}).join('')+'</div>'+
          '<div class="portfolio__detail-links">'+
            (p.links.live?'<a href="'+p.links.live+'" target="_blank" rel="noopener" class="btn btn--primary" data-i18n="portfolio.visitSite">Visit Site</a>':'')+
            (p.links.github?'<a href="'+p.links.github+'" target="_blank" rel="noopener" class="btn btn--ghost" data-i18n="portfolio.sourceCode">Source Code</a>':'')+
          '</div>';
        this._savedDetailHTML=detailHTML;
        this._detailEl.innerHTML=detailHTML;
      }

      // Build slide viewer + thumbnail strip
      this._renderSlideViewer(this._currentSlide);
      this._renderSlideStrip(this._currentSlide);

      this._stageEl.style.display='none';
      this._contentEl.classList.add('active');
      this._renderEditBar();
      var bar=document.getElementById('portfolioEditBar');
      if(bar)bar.style.display='flex';
      this._updateCounter(idx);
      this._updateDots(idx);

      // Bind slide clicks
      var thumbs=App.Utils.qsa('.portfolio__slide-thumb',this._contentEl);
      thumbs.forEach(function(thumb,i){
        thumb.addEventListener('click',function(){
          self._switchSlide(i);
        });
      });

      if(i18n._bindDOM)i18n._bindDOM();
    },

    _renderSlideViewer:function(slideIdx){
      var slide=this._slides[slideIdx];
      var viewerEl=document.getElementById('portfolioSlideViewer');
      if(!viewerEl){
        viewerEl=document.createElement('div');
        viewerEl.id='portfolioSlideViewer';
        viewerEl.className='portfolio__slide-viewer';
        this._contentEl.appendChild(viewerEl);
      }
      if(slide.type==='image'){
        viewerEl.innerHTML='<img src="'+slide.src+'" alt="">';
      }else{
        viewerEl.innerHTML='<div class="portfolio__slide-blank">Slide '+(slideIdx+1)+'</div>';
      }
    },

    _renderSlideStrip:function(activeIdx){
      var stripEl=document.getElementById('portfolioSlidesStrip');
      if(!stripEl){
        stripEl=document.createElement('div');
        stripEl.id='portfolioSlidesStrip';
        stripEl.className='portfolio__slides-strip';
        this._contentEl.appendChild(stripEl);
      }
      var self=this;
      stripEl.innerHTML=this._slides.map(function(slide,i){
        var cls='portfolio__slide-thumb';
        if(i===activeIdx)cls+=' is-active';
        if(slide.type==='image'){
          return '<div class="'+cls+'" data-slide="'+i+'"><img src="'+slide.src+'" alt=""></div>';
        }else{
          return '<div class="'+cls+' portfolio__slide-thumb--blank" data-slide="'+i+'"></div>';
        }
      }).join('');
    },

    _switchSlide:function(slideIdx){
      if(slideIdx===this._currentSlide)return;
      this._currentSlide=slideIdx;
      this._renderSlideViewer(slideIdx);
      this._renderSlideStrip(slideIdx);
      // Update detail panel: show info for slide 0, blank for others
      if(slideIdx===0){
        this._detailEl.innerHTML=this._savedDetailHTML||'';
      }else{
        this._detailEl.innerHTML=
          '<h3 class="portfolio__detail-title" style="color:var(--color-text-muted)">Slide '+(slideIdx+1)+'</h3>'+
          '<p class="portfolio__detail-meta">—</p>'+
          '<p class="portfolio__detail-desc" style="color:var(--color-text-muted)">待编辑内容</p>';
      }
      var self=this;
      var thumbs=App.Utils.qsa('.portfolio__slide-thumb',this._contentEl);
      thumbs.forEach(function(thumb,i){
        thumb.addEventListener('click',function(){
          self._switchSlide(i);
        });
      });
    },

    // ─── Edit mode ─────────────────────────────
    _renderEditBar:function(){
      var self=this;
      var editBtn=document.getElementById('editBtn');
      var saveBtn=document.getElementById('editSaveBtn');
      var cancelBtn=document.getElementById('editCancelBtn');
      if(editBtn)editBtn.onclick=function(e){e.stopPropagation();self._enterEditMode();};
      if(saveBtn)saveBtn.onclick=function(e){e.stopPropagation();self._saveEditMode();};
      if(cancelBtn)cancelBtn.onclick=function(e){e.stopPropagation();self._cancelEditMode();};
    },

    _enterEditMode:function(){
      if(this._editMode)return;
      // Backup original state for cancel
      this._editBackup={
        innerHTML:this._detailEl.innerHTML,
        slides:this._slides.map(function(s){return Object.assign({},s);}),
        currentSlide:this._currentSlide
      };
      this._editMode=true;
      this._contentEl.classList.add('is-editing');
      document.getElementById('editBtn').style.display='none';
      document.getElementById('editSaveBtn').style.display='';
      document.getElementById('editCancelBtn').style.display='';
      var fields=this._detailEl.querySelectorAll('.portfolio__detail-title,.portfolio__detail-desc,.portfolio__detail-meta');
      fields.forEach(function(f){f.contentEditable='true';});
      this._bindSlideEditEvents();
    },

    _saveEditMode:function(){
      var fields=this._detailEl.querySelectorAll('[contenteditable]');
      fields.forEach(function(f){f.contentEditable='false';});
      this._projectEdits[this._currentIdx]={
        detailHTML:this._detailEl.innerHTML,
        slides:this._slides.map(function(s){return Object.assign({},s);}),
        currentSlide:this._currentSlide
      };
      this._savedDetailHTML=this._detailEl.innerHTML;
      // Sync edited text → project data (so focus overlay picks it up)
      var p=this._projects[this._currentIdx];
      var titleEl=this._detailEl.querySelector('.portfolio__detail-title');
      var descEl=this._detailEl.querySelector('.portfolio__detail-desc');
      var lang=window.App.I18n.lang();
      if(titleEl){
        var newTitle=titleEl.textContent.trim();
        p.title[lang]=newTitle;
        // Also sync other language so focus overlay big-text picks it up
        var otherLang=(lang==='en'?'zh-CN':'en');
        p.title[otherLang]=newTitle;
      }
      if(descEl){
        var newDesc=descEl.textContent.trim();
        p.description[lang]=newDesc;
      }
      // Sync first slide image → project cover
      if(this._slides[0]&&this._slides[0].type==='image'){
        p.thumbnail=this._slides[0].src;
        p.images[0]=this._slides[0].src;
        // Update just the strip thumbnail
        var stripEl=this._stripEls[this._currentIdx];
        if(stripEl){
          var img=stripEl.querySelector('.portfolio__strip-img');
          if(img)img.src=this._slides[0].src;
        }
      }
      this._editMode=false;
      this._editBackup=null;
      this._contentEl.classList.remove('is-editing');
      // Save to localStorage (survives page refresh)
      try{localStorage.setItem('portfolioEdits',JSON.stringify(this._projectEdits));}catch(e){}
      document.getElementById('editBtn').style.display='';
      document.getElementById('editSaveBtn').style.display='none';
      document.getElementById('editCancelBtn').style.display='none';
    },

    _cancelEditMode:function(){
      if(this._editBackup){
        this._detailEl.innerHTML=this._editBackup.innerHTML;
        this._slides=this._editBackup.slides;
        this._currentSlide=this._editBackup.currentSlide;
        this._renderSlideViewer(this._currentSlide);
        this._renderSlideStrip(this._currentSlide);
        this._editBackup=null;
      }
      var fields=this._detailEl.querySelectorAll('[contenteditable]');
      fields.forEach(function(f){f.contentEditable='false';});
      this._editMode=false;
      this._contentEl.classList.remove('is-editing');
      document.getElementById('editBtn').style.display='';
      document.getElementById('editSaveBtn').style.display='none';
      document.getElementById('editCancelBtn').style.display='none';
      this._bindSlideEditEvents();
    },

    _bindSlideEditEvents:function(){
      var self=this;
      var viewer=document.getElementById('portfolioSlideViewer');
      if(viewer){
        viewer.onclick=function(){
          if(self._editMode)self._uploadToSlide(self._currentSlide);
        };
      }
      var thumbs=document.querySelectorAll('.portfolio__slide-thumb');
      thumbs.forEach(function(thumb,i){
        thumb.onclick=function(e){
          if(self._editMode){self._uploadToSlide(i);}
          else{self._switchSlide(i);}
        };
      });
    },

    _uploadToSlide:function(slideIdx){
      var self=this;
      var input=document.createElement('input');
      input.type='file';input.accept='image/*';
      input.onchange=function(e){
        var file=e.target.files[0];
        if(!file)return;
        var reader=new FileReader();
        reader.onload=function(ev){
          self._slides[slideIdx]={type:'image',src:ev.target.result};
          self._renderSlideViewer(slideIdx);
          self._renderSlideStrip(self._currentSlide);
          self._bindSlideEditEvents();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },

    _closeContent:function(){
      if(this._editMode)this._cancelEditMode();
      this._mode='out';
      this._contentEl.classList.remove('active');
      var bar=document.getElementById('portfolioEditBar');
      if(bar)bar.style.display='none';
      // Remove dynamic slide elements
      var viewer=document.getElementById('portfolioSlideViewer');
      if(viewer)viewer.remove();
      var strip=document.getElementById('portfolioSlidesStrip');
      if(strip)strip.remove();
      this._stageEl.style.display='';
      this._updateDots(this._currentIdx);
    },

    _showStack:function(){
      this._mode='out';
      this._stageEl.style.display='';
      this._contentEl.classList.remove('active');
    },

    // ─── Wheel ─────────────────────────────────────
    _onWheel:function(e){
      var now=Date.now();
      if(this._mode==='in'){
        // Scroll-to-close disabled — use back button only
        return;
      }
      if(this._mode==='focus'){
        if(now-this._lastScrollTime>400){this._exitFocus();this._lastScrollTime=now}
        e.preventDefault();
        return;
      }
      if(this._mode==='out'){
        e.preventDefault();
        var delta=e.deltaY*0.8;
        this._speedMag=Math.abs(e.deltaY)*0.5;
        this._scrollOffset+=delta;
        this._clampScroll();
        for(var i=0;i<this._stripTargets.length;i++){
          this._stripTargets[i]=this._stripBase[i]+this._scrollOffset;
        }
        this._updateIndexFromScroll();
      }
    },

    _clampScroll:function(){
      var stageW=this._stageEl.offsetWidth||window.innerWidth;
      var total=this._projects.length;
      var stripW=this._stripWidth;
      var gap=this._stripGap;
      // Keep at ~1.5 strips of buffer on each side
      var pad=stripW*1.5;
      // Rightmost strip stays within left bound
      var minOff=-(this._stripBase[total-1]+stripW)+pad;
      // Leftmost strip stays within right bound
      var maxOff=stageW-this._stripBase[0]-pad;
      this._scrollOffset=Math.max(minOff,Math.min(maxOff,this._scrollOffset));
    },

    _updateIndexFromScroll:function(){
      var stageW=this._stageEl.offsetWidth||window.innerWidth;
      var center=stageW/2-this._scrollOffset;
      var closest=0,minDist=Infinity;
      for(var i=0;i<this._stripBase.length;i++){
        var mid=this._stripBase[i]+this._stripWidth/2;
        var dist=Math.abs(center-mid);
        if(dist<minDist){minDist=dist;closest=i}
      }
      if(closest!==this._currentIdx){
        this._currentIdx=closest;
        this._updateCounter(closest);
        this._updateDots(closest);
      }
    },

    // ─── Mouse drag with wave physics ──────────────
    _onMouseDown:function(e){
      if(this._mode==='focus'){
        // Click outside expanded strip → exit focus
        var onFocused=e.target.closest('.is-focused');
        var onOverlay=e.target.closest('#portfolioFocusOverlay');
        if(!onFocused&&!onOverlay)this._exitFocus();
        return;
      }
      if(this._mode!=='out')return;
      if(e.target.closest('.portfolio__dot,.portfolio__arrow'))return;
      this._isDown=true;
      this._isDragging=false;
      this._dragStartX=e.clientX;
      this._dragStartOffset=this._scrollOffset;
      this._lastMouseX=e.clientX;
      this._velocity=0;
      this._speedMag=0;
      for(var i=0;i<this._stripTargets.length;i++){
        this._stripTargets[i]=this._stripPositions[i];
      }
    },

    _onMouseMove:function(e){
      if(!this._isDown)return;
      var dx=e.clientX-this._dragStartX;
      if(Math.abs(dx)>3)this._isDragging=true;
      if(!this._isDragging)return;

      this._velocity=e.clientX-this._lastMouseX;
      this._speedMag=Math.abs(this._velocity);
      this._lastMouseX=e.clientX;

      this._scrollOffset=this._dragStartOffset+dx;
      this._clampScroll();
      for(var i=0;i<this._stripTargets.length;i++){
        this._stripTargets[i]=this._stripBase[i]+this._scrollOffset;
      }
    },

    _onMouseUp:function(e){
      if(!this._isDown)return;
      this._isDown=false;
      this._isDragging=false;
      this._updateIndexFromScroll();
    },

    // ─── Keyboard ──────────────────────────────────
    _onKeyDown:function(e){
      if(e.target.matches('input,textarea,[contenteditable]'))return;
      if(!this.isInViewport())return;
      var self=this;
      switch(e.key){
        case 'ArrowLeft':
          if(this._mode==='in')this._switchSlide(Math.max(0,(this._currentSlide||0)-1));
          else if(this._mode==='focus'){this._exitFocus();this._currentIdx=Math.max(0,this._currentIdx-1);this._centerStrip(this._currentIdx)}
          else{this._currentIdx=Math.max(0,this._currentIdx-1);this._centerStrip(this._currentIdx)}
          break;
        case 'ArrowRight':
          if(this._mode==='in')this._switchSlide(Math.min((this._slides?this._slides.length:1)-1,(this._currentSlide||0)+1));
          else if(this._mode==='focus'){this._exitFocus();this._currentIdx=Math.min(this._projects.length-1,this._currentIdx+1);this._centerStrip(this._currentIdx)}
          else{this._currentIdx=Math.min(this._projects.length-1,this._currentIdx+1);this._centerStrip(this._currentIdx)}
          break;
        case 'Enter':
          if(this._mode==='focus')this._openContent(this._focusIdx);
          else if(this._mode==='out')this._enterFocus(this._currentIdx);
          break;
        case 'Escape':
          if(this._mode==='focus')this._exitFocus();
          else if(this._mode==='in'){this._closeContent();e.preventDefault()}
          break;
      }
    },

    // ─── RAF loop: wave physics + velocity pop ─────
    _rafLoop:function(){
      var self=this;
      function tick(){
        if(self._trackEl&&(self._mode==='out'||self._mode==='focus')){
          var total=self._stripPositions.length;

          // Momentum / speed decay
          if(!self._isDown){
            if(Math.abs(self._velocity)>0.05){
              self._scrollOffset+=self._velocity;
              self._clampScroll();
              self._velocity*=0.92;
              for(var i=0;i<total;i++){
                self._stripTargets[i]=self._stripBase[i]+self._scrollOffset;
              }
              self._updateIndexFromScroll();
            }
            // Decay speed magnitude for pop effect
            self._speedMag*=0.9;
            if(self._speedMag<0.1)self._speedMag=0;
          }

          // ── 3D Center-Axis Wave: fast→spread, slow→flat ──
          var stageW=self._stageEl.offsetWidth||window.innerWidth;
          var viewCenter=stageW/2;
          var arcThreshold=0.5;
          // Fast scroll → arcTarget→1 (3D wave), slow → arcTarget→0 (flat)
          var desiredArc=Math.min(self._speedMag/arcThreshold,1);
          self._arcTarget+=(desiredArc-self._arcTarget)*0.12;

          for(var i=0;i<total;i++){
            if(self._mode==='focus')break;

            var damp;
            if(self._isDown&&self._isDragging&&self._lastMouseX){
              var stripScreenX=self._stripPositions[i]+(self._stageEl.getBoundingClientRect().left||0);
              var distPx=Math.abs(stripScreenX-self._lastMouseX);
              var maxPx=stageW||800;
              var t=Math.min(distPx/maxPx,1);
              damp=0.22-t*0.15;
            }else{
              damp=0.1;
            }
            self._stripPositions[i]+=(self._stripTargets[i]-self._stripPositions[i])*damp;

            if(self._stripEls[i]){
              var tx=self._stripPositions[i];
              var stripMid=tx+self._stripWidth/2;

              var nd=(stripMid-viewCenter)/stageW;
              var absNd=Math.abs(nd);
              var arc=self._arcTarget;

              // Center-anchored wave: center=0° rotation, edges spread out
              var targetRY=nd*arc*80;
              var targetTZ=-absNd*arc*260;

              // Center lifts forward as wave epicenter
              var lift=-(1-absNd*2.5)*arc*22;
              if(lift>0)lift=0;

              // Wave radiates from center → edges: center responds fast, edges lag
              var arcDamp=0.20-absNd*0.16;
              self._arcCurrents[i]+=(targetRY-self._arcCurrents[i])*arcDamp;

              self._stripEls[i].style.transform=
                'translateX('+tx+'px) '+
                'rotateY('+self._arcCurrents[i]+'deg) '+
                'translateZ('+targetTZ+'px) '+
                'translateY('+lift+'px)';
            }
          }
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    },

    // ─── Event bindings ───────────────────────────
    _bindEvents:function(){
      var self=this;

      if(this._stageEl){
        this._stageEl.addEventListener('wheel',function(e){self._onWheel(e)},{passive:false});
        this._stageEl.addEventListener('mousedown',function(e){self._onMouseDown(e)});
        document.addEventListener('mousemove',function(e){self._onMouseMove(e)});
        document.addEventListener('mouseup',function(e){self._onMouseUp(e)});
      }
      // Detail view: scroll naturally, no wheel-to-close

      if(this._galleryEl){
        this._galleryEl.addEventListener('wheel',function(e){
          e.preventDefault();
          self._galleryEl.scrollLeft+=e.deltaY*1.2;
        },{passive:false});
      }

      // Back button (detail view → strip stack)
      if(this._backBtn){
        this._backBtn.addEventListener('click',function(e){
          e.stopPropagation();
          if(self._mode==='in')self._closeContent();
          else if(self._mode==='focus')self._exitFocus();
        });
      }

      if(this._arrowLeft){
        this._arrowLeft.addEventListener('click',function(e){
          e.stopPropagation();
          if(self._mode==='focus')self._exitFocus();
          if(self._mode==='in')self._switchSlide(Math.max(0,(self._currentSlide||0)-1));
          else{self._currentIdx=Math.max(0,self._currentIdx-1);self._centerStrip(self._currentIdx)}
        });
      }
      if(this._arrowRight){
        this._arrowRight.addEventListener('click',function(e){
          e.stopPropagation();
          if(self._mode==='focus')self._exitFocus();
          if(self._mode==='in')self._switchSlide(Math.min((self._slides?self._slides.length:1)-1,(self._currentSlide||0)+1));
          else{self._currentIdx=Math.min(self._projects.length-1,self._currentIdx+1);self._centerStrip(self._currentIdx)}
        });
      }

      document.addEventListener('keydown',function(e){self._onKeyDown(e)});

      window.addEventListener('resize',App.Utils.debounce(function(){
        if(self._mode==='out')self._reflowStrips();
      },200));
    },

    // ─── Helpers ─────────────────────────────────
    _updateCounter:function(idx){if(this._currentCnt)this._currentCnt.textContent=String(idx+1).padStart(2,'0')},

    isInViewport:function(){
      var el=document.getElementById('portfolio');
      if(!el)return false;
      var rect=el.getBoundingClientRect();
      return rect.top<window.innerHeight&&rect.bottom>0;
    },

    destroy:function(){this._closeContent();this._destroyWebGL()}
  };

  window.App=window.App||{};window.App.Portfolio=Portfolio;
})();
