export const sections = {
  Identity: ['Aliases','Continent','Region','Local jurisdiction','Related IDs','Campaign Bible reference','Authority','Placement evidence'],
  Landscape: ['Landforms','Biomes','Elevation','Climate','Drainage','Water features','Hazards','Resources'],
  Government: ['Ruler','Noble house','Title','Liege','Legal owner','Sovereign','Occupant','Military controller','Tax rights','Claimants','Obligations','Succession'],
  Demographics: ['Population','Communities','Households','Migration'],
  Economy: ['Agriculture','Industry','Trade','Imports','Exports'],
  Campaign: ['Factions','NPCs','Defenses','Knowledge','Campaign date','Historical change']
};
export function dossierEditor(root) {
  const inputs=new Map();
  for(const [section,fields] of Object.entries(sections)){
    const group=document.createElement('details'), title=document.createElement('summary');
    title.textContent=section;group.append(title);root.append(group);
    for(const field of fields){
      const label=document.createElement('label'),input=document.createElement('input');
      label.textContent=field; input.maxLength=2000;label.append(input);group.append(label);inputs.set(field,input);
    }
  }
  return {
    read:()=>Object.fromEntries([...inputs].filter(([,input])=>input.value.trim()).map(([field,input])=>[field,input.value.trim()])),
    show:values=>inputs.forEach((input,key)=>{input.value=values?.[key]||'';})
  };
}
export const boundaryTypes=['Sovereign','Administrative division','Estate','Disputed','Occupied','Military frontier','Vassal','Confederation member','Claim','Influence','Physical region'];
export function contains(points,p){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) inside=!inside;
  }
  return inside;
}
