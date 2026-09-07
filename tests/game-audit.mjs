import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {result, optimalMoves, aiMove, reducer, initialGame} from "../lib/game.ts";

const sourcePath = new URL("../lib/game.ts", import.meta.url);
const sourceSha256 = createHash("sha256").update(readFileSync(sourcePath)).digest("hex");
const MASKS = [7,56,448,73,146,292,273,84];
const FULL = 511;
const refWinner = (x,o) => MASKS.some(mask => (x & mask) === mask) ? "X" : MASKS.some(mask => (o & mask) === mask) ? "O" : (x|o) === FULL ? "draw" : null;
const refCache = new Map();
const empties = (x,o) => Array.from({length:9},(_,i)=>i).filter(i=>!((x|o)&(1<<i)));
function refValue(x,o,turn) {
  const end = refWinner(x,o);
  if(end) return end === "X" ? 1 : end === "O" ? -1 : 0;
  const key = x*512+o;
  if(refCache.has(key)) return refCache.get(key);
  const values = empties(x,o).map(i=>turn==="X" ? refValue(x|(1<<i),o,"O") : refValue(x,o|(1<<i),"X"));
  const score = turn==="X" ? Math.max(...values) : Math.min(...values);
  refCache.set(key,score);
  return score;
}
function refMoves(x,o,turn) {
  if(refWinner(x,o)) return [];
  const moves = empties(x,o);
  const values = moves.map(i=>turn==="X" ? refValue(x|(1<<i),o,"O") : refValue(x,o|(1<<i),"X"));
  const best = turn==="X" ? Math.max(...values) : Math.min(...values);
  return moves.filter((_,i)=>values[i]===best);
}
const toBoard = (x,o) => Array.from({length:9},(_,i)=>x&(1<<i)?"X":o&(1<<i)?"O":null);
const states = new Map();
function enumerate(x,o,turn) {
  const key=x*512+o;
  if(states.has(key))return;
  states.set(key,{x,o,turn});
  if(refWinner(x,o))return;
  for(const i of empties(x,o)) {
    if(turn==="X")enumerate(x|(1<<i),o,"O");
    else enumerate(x,o|(1<<i),"X");
  }
}
enumerate(0,0,"X");
assert.equal(states.size,5478,"Reachable board count");
const exhaustive = {boards:states.size,nonterminal:0,terminal:0,winnerComparisons:0,optimalSetComparisons:0,optimalMoveCount:0,expertSelections:0,easySelections:0,normalSelections:0,normalTacticalBoards:0};
const seqRandom = values => {
  let n=0;
  return ()=>{assert.ok(n<values.length,"Unexpected random draw"); return values[n++];};
};
for(const {x,o,turn} of states.values()) {
  const board=Object.freeze(toBoard(x,o));
  const before=JSON.stringify(board);
  const end=refWinner(x,o);
  assert.equal(result(board)?.winner??null,end,"Winner at "+before);
  exhaustive.winnerComparisons++;
  const expected=refMoves(x,o,turn);
  assert.deepEqual(optimalMoves(board,turn),expected,"Optimal set at "+before);
  exhaustive.optimalSetComparisons++;
  exhaustive.optimalMoveCount+=expected.length;
  if(end) {
    exhaustive.terminal++;
    for(const d of ["easy","normal","expert"]) assert.equal(aiMove(board,turn,d,()=>{throw Error("Terminal board requested RNG");}),null);
  } else {
    exhaustive.nonterminal++;
    const legal=empties(x,o);
    expected.forEach((move,i)=>{
      assert.equal(aiMove(board,turn,"expert",()=> (i+0.5)/expected.length),move);
      exhaustive.expertSelections++;
    });
    legal.forEach((move,i)=>{
      assert.equal(aiMove(board,turn,"easy",()=> (i+0.5)/legal.length),move);
      exhaustive.easySelections++;
    });
    const directWin=(mark,i)=>refWinner(mark==="X"?x|(1<<i):x,mark==="O"?o|(1<<i):o)===mark;
    const wins=legal.filter(i=>directWin(turn,i));
    const opp=turn==="X"?"O":"X";
    const blocks=legal.filter(i=>directWin(opp,i));
    if(wins.length||blocks.length) {
      assert.equal(aiMove(board,turn,"normal",()=>{throw Error("Tactical move requested RNG");}),(wins.length?wins:blocks)[0]);
      exhaustive.normalTacticalBoards++;
      exhaustive.normalSelections++;
    } else {
      legal.forEach((move,i)=>{
        assert.equal(aiMove(board,turn,"normal",seqRandom([0.419999999,(i+0.5)/legal.length])),move);
        exhaustive.normalSelections++;
      });
      expected.forEach((move,i)=>{
        assert.equal(aiMove(board,turn,"normal",seqRandom([0.42,(i+0.5)/expected.length])),move);
        exhaustive.normalSelections++;
      });
    }
  }
  assert.equal(JSON.stringify(board),before,"Input board was mutated");
}
assert.equal(exhaustive.nonterminal,4520);
assert.equal(exhaustive.terminal,958);
function unbeatable(ai) {
  const summary={ai,visitedPositions:0,completeGamePaths:0,aiWins:0,draws:0,aiLosses:0};
  const unique=new Set();
  function walk(x,o,turn) {
    unique.add(x*512+o);
    const end=refWinner(x,o);
    if(end) {
      summary.completeGamePaths++;
      if(end==="draw") summary.draws++;
      else if(end===ai) summary.aiWins++;
      else summary.aiLosses++;
      return;
    }
    const moves=turn===ai ? optimalMoves(Object.freeze(toBoard(x,o)),turn) : empties(x,o);
    for(const i of moves) {
      if(turn==="X") walk(x|(1<<i),o,"O");
      else walk(x,o|(1<<i),"X");
    }
  }
  walk(0,0,"X");
  summary.visitedPositions=unique.size;
  assert.equal(summary.aiLosses,0,"Expert lost as "+ai);
  return summary;
}
const unbeatability=[unbeatable("X"),unbeatable("O")];
let passedReducerCases=0;
const failures=[];
function test(name,body) {try{body();passedReducerCases++;}catch(e){failures.push({name,message:e.message});}}
const fresh=(opts={})=>({...structuredClone(initialGame),...opts});
const play=(s,index)=>reducer(s,s.mode==="ai"&&s.turn!==s.human?{type:"move",index,ai:true,revision:s.revision}:{type:"move",index});
const sequence=(moves,opts={})=>moves.reduce(play,fresh(opts));
const checkBoardHistory=s=>{
  const expected=Array(9).fill(null);
  s.history.forEach((p,i)=>expected[p]=i%2===0?"X":"O");
  assert.deepEqual(s.board,expected);
  assert.equal(s.turn,s.history.length%2===0?"X":"O");
};
test("Human X undo completed pair",()=>{
  const s=reducer(sequence([0,4]),{type:"undo"});
  assert.deepEqual(s.history,[]);checkBoardHistory(s);
});
test("Human X undo awaiting AI",()=>{
  const s=reducer(sequence([0]),{type:"undo"});
  assert.deepEqual(s.history,[]);checkBoardHistory(s);
});
test("Human O keeps AI opening and no-ops before human move",()=>{
  const s=sequence([4],{human:"O"});
  assert.strictEqual(reducer(s,{type:"undo"}),s);
});
test("Human O undo before AI response",()=>{
  const s=reducer(sequence([4,0],{human:"O"}),{type:"undo"});
  assert.deepEqual(s.history,[4]);checkBoardHistory(s);
});
test("Human O undo after AI response",()=>{
  const s=reducer(sequence([4,0,8],{human:"O"}),{type:"undo"});
  assert.deepEqual(s.history,[4]);checkBoardHistory(s);
});
test("AI winner score reversed once on undo",()=>{
  const finished=sequence([0,3,1,4,8,5]);
  assert.equal(finished.scores.O,1);
  const undone=reducer(finished,{type:"undo"});
  assert.deepEqual(undone.history,[0,3,1,4]);
  assert.deepEqual(undone.scores,{X:0,O:0,draw:0});
  checkBoardHistory(undone);
  assert.deepEqual(reducer(undone,{type:"undo"}).scores,{X:0,O:0,draw:0});
});
test("Human X winning move undo and replay",()=>{
  const finished=sequence([0,3,1,4,2]);
  assert.equal(finished.scores.X,1);
  assert.strictEqual(play(finished,8),finished);
  const undone=reducer(finished,{type:"undo"});
  assert.deepEqual(undone.history,[0,3,1,4]);
  assert.equal(undone.scores.X,0);
  assert.equal(play(undone,2).scores.X,1);
});
test("Human O winning move undo and replay",()=>{
  const finished=sequence([0,3,1,4,8,5],{human:"O"});
  assert.equal(finished.scores.O,1);
  const undone=reducer(finished,{type:"undo"});
  assert.deepEqual(undone.history,[0,3,1,4,8]);
  assert.equal(undone.scores.O,0);
  assert.equal(play(undone,5).scores.O,1);
});
test("Draw undo replay gives exactly one score",()=>{
  const moves=[0,1,2,4,3,5,7,6,8];
  const finished=sequence(moves);
  assert.equal(result(finished.board)?.winner,"draw");
  assert.equal(finished.scores.draw,1);
  const undone=reducer(finished,{type:"undo"});
  assert.deepEqual(undone.history,moves.slice(0,8));
  assert.equal(undone.scores.draw,0);
  const replayed=play(undone,8);
  assert.equal(replayed.scores.draw,1);
});
test("Local undo is exactly one move",()=>{
  const s=reducer(sequence([0,4,1],{mode:"local"}),{type:"undo"});
  assert.deepEqual(s.history,[0,4]);checkBoardHistory(s);
});
test("Empty undo no-ops",()=>{
  const s=fresh();
  assert.strictEqual(reducer(s,{type:"undo"}),s);
});
test("Stale AI after undo and different human move",()=>{
  const pending=sequence([0]);
  const action={type:"move",index:4,ai:true,revision:pending.revision};
  const current=play(reducer(pending,{type:"undo"}),1);
  assert.strictEqual(reducer(current,action),current);
});
test("Stale AI after next round",()=>{
  const pending=sequence([0]);
  const current=play(reducer(pending,{type:"next"}),1);
  assert.strictEqual(reducer(current,{type:"move",index:4,ai:true,revision:pending.revision}),current);
});
test("Stale AI after configure",()=>{
  const pending=sequence([0]);
  const current=play(reducer(pending,{type:"configure",difficulty:"easy"}),1);
  assert.strictEqual(reducer(current,{type:"move",index:4,ai:true,revision:pending.revision}),current);
});
test("AI action requires revision",()=>{
  const s=sequence([0]);
  assert.strictEqual(reducer(s,{type:"move",index:4,ai:true}),s);
});
test("Local mode rejects AI action even with current revision",()=>{
  const s=fresh({mode:"local"});
  assert.strictEqual(reducer(s,{type:"move",index:4,ai:true,revision:s.revision}),s);
});
test("Human cannot act during AI turn",()=>{
  const s=sequence([0]);
  assert.strictEqual(reducer(s,{type:"move",index:4}),s);
});
test("AI cannot act during human turn",()=>{
  const s=fresh();
  assert.strictEqual(reducer(s,{type:"move",index:4,ai:true,revision:s.revision}),s);
});
test("Duplicate AI callback cannot add another move",()=>{
  const s=sequence([0]);
  const action={type:"move",index:4,ai:true,revision:s.revision};
  const applied=reducer(s,action);
  assert.equal(applied.history.length,2);
  assert.strictEqual(reducer(applied,action),applied);
});
test("Next retains scores and resets board/history",()=>{
  const s=reducer(sequence([0,3,1,4,2]),{type:"next"});
  assert.deepEqual(s.scores,{X:1,O:0,draw:0});
  assert.deepEqual(s.history,[]);
  assert.deepEqual(s.board,Array(9).fill(null));
  assert.equal(s.round,2);
});
test("Configure resets scores and round; retains unspecified settings",()=>{
  const previous=sequence([0,3,1,4,2],{difficulty:"normal"});
  const s=reducer(previous,{type:"configure",human:"O"});
  assert.deepEqual(s.scores,{X:0,O:0,draw:0});
  assert.equal(s.round,1);
  assert.equal(s.human,"O");
  assert.equal(s.difficulty,"normal");
  assert.equal(s.revision,previous.revision+1);
});
test("Invalid or occupied index no-ops",()=>{
  const s=sequence([0,4]);
  for(const index of [-1,9,1.5,NaN,0,4])assert.strictEqual(reducer(s,{type:"move",index}),s);
});
test("Prior-round score survives current-round undo",()=>{
  let s=reducer(sequence([0,3,1,4,2],{mode:"local"}),{type:"next"});
  s=[0,3,1,4,8,5].reduce(play,s);
  assert.deepEqual(s.scores,{X:1,O:1,draw:0});
  s=reducer(s,{type:"undo"});
  assert.deepEqual(s.scores,{X:1,O:0,draw:0});
});
test("Reducer leaves frozen original state unchanged",()=>{
  const s=fresh();
  Object.freeze(s.board);Object.freeze(s.history);Object.freeze(s.scores);Object.freeze(s);
  const original=JSON.stringify(s);
  const moved=play(s,0);
  assert.notStrictEqual(moved,s);
  assert.equal(JSON.stringify(s),original);
});
console.log(JSON.stringify({sourcePath,sourceSha256,exhaustive,unbeatability,reducer:{passed:passedReducerCases,failed:failures.length,failures}},null,2));
if(failures.length)process.exitCode=1;
