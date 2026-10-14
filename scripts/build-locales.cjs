// Dependency-free static localization. Run: node scripts/build-locales.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const languages = [
  ['en','English'], ['tr','Türkçe'], ['fr','Français'], ['it','Italiano'], ['de','Deutsch'],
  ['es','Español (España)'], ['zh-CN','简体中文'], ['ja','日本語'], ['ko','한국어'],
  ['es-419','Español (Latinoamérica)'], ['pl','Polski'], ['pt-PT','Português (Portugal)'],
  ['ru','Русский'], ['cs','Čeština'], ['pt-BR','Português (Brasil)']
];
const routes = ['', 'roadmap', 'feedback'];
const english = JSON.parse(fs.readFileSync(path.join(root,'locales/en.json'),'utf8'));
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const url = (language, route) => `/${language === 'en' ? '' : language + '/'}${route}${route ? '/' : ''}`;
function catalog(language) {
  const data = JSON.parse(fs.readFileSync(path.join(root,`locales/${language}.json`),'utf8'));
  for (const [section, values] of Object.entries(english)) {
    if (!Array.isArray(data[section]) || data[section].length !== values.length || data[section].some(v => typeof v !== 'string' || !v.trim())) {
      throw new Error(`${language}.${section}: expected ${values.length} non-empty translations, found ${data[section]?.length}`);
    }
  }
  return data;
}
const urls = [];
for (const [language, name] of languages) {
  const data = catalog(language);
  for (const route of routes) {
    let html = fs.readFileSync(path.join(root,`templates/${route || 'home'}.html`),'utf8');
    html = html.replace(/\{\{(\w+)\.(\d+)(?::(\d+))?\}\}/g, (_, group, i, n) => {
      if (data[group]?.[i] === undefined) throw new Error(`Unknown token ${group}.${i}`);
      return esc(data[group][i].replaceAll('{n}', n || '{n}'));
    });
    html = html.replace('<html lang="en">', `<html lang="${language}">`);
    // Keep internal navigation within the current language. API and assets stay at root.
    html = html.replace(/href="\/(roadmap|feedback)?"/g, (_, dest) => `href="${url(language,dest || '')}"`);
    const canonical = 'https://polytan.games' + url(language, route);
    const alternates = languages.map(([code]) => `<link rel="alternate" hreflang="${code}" href="https://polytan.games${url(code,route)}">`).join('\n');
    html = html.replace('</head>', `<link rel="canonical" href="${canonical}">\n${alternates}\n<link rel="alternate" hreflang="x-default" href="https://polytan.games${url('en',route)}">\n</head>`);
    const switcher = `<details class="language-switcher"><summary aria-label="${esc(data.common[15])}: ${esc(name)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18Z"/></svg><span class="language-name" lang="${language}">${esc(name)}</span><span class="language-code" aria-hidden="true">${language.toUpperCase()}</span></summary><nav class="language-options" aria-label="${esc(data.common[14])}">${languages.map(([code,label])=>`<a href="${url(code,route)}" lang="${code}" hreflang="${code}"${code === language ? ' aria-current="true"' : ''}>${esc(label)}</a>`).join('')}</nav></details>`;
    html = html.replace('<!-- language-switcher -->', switcher);
    if (route === 'feedback') {
      const messages = Object.fromEntries(['submit','sending','success','error','unavailable','required','email','length','invalid'].map((key,i)=>[key,data.feedback[[13,23,24,25,26,27,28,29,30][i]]]));
      html = html.replace('<!-- feedback-messages -->', `<script type="application/json" id="feedback-messages">${JSON.stringify(messages).replaceAll('<','\\u003c')}</script><script defer src="/assets/feedback.js"></script>`);
    }
    if (/\{\{/.test(html)) throw new Error(`Unresolved token in ${language}/${route}`);
    const out = path.join(root, language === 'en' ? '' : language, route);
    fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'index.html'),html);
    urls.push(canonical);
  }
}
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated ${urls.length} pages in ${languages.length} languages and sitemap.xml.`);
module.exports = { languages, routes, url };
