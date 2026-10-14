// Run in <head> so an initial language redirect happens before page rendering.
(() => {
  const supported = ['en','tr','fr','it','de','es','zh-CN','ja','ko','es-419','pl','pt-PT','ru','cs','pt-BR'];
  const preferenceKey = 'pizzapoly.language';
  function matchLanguage(value) {
    const tag = String(value).toLowerCase().replaceAll('_','-');
    const exact = supported.find(code => code.toLowerCase() === tag);
    if (exact) return exact;
    const [base] = tag.split('-');
    if (base === 'zh') {
      // Do not silently label Traditional Chinese as Simplified Chinese.
      return /(?:^|-)hant(?:-|$)|-(tw|hk|mo)(?:-|$)/.test(tag) ? null : 'zh-CN';
    }
    if (base === 'es') return tag === 'es' || tag === 'es-es' ? 'es' : 'es-419';
    if (base === 'pt') return tag === 'pt-br' ? 'pt-BR' : 'pt-PT';
    return supported.includes(base) ? base : null;
  }
  let saved;
  try { saved = localStorage.getItem(preferenceKey); } catch { /* Private mode may block storage. */ }
  let preferred = supported.includes(saved) ? saved : null;
  if (!preferred) {
    for (const tag of navigator.languages?.length ? navigator.languages : [navigator.language]) {
      preferred = matchLanguage(tag);
      if (preferred) break;
    }
  }
  // Explicit language URLs are authoritative. Only neutral English entry routes negotiate.
  const entry = location.pathname.match(/^\/(?:index\.html|(?:(roadmap|feedback)(?:\/index\.html|\/)?))?$/);
  if (entry && preferred && preferred !== 'en') {
    const route = entry[1] ? entry[1] + '/' : '';
    location.replace('/' + preferred + '/' + route + location.search + location.hash);
  }
  // Remember only a deliberate language-menu choice, including an explicit English choice.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('.language-options a[hreflang]');
    if (!link) return;
    const language = link.getAttribute('hreflang');
    if (!supported.includes(language)) return;
    try { localStorage.setItem(preferenceKey, language); } catch { /* Navigation still works. */ }
  });
})();
