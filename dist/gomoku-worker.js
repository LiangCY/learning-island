import {chooseMove,suggestMove} from './gomoku.js';
self.onmessage=({data})=>{
 try{const value=data.type==='hint'?suggestMove(data.board,data.player):chooseMove(data.board,data.player,data.difficulty);self.postMessage({id:data.id,value});}
 catch(error){self.postMessage({id:data.id,error:error.message});}
};
