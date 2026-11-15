'use strict';
/* Коллекционный набор v3: расписная глянцевая керамика в цветах персонажей.
   Светлые — «Время приключений» на белом мраморе с золотом,
   тёмные — «Рик и Морти» на чёрном мраморе с платиной. */
const S = require('./sdf');
const { sqrt,abs,max,min,sin,cos,atan2,PI,smin,smax,rot,sph,ell,cone,box,tor,torZ,cyl,makeRev,rev,smileSDF,
        add,cut,paint,spline,radii,stauntonPiece } = S;
const tube = (x,y,z,pts,rs) => S.chain(x,y,z,pts,rs,0);
const sat = v => v<0?0:v>1?1:v;
const rad = (x,z) => sqrt(x*x+z*z);
const curve = (ctrl, rs, n=12) => [spline(ctrl,n), radii(rs,n)];

/* ---------- Палитра: индекс → [цвет, вид] (glaze | metal | glow) ---------- */
const PALETTE = [];
const C = {};
function col(name, hex, kind='glaze'){ C[name]=PALETTE.length; PALETTE.push({name,hex,kind}); return C[name]; }
col('BASE_W','#efe9dd'); col('BASE_B','#1c1e23'); col('GOLD','#e3bd6e','metal'); col('SILVER','#dfe3ea','metal');
col('BLACK','#151517'); col('WHITE','#fbfaf6'); col('GLOW','#8cff5c','glow'); col('STEEL','#cdd3da','metal');
// Время приключений
col('BANANA','#f6d64a'); col('BAN_TIP','#6e4a26'); col('WOOD','#b07a45');
col('JAKE','#f2a93b'); col('JAKE_NOSE','#2a1f1a');
col('FINN_SKIN','#ffd6b3'); col('FINN_SHIRT','#5ab9ea'); col('FINN_SHORTS','#2149a3'); col('FINN_PACK','#3fa34d');
col('BMO','#6fc9b4'); col('BMO_SCREEN','#c9f2cb'); col('RED','#e5473d'); col('YELLOW','#f4d03f'); col('BLUE','#3f7fe0'); col('GREEN','#49c25a');
col('PB_SKIN','#f9b0cc'); col('PB_HAIR','#ff6aae'); col('PB_DRESS','#e562ad'); col('GEM_BLUE','#3aa0ff');
col('IK_SKIN','#86bce8'); col('IK_ROBE','#2d4fa5'); col('IK_BEARD','#f4f6fa'); col('GEM_RED','#d93a3a');
// Рик и Морти
col('SKIN','#f4d2b2'); col('MORTY_SHIRT','#f1de4e'); col('MORTY_PANTS','#3b5ca6'); col('MORTY_HAIR','#6e4221');
col('BIRD','#8a5634'); col('BIRD_LIGHT','#d9b98f'); col('BEAK','#e9b53e'); col('ARMOR','#4a5160');
col('MEES','#79c5ee');
col('PICKLE','#78b13f'); col('PICKLE_DARK','#4f8a2a'); col('STONE','#a3a9b3');
col('SUM_HAIR','#d8602a'); col('SUM_TOP','#f29bc2'); col('DENIM','#8fb0db');
col('RICK_HAIR','#a7d3e6'); col('COAT','#f3f5f8'); col('RICK_SHIRT','#8fcbe9'); col('RICK_PANTS','#7a5838'); col('SHOE_BROWN','#4f3a2a');

const PW = fn => stauntonPiece(fn, C.BASE_W, C.GOLD);
const PB = fn => stauntonPiece(fn, C.BASE_B, C.SILVER);
const band = (y,a,b) => max(a-y, y-b);                 // маска «между a и b по высоте»

/* ================= ВРЕМЯ ПРИКЛЮЧЕНИЙ ================= */
const BAN = curve([[.035,.19,0],[-.02,.3,0],[-.062,.44,.006],[-.072,.58,.01],[-.05,.71,.008],[-.005,.8,0],[.04,.865,-.01]],[.05,.085,.1,.098,.083,.058,.022],22);
const banCx = y => { const p=BAN[0]; for(let i=0;i<p.length-1;i++) if(y<=p[i+1][1]) { const t=(y-p[i][1])/(p[i+1][1]-p[i][1]||1); return p[i][0]+(p[i+1][0]-p[i][0])*sat(t); } return p[p.length-1][0]; };
const BAN_AR = curve([[.02,.5,.05],[.09,.44,.08],[.16,.475,.1]],[.014,.013,.013],8);
const BAN_AL = curve([[-.16,.5,.04],[-.19,.42,.07],[-.18,.34,.08]],[.014,.013,.013],8);
const JAKE_NECK = curve([[0,.42,0],[0,.53,-.02],[0,.62,.02],[0,.67,.07]],[.088,.084,.08,.08],10);
const JAKE_TAIL = curve([[0,.26,-.2],[0,.3,-.27],[0,.38,-.3],[0,.44,-.28]],[.028,.024,.018,.012],8);
const FINN_SHIRT = makeRev(.35,.57,y=>.108-.022*Math.pow((y-.35)/.22,2));
const FINN_AR = curve([[.095,.54,0],[.135,.48,.05],[.155,.5,.105]],[.021,.02,.019],6);
const FINN_AL = curve([[-.095,.54,0],[-.13,.46,.03],[-.135,.39,.05]],[.021,.02,.019],6);
const BMO_AR = curve([[.16,.48,0],[.21,.52,.03],[.24,.6,.05]],[.013,.012,.012],6);
const BMO_AL = curve([[-.16,.48,0],[-.205,.42,.03],[-.215,.35,.05]],[.013,.012,.012],6);
const GOWN = makeRev(.175,.68,y=> y<.52 ? .1+.155*Math.pow((.52-y)/.345,1.6) : y<.62 ? .1+.012*sin((y-.52)/.1*PI) : .1-.06*Math.pow((y-.62)/.06,1.5), 48);
const PB_HAIR = curve([[0,.8,-.07],[0,.68,-.12],[0,.54,-.13],[0,.42,-.11],[0,.33,-.08]],[.09,.095,.085,.06,.03],14);
const PB_LOCK = curve([[.07,.84,.04],[.088,.74,.035],[.08,.64,.02]],[.03,.026,.016],8);
const PB_ARM = curve([[.098,.625,0],[.122,.56,.015],[.13,.495,.035]],[.015,.014,.013],10);
const ROBE = makeRev(.175,.84,y=>.255-.1*Math.pow((y-.175)/.665,.6), 48);
const BEARD = curve([[0,.8,.13],[0,.66,.18],[0,.5,.2],[0,.36,.19],[0,.24,.16]],[.105,.095,.075,.047,.016],16);

const AT = {
  p: PW((x,y,z)=>{ // Банановый страж
    let d = tube(x,y,z,BAN[0],BAN[1]);
    const th = atan2(x-banCx(y), z); d += .0045*(1-abs(cos(2.5*th)));
    add(d,C.BANANA,.02);
    add(cone(x,y,z,.04,.86,-.01,.056,.912,-.018,.02,.016),C.BAN_TIP,.012);
    paint(.846-y, C.BAN_TIP);
    add(cone(x,y,z,.005,.17,.02,.005,.24,.02,.015,.014),C.BANANA,.01);
    add(cone(x,y,z,.07,.17,.02,.07,.24,.02,.015,.014),C.BANANA,.01);
    const fx=banCx(.6);
    for(const ex of [fx-.034,fx+.034]){ cut(ell(x,y,z,ex,.605,.098,.0135,.019,.014),C.BLACK,.003); paint(sph(x,y,z,ex+.005,.613,.109,.0045),C.WHITE); }
    cut(smileSDF(x,y,z,fx,.556,.1,.022,.0055,.2),C.BLACK,.002);
    add(tube(x,y,z,BAN_AR[0],BAN_AR[1]),C.BANANA,.012); add(sph(x,y,z,.165,.478,.1,.021),C.BANANA,.008);
    add(tube(x,y,z,BAN_AL[0],BAN_AL[1]),C.BANANA,.012); add(sph(x,y,z,-.18,.33,.08,.02),C.BANANA,.008);
    add(cone(x,y,z,.17,.17,.1,.17,1.0,.1,.0105,.009),C.WOOD);
    add(sph(x,y,z,.17,.185,.1,.014),C.STEEL,.004);
    add(tor(x,y,z,.17,.998,.1,.014,.006),C.STEEL,.003);
    add(ell(x,y,z,.17,1.06,.1,.028,.066,.008),C.STEEL,.004);
    add(cone(x,y,z,.17,1.11,.1,.17,1.165,.1,.011,.001),C.STEEL,.003);
  }),
  n: PW((x,y,z)=>{ // Джейк
    const X=abs(x);
    add(smin(ell(x,y,z,0,.3,-.05,.165,.135,.165), ell(x,y,z,0,.4,.02,.12,.14,.105), .06),C.JAKE,.03);
    add(ell(X,y,z,.12,.24,-.02,.06,.07,.1),C.JAKE,.03);
    add(ell(X,y,z,.12,.19,.06,.045,.022,.06),C.JAKE,.015);
    add(cone(X,y,z,.06,.19,.11,.06,.36,.07,.038,.042),C.JAKE,.025);
    add(ell(X,y,z,.06,.192,.135,.042,.022,.05),C.JAKE,.012);
    for(const tx of [-.018,.018]) cut(box(X,y,z,.06+tx,.19,.18,.0018,.014,.02),-1,.002);
    add(tube(x,y,z,JAKE_NECK[0],JAKE_NECK[1]),C.JAKE,.05);
    add(smax(ell(x,y,z,0,.77,.1,.19,.13,.15), y-.885, .035),C.JAKE,.04);
    add(sph(X,y,z,.056,.71,.21,.07),C.JAKE,.025);
    add(ell(x,y,z,0,.665,.18,.065,.032,.055),C.JAKE,.02);
    add(ell(x,y,z,0,.77,.272,.042,.028,.03),C.JAKE_NOSE,.008);
    paint(sph(x,y,z,-.013,.781,.296,.008),C.WHITE);
    cut(box(x,y,z,0,.69,.262,.0028,.024,.02,.002),C.JAKE_NOSE,.002);
    cut(smileSDF(x,y,z,0,.68,.25,.06,.005,.2),C.JAKE_NOSE,.002);
    add(ell(X,y,z,.078,.81,.222,.036,.04,.02),C.BLACK,.006);
    paint(sph(X,y,z,.066,.825,.24,.009),C.WHITE);
    add(cone(X,y,z,.122,.872,.205,.04,.865,.235,.009,.008),C.JAKE_NOSE,.004);
    add(ell(X,y,z,.188,.735,.085,.04,.095,.06,rot(0,0,.3)),C.JAKE,.02);
    add(tube(x,y,z,JAKE_TAIL[0],JAKE_TAIL[1]),C.JAKE,.02);
  }),
  b: PW((x,y,z)=>{ // Финн
    const X=abs(x);
    add(ell(X,y,z,.045,.198,.03,.038,.025,.058),C.BLACK,.012);
    add(cone(X,y,z,.045,.2,0,.045,.31,0,.025,.026),C.FINN_SKIN,.01);
    paint(max(band(y,.222,.262), sqrt((X-.045)*(X-.045)+z*z)-.032), C.WHITE);
    add(cyl(x,y,z,0,.335,0,.105,.042,.02),C.FINN_SHORTS,.012);
    cut(tor(x,y,z,0,.297,0,.1,.0035),-1,.002);
    add(rev(x,y,z,0,0,FINN_SHIRT,.004),C.FINN_SHIRT,.02);
    add(box(x,y,z,0,.47,-.105,.088,.095,.045,.03),C.FINN_PACK,.012);
    cut(box(x,y,z,0,.5,-.152,.07,.0028,.012),-1,.002);
    add(box(X,y,z,.058,.49,.087,.013,.075,.008,.004,rot(-.15,0,0)),C.FINN_PACK,.006);
    add(smin(ell(x,y,z,0,.755,0,.13,.15,.125), ell(X,y,z,.072,.9,-.005,.036,.046,.03), .03),C.WHITE,.02);
    cut(ell(x,y,z,0,.73,.118,.092,.078,.05),-1,.006);
    add(ell(x,y,z,0,.73,.075,.087,.073,.058),C.FINN_SKIN);
    cut(ell(X,y,z,.03,.75,.132,.0115,.014,.008),C.BLACK,.002);
    paint(sph(X,y,z,.026,.756,.134,.004),C.WHITE);
    cut(smax(ell(x,y,z,0,.712,.132,.024,.016,.014), y-.716, .003),C.BLACK,.002);
    add(tube(x,y,z,FINN_AR[0],FINN_AR[1]),C.FINN_SKIN,.01); add(sph(x,y,z,.155,.505,.112,.024),C.FINN_SKIN,.008);
    add(tube(x,y,z,FINN_AL[0],FINN_AL[1]),C.FINN_SKIN,.01); add(sph(x,y,z,-.135,.385,.05,.023),C.FINN_SKIN,.008);
    paint(max(band(y,.5,.565), .09-X), C.FINN_SHIRT);   // рукава футболки
    add(box(x,y,z,.155,.69,.112,.013,.155,.0035,.002),C.GOLD);
    add(cone(x,y,z,.155,.845,.112,.155,.89,.112,.013,.001),C.GOLD);
    add(box(x,y,z,.155,.53,.112,.042,.007,.011,.004),C.GOLD,.003);
    add(cyl(x,y,z,.155,.5,.112,.0085,.022),C.GOLD);
    add(sph(x,y,z,.155,.472,.112,.013),C.GOLD);
  }),
  r: PW((x,y,z)=>{ // БиМО
    const X=abs(x);
    add(cone(X,y,z,.07,.17,0,.07,.25,0,.022,.022),C.BMO,.01);
    add(ell(X,y,z,.07,.18,.02,.035,.016,.05),C.BMO,.008);
    add(box(x,y,z,0,.47,0,.16,.215,.115,.035),C.BMO,.02);
    for(const mx of [-.105,0,.105]) for(const mz of [-.065,.065]) add(box(x,y,z,mx,.712,mz,.038,.035,.032,.008),C.BMO,.006);
    cut(box(x,y,z,0,.53,.12,.115,.08,.02,.018),C.BMO_SCREEN,.004);
    add(ell(X,y,z,.045,.553,.102,.011,.014,.006),C.BLACK,.002);
    add(smileSDF(x,y,z,0,.516,.102,.03,.005,.2),C.BLACK,.002);
    add(box(x,y,z,-.075,.34,.118,.04,.011,.006,.003),C.YELLOW,.002);
    add(box(x,y,z,-.075,.34,.118,.011,.04,.006,.003),C.YELLOW,.002);
    add(sph(x,y,z,.08,.375,.108,.02),C.RED,.002);
    add(cone(x,y,z,.045,.31,.112,.045,.335,.112,.016,.001),C.BLUE,.002);
    add(sph(x,y,z,.112,.31,.108,.012),C.GREEN,.002);
    cut(box(x,y,z,-.02,.275,.12,.055,.004,.01,.002),C.BLACK,.001);
    for(const sx of [-1,1]) cut(box(x,y,z,sx*.16,.47,0,.004,.15,.06,.002),-1,.002);
    add(tube(x,y,z,BMO_AR[0],BMO_AR[1]),C.BMO,.008); add(sph(x,y,z,.24,.61,.05,.019),C.BMO,.006);
    add(tube(x,y,z,BMO_AL[0],BMO_AL[1]),C.BMO,.008); add(sph(x,y,z,-.215,.34,.05,.019),C.BMO,.006);
  }),
  q: PW((x,y,z)=>{ // Принцесса Бубльгум
    const X=abs(x), r=rad(x,z), th=atan2(x,z);
    let g = rev(x,y,z,0,0,GOWN,.004); g += .005*sin(th*9)*sat((.5-y)*6);
    g = smax(g, abs(z)-.078-max(0,.53-y)*3, .02);
    add(g,C.PB_DRESS,.01);
    paint(max(max(y-.205, .179-y), .215-r), C.GOLD);
    add(smax(tor(x,y,z,0,.52,0,.098,.011), abs(z)-.085, .01),C.GOLD,.004);
    add(sph(X,y,z,.095,.64,0,.04),C.PB_DRESS,.015);
    add(tube(X,y,z,PB_ARM[0],PB_ARM[1]),C.PB_SKIN,.01); add(sph(X,y,z,.131,.485,.038,.017),C.PB_SKIN,.008);
    add(cyl(x,y,z,0,.7,0,.026,.03),C.PB_SKIN,.012);
    add(sph(x,y,z,0,.79,.012,.085),C.PB_SKIN,.015);
    let h = smin(ell(x,y,z,0,.81,-.03,.098,.1,.092), tube(x,y,z,PB_HAIR[0],PB_HAIR[1]), .04);
    h += .004*sin(atan2(x,z+.1)*16)*sat((.86-y)*8);
    add(h,C.PB_HAIR,.012);
    add(ell(x,y,z,0,.86,.035,.08,.035,.055,rot(-.2,0,0)),C.PB_HAIR,.02);
    add(tube(X,y,z,PB_LOCK[0],PB_LOCK[1]),C.PB_HAIR,.012);
    cut(ell(X,y,z,.03,.795,.088,.0095,.012,.007),C.BLACK,.002);
    paint(sph(X,y,z,.027,.8,.094,.0035),C.WHITE);
    cut(smileSDF(x,y,z,0,.765,.093,.02,.0045,.2),C.BLACK,.002);
    add(tor(x,y,z,0,.905,0,.045,.009),C.GOLD,.004);
    for(let i=0;i<5;i++){ const a=i/5*PI*2; add(cone(x,y,z,sin(a)*.045,.905,cos(a)*.045,sin(a)*.05,.965,cos(a)*.05,.012,.003),C.GOLD,.003); add(sph(x,y,z,sin(a)*.05,.968,cos(a)*.05,.007),C.GOLD,.002); }
    add(sph(x,y,z,0,.915,.05,.014),C.GEM_BLUE,.003);
  }),
  k: PW((x,y,z)=>{ // Ледяной король
    const X=abs(x), r=rad(x,z), th=atan2(x,z);
    let g = rev(x,y,z,0,0,ROBE,.004); g += .005*sin(th*8)*sat((.55-y)*5);
    add(g,C.IK_ROBE,.01);
    paint(max(max(y-.205, .179-y), .215-r), C.GOLD);
    add(ell(x,y,z,0,.8,0,.16,.065,.12),C.IK_ROBE,.04);
    add(cone(X,y,z,.14,.77,0,.2,.58,.06,.05,.065),C.IK_ROBE,.03);
    cut(sph(X,y,z,.205,.56,.07,.045),-1,.01);
    add(sph(X,y,z,.19,.55,.08,.034),C.IK_SKIN,.01);
    let bd = smin(ell(x,y,z,0,.83,.09,.115,.09,.075), tube(x,y,z,BEARD[0],BEARD[1]), .05);
    bd += .005*sin(x*80+y*12);
    add(bd,C.IK_BEARD,.012);
    add(ell(X,y,z,.045,.875,.1,.055,.018,.024,rot(0,0,-.35)),C.IK_BEARD,.01);
    add(sph(x,y,z,0,.94,0,.11),C.IK_SKIN,.03);
    add(cone(x,y,z,0,.93,.1,0,.865,.235,.03,.007),C.IK_SKIN,.012);
    cut(ell(X,y,z,.04,.955,.1,.011,.008,.008,rot(0,0,-.3)),C.BLACK,.002);
    add(cone(X,y,z,.08,.998,.09,.018,.975,.106,.012,.009),C.IK_BEARD,.004);
    add(cyl(x,y,z,0,1.0,0,.09,.024,.006),C.GOLD,.006);
    for(const a of [-.75,0,.75]){ const h=a===0?.16:.12; add(cone(x,y,z,sin(a)*.088,1.015,cos(a)*.088,sin(a)*.092,1.0+h,cos(a)*.092,.022,.003),C.GOLD,.003); add(sph(x,y,z,sin(a)*.093,1.04,cos(a)*.093,.015),C.GEM_RED,.003); }
    for(const a of [PI-.9,PI,PI+.9,-1.6,1.6]) add(cone(x,y,z,sin(a)*.088,1.015,cos(a)*.088,sin(a)*.09,1.085,cos(a)*.09,.018,.003),C.GOLD,.003);
  }),
};

/* ================= РИК И МОРТИ ================= */
const MORTY_T = makeRev(.33,.53,y=>.1+.01*sin((y-.33)/.2*PI)-.025*Math.pow((y-.33)/.2,3));
const MORTY_A = curve([[.1,.5,0],[.13,.42,.02],[.13,.34,.04]],[.021,.02,.019],6);
const BIRD_BASE = makeRev(.175,.45,y=>.2-.09*Math.pow((y-.175)/.275,1.3));
const BIRD_NECK = curve([[0,.44,-.025],[0,.56,-.04],[0,.68,-.005],[0,.77,.06]],[.085,.08,.075,.07],10);
const BIRD_BEAK = curve([[0,.845,.165],[0,.838,.25],[0,.815,.32],[0,.78,.355]],[.042,.032,.016,.004],10);
const BIRD_CREST = [-2,-1,0,1,2].map(i=>{ const s=i*.025; return curve([[s,.88,-.01],[s*1.8,.945,-.12],[s*2.4,.965-abs(i)*.012,-.23+abs(i)*.02]],[.026,.016,.004],8); });
const MEES = makeRev(.34,.64,y=>.062+.016*sin((y-.34)/.3*PI));
const MEES_A = curve([[.06,.6,0],[.13,.66,.02],[.19,.77,.04],[.21,.86,.05]],[.019,.018,.018,.017],8);
const TOWER = makeRev(.175,.56,y=> y<.2 ? .225 : y<.47 ? .2-.018*((y-.2)/.27) : y<.5 ? .182+.043*((y-.47)/.03) : .225, 48);
const PICKLE_BUMPS = Array.from({length:24},(_,i)=>{ const a=i*2.39996; return [sin(a)*.106, .5+(i%8)*.05+(i%3)*.012, cos(a)*.106]; });
const SUM_LOW = makeRev(.175,.5,y=>.105+.1*Math.pow((.5-y)/.325,1.5), 40);
const SUM_TOP = makeRev(.48,.77,y=> y<.6 ? .1+.018*((y-.48)/.12) : y<.7 ? .118+.004*sin((y-.6)/.1*PI) : .118-.085*Math.pow((y-.7)/.07,.7));
const SUM_A = curve([[.105,.68,0],[.14,.6,.03],[.15,.51,.05]],[.019,.018,.017],6);
const PONY = curve([[0,.93,-.08],[0,.95,-.15],[0,.88,-.2],[0,.76,-.19],[0,.66,-.15]],[.035,.04,.035,.025,.01],12);
const COAT = makeRev(.3,.83,y=>.24-.09*Math.pow((y-.3)/.53,.8), 40);
const RICK_AR = curve([[.15,.76,0],[.22,.63,.06],[.245,.56,.12]],[.033,.032,.031],6);
const RICK_AL = curve([[-.15,.76,0],[-.21,.6,.04],[-.21,.5,.07]],[.033,.032,.031],6);
const RICK_SPIKES = Array.from({length:11},(_,i)=>{ const th=-PI*.55+i*(PI*1.1/10); let dx=sin(th),dy=cos(th),dz=-.5; const l=Math.hypot(dx,dy,dz); return [dx/l,dy/l,dz/l]; })
  .concat([[0,.35,-.94],[.4,.2,-.89],[-.4,.2,-.89]]);

const RM = {
  p: PB((x,y,z)=>{ // Морти
    const X=abs(x);
    add(ell(X,y,z,.045,.198,.03,.04,.026,.06),C.WHITE,.012);
    add(cone(X,y,z,.045,.2,0,.045,.32,0,.034,.036),C.MORTY_PANTS,.012);
    add(ell(x,y,z,0,.335,0,.098,.045,.072),C.MORTY_PANTS,.02);
    add(rev(x,y,z,0,0,MORTY_T,.004),C.MORTY_SHIRT,.02);
    cut(tor(x,y,z,0,.345,0,.1,.0035),-1,.002);
    add(tube(X,y,z,MORTY_A[0],MORTY_A[1]),C.SKIN,.01); add(sph(X,y,z,.13,.335,.04,.025),C.SKIN,.008);
    paint(max(band(y,.455,.515), .09-X), C.MORTY_SHIRT);
    add(cyl(x,y,z,0,.545,0,.03,.03),C.SKIN,.015);
    add(ell(x,y,z,0,.665,0,.132,.135,.125),C.SKIN,.02);
    add(ell(X,y,z,.13,.66,0,.022,.03,.018),C.SKIN,.01);
    let h = ell(x,y,z,0,.712,-.025,.138,.11,.13);
    h = smax(h, z-.06-(y-.72)*1.1, .012);
    h += .005*sin(atan2(x,z)*11)*sat((y-.66)*12);
    add(h,C.MORTY_HAIR,.006);
    add(ell(X,y,z,.045,.68,.113,.033,.035,.017),C.WHITE,.004);
    paint(sph(X,y,z,.045,.68,.131,.0075),C.BLACK);
    cut(box(x,y,z,0,.6,.123,.022,.003,.02,.002),C.BLACK,.002);
  }),
  n: PB((x,y,z)=>{ // Птичья личность
    const X=abs(x);
    add(rev(x,y,z,0,-.02,BIRD_BASE,.004),C.ARMOR,.02);
    add(tor(x,y,z,0,.3,-.02,.168,.009),C.SILVER,.004);
    add(tor(x,y,z,0,.43,-.02,.113,.012),C.SILVER,.004);
    add(ell(X,y,z,.12,.44,-.02,.055,.035,.065),C.SILVER,.012);
    let nk = tube(x,y,z,BIRD_NECK[0],BIRD_NECK[1]); nk += .0035*sin(y*95)*sat((y-.48)*8);
    add(nk,C.BIRD,.03);
    let rf = tor(x,y,z,0,.6,-.02,.075,.028,rot(-.25,0,0)); rf += .006*sin(atan2(x,z+.02)*12);
    add(rf,C.BIRD_LIGHT,.015);
    add(ell(x,y,z,0,.82,.07,.09,.09,.115),C.BIRD,.03);
    add(ell(X,y,z,.06,.8,.1,.035,.04,.05),C.BIRD_LIGHT,.02);
    add(tube(x,y,z,BIRD_BEAK[0],BIRD_BEAK[1]),C.BEAK,.012);
    add(cone(x,y,z,0,.792,.16,0,.783,.27,.026,.006),C.BEAK,.01);
    add(ell(X,y,z,.058,.855,.138,.02,.015,.012),C.WHITE,.003);
    paint(sph(X,y,z,.06,.855,.149,.006),C.BLACK);
    add(cone(X,y,z,.085,.885,.115,.03,.872,.16,.014,.011),C.BIRD,.008);
    for(const c of BIRD_CREST) add(tube(x,y,z,c[0],c[1]),C.BIRD,.015);
    paint(max(-(z+.12), .9-y), C.BIRD_LIGHT);   // светлые кончики гребня
  }),
  b: PB((x,y,z)=>{ // Мистер Мисикс
    const X=abs(x);
    add(ell(X,y,z,.04,.195,.03,.035,.02,.05),C.MEES,.01);
    add(cone(X,y,z,.04,.2,0,.04,.37,0,.022,.024),C.MEES,.01);
    add(rev(x,y,z,0,0,MEES,.003),C.MEES,.02);
    add(ell(x,y,z,0,.8,0,.105,.15,.105),C.MEES,.03);
    add(ell(X,y,z,.04,.845,.091,.028,.034,.015),C.WHITE,.004);
    paint(sph(X,y,z,.04,.845,.106,.0075),C.BLACK);
    cut(ell(x,y,z,0,.735,.095,.048,.03,.035),C.BLACK,.006);
    add(ell(x,y,z,0,.715,.088,.026,.01,.02),C.RED,.004);
    add(cone(x,y,z,-.015,.945,0,-.03,1.0,.008,.007,.004),C.MEES,.004);
    add(cone(x,y,z,.015,.945,0,.025,1.005,0,.007,.004),C.MEES,.004);
    add(tube(X,y,z,MEES_A[0],MEES_A[1]),C.MEES,.012); add(sph(X,y,z,.212,.875,.05,.025),C.MEES,.008);
  }),
  r: PB((x,y,z)=>{ // Огурчик Рик в башне
    const r=rad(x,z);
    add(rev(x,y,z,0,0,TOWER,.004),C.STONE);
    for(let i=0;i<6;i++){ const a=i/6*PI*2; add(box(x,y,z,sin(a)*.19,.6,cos(a)*.19,.045,.04,.035,.006,rot(0,a,0)),C.STONE,.005); }
    cut(cyl(x,y,z,0,.62,0,.15,.06),-1,.006);
    for(const yy of [.27,.36,.44]) cut(tor(x,y,z,0,yy,0,.2-.018*((yy-.2)/.27),.0035),-1,.002);
    cut(box(x,y,z,0,.33,.2,.016,.045,.04,.008),C.BLACK,.003);
    paint(max(abs(y-.53)-.027, .195-r), C.SILVER);
    let p = cone(x,y,z,0,.44,0,.015,.92,0,.108,.1);
    let bump = 1e9; for(const b of PICKLE_BUMPS) bump = min(bump, sph(x,y,z,b[0],b[1],b[2],.013));
    add(p,C.PICKLE,.02); add(bump,C.PICKLE_DARK,.006);
    add(ell(abs(x-.004),y,z,.042,.82,.098,.032,.036,.016),C.WHITE,.004);
    paint(sph(abs(x-.004),y,z,.042,.818,.113,.0075),C.BLACK);
    add(box(x,y,z,.005,.872,.104,.07,.011,.014,.006),C.PICKLE_DARK,.006);
    cut(box(x,y,z,.003,.74,.105,.05,.02,.03,.01),C.BLACK,.004);
    add(box(x,y,z,.003,.742,.09,.045,.013,.02,.004),C.WHITE);
    cut(box(x,y,z,.003,.742,.111,.045,.0015,.01),C.BLACK,.001);
  }),
  q: PB((x,y,z)=>{ // Саммер
    const X=abs(x), th=atan2(x,z);
    let lo = rev(x,y,z,0,0,SUM_LOW,.004); lo += .004*sin(th*8)*sat((.45-y)*6);
    add(lo,C.DENIM,.01);
    add(tor(x,y,z,0,.5,0,.104,.01),C.SILVER,.004);
    add(smax(rev(x,y,z,0,0,SUM_TOP,.004), abs(z)-.085, .03),C.SUM_TOP,.02);
    add(cone(X,y,z,.04,.7,.0,.09,.71,.0,.012,.012),C.SUM_TOP,.006);
    add(tube(X,y,z,SUM_A[0],SUM_A[1]),C.SKIN,.01); add(sph(X,y,z,.15,.5,.05,.022),C.SKIN,.008);
    add(cyl(x,y,z,0,.765,0,.028,.035),C.SKIN,.015);
    add(sph(x,y,z,0,.84,.01,.092),C.SKIN,.015);
    add(ell(x,y,z,0,.86,-.028,.1,.105,.098),C.SUM_HAIR,.015);
    add(ell(x,y,z,0,.905,.045,.078,.03,.05,rot(-.25,0,0)),C.SUM_HAIR,.02);
    let pt = tube(x,y,z,PONY[0],PONY[1]); pt += .003*sin(atan2(x,z+.15)*14);
    add(pt,C.SUM_HAIR,.015);
    add(tor(x,y,z,0,.935,-.085,.028,.008,rot(PI/2-.3,0,0)),C.SILVER,.003);
    add(ell(X,y,z,.038,.85,.083,.03,.033,.015),C.WHITE,.004);
    paint(sph(X,y,z,.038,.85,.097,.007),C.BLACK);
    cut(smileSDF(x,y,z,0,.8,.093,.022,.005,.2),C.BLACK,.002);
    add(smax(tor(x,y,z,0,.925,.0,.083,.008,rot(-.35,0,0)), -z, .01),C.SILVER,.004);
    for(let i=-2;i<=2;i++){ const a=i*.35, h=i===0?.05:.03-abs(i)*.004; add(cone(x,y,z,sin(a)*.08,.945,cos(a)*.075,sin(a)*.082,.945+h,cos(a)*.074,.01,.002),C.SILVER,.003); }
    add(sph(x,y,z,0,.95,.078,.012),C.GLOW,.003);
  }),
  k: PB((x,y,z)=>{ // Рик
    const X=abs(x), th=atan2(x,z);
    add(ell(X,y,z,.055,.198,.03,.045,.028,.068),C.SHOE_BROWN,.012);
    add(cone(X,y,z,.055,.2,0,.055,.37,0,.038,.038),C.RICK_PANTS,.012);
    let coat = rev(x,y,z,0,0,COAT,.004); coat += .004*sin(th*6)*sat((.5-y)*5);
    add(coat,C.COAT,.02);
    cut(box(x,y,z,0,.55,.2,.028,.3,.1,.01),-1,.006);
    add(ell(x,y,z,0,.62,.03,.105,.25,.115),C.RICK_SHIRT,.01);
    add(box(X,y,z,.055,.72,.15,.03,.08,.007,.004,rot(0,-.45,0)),C.COAT,.006);
    cut(box(x,y,z,-.11,.6,.2,.035,.004,.05,.002,rot(0,.4,0)),-1,.002);
    add(cyl(x,y,z,-.1,.625,.185,.006,.03),C.SILVER); add(cyl(x,y,z,-.115,.62,.178,.006,.025),C.SILVER);
    add(cyl(x,y,z,0,.86,0,.033,.04),C.SKIN,.015);
    add(ell(x,y,z,0,.965,.01,.1,.125,.1),C.SKIN,.015);
    for(const s of RICK_SPIKES) add(cone(x,y,z,s[0]*.07,1.0+s[1]*.07,-.03+s[2]*.07,s[0]*.235,1.0+s[1]*.215,-.03+s[2]*.235,.046,.004),C.RICK_HAIR,.012);
    add(box(x,y,z,0,1.005,.094,.074,.013,.016,.007),C.RICK_HAIR,.005);
    add(ell(X,y,z,.042,.97,.088,.031,.029,.015),C.WHITE,.004);
    paint(sph(X,y,z,.042,.97,.101,.0065),C.BLACK);
    cut(box(x,y,z,0,.903,.1,.04,.0035,.02,.002),C.BLACK,.002);
    add(cone(x,y,z,.03,.9,.1,.036,.845,.11,.006,.004),C.GLOW,.003);
    add(tube(x,y,z,RICK_AR[0],RICK_AR[1]),C.COAT,.012); add(sph(x,y,z,.245,.55,.13,.033),C.SKIN,.008);
    add(box(x,y,z,.245,.585,.195,.024,.032,.065,.012),C.STEEL,.006);
    add(cone(x,y,z,.245,.625,.15,.245,.625,.24,.015,.015),C.GLOW,.004);
    add(sph(x,y,z,.245,.578,.27,.021),C.STEEL,.004);
    add(sph(x,y,z,.245,.578,.287,.012),C.GLOW,.002);
    add(tube(x,y,z,RICK_AL[0],RICK_AL[1]),C.COAT,.012); add(sph(x,y,z,-.21,.49,.07,.033),C.SKIN,.008);
  }),
};
module.exports = { AT, RM, PALETTE };
