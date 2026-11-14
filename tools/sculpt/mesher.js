'use strict';
/* Surface Nets: SDF → треугольная сетка, нормали по градиенту, запечённое AO */
function mesh(f, opt={}){
  const h = opt.h || .006;
  const bx0=opt.min?.[0]??-.46, by0=opt.min?.[1]??-.01, bz0=opt.min?.[2]??-.46;
  const bx1=opt.max?.[0]??.46,  by1=opt.max?.[1]??1.56, bz1=opt.max?.[2]??.46;
  const nx=Math.ceil((bx1-bx0)/h)+1, ny=Math.ceil((by1-by0)/h)+1, nz=Math.ceil((bz1-bz0)/h)+1;
  const N=nx*ny*nz, val=new Float32Array(N);
  const idx=(i,j,k)=>i+nx*(j+ny*k);
  // грубая сетка для узкой полосы
  const c=4, cnx=Math.floor((nx-1)/c)+1, cny=Math.floor((ny-1)/c)+1, cnz=Math.floor((nz-1)/c)+1;
  const cv=new Float32Array(cnx*cny*cnz);
  for(let k=0;k<cnz;k++) for(let j=0;j<cny;j++) for(let i=0;i<cnx;i++) cv[i+cnx*(j+cny*k)]=f(bx0+i*c*h, by0+j*c*h, bz0+k*c*h);
  const thr=1.6*c*h; let evals=0;
  for(let k=0;k<nz;k++){ const z=bz0+k*h, ck=Math.min(cnz-1,Math.round(k/c));
    for(let j=0;j<ny;j++){ const y=by0+j*h, cj=Math.min(cny-1,Math.round(j/c));
      for(let i=0;i<nx;i++){ const ci=Math.min(cnx-1,Math.round(i/c)); const g=cv[ci+cnx*(cj+cny*ck)];
        if(Math.abs(g)>thr) val[idx(i,j,k)]=g; else { val[idx(i,j,k)]=f(bx0+i*h,y,z); evals++; } } } }
  // вершины в ячейках
  const cidx=new Int32Array((nx-1)*(ny-1)*(nz-1)).fill(-1);
  const cI=(i,j,k)=>i+(nx-1)*(j+(ny-1)*k);
  const P=[];
  const E=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  const co=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]];
  const v=new Float32Array(8);
  for(let k=0;k<nz-1;k++) for(let j=0;j<ny-1;j++) for(let i=0;i<nx-1;i++){
    let mask=0; for(let q=0;q<8;q++){ const o=co[q]; v[q]=val[idx(i+o[0],j+o[1],k+o[2])]; if(v[q]<0) mask|=1<<q; }
    if(mask===0||mask===255) continue;
    let sx=0,sy=0,sz=0,n=0;
    for(const [a,b] of E){ const va=v[a],vb=v[b]; if((va<0)===(vb<0)) continue; const t=va/(va-vb), oa=co[a], ob=co[b];
      sx+=oa[0]+(ob[0]-oa[0])*t; sy+=oa[1]+(ob[1]-oa[1])*t; sz+=oa[2]+(ob[2]-oa[2])*t; n++; }
    cidx[cI(i,j,k)]=P.length/3; P.push(bx0+(i+sx/n)*h, by0+(j+sy/n)*h, bz0+(k+sz/n)*h);
  }
  const I=[];
  const quad=(a,b,c2,d)=>{ if(a<0||b<0||c2<0||d<0) return; I.push(a,b,c2, a,c2,d); };
  for(let k=1;k<nz-1;k++) for(let j=1;j<ny-1;j++) for(let i=0;i<nx-1;i++){ const s=val[idx(i,j,k)]<0; if(s!==(val[idx(i+1,j,k)]<0)) quad(cidx[cI(i,j-1,k-1)],cidx[cI(i,j,k-1)],cidx[cI(i,j,k)],cidx[cI(i,j-1,k)]); }
  for(let k=1;k<nz-1;k++) for(let j=0;j<ny-1;j++) for(let i=1;i<nx-1;i++){ const s=val[idx(i,j,k)]<0; if(s!==(val[idx(i,j+1,k)]<0)) quad(cidx[cI(i-1,j,k-1)],cidx[cI(i,j,k-1)],cidx[cI(i,j,k)],cidx[cI(i-1,j,k)]); }
  for(let k=0;k<nz-1;k++) for(let j=1;j<ny-1;j++) for(let i=1;i<nx-1;i++){ const s=val[idx(i,j,k)]<0; if(s!==(val[idx(i,j,k+1)]<0)) quad(cidx[cI(i-1,j-1,k)],cidx[cI(i,j-1,k)],cidx[cI(i,j,k)],cidx[cI(i-1,j,k)]); }

  const nv=P.length/3, pos=new Float32Array(P), nor=new Float32Array(nv*3), ao=new Float32Array(nv);
  const e=h*.5;
  const grad=(x,y,z,out,o)=>{ const a=f(x+e,y-e,z-e), b=f(x-e,y-e,z+e), c3=f(x-e,y+e,z-e), d=f(x+e,y+e,z+e);
    let gx=a-b-c3+d, gy=-a-b+c3+d, gz=-a+b-c3+d; const l=Math.hypot(gx,gy,gz)||1; out[o]=gx/l; out[o+1]=gy/l; out[o+2]=gz/l; };
  const tmp=new Float32Array(3);
  for(let q=0;q<nv;q++){ let x=pos[3*q],y=pos[3*q+1],z=pos[3*q+2];
    for(let it=0;it<2;it++){ const d=f(x,y,z); grad(x,y,z,tmp,0); const s=Math.max(-h,Math.min(h,d)); x-=tmp[0]*s; y-=tmp[1]*s; z-=tmp[2]*s; }
    pos[3*q]=x; pos[3*q+1]=y; pos[3*q+2]=z; grad(x,y,z,nor,3*q);
    let occ=0, sca=1; const nx_=nor[3*q],ny_=nor[3*q+1],nz_=nor[3*q+2];
    for(let s=1;s<=6;s++){ const hh=.006+.022*s; const d=f(x+nx_*hh,y+ny_*hh,z+nz_*hh); occ+=(hh-d)*sca; sca*=.72; }
    // небесная видимость: снизу темнее
    const sky=.82+.18*ny_;
    ao[q]=Math.max(0,Math.min(1,1-2.4*occ))*sky;
  }
  // ориентация треугольников по нормалям
  for(let t=0;t<I.length;t+=3){ const a=I[t],b=I[t+1],c2=I[t+2];
    const ax=pos[3*a],ay=pos[3*a+1],az=pos[3*a+2];
    const ux=pos[3*b]-ax,uy=pos[3*b+1]-ay,uz=pos[3*b+2]-az, vx=pos[3*c2]-ax,vy=pos[3*c2+1]-ay,vz=pos[3*c2+2]-az;
    const fx=uy*vz-uz*vy, fy=uz*vx-ux*vz, fz=ux*vy-uy*vx;
    const mx=nor[3*a]+nor[3*b]+nor[3*c2], my=nor[3*a+1]+nor[3*b+1]+nor[3*c2+1], mz=nor[3*a+2]+nor[3*b+2]+nor[3*c2+2];
    if(fx*mx+fy*my+fz*mz<0){ I[t+1]=c2; I[t+2]=b; } }
  return { pos, nor, ao, idx:new Uint32Array(I), stats:{nx,ny,nz,evals,nv,tris:I.length/3} };
}
function toBin(m){
  const nv=m.pos.length/3, ni=m.idx.length;
  const buf=Buffer.alloc(8+nv*12*2+nv*4+ni*4);
  buf.writeUInt32LE(nv,0); buf.writeUInt32LE(ni,4); let o=8;
  Buffer.from(m.pos.buffer).copy(buf,o); o+=nv*12;
  Buffer.from(m.nor.buffer).copy(buf,o); o+=nv*12;
  Buffer.from(m.ao.buffer).copy(buf,o); o+=nv*4;
  Buffer.from(m.idx.buffer).copy(buf,o);
  return buf;
}
module.exports={mesh,toBin};
