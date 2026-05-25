// js/components/blog.js - Blog listing + post detail + simple markdown renderer
(function(){
  'use strict';
  const Blog={
    _posts:[],
    _currentSlug:null,

    init(){
      this._posts=window.__BLOG_POSTS||[];
      const hash=window.location.hash.replace('#','');
      if(hash){
        // Show individual post
        this._showPost(hash);
      }else{
        this._showListing();
      }
      document.addEventListener('hashchange',()=>this._onHashChange());
      document.addEventListener('languageChanged',()=>this._refresh());
    },

    _onHashChange(){
      const hash=window.location.hash.replace('#','');
      if(hash){this._showPost(hash)}
      else{this._showListing()}
    },

    _refresh(){
      if(this._currentSlug){this._showPost(this._currentSlug)}
      else{this._showListing()}
    },

    _showListing(){
      this._currentSlug=null;
      const listing=document.getElementById('blogListing');
      const post=document.getElementById('blogPost');
      const grid=document.getElementById('blogGrid');
      if(listing)listing.style.display='block';
      if(post)post.style.display='none';
      if(grid&&this._posts.length)this._renderGrid(grid);
    },

    _showPost(slug){
      this._currentSlug=slug;
      const p=this._posts.find(x=>x.slug===slug);
      if(!p)return this._showListing();

      const listing=document.getElementById('blogListing');
      const post=document.getElementById('blogPost');
      if(listing)listing.style.display='none';
      if(post)post.style.display='block';

      const i18n=window.App.I18n;
      const lang=i18n.lang();
      const idx=this._posts.indexOf(p);

      document.getElementById('blogTitle').innerHTML=p.title[lang];
      document.getElementById('blogMeta').innerHTML=`
        <span data-i18n="blog.published">Published</span> ${p.date}
        <span data-i18n="blog.category">Category</span> ${p.category[lang]}
      `;
      document.getElementById('blogBody').innerHTML=this._renderMarkdown(p.body[lang]);
      document.getElementById('blogBack').href='blog.html';

      // Prev/Next navigation
      const nav=document.getElementById('blogPostNav');
      if(nav&&this._posts.length>1){
        const prev=idx>0?this._posts[idx-1]:null;
        const next=idx<this._posts.length-1?this._posts[idx+1]:null;
        nav.innerHTML=`
          <div>${prev?`<a href="blog.html#${prev.slug}" class="btn btn--ghost">← ${prev.title[lang]}</a>`:''}</div>
          <div>${next?`<a href="blog.html#${next.slug}" class="btn btn--ghost">${next.title[lang]} →</a>`:''}</div>
        `;
      }

      window.scrollTo(0,0);

      // Re-bind i18n
      if(i18n._bindDOM)i18n._bindDOM();
    },

    _renderGrid(grid){
      const i18n=window.App.I18n;
      const lang=i18n.lang();
      grid.innerHTML=this._posts.map(p=>`
        <a href="blog.html#${p.slug}" class="blog-card" data-reveal>
          <div class="blog-card__img-wrap">
            <img src="${p.thumbnail}" alt="${p.title[lang]}" class="blog-card__img" loading="lazy">
            <span class="blog-card__category">${p.category[lang]}</span>
          </div>
          <div class="blog-card__body">
            <time class="blog-card__date">${p.date}</time>
            <h3 class="blog-card__title">${p.title[lang]}</h3>
            <p class="blog-card__excerpt">${p.excerpt[lang]}</p>
          </div>
        </a>
      `).join('');

      // Re-trigger reveal animations
      if(window.App.Animations)window.App.Animations.init();
    },

    _renderMarkdown(text){
      if(!text)return'';
      let html=text
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/^### (.+)$/gm,'<h3>$1</h3>')
        .replace(/^## (.+)$/gm,'<h2>$1</h2>')
        .replace(/^# (.+)$/gm,'<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,'<em>$1</em>')
        .replace(/`([^`]+)`/g,'<code>$1</code>')
        .replace(/^\- (.+)$/gm,'<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s,function(m){return'<ul>'+m+'</ul>'})
        .replace(/```(\w*)\n([\s\S]*?)```/g,'<pre><code>$2</code></pre>')
        .replace(/\n\n/g,'</p><p>')
        .replace(/^(?!<[hulp])/gm,'<p>');
      // Close last paragraph
      if(!html.endsWith('</p>')&&!html.endsWith('</pre>')&&!html.endsWith('</ul>')){
        html+='</p>';
      }
      // Fix nested <p> inside block elements
      html=html.replace(/<(h[123]|pre|ul)>(\s*)<p>/g,'<$1>$2').replace(/<\/p>(\s*)<\/(h[123]|pre|ul)>/g,'$1</$2>');
      return html;
    }
  };
  window.App=window.App||{};window.App.Blog=Blog;
})();
