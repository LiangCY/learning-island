export const LAYOUTS={sheet:{name:'分站练习',description:'每页 10 题，一起检查',size:10},single:{name:'单题闯关',description:'大字看一题，专心算一题',size:1}};
// Retired game sessions used one question per page; continue them in single mode.
export const layoutId=value=>value==='mole'||value==='space'?'single':Object.hasOwn(LAYOUTS,value)?value:'sheet';
export const pageSize=value=>LAYOUTS[layoutId(value)].size;
export function switchLayout(session,value,focusedIndex){
 const start=session.page*pageSize(session.layout),end=Math.min(start+pageSize(session.layout),session.questions.length);
 const index=Number.isInteger(focusedIndex)&&focusedIndex>=start&&focusedIndex<end?focusedIndex:start;
 return {...session,layout:layoutId(value),page:Math.floor(index/pageSize(value))};
}
