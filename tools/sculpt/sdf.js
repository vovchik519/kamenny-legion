'use strict';
/* SDF-библиотека: примитивы, булевы операции с плавным слиянием, резьба */
const { sqrt, abs, max, min, sin, cos, atan2, floor, PI } = Math;
const clamp = (x,a,b) => x<a?a:x>b?b:x;
const smin = (a,b,k) => { const h=max(k-abs(a-b),0)/k; return min(a,b)-h*h*k*.25; };
const smax = (a,b,k) => -smin(-a,-b,k);
const carve = (d,c,k=.004) => smax(d,-c,k);

function rot(rx=0,ry=0,rz=0){ // R = Rz*Ry*Rx, row-major
  const cx=cos(rx),sx=sin(rx),cy=cos(ry),sy=sin(ry),cz=cos(rz),sz=sin(rz);
  return [cz*cy, cz*sy*sx-sz*cx, cz*sy*cx+sz*sx,
          sz*cy, sz*sy*sx+cz*cx, sz*sy*cx-cz*sx,
          -sy,   cy*sx,          cy*cx];
}
let LX=0,LY=0,LZ=0;
function L(x,y,z,cx,cy,cz,m){ const dx=x-cx,dy=y-cy,dz=z-cz;
  if(m){ LX=m[0]*dx+m[3]*dy+m[6]*dz; LY=m[1]*dx+m[4]*dy+m[7]*dz; LZ=m[2]*dx+m[5]*dy+m[8]*dz; }
  else { LX=dx; LY=dy; LZ=dz; } }

const sph = (x,y,z,cx,cy,cz,r) => { const dx=x-cx,dy=y-cy,dz=z-cz; return sqrt(dx*dx+dy*dy+dz*dz)-r; };
function ell(x,y,z,cx,cy,cz,rx,ry,rz,m){ L(x,y,z,cx,cy,cz,m);
  const a=LX/rx,b=LY/ry,c=LZ/rz, k0=sqrt(a*a+b*b+c*c);
  const a2=LX/(rx*rx),b2=LY/(ry*ry),c2=LZ/(rz*rz), k1=sqrt(a2*a2+b2*b2+c2*c2);
  return k1<1e-9 ? -min(rx,ry,rz) : k0*(k0-1)/k1; }
function cone(x,y,z,ax,ay,az,bx,by,bz,r1,r2){ // скруглённый конус / капсула
  const bax=bx-ax,bay=by-ay,baz=bz-az, l2=bax*bax+bay*bay+baz*baz, rr=r1-r2, a2=l2-rr*rr, il2=1/l2;
  const pax=x-ax,pay=y-ay,paz=z-az, yv=pax*bax+pay*bay+paz*baz, zv=yv-l2;
  const qx=pax*l2-bax*yv, qy=pay*l2-bay*yv, qz=paz*l2-baz*yv, x2=qx*qx+qy*qy+qz*qz, y2=yv*yv*l2, z2=zv*zv*l2;
  const k=Math.sign(rr)*rr*rr*x2;
  if(Math.sign(zv)*a2*z2>k) return sqrt(x2+z2)*il2-r2;
  if(Math.sign(yv)*a2*y2<k) return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+yv*rr)*il2-r1; }
function chain(x,y,z,pts,rads,k=.0){ // цепочка конусов по точкам
  let d=1e9; for(let i=0;i<pts.length-1;i++){ const a=pts[i],b=pts[i+1];
    const s=cone(x,y,z,a[0],a[1],a[2],b[0],b[1],b[2],rads[i],rads[i+1]); d = k>0 ? smin(d,s,k) : min(d,s); } return d; }
function box(x,y,z,cx,cy,cz,hx,hy,hz,r=0,m){ L(x,y,z,cx,cy,cz,m);
  const qx=abs(LX)-hx+r,qy=abs(LY)-hy+r,qz=abs(LZ)-hz+r, ox=max(qx,0),oy=max(qy,0),oz=max(qz,0);
  return sqrt(ox*ox+oy*oy+oz*oz)+min(max(qx,max(qy,qz)),0)-r; }
function tor(x,y,z,cx,cy,cz,R,r,m){ L(x,y,z,cx,cy,cz,m); const q=sqrt(LX*LX+LZ*LZ)-R; return sqrt(q*q+LY*LY)-r; } // кольцо в плоскости XZ
function torZ(x,y,z,cx,cy,cz,R,r){ const dx=x-cx,dy=y-cy,dz=z-cz, q=sqrt(dx*dx+dy*dy)-R; return sqrt(q*q+dz*dz)-r; } // кольцо в плоскости XY
function cyl(x,y,z,cx,cy,cz,rad,h,rd=0,m){ L(x,y,z,cx,cy,cz,m);
  const dx=sqrt(LX*LX+LZ*LZ)-rad+rd, dy=abs(LY)-h+rd;
  return min(max(dx,dy),0)+sqrt(max(dx,0)**2+max(dy,0)**2)-rd; }
function poly2(px,py,v){ const n=v.length/2; let d=(px-v[0])**2+(py-v[1])**2, s=1;
  for(let i=0,j=n-1;i<n;j=i,i++){ const vix=v[2*i],viy=v[2*i+1],vjx=v[2*j],vjy=v[2*j+1];
    const ex=vjx-vix,ey=vjy-viy,wx=px-vix,wy=py-viy, t=clamp((wx*ex+wy*ey)/(ex*ex+ey*ey),0,1), bx=wx-ex*t, by=wy-ey*t;
    d=min(d,bx*bx+by*by); const c1=py>=viy,c2=py<vjy,c3=ex*wy>ey*wx; if((c1&&c2&&c3)||(!c1&&!c2&&!c3)) s=-s; }
  return s*sqrt(d); }
function makeRev(y0,y1,rfn,n=40){ const v=[0,y0]; for(let i=0;i<=n;i++){ const y=y0+(y1-y0)*i/n; v.push(max(.001,rfn(y)),y); } v.push(0,y1); return v; }
const rev = (x,y,z,cx,cz,poly,round=0) => poly2(sqrt((x-cx)**2+(z-cz)**2), y, poly)-round;
// улыбка/дуга, вырезанная в плоскости XY, нижняя половина
function smileSDF(x,y,z,cx,cy,cz,R,r,cut=.25){ const dx=x-cx,dy=y-cy,dz=z-cz, q=sqrt(dx*dx+dy*dy)-R; return max(sqrt(q*q+dz*dz)-r, dy+R*cut); }

/* ---------- Постамент Стаунтона ---------- */
const BASE = [0,0, .352,0, .366,.01, .368,.024, .35,.04, .318,.054, .304,.068, .306,.078, .322,.086, .322,.096, .296,.106, .25,.128, .222,.146, .232,.154, .232,.165, .205,.175, 0,.175];
const base = (x,y,z) => rev(x,y,z,0,0,BASE,.003);
// узор желобков на постаменте (бусины)
function piece(fn){ return (x,y,z)=>{ let d=fn(x,y,z); const b=base(x,y,z); return smin(b,d,.025); }; }

/* ---------- Скульптура с материалами ----------
   Материалы: 0 основной фарфор, 1 металл, 2 тёмная глазурь, 3 светлая глазурь, 4 свечение */
const ST = { D:1e9, M:0 };
const begin = () => { ST.D=1e9; ST.M=0; };
function add(d, m=0, k=0){ if(d<ST.D) ST.M=m; ST.D = k>0 ? smin(ST.D,d,k) : min(ST.D,d); }
function cut(c, m=-1, k=0){ const v=-c; if(v>ST.D && m>=0) ST.M=m; ST.D = k>0 ? smax(ST.D,v,k) : max(ST.D,v); }
function paint(mask, m){ if(mask<0) ST.M=m; }
// сглаженная кривая Катмулла–Рома по контрольным точкам + радиусы
function spline(ctrl, n){ const out=[]; const P=i=>ctrl[Math.max(0,Math.min(ctrl.length-1,i))];
  for(let s=0;s<=n;s++){ const u=s/n*(ctrl.length-1), i=Math.min(ctrl.length-2,Math.floor(u)), t=u-i;
    const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2), t2=t*t,t3=t2*t, r=[];
    for(let k=0;k<3;k++) r.push(.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3));
    out.push(r); } return out; }
function radii(rs, n){ const out=[]; for(let s=0;s<=n;s++){ const u=s/n*(rs.length-1), i=Math.min(rs.length-2,Math.floor(u)), t=u-i; out.push(rs[i]+(rs[i+1]-rs[i])*t); } return out; }
const tube = (x,y,z,P,R,k=.008) => chain(x,y,z,P,R,k);
// постамент Стаунтона с золотыми поясками
function stauntonPiece(build, baseCol=0, ringCol=1){
  return (x,y,z)=>{ begin(); const b=base(x,y,z); ST.D=b; ST.M=baseCol; build(x,y,z);
    // поясок и воротник постамента — металл, только на самом постаменте
    if(abs(b-ST.D)<.004 || b<=ST.D+.002){ const r=sqrt(x*x+z*z); ST.M=baseCol;
      if((y>.076&&y<.099&&r>.29) || (y>.151&&y<.168&&r>.2) || (y<.012&&r>.33)) ST.M=ringCol; }
    return ST.D; };
}
const getMat = () => ST.M;

module.exports = { sqrt,abs,max,min,sin,cos,atan2,floor,PI,clamp,smin,smax,carve,rot,sph,ell,cone,chain,box,tor,torZ,cyl,makeRev,rev,smileSDF,piece,base,
  ST,begin,add,cut,paint,spline,radii,tube,stauntonPiece,getMat };
