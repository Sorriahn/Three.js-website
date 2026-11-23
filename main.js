let DATA;
 
const $ = s => document.querySelector(s);
if (!window.THREE) {
  $('#loading').textContent = 'Could not load Three.js. Check your connection and reload.';
  throw new Error('THREE missing');
}
 
// seeded random so the board looks the same every load
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rand = mulberry32(1987);
 
// ---------------- textures drawn on <canvas> ----------------
function woodTexture(){
  const c=document.createElement('canvas'); c.width=2048; c.height=1280;
  const g=c.getContext('2d');
  const planks=7, ph=c.height/planks;
  for(let p=0;p<planks;p++){
    const y0=p*ph, shade=rand()*22-11;
    g.fillStyle=`rgb(${120+shade},${80+shade*.8},${48+shade*.5})`;
    g.fillRect(0,y0,c.width,ph);
    for(let i=0;i<70;i++){                         // grain lines
      const y=y0+rand()*ph, amp=2+rand()*6, freq=.002+rand()*.004, ph0=rand()*10;
      g.strokeStyle=`rgba(${rand()<.5?60:170},${rand()<.5?35:115},${rand()<.5?15:70},${.08+rand()*.12})`;
      g.lineWidth=.6+rand()*2.2;
      g.beginPath();
      for(let x=0;x<=c.width;x+=16){const yy=y+Math.sin(x*freq+ph0)*amp; x?g.lineTo(x,yy):g.moveTo(x,yy);}
      g.stroke();
    }
    for(let k=0;k<2;k++){                          // knots
      const kx=rand()*c.width, ky=y0+ph*(.3+rand()*.4);
      for(let r=22;r>3;r-=4){g.strokeStyle=`rgba(60,32,14,${.12+(22-r)*.012})`;g.lineWidth=2;g.beginPath();g.ellipse(kx,ky,r*2.2,r*.7,0,0,7);g.stroke();}
    }
    g.fillStyle='rgba(25,12,4,.75)'; g.fillRect(0,y0,c.width,4);   // seam
    g.fillStyle='rgba(255,220,170,.06)'; g.fillRect(0,y0+4,c.width,3);
  }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t;
}
 
function fitFont(g,text,max,size,family){ do{g.font=`${size}px ${family}`;size-=1;}while(g.measureText(text).width>max&&size>10); }
function photoCanvas(n){
  const c=document.createElement('canvas'); c.width=512; c.height=620; const g=c.getContext('2d');
  g.fillStyle='#f3eee2'; g.fillRect(0,0,512,620);
  const ix=30,iy=30,iw=452,ih=452;
  const grd=g.createLinearGradient(0,iy,0,iy+ih); grd.addColorStop(0,'#d2ba92'); grd.addColorStop(1,'#93734d');
  g.fillStyle=grd; g.fillRect(ix,iy,iw,ih);
  g.save(); g.beginPath(); g.rect(ix,iy,iw,ih); g.clip(); g.translate(ix,iy);
  for(let i=0;i<4000;i++){g.fillStyle=rand()<.5?'rgba(0,0,0,.07)':'rgba(255,240,210,.07)'; g.fillRect(rand()*iw,rand()*ih,1.6,1.6);}
  const v=g.createRadialGradient(iw/2,ih/2,ih*.25,iw/2,ih/2,ih*.78); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(45,22,6,.6)');
  g.fillStyle=v; g.fillRect(0,0,iw,ih); g.restore();
  g.fillStyle='#2a1d12'; g.textAlign='center';
  fitFont(g,n.title,450,34,'"Permanent Marker", cursive'); g.fillText(n.title,256,532);
  if(n.label){ g.fillStyle='#7a5c3c'; fitFont(g,n.label.toUpperCase(),440,17,'"Special Elite", monospace'); g.fillText(n.label.toUpperCase(),256,572); }
  const age=g.createLinearGradient(0,0,512,620); age.addColorStop(0,'rgba(140,100,40,.10)'); age.addColorStop(1,'rgba(140,100,40,.0)');
  g.fillStyle=age; g.fillRect(0,0,512,620);
  return c;
}
 
// ---------------- scene ----------------
const host=$('#scene');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
 
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0d0b09);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,100);
function fitDistance(){ const t=Math.tan(THREE.MathUtils.degToRad(20))*2; return Math.max(12/t,(19/camera.aspect)/t); }
camera.position.set(0,0,fitDistance());
 
// how far past "whole board fits on screen"
const MAX_ZOOM_OUT=1.4;
let controls=null;
if(THREE.OrbitControls){
  controls=new THREE.OrbitControls(camera,renderer.domElement);
  Object.assign(controls,{enableDamping:true,dampingFactor:.08,enablePan:true,screenSpacePanning:true,enableZoom:false,
    minDistance:4,maxDistance:fitDistance()*MAX_ZOOM_OUT,
    minAzimuthAngle:-.5,maxAzimuthAngle:.5,minPolarAngle:Math.PI/2-.4,maxPolarAngle:Math.PI/2+.4,rotateSpeed:.5});
}
 
scene.add(new THREE.HemisphereLight(0xfff1dd,0x221408,.55));
const spot=new THREE.SpotLight(0xffd6a0,1.5,45,.75,.65,1);
spot.position.set(-2,7,13); spot.target.position.set(0,0,0);
spot.castShadow=true; spot.shadow.mapSize.set(2048,2048); spot.shadow.bias=-.0004;
scene.add(spot,spot.target);
const fill=new THREE.PointLight(0x8fa6c8,.25,40); fill.position.set(9,-5,8); scene.add(fill);
 
// board + frame + wall
const W=17,H=10.5;
const woodMap=woodTexture();
const board=new THREE.Mesh(new THREE.BoxGeometry(W,H,.4),new THREE.MeshStandardMaterial({map:woodMap,roughness:.85}));
board.position.z=-.2; board.receiveShadow=true; scene.add(board);
const frameMat=new THREE.MeshStandardMaterial({map:woodMap,color:0x6a4426,roughness:.7});
[[0,H/2+.25,W+1,.5],[0,-H/2-.25,W+1,.5],[W/2+.25,0,.5,H],[-W/2-.25,0,.5,H]].forEach(([x,y,w,h])=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.7),frameMat); m.position.set(x,y,-.05); m.castShadow=m.receiveShadow=true; scene.add(m);
});
const wall=new THREE.Mesh(new THREE.PlaneGeometry(80,50),new THREE.MeshStandardMaterial({color:0x2a2420,roughness:1}));
wall.position.z=-.6; wall.receiveShadow=true; scene.add(wall);
 
// ---------------- photos ----------------
const pickables=[], photos={}, strings=[];
const PW=2.0, PH=PW*620/512;
const pinMat=new THREE.MeshStandardMaterial({color:0xc4161c,roughness:.35,metalness:.1});
const needleMat=new THREE.MeshStandardMaterial({color:0xcccccc,metalness:.8,roughness:.3});
 
// Photo looks
function curledPhotoGeometry(){
  const geo=new THREE.PlaneGeometry(PW,PH,12,14);
  const pos=geo.attributes.position;
  // kept small so the highest point (lift + curl ≈ 0.19) stays below the strings (z ≈ 0.24)
  const lift=.05+rand()*.06;                 // how far the bottom edge leaves the board
  const curl=.03+rand()*.05;                 // corner curl amount
  const side=rand()<.5?-1:1;                 // which bottom corner curls
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), y=pos.getY(i);
    const t=(PH/2-y)/PH;                     // 0 at the top (pin) → 1 at the bottom
    const u=(x*side+PW/2)/PW;                // 0 → 1 toward the curling corner
    const corner=Math.max(0,t+u-1.25)/.75;   // only the corner triangle
    pos.setZ(i,lift*t*t+curl*corner*corner);
  }
  geo.computeVertexNormals();
  return geo;
}
 
function buildPhotos(){
  DATA.nodes.forEach(n=>{
    const canvas=photoCanvas(n); n.thumb=canvas.toDataURL('image/jpeg',.85);
    const tex=new THREE.CanvasTexture(canvas); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=8;
    const group=new THREE.Group();
    group.position.set(n.x,n.y,.06); group.rotation.z=(rand()-.5)*.16;
    const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.9,side:THREE.DoubleSide,
      emissive:0xffcf7a,emissiveMap:tex,emissiveIntensity:0});   // emissiveMap = the photo itself, so it brightens the picture instead of washing it out
    const mesh=new THREE.Mesh(curledPhotoGeometry(),mat);
    mesh.castShadow=true; mesh.userData={kind:'node',id:n.id}; group.add(mesh);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.12,20,14),pinMat); head.position.set(0,PH/2-.18,.2); head.castShadow=true;
    const needle=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.22,8),needleMat); needle.rotation.x=Math.PI/2; needle.position.set(0,PH/2-.18,.09);
    group.add(head,needle); scene.add(group);
    group.updateMatrixWorld(true);
    photos[n.id]={n,group,mesh,mat,head,glowNow:0,targetGlow:0};
    pickables.push(mesh);
  });
}
 
const STRING_RED=new THREE.Color(0xa8141a), STRING_HOT=new THREE.Color(0xff3434), STRING_DIM=new THREE.Color(0x4a1416);
function buildStrings(){
  DATA.links.forEach((l,i)=>{
    l.id='link'+i;
    const a=new THREE.Vector3(), b=new THREE.Vector3();
    photos[l.from].head.getWorldPosition(a); photos[l.to].head.getWorldPosition(b);
    a.z=b.z=.24;
    const mid=a.clone().lerp(b,.5); mid.y-=a.distanceTo(b)*.07; mid.z+=.08;
    const curve=new THREE.QuadraticBezierCurve3(a,mid,b);
    const mat=new THREE.MeshStandardMaterial({color:STRING_RED.clone(),roughness:.6,emissive:0x000000});
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.028,6),mat); tube.castShadow=true; scene.add(tube);
    const hit=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.2,6),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    hit.userData={kind:'link',id:l.id}; scene.add(hit); pickables.push(hit);
    strings.push({l,tube,mat});
  });
}
 
// ---------------- interaction ----------------
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
let hovered=null, selected=null, downAt=null;
 
function pick(e){
  const r=renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(pickables,false);
  // prefer photos over strings when both are under the cursor
  const node=hits.find(h=>h.object.userData.kind==='node');
  return (node||hits[0]||{}).object?.userData||null;
}
function same(a,b){return a&&b&&a.kind===b.kind&&a.id===b.id}
 
function refreshVisuals(){
  const selNode=selected?.kind==='node'?selected.id:null;
  const selLink=selected?.kind==='link'?selected.id:null;
  strings.forEach(s=>{
    const touches=selNode&&(s.l.from===selNode||s.l.to===selNode);
    const isHover=hovered?.kind==='link'&&hovered.id===s.l.id;
    const isSel=selLink===s.l.id;
    let c=STRING_RED;
    if(selected) c=(touches||isSel)?STRING_HOT:STRING_DIM;
    if(isHover) c=STRING_HOT;
    s.mat.color.copy(c);
    s.mat.emissive.setHex((isHover||isSel||touches)?0x3a0505:0x000000);
  });
  Object.values(photos).forEach(p=>{
    const lit=(hovered?.kind==='node'&&hovered.id===p.n.id)||selNode===p.n.id||
      (selLink&&DATA.links.find(l=>l.id===selLink&&(l.from===p.n.id||l.to===p.n.id)));
    p.targetGlow=lit?1:0;
  });
  renderer.domElement.style.cursor=hovered?'pointer':'grab';
}
 
renderer.domElement.addEventListener('pointermove',e=>{
  if(e.buttons) return;
  const h=pick(e); if(!same(h,hovered)&&(h||hovered)){hovered=h;refreshVisuals();}
});
renderer.domElement.addEventListener('pointerdown',e=>{downAt=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!downAt||e.button!==0){downAt=null;return;}
  const moved=Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1]); downAt=null;
  if(moved>6) return;
  const h=pick(e); if(!h) return;
  const origin={x:e.clientX,y:e.clientY};
  h.kind==='node'?openNode(h.id,origin):openLink(h.id,origin);
});
 
// ---------------- zoom toward the cursor ----------------
// Find the point on the board under the cursor, then scale the camera's
// distance around that point. The spot you point at stays under the cursor.
const boardPlane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
function boardPointAt(e){
  const r=renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  ray.setFromCamera(ndc,camera);
  return ray.ray.intersectPlane(boardPlane,new THREE.Vector3());
}
// Keep the view on the board: the further out you are, the closer to center the target must be.
function clampView(){
  if(!controls) return;
  const dist=camera.position.distanceTo(controls.target);
  const t=THREE.MathUtils.clamp((dist-controls.minDistance)/(controls.maxDistance-controls.minDistance),0,1);
  const room=1-t;
  const before=controls.target.clone();
  controls.target.x=THREE.MathUtils.clamp(controls.target.x,-W/2*room,W/2*room);
  controls.target.y=THREE.MathUtils.clamp(controls.target.y,-H/2*room,H/2*room);
  controls.target.z=0;
  camera.position.add(controls.target.clone().sub(before));
}
renderer.domElement.addEventListener('wheel',e=>{
  if(!controls) return;
  e.preventDefault();
  const dy=e.deltaY*(e.deltaMode===1?33:1);
  const P=boardPointAt(e)||controls.target.clone();
  const dist=camera.position.distanceTo(controls.target);
  const want=THREE.MathUtils.clamp(dist*Math.exp(dy*.0015),controls.minDistance,controls.maxDistance);
  const k=want/dist;
  camera.position.sub(P).multiplyScalar(k).add(P);
  controls.target.sub(P).multiplyScalar(k).add(P);
  clampView();
},{passive:false});
 
// ---------------- floating window ----------------
const win=$('#win'), wbody=$('#win-body'), wtitle=$('#win-title'), dock=$('#dock');
const nodeById=id=>DATA.nodes.find(n=>n.id===id), linkById=id=>DATA.links.find(l=>l.id===id);
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fileName=s=>s.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,24)+'.TXT';
// optional pieces: each returns '' when the field is empty
const para=t=>t?`<p>${esc(t)}</p>`:'';
const sourceList=a=>a&&a.length?`<h3>Sources</h3><ul class="sources">${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
const linkName=l=>l.title||`${nodeById(l.from).title} ⟷ ${nodeById(l.to).title}`;
let placed=false, last=null;
 
function openNode(id,origin){
  const n=nodeById(id), i=DATA.nodes.indexOf(n); selected={kind:'node',id}; last=selected;
  const links=DATA.links.filter(l=>l.from===id||l.to===id);
  showWin(`EVIDENCE / ${fileName(n.title)}`,`
    <div class="kicker">Evidence${n.label?' · '+esc(n.label):''}</div>
    <h2>${esc(n.title)}</h2>
    <div class="thumb"><img alt="" src="${n.thumb}"></div>
    ${para(n.text)}
    <h3>Connected to</h3>
    ${links.map(l=>{const o=nodeById(l.from===id?l.to:l.from);return `<button class="chip bevel" data-link="${l.id}">⟶ ${esc(o.title)}${l.title?`<br><small>${esc(l.title)}</small>`:''}</button>`}).join('')}
    ${sourceList(n.sources)}`,
    `EVIDENCE ${i+1} OF ${DATA.nodes.length}`,`${links.length} CONNECTIONS`,origin);
}
function openLink(id,origin){
  const l=linkById(id), a=nodeById(l.from), b=nodeById(l.to), i=DATA.links.indexOf(l); selected={kind:'link',id}; last=selected;
  showWin(`CONNECTION / ${fileName(l.title||a.id+'_'+b.id)}`,`
    <div class="kicker">Connection</div>
    <h2>${esc(linkName(l))}</h2>
    <div class="linkpair"><button class="chip bevel" data-node="${a.id}">${esc(a.title)}</button><span>⟷</span><button class="chip bevel" data-node="${b.id}">${esc(b.title)}</button></div>
    ${para(l.text)}
    ${sourceList(l.sources)}`,
    `CONNECTION ${i+1} OF ${DATA.links.length}`,'2 ITEMS LINKED',origin);
}
function setOrigin(x,y){
  const r=win.getBoundingClientRect(), s=r.width/win.offsetWidth||1;   // undo the closed-state scale
  const left=win.classList.contains('max')?0:win.offsetLeft, top=win.classList.contains('max')?0:win.offsetTop;
  win.style.setProperty('--ox',(x-left)+'px'); win.style.setProperty('--oy',(y-top)+'px');
}
function placeWin(){
  if(placed) return; placed=true;
  const w=win.offsetWidth, h=win.offsetHeight, wide=innerWidth>820;
  win.style.left=Math.round(wide?innerWidth-w-36:(innerWidth-w)/2)+'px';
  win.style.top=Math.round(wide?78:(innerHeight-h)/2)+'px';
}
function showWin(title,html,statusL,statusR,origin){
  placeWin();
  const wasOpen=win.classList.contains('open');
  if(!wasOpen&&origin) setOrigin(origin.x,origin.y);
  wtitle.textContent=title;
  wbody.innerHTML=`<div class="inner">${html}</div>`; wbody.scrollTop=0;
  $('#status-l').textContent=statusL; $('#status-r').textContent=statusR;
  win.classList.add('open'); win.setAttribute('aria-hidden','false');
  dock.hidden=true; refreshVisuals();
}
function minimize(){
  if(!win.classList.contains('open')) return;
  dock.textContent='▣ '+wtitle.textContent; dock.hidden=false;
  const d=dock.getBoundingClientRect(); setOrigin(d.left+d.width/2,d.top+d.height/2);
  win.classList.remove('open'); win.setAttribute('aria-hidden','true');
  selected=null; refreshVisuals();
}
function toggleMax(){
  win.classList.toggle('max');
  $('#btn-max').title=$('#btn-max').ariaLabel=win.classList.contains('max')?'Restore':'Maximize';
}
function restoreFromDock(){
  if(!last) return;
  const d=dock.getBoundingClientRect(), o={x:d.left+d.width/2,y:d.top+d.height/2};
  last.kind==='node'?openNode(last.id,o):openLink(last.id,o);
}
win.addEventListener('click',e=>{
  const t=e.target.closest('[data-link],[data-node]'); if(!t) return;
  t.dataset.link?openLink(t.dataset.link):openNode(t.dataset.node);
});
$('#btn-min').addEventListener('click',minimize);
$('#btn-max').addEventListener('click',toggleMax);
dock.addEventListener('click',restoreFromDock);
addEventListener('keydown',e=>{if(e.key==='Escape')minimize();});
 
// drag the window by its title bar (double-click the title bar to maximize)
const tb=$('#titlebar'); let drag=null;
tb.addEventListener('dblclick',e=>{if(!e.target.closest('button'))toggleMax();});
tb.addEventListener('pointerdown',e=>{
  if(e.target.closest('button')||win.classList.contains('max')) return;
  drag={dx:e.clientX-win.offsetLeft,dy:e.clientY-win.offsetTop}; tb.setPointerCapture(e.pointerId);
  win.style.transition='none';
});
tb.addEventListener('pointermove',e=>{
  if(!drag) return;
  const x=THREE.MathUtils.clamp(e.clientX-drag.dx,-win.offsetWidth+80,innerWidth-80);
  const y=THREE.MathUtils.clamp(e.clientY-drag.dy,0,innerHeight-40);
  win.style.left=x+'px'; win.style.top=y+'px';
});
const endDrag=()=>{ if(drag){drag=null; win.style.transition='';} };
tb.addEventListener('pointerup',endDrag); tb.addEventListener('pointercancel',endDrag);
 
// ---------------- loop ----------------
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);
  if(controls) controls.maxDistance=fitDistance()*MAX_ZOOM_OUT;
  if(placed){
    win.style.left=THREE.MathUtils.clamp(win.offsetLeft,-win.offsetWidth+80,innerWidth-80)+'px';
    win.style.top=THREE.MathUtils.clamp(win.offsetTop,0,innerHeight-40)+'px';
  }
});
function tick(){
  requestAnimationFrame(tick);
  Object.values(photos).forEach(p=>{
    p.glowNow+=(p.targetGlow-p.glowNow)*.18;          // fade the highlight in/out
    p.mat.emissiveIntensity=p.glowNow*.55;
  });
  if(controls){ controls.update(); clampView(); } else camera.lookAt(0,0,0);
  renderer.render(scene,camera);
}
 
// wait briefly for the handwriting fonts so they draw onto the photos
const fontsReady=document.fonts?Promise.all([document.fonts.load('34px "Permanent Marker"'),document.fonts.load('17px "Special Elite"')]):Promise.resolve();
Promise.all([
  fetch('data.json').then(r=>r.json()),
  Promise.race([fontsReady,new Promise(r=>setTimeout(r,2000))])
]).then(([data])=>{
  DATA=data;
  buildPhotos(); buildStrings(); refreshVisuals(); $('#loading').remove(); tick();
}).catch(err=>{
  console.error(err);
  $('#loading').textContent='Could not load data.json. Open the page through a local server, not by double-clicking the file.';
});
 