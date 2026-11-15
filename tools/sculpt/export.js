'use strict';
/* Экспорт игровых моделей, формат v3 (материал вершины = индекс в palette.json):
   [u32 вершин][u32 индексов][u32 16-битные индексы][u32 версия=3]
   позиции Uint16×3 (куб x,z∈[-.5,.5], y∈[-.05,1.6]) · затенение Uint8 · материал Uint8 · индексы */
const fs=require('fs'), path=require('path');
const { mesh } = require('./mesher');
const { getMat } = require('./sdf');
const SETS = require('./chars3');
const [,, outDir, setsArg='AT:w,RM:b', lodArg='hi:.0095,lo:.015', only=''] = process.argv;
const BOX={x0:-.5,x1:.5,y0:-.05,y1:1.6,z0:-.5,z1:.5};
const q=(v,a,b)=>Math.max(0,Math.min(65535,Math.round((v-a)/(b-a)*65535)));
const pad4=n=>(n+3)&~3;
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'palette.json'), JSON.stringify(SETS.PALETTE.map(p=>[p.hex,p.kind])));
for(const pair of setsArg.split(',')){
  const [setName,side]=pair.split(':');
  for(const lod of lodArg.split(',')){
    const [lname,h]=lod.split(':');
    for(const k of ['p','n','b','r','q','k']){
      if(only && !only.includes(k)) continue;
      const t0=Date.now(), m=mesh(SETS[setName][k],{h:+h,getMat});
      const nv=m.pos.length/3, ni=m.idx.length, i16=nv<65536?1:0;
      const posB=pad4(nv*6), aoB=pad4(nv), matB=pad4(nv), idxB=ni*(i16?2:4);
      const buf=Buffer.alloc(16+posB+aoB+matB+idxB);
      buf.writeUInt32LE(nv,0); buf.writeUInt32LE(ni,4); buf.writeUInt32LE(i16,8); buf.writeUInt32LE(3,12);
      let o=16;
      for(let i=0;i<nv;i++){ buf.writeUInt16LE(q(m.pos[3*i],BOX.x0,BOX.x1),o); buf.writeUInt16LE(q(m.pos[3*i+1],BOX.y0,BOX.y1),o+2); buf.writeUInt16LE(q(m.pos[3*i+2],BOX.z0,BOX.z1),o+4); o+=6; }
      o=16+posB; for(let i=0;i<nv;i++) buf.writeUInt8(Math.round(Math.max(0,Math.min(1,m.ao[i]))*255),o+i);
      o=16+posB+aoB; for(let i=0;i<nv;i++) buf.writeUInt8(m.mat[i],o+i);
      o=16+posB+aoB+matB; for(let i=0;i<ni;i++){ if(i16) buf.writeUInt16LE(m.idx[i],o+2*i); else buf.writeUInt32LE(m.idx[i],o+4*i); }
      const file=path.join(outDir,`${side}-${k}-${lname}.bin`);
      fs.writeFileSync(file,buf);
      const counts={}; for(const v of m.mat) counts[v]=(counts[v]||0)+1;
      console.log(path.basename(file),(buf.length/1024).toFixed(0)+'KB','verts',nv,'colors',Object.keys(counts).length,((Date.now()-t0)/1000).toFixed(1)+'s');
    }
  }
}
