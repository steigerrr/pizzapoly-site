// Shared navigation and gallery behavior for every page.
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-navigation');
if (header && toggle && navigation) {
  header.classList.add('nav-ready');
  function setMenu(open, restoreFocus = false) {
    navigation.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', () => setMenu(false));
}

const languages = document.querySelector('.language-switcher');
if (languages) {
  document.addEventListener('click', event => {
    if (!languages.contains(event.target)) languages.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && languages.open) {
      languages.open = false;
      languages.querySelector('summary').focus();
    }
  });
}

const lightbox = document.querySelector('#screenshot-lightbox');
if (lightbox) {
  const image = lightbox.querySelector('img');
  const caption = lightbox.querySelector('.lightbox-caption');
  document.querySelectorAll('[data-screenshot]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const thumbnail = trigger.querySelector('img');
      image.src = thumbnail.src;
      image.alt = thumbnail.alt;
      caption.textContent = thumbnail.alt;
      lightbox.showModal();
      document.body.classList.add('dialog-open');
    });
  });
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    image.removeAttribute('src');
  });
}
