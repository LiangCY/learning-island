export const BOARD_SIZE=15;
export const DIRECTIONS=[[1,0],[0,1],[1,1],[1,-1]];
export const DIFFICULTIES={
 easy:{name:'轻松练习',description:'会争取连五、挡住一步获胜，适合初次下棋。',depth:1,width:6},
 normal:{name:'认真对弈',description:'兼顾进攻和防守，提前考虑你的下一手。',depth:2,width:10},
 hard:{name:'棋力挑战',description:'向前推演三步，优先寻找冲四与双向威胁。',depth:3,width:10}
};
const pets=['fox','rabbit','panda','cat'];
export function winningLine(board,index){
 const player=board[index];if(!player)return [];
 const x=index%BOARD_SIZE,y=Math.floor(index/BOARD_SIZE);
 for(const [dx,dy] of DIRECTIONS){
  const line=[index];for(const sign of [-1,1])for(let n=1;n<BOARD_SIZE;n++){
   const xx=x+dx*n*sign,yy=y+dy*n*sign;
   if(xx<0||xx>=BOARD_SIZE||yy<0||yy>=BOARD_SIZE||board[yy*BOARD_SIZE+xx]!==player)break;
   if(sign<0)line.unshift(yy*BOARD_SIZE+xx);else line.push(yy*BOARD_SIZE+xx);
  }
  if(line.length>=5)return line;
 }
 return [];
}
export function boardFromMoves(moves){const board=Array(225).fill(0);moves.forEach((pos,index)=>board[pos]=index%2+1);return board;}
export function gameResult(moves){
 const board=boardFromMoves(moves),line=moves.length?winningLine(board,moves.at(-1)):[];
 return {winner:line.length?board[moves.at(-1)]:0,line,draw:!line.length&&moves.length===225};
}
export function normalizeGomoku(value){
 const moves=[],seen=new Set(),board=Array(225).fill(0);
 for(const pos of Array.isArray(value?.moves)?value.moves:[]){
  if(!Number.isInteger(pos)||pos<0||pos>=225||seen.has(pos))break;
  seen.add(pos);board[pos]=moves.length%2+1;moves.push(pos);if(winningLine(board,pos).length)break;
 }
 return {version:1,mode:value?.mode==='local'?'local':'ai',difficulty:Object.hasOwn(DIFFICULTIES,value?.difficulty)?value.difficulty:'easy',humanColor:value?.humanColor===2?2:1,blackPet:pets.includes(value?.blackPet)?value.blackPet:'fox',whitePet:pets.includes(value?.whitePet)?value.whitePet:'rabbit',autoHint:value?.autoHint!==false,showAvatars:value?.showAvatars!==false,moves};
}
export function playMove(value,pos){
 const state=normalizeGomoku(value),result=gameResult(state.moves);
 if(result.winner||result.draw)throw Error('这一局已经结束，可以再来一局');
 if(!Number.isInteger(pos)||pos<0||pos>=225)throw Error('请选择棋盘上的交叉点');
 if(state.moves.includes(pos))throw Error('这个位置已经有棋子啦');
 state.moves.push(pos);return state;
}
export function undoMoves(value){
 const state=normalizeGomoku(value);if(!state.moves.length)return state;
 // Undo back to the human's previous turn, including a just-finished AI reply.
 const count=state.mode==='local'?1:state.moves.length%2+1===state.humanColor?2:1;
 state.moves=state.moves.slice(0,Math.max(state.humanColor===2&&state.mode==='ai'?1:0,state.moves.length-count));return state;
}
function candidates(board){
 const set=new Set();let count=0;
 for(let i=0;i<225;i++)if(board[i]){count++;const x=i%15,y=Math.floor(i/15);for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<15&&yy>=0&&yy<15&&!board[yy*15+xx])set.add(yy*15+xx);}}
 return count?[...set]:[112];
}
export function moveStrength(board,pos,player){
 if(board[pos])return -Infinity;
 const x=pos%15,y=Math.floor(pos/15);let score=0,strong=0,fours=0;
 board[pos]=player;
 for(const [dx,dy] of DIRECTIONS){
  let line='';for(let k=-4;k<=4;k++){const xx=x+dx*k,yy=y+dy*k;line+=xx<0||xx>=15||yy<0||yy>=15?'2':board[yy*15+xx]===player?'1':board[yy*15+xx]===0?'0':'2';}
  let value=0;
  if(line.includes('11111'))value=10000000;
  else if(line.includes('011110')){value=250000;fours++;}
  else {
   for(let start=0;start<=4;start++){const part=line.slice(start,start+5);if(part.includes('2'))continue;const count=part.split('1').length-1;if(count===4)value=Math.max(value,24000);else if(count===3)value=Math.max(value,700);else if(count===2)value=Math.max(value,50);}
   if(value>=24000)fours++;
   if(/01110|011010|010110/.test(line)){value=Math.max(value,6500);strong++;}
   else if(/001100|0010100/.test(line))value=Math.max(value,300);
  }
  score+=value;
 }
 board[pos]=0;
 if(fours>=2)score+=180000;if(fours&&strong)score+=100000;if(strong>=2)score+=50000;
 return score+(7-Math.abs(x-7)+7-Math.abs(y-7))*.5;
}
function ordered(board,player,width=10){return candidates(board).map(pos=>({pos,attack:moveStrength(board,pos,player),defend:moveStrength(board,pos,3-player)})).sort((a,b)=>(b.attack+b.defend*1.08)-(a.attack+a.defend*1.08)||a.pos-b.pos).slice(0,width);}
function immediate(board,player){return candidates(board).filter(pos=>{board[pos]=player;const win=winningLine(board,pos).length>0;board[pos]=0;return win;});}
function evaluate(board,player){const own=ordered(board,player,2),opponent=ordered(board,3-player,2);return (own[0]?.attack||0)+(own[1]?.attack||0)*.2-(opponent[0]?.attack||0)*1.12-(opponent[1]?.attack||0)*.2;}
export function chooseMove(board,player,difficulty='normal',random=Math.random){
 const config=DIFFICULTIES[difficulty]||DIFFICULTIES.normal;
 if(board.length!==225||![1,2].includes(player))throw Error('棋盘数据无效');
 if(board.every(v=>v!==0))return null;
 const winning=immediate(board,player);if(winning.length)return winning[0];
 const blocks=immediate(board,3-player);if(blocks.length)return blocks.map(pos=>({pos,score:moveStrength(board,pos,player)})).sort((a,b)=>b.score-a.score)[0].pos;
 const moves=ordered(board,player,config.width);if(!moves.length)return null;
 if(difficulty==='easy'){
  const best=moves[0].attack+moves[0].defend*1.08;
  const options=moves.filter(m=>m.attack+m.defend*1.08>=best*.62).slice(0,3);
  return options[Math.min(options.length-1,Math.floor(Math.max(0,random())*options.length))].pos;
 }
 let nodes=0;const limit=6000;
 function search(turn,depth,alpha,beta,last){
  if(last!==null&&winningLine(board,last).length)return board[last]===player?20000000+depth:-20000000-depth;
  if(depth===0||++nodes>limit)return evaluate(board,player);
  const threats=immediate(board,turn),defense=immediate(board,3-turn);
  if(threats.length)return turn===player?19000000+depth:-19000000-depth;
  const list=defense.length?defense.slice(0,2).map(pos=>({pos})):ordered(board,turn,depth===1?7:config.width);
  if(!list.length)return 0;
  let best=turn===player?-Infinity:Infinity;
  for(const {pos} of list){
   board[pos]=turn;const score=search(3-turn,depth-1,alpha,beta,pos);board[pos]=0;
   if(turn===player){best=Math.max(best,score);alpha=Math.max(alpha,best);}else{best=Math.min(best,score);beta=Math.min(beta,best);}
   if(beta<=alpha)break;
  }
  return best;
 }
 let best=-Infinity,choice=moves[0].pos;
 for(const move of moves){board[move.pos]=player;const score=search(3-player,config.depth-1,-Infinity,Infinity,move.pos);board[move.pos]=0;if(score>best){best=score;choice=move.pos;}}
 return choice;
}
export function suggestMove(board,player){
 const pos=chooseMove(board,player,'normal');if(pos===null)return null;
 const attack=moveStrength(board,pos,player),defend=moveStrength(board,pos,3-player);
 return {pos,reason:attack>=10000000?'这里可以连成五子，拿下这一局。':defend>=10000000?'先挡住这里，对方下一手就能连五。':defend>=24000?'守住关键位置，别让对方的连线长起来。':attack>=24000?'在这里制造冲四，让对方必须回应。':attack>=6500?'把棋子连起来，为下一次进攻留两条路。':'靠近自己的棋子，兼顾连线和防守。'};
}
