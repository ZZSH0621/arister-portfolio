// js/components/contact.js
(function(){
  'use strict';
  const Contact={
    init(){
      this._form=document.getElementById('contactForm');
      this._mailtoBtn=document.querySelector('.contact__mailto');
      this._copyBtn=document.querySelector('.contact__copy');
      this._feedback=document.getElementById('copyFeedback');
      this._config=window.__CONFIG;

      if(this._form)this._form.addEventListener('submit',e=>this._handleSubmit(e));
      if(this._copyBtn)this._copyBtn.addEventListener('click',()=>this._copyEmail());
      if(this._mailtoBtn)this._updateMailto();
    },

    _updateMailto(){
      if(!this._mailtoBtn||!this._config)return;
      const i18n=window.App.I18n;
      const subject=encodeURIComponent('Hello!');
      this._mailtoBtn.href=`mailto:${this._config.email}?subject=${subject}`;
    },

    _handleSubmit(e){
      e.preventDefault();
      const form=e.target;
      const name=form.elements.name.value.trim();
      const email=form.elements.email.value.trim();
      const message=form.elements.message.value.trim();
      if(!name||!email||!message)return;

      const subject=encodeURIComponent(`Hello from ${name}`);
      const body=encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href=`mailto:${this._config.email}?subject=${subject}&body=${body}`;
      form.reset();
    },

    _copyEmail(){
      if(!this._config)return;
      navigator.clipboard.writeText(this._config.email).then(()=>{
        if(this._feedback){
          this._feedback.classList.add('show');
          setTimeout(()=>this._feedback.classList.remove('show'),2000);
        }
      }).catch(()=>{});
    }
  };
  window.App=window.App||{};window.App.Contact=Contact;
})();
