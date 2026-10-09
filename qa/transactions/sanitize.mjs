// Local-only comparison with the private audit. Never prints or writes its values.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,lstat,readlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
const base='d80e9c4d515b7aed0a09998caaa6f1a1d9a92057';
assert.ok(process.argv[2],'Pass the local private audit checkout; it is read only.');
const privateRoot=resolve(process.argv[2]);
const privateFixtures=await Promise.all(['frozen-current.json','frozen-archive.json'].map(n=>readFile(resolve(privateRoot,'qa/transactions',n),'utf8').then(JSON.parse)));
const deny=new Set(),privateRows=new Set(),rosterIds=new Set();
for(const f of privateFixtures){
  deny.add(f.leagueId);
  for(const t of f.teams){for(const k of ['name','managerName','avatar'])if(t[k])deny.add(t[k]);rosterIds.add(t.id);}
  for(const [id,name] of Object.entries(f.playerNames)){deny.add(id);if(!name.startsWith('Player '))deny.add(name);}
  for(const t of f.raw){
    privateRows.add(JSON.stringify(t));deny.add(t.transaction_id);if(t.creator)deny.add(t.creator);
    for(const k of [...Object.keys(t.adds??{}),...Object.keys(t.drops??{})])deny.add(k);
  }
}
const changed=execFileSync('git',['diff',base,'--name-only'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.ok(changed.length,'Stage the proposed files before scanning.');
const source=new Set(['src/data/sleeper.ts','src/data/transform.ts','src/data/__tests__/transactions.test.ts','src/data/__tests__/recent-activity.test.ts','src/surfaces/transactions/TransactionFilters.tsx','src/surfaces/transactions/TransactionHistory.tsx','src/surfaces/transactions/transactionQuery.ts','src/surfaces/transactions/transactionQuery.test.ts']);
assert.ok(changed.every(p=>source.has(p)||p.startsWith('qa/transactions/')),'Out-of-scope public diff.');
assert.ok(changed.every(p=>!/(frozen|evidence|\.next|\.cache|\.build)/.test(p)),'Private/generated material in public inventory.');
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=[...deny].filter(x=>String(x).length>=3).map(x=>new RegExp(`(?<![A-Za-z0-9])${esc(String(x))}(?![A-Za-z0-9])`,'u'));
const files=[],hits=[];
for(const path of changed){
  const data=(await lstat(path)).isSymbolicLink()?Buffer.from(await readlink(path)):await readFile(path);const s=execFileSync('git',['diff',base,'--unified=0','--',path],{encoding:'utf8'}).split('\n').filter(x=>x.startsWith('+')&&!x.startsWith('+++')).join('\n');
  const matches=patterns.filter(r=>r.test(s)).length;
  if(matches)hits.push({path,matches});
  assert.ok(!/\d{15,}/.test(s),`Unexpected long numeric identifier in ${path}`);
  files.push({path,sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length});
}
assert.deepEqual(hits,[],'Captured identifiers/names were found; values suppressed.');
for(const name of ['synthetic-2031.json','synthetic-2032.json']){
  const f=JSON.parse(await readFile('qa/transactions/'+name,'utf8'));
  assert.equal(f.synthetic,true);assert.match(f.leagueId,/^demo-league-/);
  for(const t of f.teams){assert.ok(!rosterIds.has(t.id));assert.match(t.managerName,/^Demo /);assert.equal(t.avatar,null);}
  for(const t of f.raw){
    assert.match(t.transaction_id,/^demo-/);assert.ok(!privateRows.has(JSON.stringify(t)));
    assert.equal(t.creator,undefined);assert.equal(t.consenter_ids,undefined);
    assert.ok(t.roster_ids.every(id=>id>=700));
    for(const id of [...Object.keys(t.adds??{}),...Object.keys(t.drops??{})])assert.match(id,/^demo-player-/);
  }
}
// Fail closed: command errors propagate. Prove every new commit parent explicitly.
const history=execFileSync('git',['rev-list','--reverse','--parents',`${base}..HEAD`],{encoding:'utf8'}).trim().split('\n').filter(Boolean).map(l=>l.split(' '));
assert.ok(history.length,'Commit the proposed files before ancestry verification.');
let expectedParent=base;
for(const [head,...parents] of history){
 assert.deepEqual(parents,[expectedParent],'Unexpected candidate parent or merge ancestry.');
 const paths=execFileSync('git',['diff-tree','--no-commit-id','--name-only','-r',head],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 assert.ok(paths.every(p=>(source.has(p)||p.startsWith('qa/transactions/'))&&!/(frozen|evidence|\.next|\.cache|\.build)/.test(p)),'Out-of-scope intermediate commit inventory.');
 const additions=execFileSync('git',['diff',expectedParent,head,'--unified=0'],{encoding:'utf8'}).split('\n').filter(x=>x.startsWith('+')&&!x.startsWith('+++')).join('\n');
 assert.ok(!patterns.some(r=>r.test(additions)),'Captured value in intermediate commit; values suppressed.');
 expectedParent=head;
}
assert.equal(expectedParent,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
const output=process.argv[3]??'qa/transactions/evidence/sanitization.json';
const report={result:'PASS',base,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Authorized bounded source and synthetic QA additions; complete candidate parent chain and file inventory',privateValuesChecked:deny.size,privateRawRowsChecked:privateRows.size,capturedValueMatches:0,rawRecordMatches:0,candidateParents:history,syntheticFixtureChecks:'PASS',files};
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,files:files.length,capturedValueMatches:0,rawRecordMatches:0,candidateParents:history}));
