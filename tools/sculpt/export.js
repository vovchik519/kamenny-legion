'use strict';
/* Экспорт компактных моделей для игры:
   [u32 nv][u32 ni][u32 idx16] · pos Uint16×3 (квантованы в куб) · ao Uint8 · индексы Uint16/Uint32 */
const fs=require('fs'), path=require('path');
const { mesh } = require('./mesher');
const SETS = require('./chars');
const [,, outDir, setsArg='AT:w,RM:b', lodArg='hi:.0095,lo:.015'] = process.argv;
const BOX={x0:-.5,x1:.5,y0:-.05,y1:1.6,z0:-.5,z1:.5};
const q=(v,a,b)=>Math.max(0,Math.min(65535,Math.round((v-a)/(b-a)*65535)));
const pad4=n=>(n+3)&~3;
fs.mkdirSync(outDir,{recursive:true});
for(const pair of setsArg.split(',')){
  const [setName,side]=pair.split(':');
  for(const lod of lodArg.split(',')){
    const [lname,h]=lod.split(':');
    for(const k of ['p','n','b','r','q','k']){
      const t0=Date.now(), m=mesh(SETS[setName][k],{h:+h});
      const nv=m.pos.length/3, ni=m.idx.length, i16=nv<65536?1:0;
      const posBytes=pad4(nv*6), aoBytes=pad4(nv), idxBytes=ni*(i16?2:4);
      const buf=Buffer.alloc(12+posBytes+aoBytes+idxBytes);
      buf.writeUInt32LE(nv,0); buf.writeUInt32LE(ni,4); buf.writeUInt32LE(i16,8);
      let o=12;
      for(let i=0;i<nv;i++){ buf.writeUInt16LE(q(m.pos[3*i],BOX.x0,BOX.x1),o); buf.writeUInt16LE(q(m.pos[3*i+1],BOX.y0,BOX.y1),o+2); buf.writeUInt16LE(q(m.pos[3*i+2],BOX.z0,BOX.z1),o+4); o+=6; }
      o=12+posBytes;
      for(let i=0;i<nv;i++) buf.writeUInt8(Math.round(Math.max(0,Math.min(1,m.ao[i]))*255),o+i);
      o=12+posBytes+aoBytes;
      for(let i=0;i<ni;i++){ if(i16) buf.writeUInt16LE(m.idx[i],o+2*i); else buf.writeUInt32LE(m.idx[i],o+4*i); }
      const file=path.join(outDir,`${side}-${k}-${lname}.bin`);
      fs.writeFileSync(file,buf);
      console.log(path.basename(file), (buf.length/1024).toFixed(0)+'KB', 'verts',nv,'tris',ni/3, ((Date.now()-t0)/1000).toFixed(1)+'s');
    }
  }
}
