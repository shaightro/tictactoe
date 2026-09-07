"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { result, type Board, type Mark } from "@/lib/game";
type Props={board:Board;turn:Mark;onPlay:(i:number)=>void;disabled:boolean;cinematic:boolean;sound:boolean;round:number};
const CYAN=0x35ffe2,PINK=0xff339b;
export default function Arena(props:Props){
 const host=useRef<HTMLDivElement>(null),current=useRef(props),hover=useRef(-1);
 current.current=props;
 const buttons=useRef<(HTMLButtonElement|null)[]>([]);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const el=host.current!;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:false,alpha:true,powerPreference:"high-performance"});}catch{setFailed(true);return;}
  renderer.setClearColor(0x050812,1);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  el.insertBefore(renderer.domElement,el.firstChild);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(37,1,.1,100);
  const baseCamera=new THREE.Vector3(7.3,10.6,12.7);
  const target=new THREE.Vector3(0,.05,0);
  camera.position.copy(baseCamera);camera.lookAt(target);
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(600,500),.85,.55,.72);
  composer.addPass(bloom);composer.addPass(new OutputPass());
  scene.add(new THREE.AmbientLight(0x7f92ff,1.5));
  const key=new THREE.DirectionalLight(0xc1e7ff,5);key.position.set(4,9,5);scene.add(key);
  const lightX=new THREE.PointLight(CYAN,24,18);lightX.position.set(-4,3,1);scene.add(lightX);
  const lightO=new THREE.PointLight(PINK,30,18);lightO.position.set(4,2,-2);scene.add(lightO);
  const board=new THREE.Group();board.position.y=-.25;scene.add(board);

  const nebulaGeo=new THREE.PlaneGeometry(80,80);
  const nebulaMat=new THREE.ShaderMaterial({depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:`
   varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
   varying vec2 vUv; uniform float uTime;
   void main(){
    vec2 p=(vUv-.5)*3.; float d=length(p);
    float a=atan(p.y,p.x); float ribbon=sin(a*3.+d*13.-uTime*.14)*.5+.5;
    float haze=exp(-d*d*3.5);
    vec3 col=mix(vec3(.025,.13,.16),vec3(.13,.02,.14),smoothstep(-.7,.7,p.x));
    col*=haze*(.4+ribbon*.15);
    gl_FragColor=vec4(col+vec3(.007,.011,.025),1.);
   }`});
  const backdrop=new THREE.Mesh(nebulaGeo,nebulaMat);backdrop.position.set(0,-8,-12);backdrop.quaternion.copy(camera.quaternion);scene.add(backdrop);

  const tileGeo=new RoundedBoxGeometry(1.71,.26,1.71,3,.085);
  const tiles:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>[]=[];
  const outlines:THREE.LineSegments[]=[];
  const tilePositions:THREE.Vector3[]=[];
  const markGroup=new THREE.Group();board.add(markGroup);
  for(let i=0;i<9;i++){
   const material=new THREE.MeshStandardMaterial({color:0x102437,metalness:.75,roughness:.23,emissive:0x0c5264,emissiveIntensity:.1});
   const tile=new THREE.Mesh(tileGeo,material);
   tile.position.set((i%3-1)*1.89,0,(Math.floor(i/3)-1)*1.89);
   tilePositions.push(tile.position.clone());tiles.push(tile);board.add(tile);
   const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.68,.20,1.68)),new THREE.LineBasicMaterial({color:0x399aae,transparent:true,opacity:.65}));
   edge.position.y=-.04;tile.add(edge);outlines.push(edge);
   const strip=new THREE.Mesh(new THREE.BoxGeometry(1.25,.018,.025),new THREE.MeshBasicMaterial({color:i%2?PINK:CYAN,transparent:true,opacity:.75}));
   strip.position.set(0,-.14,.73);tile.add(strip);
  }
  const platform=new THREE.Mesh(new RoundedBoxGeometry(6.1,.19,6.1,3,.25),new THREE.MeshStandardMaterial({color:0x080e1c,metalness:.85,roughness:.35}));
  platform.position.y=-.65;board.add(platform);
  const platformEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6.07,.17,6.07)),new THREE.LineBasicMaterial({color:0x5381b1,transparent:true,opacity:.4}));
  platformEdge.position.y=-.65;board.add(platformEdge);
  const rings:THREE.Group[]=[];
  for(let r=0;r<4;r++){
   const group=new THREE.Group();group.position.y=-.8-r*.13;
   const radius=3.8+r*.22;
   for(let j=0;j<3;j++){
    const arc=new THREE.Mesh(new THREE.TorusGeometry(radius,r===0?.024:.014,6,70,1.55),new THREE.MeshBasicMaterial({color:r%2?PINK:CYAN,transparent:true,opacity:r===0?.85:.35}));
    arc.rotation.set(Math.PI/2,0,j*Math.PI*2/3);group.add(arc);
   }rings.push(group);board.add(group);
  }
  const ticks=new THREE.Group();ticks.position.y=-.85;board.add(ticks);
  for(let i=0;i<72;i++){const a=i/72*Math.PI*2;const tick=new THREE.Mesh(new THREE.BoxGeometry(.025,.012,i%6===0?.23:.09),new THREE.MeshBasicMaterial({color:i%18<9?CYAN:PINK,transparent:true,opacity:i%6===0?.65:.2}));tick.position.set(Math.sin(a)*4.72,0,Math.cos(a)*4.72);tick.rotation.y=a;ticks.add(tick);}
  const orbit=new THREE.Group();orbit.position.y=-1.12;board.add(orbit);
  const orbitalPath=new THREE.Mesh(new THREE.TorusGeometry(4.95,.012,6,180,Math.PI*1.6),new THREE.MeshBasicMaterial({color:0x3f5c89,transparent:true,opacity:.6}));orbitalPath.rotation.x=Math.PI/2;orbit.add(orbitalPath);
  for(let i=0;i<3;i++){const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.065,1),new THREE.MeshBasicMaterial({color:i%2?PINK:CYAN}));const a=i*2.1;orb.position.set(Math.sin(a)*4.95,0,Math.cos(a)*4.95);orbit.add(orb);}

  const count=1100,starPos=new Float32Array(count*3),starColors=new Float32Array(count*3);
  for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,r=3.2+Math.random()*16;starPos.set([Math.cos(a)*r,(Math.random()-.5)*16,Math.sin(a)*r-5],i*3);const c=new THREE.Color(i%3===0?PINK:i%3===1?CYAN:0x829eff);c.multiplyScalar(.45+Math.random()*.8);starColors.set(c.toArray(),i*3);}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute("position",new THREE.BufferAttribute(starPos,3));starGeo.setAttribute("color",new THREE.BufferAttribute(starColors,3));
  const starMaterial=new THREE.PointsMaterial({size:.026,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending});
  const stars=new THREE.Points(starGeo,starMaterial);scene.add(stars);

  type Piece={group:THREE.Group;mark:Mark;born:number;material:THREE.MeshStandardMaterial};
  const pieces=new Map<number,Piece>();
  type Burst={points:THREE.Points;vel:Float32Array;ring:THREE.Mesh;born:number;life:number};
  const bursts:Burst[]=[];
  const pointGeom=new THREE.Vector3();
  let winBeam:THREE.Group|null=null,lastWinner="",lastRound=current.current.round;
  let shake=0,audio:AudioContext|null=null,frame=0,lastTime=performance.now(),elapsed=0,hidden=document.hidden,lost=false,quality=true;
  const pointer={x:0,y:0};
  function disposeObject(object:THREE.Object3D){object.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.LineSegments||o instanceof THREE.Points){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});object.removeFromParent();}
  function tone(win=false,mark:Mark="X"){
   if(!current.current.sound||!audio)return;
   const notes=win?[523.25,659.25,783.99,1046.5]:[mark==="X"?520:390,mark==="X"?1040:780];
   notes.forEach((freq,i)=>{const osc=audio!.createOscillator(),gain=audio!.createGain(),t=audio!.currentTime+i*(win?.1:.035);osc.type="sine";osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(freq*.65,t+.24);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.055,t+.01);gain.gain.exponentialRampToValueAtTime(.0001,t+(win?.65:.25));osc.connect(gain);gain.connect(audio!.destination);osc.start(t);osc.stop(t+.75);osc.onended=()=>{osc.disconnect();gain.disconnect();};});
  }
  function unlock(){if(!current.current.sound)return;try{audio??=new AudioContext();void audio.resume().catch(()=>{});}catch{}}
  el.addEventListener("pointerdown",unlock);el.addEventListener("keydown",unlock);
  function burst(pos:THREE.Vector3,color:number,win=false){
   if(!current.current.cinematic)return;
   const n=win?440:80,positions=new Float32Array(n*3),vel=new Float32Array(n*3);
   for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=.5+Math.random()*(win?5:2);positions.set(pos.toArray(),i*3);vel.set([Math.cos(a)*s,.7+Math.random()*(win?5:3),Math.sin(a)*s],i*3);}
   const geom=new THREE.BufferGeometry();geom.setAttribute("position",new THREE.BufferAttribute(positions,3));
   const points=new THREE.Points(geom,new THREE.PointsMaterial({color,size:win?.048:.037,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending}));board.add(points);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.24,.018,6,60),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending}));ring.rotation.x=Math.PI/2;ring.position.copy(pos);board.add(ring);
   bursts.push({points,vel,ring,born:elapsed,life:win?2.7:1.05});shake=win?.14:.055;
  }
  function createPiece(i:number,mark:Mark){
   const color=mark==="X"?CYAN:PINK;
   const material=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.65,metalness:.5,roughness:.18});
   const group=new THREE.Group();group.position.copy(tilePositions[i]);group.position.y=.4;
   if(mark==="O"){
    const m=new THREE.Mesh(new THREE.TorusGeometry(.49,.105,16,72),material);m.rotation.x=Math.PI/2;group.add(m);
    const outer=new THREE.Mesh(new THREE.TorusGeometry(.62,.012,6,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.55}));outer.rotation.x=Math.PI/2;group.add(outer);
   }else{
    for(const angle of [-Math.PI/4,Math.PI/4]){const m=new THREE.Mesh(new RoundedBoxGeometry(1.3,.19,.20,3,.07),material);m.rotation.y=angle;group.add(m);}
   }
   markGroup.add(group);pieces.set(i,{group,mark,born:elapsed,material});burst(group.position,color);tone(false,mark);
  }
  function createBeam(line:number[],mark:Mark){
   const g=new THREE.Group(),color=mark==="X"?CYAN:PINK;
   const start=tilePositions[line[0]].clone(),finish=tilePositions[line[2]].clone();start.y=.7;finish.y=.7;
   const direction=finish.clone().sub(start),mid=start.clone().add(finish).multiplyScalar(.5);
   for(const [radius,opacity] of [[.036,1],[.14,.15]]){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length()+1.1,12),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());direction.copy(finish).sub(start);beam.position.copy(mid);g.add(beam);
   }
   board.add(g);winBeam=g;burst(mid,color,true);tone(true,mark);
  }
  const visibility=()=>{hidden=document.hidden;lastTime=performance.now();};document.addEventListener("visibilitychange",visibility);
  const onMove=(e:PointerEvent)=>{const box=el.getBoundingClientRect();pointer.x=(e.clientX-box.left)/box.width-.5;pointer.y=(e.clientY-box.top)/box.height-.5;};
  const onLeave=()=>{pointer.x=0;pointer.y=0;hover.current=-1;};el.addEventListener("pointermove",onMove);el.addEventListener("pointerleave",onLeave);
  const onLost=(e:Event)=>{e.preventDefault();lost=true;setFailed(true);};
  renderer.domElement.addEventListener("webglcontextlost",onLost);
  function resize(){const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio,current.current.cinematic?1.6:1));renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const ro=new ResizeObserver(resize);ro.observe(el);resize();
  function draw(now:number){
   frame=requestAnimationFrame(draw);const dt=Math.min((now-lastTime)/1000,.045);lastTime=now;if(hidden||lost)return;
   const p=current.current,fx=p.cinematic;elapsed+=dt;
   if(quality!==fx){quality=fx;resize();}
   nebulaMat.uniforms.uTime.value=fx?elapsed:0;
   starGeo.setDrawRange(0,fx?count:160);
   stars.rotation.y=fx?elapsed*.018:0;
   board.rotation.y=fx?Math.sin(elapsed*.26)*.035:0;
   board.position.y=fx?-.25+Math.sin(elapsed*.8)*.055:-.25;
   rings.forEach((r,i)=>r.rotation.y=fx?elapsed*(i%2?-.10:.08)+i*.5:i*.5);
   orbit.rotation.y=fx?elapsed*.11:0;
   ticks.rotation.y=fx?-elapsed*.018:0;
   if(lastRound!==p.round){lastRound=p.round;shake=0;}
   for(const [i,piece] of pieces)if(p.board[i]!==piece.mark){disposeObject(piece.group);pieces.delete(i);}
   p.board.forEach((mark,i)=>{if(mark&&!pieces.has(i))createPiece(i,mark);});
   const end=result(p.board);const winner=end?.winner??"";
   if(lastWinner!==winner){if(winBeam){disposeObject(winBeam);winBeam=null;}if(end&&end.winner!=="draw")createBeam(end.line,end.winner);lastWinner=winner;}
   const won=end?.line??[];
   tiles.forEach((tile,i)=>{
    const active=hover.current===i&&!p.disabled&&!p.board[i];
    const targetY=active?.12:0;tile.position.y=THREE.MathUtils.lerp(tile.position.y,targetY,fx?.16:1);
    const color=p.board[i]==="O"?PINK:p.board[i]==="X"?CYAN:0x23859e;
    tile.material.emissive.setHex(color);tile.material.emissiveIntensity=won.includes(i)?.5:active?.3:p.board[i]?.12:.06;
    (outlines[i].material as THREE.LineBasicMaterial).color.setHex(active?(p.turn==="X"?CYAN:PINK):p.board[i]?color:0x367289);
   });
   for(const [i,piece] of pieces){
    const t=Math.min(1,(elapsed-piece.born)/.45);
    const scale=fx?Math.max(.001,1-Math.pow(1-t,3)*Math.cos(t*7)):1;
    piece.group.scale.setScalar(scale);piece.group.position.y=.38+(fx?Math.sin(elapsed*1.5+i)*.04+Math.pow(1-t,3)*.8:0);
    piece.material.emissiveIntensity=won.includes(i)?2.3+(fx?Math.sin(elapsed*4)*.3:0):1.35;
   }
   for(let j=bursts.length-1;j>=0;j--){
    const b=bursts[j],age=elapsed-b.born;
    if(age>b.life||!fx){disposeObject(b.points);disposeObject(b.ring);bursts.splice(j,1);continue;}
    const positions=b.points.geometry.attributes.position.array as Float32Array;
    for(let i=0;i<positions.length;i+=3){positions[i]+=b.vel[i]*dt;positions[i+1]+=b.vel[i+1]*dt;positions[i+2]+=b.vel[i+2]*dt;b.vel[i+1]-=2.9*dt;}
    b.points.geometry.attributes.position.needsUpdate=true;
    (b.points.material as THREE.PointsMaterial).opacity=Math.pow(1-age/b.life,1.4);
    b.ring.scale.setScalar(1+age*10);(b.ring.material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-age/.75);
   }
   shake*=.88;
   const fit=Math.max(1,1.05/camera.aspect);
   camera.position.copy(baseCamera).multiplyScalar(fit);
   if(fx){camera.position.x+=pointer.x*.45+Math.sin(elapsed*65)*shake;camera.position.y+=pointer.y*.25+Math.cos(elapsed*53)*shake;}
   camera.lookAt(target);camera.updateMatrixWorld();board.updateMatrixWorld(true);
   tiles.forEach((tile,i)=>{pointGeom.copy(tile.position);pointGeom.y=.3;board.localToWorld(pointGeom);pointGeom.project(camera);const b=buttons.current[i];if(b){b.style.left=(pointGeom.x*.5+.5)*100+"%";b.style.top=(-pointGeom.y*.5+.5)*100+"%";}});
   if(fx)composer.render();else renderer.render(scene,camera);

  }
  frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);ro.disconnect();document.removeEventListener("visibilitychange",visibility);el.removeEventListener("pointermove",onMove);el.removeEventListener("pointerleave",onLeave);el.removeEventListener("pointerdown",unlock);el.removeEventListener("keydown",unlock);renderer.domElement.removeEventListener("webglcontextlost",onLost);void audio?.close().catch(()=>{});disposeObject(scene);bloom.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div ref={host} className={"arena-canvas "+(failed?"fallback":"")}>
  <div className="board-access" role="group" aria-label="틱택토 게임판">{props.board.map((v,i)=><button ref={e=>{buttons.current[i]=e}} key={i} className={"cell-target "+(v??"empty")} aria-label={`${Math.floor(i/3)+1}행 ${i%3+1}열, ${v??"빈 칸"}`} aria-disabled={!!v||props.disabled} onPointerEnter={()=>{hover.current=i}} onFocus={()=>{hover.current=i}} onBlur={()=>{hover.current=-1}} onClick={()=>props.onPlay(i)} onKeyDown={e=>{const delta=({ArrowRight:1,ArrowLeft:-1,ArrowDown:3,ArrowUp:-3} as Record<string,number>)[e.key];if(delta){e.preventDefault();buttons.current[(i+delta+9)%9]?.focus();}}}>{failed?(v??"＋"):<span className="target-cross">＋</span>}</button>)}</div>
  {failed&&<p className="fallback-note">3D를 사용할 수 없어 기본 보드로 플레이해.</p>}
  <span className="coordinate coord-left">SECTOR 09 / ZERO GRAVITY</span><span className="coordinate coord-right">X : O</span>
 </div>;
}
