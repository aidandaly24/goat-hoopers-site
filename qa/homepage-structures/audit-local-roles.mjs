// Bounded CSS role check, not Hallmark/sloplint or rendered contrast acceptance.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import postcss from 'postcss';
const root='qa/homepage-structures',phase=process.env.GOAT_STRUCT_PHASE||'polished';
const ids=process.argv.slice(2);
if(!ids.length)throw Error('Pass study IDs');
const results=[];
for(const id of ids){
  const folder=`${root}/${phase}/${id}`,flags=[];
  for(const name of(await readdir(folder)).filter(n=>n.endsWith('.css'))){
    const css=postcss.parse(await readFile(`${folder}/${name}`,'utf8'));
    css.walkDecls(d=>{
      let parent=d.parent,roleScope=d.prop.startsWith('--');
      while(parent){
        if(parent.type==='rule'&&parent.selector.split(',').some(s=>s.trim()===':root'))roleScope=true;
        if(parent.type==='atrule'&&parent.name==='font-face')roleScope=true;
        parent=parent.parent;
      }
      if(roleScope)return;
      const value=d.value.replace(/var\([^)]*\)/g,'');
      if(/color|background|border|outline|shadow|fill|stroke/.test(d.prop)&&/(#[\da-f]{3,8}\b|rgba?\(|hsla?\(|\bwhite\b|\bblack\b)/i.test(value))flags.push({file:name,line:d.source.start.line,property:d.prop,value:d.value});
      if((d.prop==='font-family'||d.prop==='font')&&/Arial|Georgia|Helvetica|system-ui|sans-serif|serif|monospace/i.test(d.value)&&!d.value.includes('var('))flags.push({file:name,line:d.source.start.line,property:d.prop,value:d.value});
    });
  }
  results.push({id,flags,pass:flags.length===0});
  console.log(JSON.stringify({id,pass:flags.length===0,literalDeclarations:flags.length,sample:flags.slice(0,3)}));
}
await writeFile(`${root}/${phase}/local-role-audit.json`,JSON.stringify({phase,scope:'CSS literals outside local role/font-face declarations only. Does not validate semantic role quality, markup style attributes, contrast, geometry or accessibility.',results},null,2)+'\n');
if(results.some(r=>!r.pass))process.exitCode=1;
