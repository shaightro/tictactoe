"use client";
import { useEffect, useReducer, useState } from "react";
import { ArrowUpRight, RotateCcw, Undo2, Sparkles, Cpu, Users, Zap, Volume2, Crosshair } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { initialGame, reducer, result, aiMove, type Difficulty, type Mark } from "@/lib/game";
import Arena from "./arena";
import { useGameTools } from "./game-tools";

export default function Home(){
 const [game,dispatch]=useReducer(reducer,initialGame);
 useGameTools(game,dispatch);
 const [cinematic,setCinematic]=useState(true);
 const [sound,setSound]=useState(false);
 const [hint,setHint]=useState(false);
 const end=result(game.board), thinking=game.mode==="ai"&&game.turn!==game.human&&!end;
 useEffect(()=>{if(!thinking)return;const timer=setTimeout(()=>{const index=aiMove(game.board,game.turn,game.difficulty);if(index!==null)dispatch({type:"move",index,ai:true,revision:game.revision});},620);return()=>clearTimeout(timer);},[game,thinking]);
 useEffect(()=>{if(matchMedia("(prefers-reduced-motion: reduce)").matches)setCinematic(false);},[]);
 function play(index:number){dispatch({type:"move",index});}
 const canUndo=game.mode==="local"?game.history.length>0:game.history.length>(game.human==="O"?1:0);
 const status=end?(end.winner==="draw"?"팽팽한 무승부":game.mode==="ai"?(end.winner===game.human?"아레나를 지배했어.":"AI의 승리. 다시 도전할까?"):`${end.winner} 플레이어 승리!`):thinking?"상대가 수를 읽는 중":game.mode==="local"?`${game.turn} 플레이어의 차례`:"한 수를 놓을 차례예요.";
 return <main className="app-shell">
  <header className="topbar"><a href="./" className="brand" aria-label="NEXUS 홈"><span className="brand-symbol">✳</span>NEXUS<span className="brand-tag">PLAY LAB</span></a><span className="edition">TIC TAC TOE / REIMAGINED</span><div className="live-badge"><i/> ARENA ONLINE</div></header>
  <div className="intro"><div><p className="eyebrow"><span/> THE NEXT DIMENSION OF PLAY</p><h1>작은 게임.<br className="mobile-break"/> <em>압도적인 한 수.</em></h1></div><p className="intro-note">세 개를 연결해.<br/>나머지는 우주가 알아서 할게.</p></div>
  <div className="game-layout">
   <aside className="control-panel">
    <div className="panel-heading"><span>01 / MATCH SETUP</span><Crosshair size={17}/></div>
    <h2>누구와 붙을까?</h2>
    <RadioGroup className="mode-options" value={game.mode} onValueChange={v=>dispatch({type:"configure",mode:v as "ai"|"local"})} aria-label="대결 모드">
      <label className={"mode-option "+(game.mode==="ai"?"selected":"")}><RadioGroupItem value="ai" aria-label="AI 대결"/><Cpu size={23}/><span><strong>AI와 대결</strong><small>너의 다음 수까지 생각해.</small></span><span className="option-dot"/></label>
      <label className={"mode-option "+(game.mode==="local"?"selected":"")}><RadioGroupItem value="local" aria-label="로컬 2인 대결"/><Users size={23}/><span><strong>친구와 대결</strong><small>같은 화면, 진짜 승부.</small></span><span className="option-dot"/></label>
    </RadioGroup>
    <div className={"settings-block "+(game.mode==="local"?"dimmed":"")}>
    <label className="field-label">AI 난이도 <span>{game.difficulty==="expert"?"NO MERCY":game.difficulty==="normal"?"GOOD MATCH":"WARM UP"}</span></label>
    <RadioGroup className="segments" value={game.difficulty} disabled={game.mode==="local"} onValueChange={v=>dispatch({type:"configure",difficulty:v as Difficulty})} aria-label="AI 난이도">{[["easy","가볍게"],["normal","진지하게"],["expert","무적"]].map(([v,l])=><label key={v} className={game.difficulty===v?"selected":""}><RadioGroupItem value={v} aria-label={l}/>{l}{v==="expert"&&<Zap size={12}/>}</label>)}</RadioGroup>
    <p className="setting-hint">{game.difficulty==="expert"?"빈틈없는 AI. 무승부도 실력이야.":game.difficulty==="normal"?"방심하면 진다. 하지만 기회는 있어.":"부담 없이, 손부터 풀어볼까?"}</p>
    <label className="field-label">내 심볼 <span>X가 먼저 시작</span></label>
    <RadioGroup className="symbol-options" value={game.human} disabled={game.mode==="local"} onValueChange={v=>dispatch({type:"configure",human:v as Mark})} aria-label="내 심볼">{(["X","O"] as const).map(v=><label key={v} className={(game.human===v?"selected ":"")+v}><RadioGroupItem value={v} aria-label={v+"로 플레이"}/><b>{v==="X"?"✕":"○"}</b><span>{v==="X"?"선공":"후공"}</span></label>)}</RadioGroup>
    </div>
    <div className="visual-controls"><div><span><Sparkles size={16}/> 시네마틱 이펙트</span><Switch checked={cinematic} onCheckedChange={setCinematic} aria-label="시네마틱 이펙트"/></div><div><span><Volume2 size={16}/> 사운드</span><Switch checked={sound} onCheckedChange={setSound} aria-label="사운드"/></div></div>
    <div className="setup-note">모드·난이도·심볼을 바꾸면<br/>새 매치가 시작돼.</div>
   </aside>
   <section className={"arena-panel "+(end?"finished":"")} aria-label="3D 틱택토 게임">
    <div className="arena-heading"><span><i/> LIVE MATCH</span><span>ROUND {String(game.round).padStart(2,"0")}</span></div>
    <div className="turn-banner" aria-live="polite" aria-atomic="true"><span className={"turn-chip "+(end?.winner??game.turn)}>{end?end.winner==="draw"?"=":end.winner:game.turn}</span><div><span>{end?"ROUND COMPLETE":thinking?"AI IS THINKING":"YOUR MOVE"}</span><h2>{status}</h2></div>{thinking&&<span className="thinking-dots">•••</span>}</div>
    <Arena board={game.board} turn={game.turn} onPlay={play} disabled={!!end||!!thinking} cinematic={cinematic} sound={sound} round={game.round}/>
    <div className="arena-bottom"><span><span className="status-pulse"/> {end?"ROUND COMPLETE":"빈 타일을 눌러 시작해"}</span><button className="text-button" onClick={()=>setHint(!hint)} aria-expanded={hint}>플레이 방법 <ArrowUpRight size={14}/></button></div>
    {hint&&<div className="rules"><b>한 줄을 먼저 완성하면 승리.</b><p>가로·세로·대각선으로 같은 심볼 3개를 연결해. 키보드는 Tab과 Enter, 또는 게임판 위에서 방향키를 사용할 수 있어. AI 대결의 되돌리기는 내 마지막 차례부터 되돌려.</p><button onClick={()=>setHint(false)}>알겠어</button></div>}
    <div className="actions"><button className="undo-button" disabled={!canUndo} onClick={()=>dispatch({type:"undo"})}><Undo2 size={17}/> 한 수 되돌리기</button><button className="new-round" onClick={()=>dispatch({type:"next"})}><RotateCcw size={16}/>{end?"다음 라운드":"라운드 다시 시작"}<ArrowUpRight size={18}/></button></div>
   </section>
   <aside className="score-panel"><div className="panel-heading"><span>02 / SCOREBOARD</span><Zap size={16}/></div><h2>승부의 기록</h2><p className="session-label">이번 매치 · {game.scores.X+game.scores.O+game.scores.draw} 라운드 완료</p>
    <div className={"score-card x-score "+(!end&&game.turn==="X"?"active":"")}><span className="score-symbol">✕</span><div><span>PLAYER X</span><strong>{game.mode==="local"?"플레이어 X":game.human==="X"?"YOU":"NEXUS AI"}</strong></div><b>{String(game.scores.X).padStart(2,"0")}</b></div>
    <div className={"score-card o-score "+(!end&&game.turn==="O"?"active":"")}><span className="score-symbol">○</span><div><span>PLAYER O</span><strong>{game.mode==="local"?"플레이어 O":game.human==="O"?"YOU":"NEXUS AI"}</strong></div><b>{String(game.scores.O).padStart(2,"0")}</b></div>
    <div className="draw-score"><span>무승부</span><span>{String(game.scores.draw).padStart(2,"0")}</span></div>
    <div className="match-detail"><p><span>BOARD</span><b>3 × 3</b></p><p><span>WIN CONDITION</span><b>3 IN A ROW</b></p><p><span>RENDER MODE</span><b>{cinematic?"ULTRA FX":"LOW MOTION"}</b></p></div>
    <div className="arena-quote"><span>“</span><p>아홉 개의 칸.<br/>단 하나의 승자.</p><small>MAKE YOUR MOVE.</small></div>
   </aside>
  </div>
  <footer><span>NEXUS <b>© 2026</b></span><span>BUILT FOR THE NEXT MOVE.</span><span><i/> NO DOWNLOAD. JUST PLAY.</span></footer>
 </main>;
}
