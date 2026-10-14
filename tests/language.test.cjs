const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync(require('node:path').join(__dirname,'../assets/language.js'),'utf8');
function run(languages, pathname='/', saved=null, blocked=false) {
  let redirect, click, stored;
  vm.runInNewContext(script, {
    navigator:{languages,language:languages[0]},
    location:{pathname,search:'?source=steam',hash:'#screenshots',replace:value=>redirect=value},
    localStorage:{getItem(){if(blocked)throw Error();return saved},setItem(key,value){if(blocked)throw Error();stored={key,value}}},
    document:{addEventListener:(name,listener)=>{if(name==='click')click=listener}}
  });
  return {redirect,choose(language){click({target:{closest:()=>({getAttribute:()=>language})}});return stored}};
}
test('browser preference order, regional variants and unsupported languages',()=>{
  for(const [tags,expected] of [
    [['tr-TR'],'tr'],[['de-AT'],'de'],[['fr-CA'],'fr'],[['es-ES'],'es'],[['es-MX'],'es-419'],[['es-AR'],'es-419'],
    [['pt-BR'],'pt-BR'],[['pt-PT'],'pt-PT'],[['pt'],'pt-PT'],[['zh-Hans-CN'],'zh-CN'],[['zh-SG'],'zh-CN'],
    [['ja-JP'],'ja'],[['ko-KR'],'ko'],[['ru-RU'],'ru'],[['pl-PL'],'pl'],[['cs-CZ'],'cs'],[['it-IT'],'it'],
    [['ar','tr-TR'],'tr'],[['zh-Hant-TW','en-US'],'en'],[['en-US','tr-TR'],'en'],[['ar'],'en']
  ]) {
    assert.equal(run(tags).redirect,expected==='en'?undefined:`/${expected}/?source=steam#screenshots`,tags.join(','));
  }
});
test('remembered manual choice wins, including English, and blocked storage falls back safely',()=>{
  assert.equal(run(['tr-TR'],'/','en').redirect,undefined);
  assert.equal(run(['en-US'],'/','ja').redirect,'/ja/?source=steam#screenshots');
  assert.equal(run(['tr-TR'],'/','invalid').redirect,'/tr/?source=steam#screenshots');
  assert.equal(run(['tr-TR'],'/',null,true).redirect,'/tr/?source=steam#screenshots');
  assert.deepEqual(run(['en']).choose('pt-BR'),{key:'pizzapoly.language',value:'pt-BR'});
  assert.equal(run(['en'],'/',null,true).choose('tr'),undefined);
});
test('direct language links never redirect; neutral routes retain page, query and hash',()=>{
  for(const route of ['/tr/','/de/feedback/','/en/','/ja/roadmap/','/assets/site.css','/api/feedback','/unknown']) assert.equal(run(['fr'],route,'ko').redirect,undefined);
  for(const route of ['/feedback','/feedback/','/feedback/index.html']) assert.equal(run(['de'],route).redirect,'/de/feedback/?source=steam#screenshots');
  assert.equal(run(['tr'],'/roadmap').redirect,'/tr/roadmap/?source=steam#screenshots');
  assert.equal(run(['fr'],'/index.html').redirect,'/fr/?source=steam#screenshots');
});
