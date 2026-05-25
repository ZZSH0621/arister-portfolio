// js/components/blog-preview.js
(function(){
  'use strict';
  const BlogPreview={
    init(){
      const data=window.__BLOG_POSTS;
      if(!data)return;
      this._renderGrid(data);
    },

    _renderGrid(posts){
      const grid=document.getElementById('blogGrid');
      if(!grid)return;
      const i18n=window.App.I18n;
      const lang=i18n.lang();
      const recent=posts.slice(0,3);

      grid.innerHTML=recent.map(p=>`
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

      // Re-observe new elements
      if(window.App.Animations)window.App.Animations.init();
    }
  };
  window.App=window.App||{};window.App.BlogPreview=BlogPreview;
})();
