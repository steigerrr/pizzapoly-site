const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname,'..');
execFileSync(process.execPath,[path.join(root,'scripts/build-locales.cjs')],{cwd:root});
const languages=fs.readdirSync(path.join(root,'locales')).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const pagePath=(lang,route)=>path.join(root,lang==='en'?'':lang,route,'index.html');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

test('all 45 pages have localized content, metadata, accessible language links and valid local destinations',()=>{
  assert.equal(languages.length,15);
  for(const lang of languages){
    const data=JSON.parse(fs.readFileSync(path.join(root,`locales/${lang}.json`),'utf8'));
    for(const route of ['','roadmap','feedback']){
      const html=fs.readFileSync(pagePath(lang,route),'utf8');
      assert.ok(html.includes(`<html lang="${lang}">`));
      assert.ok(!html.includes('{{')&&!html.includes('\uFFFD'),`${lang}/${route} unresolved token or encoding`);
      assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
      assert.equal((html.match(/rel="alternate"/g)||[]).length,16);
      assert.equal((html.match(/hreflang="/g)||[]).length,31);
      assert.ok(html.includes(escape(data.common[2]))&&html.includes(escape(data.common[3])));
      const group=route||'home';
      for (const value of data[group]) {
        if (route==='feedback' && data.feedback.indexOf(value)>=23) continue;
        if(group==='home' && value===data.home[0]) continue;
        assert.ok(html.includes(escape(value)),`${lang}/${route} missing: ${value}`);
      }
      for(const match of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){
        const target=match[1];
        if(target.startsWith('/_vercel/')) continue;
        let file=path.join(root,target);
        if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
        assert.ok(fs.existsSync(file),`${lang}/${route} broken link ${target}`);
      }
      const options=html.match(/<nav class="language-options"[\s\S]*?<\/nav>/)[0];
      assert.equal((options.match(/<a /g)||[]).length,15);
      assert.equal((options.match(/aria-current=/g)||[]).length,1);
      for(const other of languages){
        const destination=`/${other==='en'?'':other+'/'}${route}${route?'/':''}`;
        assert.ok(options.includes(`href="${destination}"`),`${lang}/${route} switch to ${other}`);
      }
    }
  }
});

test('sitemap contains each page once and translated pages include no original English prose',()=>{
  const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  assert.equal(urls.length,45);assert.equal(new Set(urls).size,45);
  const english=JSON.parse(fs.readFileSync(path.join(root,'locales/en.json'),'utf8'));
  for(const lang of languages.filter(l=>l!=='en')){
    for(const route of ['','roadmap','feedback']){
      const html=fs.readFileSync(pagePath(lang,route),'utf8');
      for(const phrase of Object.values(english).flat().filter(s=>s.length>65 && !s.includes('{n}'))){
        assert.ok(!html.includes(escape(phrase)),`${lang}/${route} English paragraph left behind`);
      }
    }
  }
});

test('every language has localized feedback success, validation, unavailable and network failure states',async()=>{
  const script=fs.readFileSync(path.join(root,'assets/feedback.js'),'utf8');
  for(const lang of languages){
    const html=fs.readFileSync(pagePath(lang,'feedback'),'utf8');
    const messages=JSON.parse(html.match(/id="feedback-messages">(.*?)<\/script>/)[1]);
    for(const outcome of [200,400,503,'network']){
      let submit,reset=false,payload;
      const fields=['name','email','message'].map(id=>({id,type:id==='email'?'email':'text',value:id==='email'?'test@example.com':id==='message'?'日本語でのフィードバックです。':' Test ',validity:{typeMismatch:false},listeners:{},setCustomValidity(v){this.error=v},addEventListener(k,v){this.listeners[k]=v}}));
      const elements={
        'feedback-messages':{textContent:JSON.stringify(messages)},
        'feedback-form':{querySelectorAll:()=>fields,addEventListener:(_,cb)=>submit=cb,reportValidity:()=>true,setAttribute(){},reset:()=>reset=true},
        'submit-feedback':{disabled:false},'form-status':{},website:{value:''},...Object.fromEntries(fields.map(f=>[f.id,f]))
      };
      vm.runInNewContext(script,{document:{getElementById:id=>elements[id]},AbortSignal,fetch:async(url,options)=>{
        assert.equal(url,'/api/feedback');payload=JSON.parse(options.body);
        assert.equal(elements['submit-feedback'].disabled,true);
        if(outcome==='network') throw new Error('English network error');
        return {ok:outcome===200,status:outcome,json:async()=>outcome===200?{success:true}:{error:'English backend error'}};
      }});
      await submit({preventDefault(){}});
      assert.equal(reset,outcome===200);
      assert.equal(payload.message,'日本語でのフィードバックです。');
      assert.equal(elements['submit-feedback'].disabled,false);
      assert.equal(elements['submit-feedback'].textContent,messages.submit);
      assert.equal(elements['form-status'].textContent,outcome===200?messages.success:outcome===400?messages.invalid:outcome===503?messages.unavailable:messages.error);
      fields[0].value='   ';fields[0].listeners.input();assert.equal(fields[0].error,messages.required);
      fields[1].validity.typeMismatch=true;fields[1].listeners.input();assert.equal(fields[1].error,messages.email);
      fields[2].value='短';fields[2].listeners.input();assert.equal(fields[2].error,messages.length);
    }
  }
});

test('feedback API accepts a valid full-length CJK message with more than 12 KB',async()=>{
  const script=fs.readFileSync(path.join(root,'api/feedback.js'),'utf8');
  const message='中'.repeat(5000);let result,delivery;
  const sandbox={module:{exports:{}},process:{env:{RESEND_API_KEY:'test-only'}},console,AbortSignal,fetch:async(_,options)=>{delivery=JSON.parse(options.body);return {ok:true}}};
  vm.runInNewContext(script,sandbox);
  const req={method:'POST',headers:{'content-type':'application/json','content-length':String(Buffer.byteLength(JSON.stringify({name:'Test',email:'test@example.com',message})))},body:{name:'Test',email:'test@example.com',message}};
  const res={setHeader(){},status(code){this.code=code;return this},json(value){result=value;return this}};
  await sandbox.module.exports(req,res);
  assert.equal(res.code,200);assert.equal(result.success,true);assert.ok(delivery.text.includes(message));
});
