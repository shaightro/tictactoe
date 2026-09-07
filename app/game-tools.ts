"use client";
import { useEffect, useRef, type Dispatch } from "react";
import { flushSync } from "react-dom";
import { reducer, result, type Action, type Game } from "@/lib/game";
type Tool={name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function useGameTools(game:Game,dispatch:Dispatch<Action>){
 const state=useRef(game);state.current=game;
 useEffect(()=>{
  const context=(document as Document & {modelContext?:Context}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const read=()=>({board:state.current.board,turn:state.current.turn,mode:state.current.mode,human:state.current.human,difficulty:state.current.difficulty,round:state.current.round,result:result(state.current.board),scores:state.current.scores});
  const apply=(action:Action)=>{if(reducer(state.current,action)===state.current)throw new Error("This action is not allowed in the current game state.");flushSync(()=>dispatch(action));return read();};
  const noInput={type:"object",properties:{},additionalProperties:false};
  const tools:Tool[]=[
   {name:"read_tic_tac_toe",title:"Read game",description:"Read the visible board, turn, round result, and match score.",inputSchema:noInput,annotations:{readOnlyHint:true,untrustedContentHint:false},execute:read},
   {name:"play_tic_tac_toe_move",title:"Play a move",description:"Place the current human player's mark into one empty cell of the visible board. Rows and columns are 1 through 3. The AI responds automatically in AI mode.",inputSchema:{type:"object",properties:{row:{type:"integer",minimum:1,maximum:3},column:{type:"integer",minimum:1,maximum:3}},required:["row","column"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input)=>{if(!input||typeof input!=="object")throw new Error("Provide row and column.");const {row,column}=input as {row:unknown;column:unknown};if(typeof row!=="number"||typeof column!=="number"||!Number.isInteger(row)||!Number.isInteger(column)||row<1||row>3||column<1||column>3)throw new Error("Row and column must be integers from 1 to 3.");return apply({type:"move",index:(row-1)*3+column-1});}},
   {name:"start_tic_tac_toe_round",title:"Start next round",description:"Clear the current board and start a new round while keeping this match's scores and settings. Any unfinished round is discarded.",inputSchema:noInput,annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>apply({type:"next"})}
  ];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  return()=>lifecycle.abort();
 },[dispatch]);
}
