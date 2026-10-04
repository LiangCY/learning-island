export const INITIAL_GAME_COINS=120;
export const COINS_PER_ANSWER=2;
const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);
export {validId as validGameId};

export function gameRewards(history=[]){
 const seen=new Set();return (Array.isArray(history)?history:[]).flatMap(round=>{
  if(typeof round?.id!=='string'||seen.has(round.id)||!Array.isArray(round.details))return [];
  seen.add(round.id);const answered=round.details.filter(q=>typeof q?.userAnswer==='string'&&q.userAnswer.trim()).length;
  return [{id:round.id,answered,total:answered*COINS_PER_ANSWER}];
 });
}
export function gameEarnings(history=[]){return INITIAL_GAME_COINS+gameRewards(history).reduce((n,r)=>n+r.total,0);}

export function normalizeWallet(value){
 const seen=new Set(),purchases=[];
 for(const p of Array.isArray(value?.purchases)?value.purchases:[]){
  if(!validId(p?.gameId)||!validId(p?.id)||!Number.isSafeInteger(p?.paid)||p.paid<=0)continue;
  const key=p.gameId+':'+p.id;
  if(seen.has(key))continue;
  seen.add(key);purchases.push({gameId:p.gameId,id:p.id,paid:p.paid});
 }
 return {purchases};
}
export function walletBalance(wallet,history=[]){
 const earned=gameEarnings(history),spent=normalizeWallet(wallet).purchases.reduce((n,p)=>n+p.paid,0);
 return {earned,spent,balance:earned-spent};
}
export function chargeWallet(value,history,{gameId,id,paid}){
 if(!validId(gameId)||!validId(id)||!Number.isSafeInteger(paid)||paid<=0)throw Error('游戏购买信息无效');
 const wallet=normalizeWallet(value);
 if(wallet.purchases.some(p=>p.gameId===gameId&&p.id===id))throw Error('已经购买过了，无需重复购买');
 if(walletBalance(wallet,history).balance<paid)throw Error('游戏币还不够，去答几道题再来吧');
 wallet.purchases.push({gameId,id,paid});return wallet;
}
