export type Mark = "X" | "O";
export type Board = (Mark | null)[];
export type Difficulty = "easy" | "normal" | "expert";
export const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function result(board: Board): {winner: Mark | "draw"; line: number[]} | null {
  for(const line of LINES) if(board[line[0]] && line.every(i=>board[i]===board[line[0]])) return {winner:board[line[0]]!,line};
  return board.every(Boolean) ? {winner:"draw",line:[]} : null;
}
export const other=(mark:Mark):Mark=>mark==="X"?"O":"X";
const cache=new Map<string,number>();
function value(board:Board,turn:Mark):number{
  const end=result(board);
  if(end) return end.winner==="draw"?0:end.winner===turn?1:-1;
  const key=board.map(x=>x??"-").join("")+turn;
  if(cache.has(key)) return cache.get(key)!;
  let best=-2;
  for(let i=0;i<9;i++) if(!board[i]){ board[i]=turn; best=Math.max(best,-value(board,other(turn))); board[i]=null; }
  cache.set(key,best); return best;
}
export function optimalMoves(board:Board,turn:Mark):number[]{
  if(result(board)) return [];
  const copy=[...board]; let best=-2; let moves:number[]=[];
  for(let i=0;i<9;i++) if(!copy[i]){copy[i]=turn;const v=-value(copy,other(turn));copy[i]=null;if(v>best){best=v;moves=[i];}else if(v===best)moves.push(i);}
  return moves;
}
export function aiMove(board:Board,turn:Mark,difficulty:Difficulty,random= Math.random):number | null {
  if(result(board))return null;
  const empty=board.flatMap((v,i)=>v?[]:[i]);
  const pick=(list:number[])=>list[Math.min(list.length-1,Math.floor(Math.max(0,random())*list.length))];
  if(difficulty==="easy")return pick(empty);
  if(difficulty==="normal"){
    for(const m of [turn,other(turn)])for(const i of empty){const copy=[...board];copy[i]=m;if(result(copy)?.winner===m)return i;}
    if(random()<0.42)return pick(empty);
  }
  return pick(optimalMoves(board,turn));
}
export type Game = {board:Board; history:number[]; turn:Mark; mode:"ai"|"local"; human:Mark; difficulty:Difficulty; round:number; revision:number; scores:Record<Mark|"draw",number>};
export type Action = {type:"move";index:number;ai?:boolean;revision?:number}|{type:"undo"}|{type:"next"}|{type:"configure";mode?:Game["mode"];human?:Mark;difficulty?:Difficulty};
export const initialGame:Game={board:Array(9).fill(null),history:[],turn:"X",mode:"ai",human:"X",difficulty:"expert",round:1,revision:0,scores:{X:0,O:0,draw:0}};
export function reducer(state:Game,action:Action):Game{
  const revision=state.revision+1;
  if(action.type==="configure") return {...initialGame,mode:action.mode??state.mode,human:action.human??state.human,difficulty:action.difficulty??state.difficulty,board:Array(9).fill(null),scores:{X:0,O:0,draw:0},revision};
  if(action.type==="next")return {...state,board:Array(9).fill(null),history:[],turn:"X",round:state.round+1,revision};
  if(action.type==="undo"){
    let count=state.history.length;
    if(!count)return state;
    if(state.mode==="ai"){
      const lastHuman=state.history.map((_,i)=>i%2===0?"X":"O").lastIndexOf(state.human);
      if(lastHuman<0)return state;
      count=lastHuman;
    }else count--;
    const board:Board=Array(9).fill(null);const history=state.history.slice(0,count);history.forEach((p,i)=>board[p]=i%2===0?"X":"O");
    const scores={...state.scores};const end=result(state.board);if(end)scores[end.winner]--;
    return {...state,board,history,turn:count%2===0?"X":"O",scores,revision};
  }
  if(action.type==="move"){
    if(!Number.isInteger(action.index)||action.index<0||action.index>8||state.board[action.index]||result(state.board))return state;
    if(action.ai && (state.mode!=="ai" || action.revision!==state.revision))return state;
    if(action.revision!==undefined&&action.revision!==state.revision)return state;
    if(state.mode==="ai"&&(action.ai ? state.turn===state.human : state.turn!==state.human))return state;
    const board=[...state.board];board[action.index]=state.turn;
    const scores={...state.scores};const end=result(board);if(end)scores[end.winner]++;
    return {...state,board,history:[...state.history,action.index],turn:other(state.turn),scores,revision};
  }return state;
}
