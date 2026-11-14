'use strict';
const fs=require('fs'), path=require('path');
const { mesh, toBin } = require('./mesher');
const SETS = require('./chars');
const [,, setName='AT', only='', hArg='.006'] = process.argv;
const h=+hArg, out=path.join(__dirname,'out'); fs.mkdirSync(out,{recursive:true});
const set=SETS[setName];
for(const k of ['p','n','b','r','q','k']){
  if(only && !only.includes(k)) continue;
  const t0=Date.now();
  const m=mesh(set[k],{h});
  fs.writeFileSync(path.join(out,`${setName}-${k}.bin`), toBin(m));
  console.log(setName,k,`${((Date.now()-t0)/1000).toFixed(1)}s`, JSON.stringify(m.stats));
}
