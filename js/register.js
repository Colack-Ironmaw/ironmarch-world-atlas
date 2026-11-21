const $ = id => document.getElementById(id);
const read = async name => {
  const response = await fetch('data/' + name + '.json');
  if (!response.ok) throw Error('Could not load ' + name);
  return response.json();
};
let db, records, privateMode = false;
function add(parent, tag, value) {
  const element = document.createElement(tag);
  element.textContent = value;
  parent.append(element);
  return element;
}
function show(row) {
  const panel = $('record');
  panel.replaceChildren();
  add(panel,'h2',row.name);
  for (const key of ['classification','continent','space','authority','detail','source','id']) {
    if (row[key]) add(panel,'p',key.charAt(0).toUpperCase()+key.slice(1)+' · '+row[key]);
  }
  if(row.environment) add(panel,'p',[...row.environment.terrain,row.environment.watershed && row.environment.watershed+' watershed'].filter(Boolean).join(' · '));
  const positions = db.Placements.filter(p => p.entity === row.id);
  for (const p of positions) add(panel,'p',[p.frame,p.status,'X '+p.x,'Y '+p.y,p.source].join(' · '));
  if (!positions.length) add(panel,'p','No recorded HD placement.');
  if (!privateMode && row.chart) {
    const link = add(panel,'a','Open atlas entry');
    link.href = './#map=hd&place='+encodeURIComponent(row.id);
  }
  for (const edge of db.Relationships.filter(e=>e.subject===row.id || e.object===row.id)) {
    const target = records.get(edge.subject===row.id ? edge.object : edge.subject);
    if (target) add(panel,'button',records.get(edge.subject).name+' · '+edge.relationship+' · '+records.get(edge.object).name).onclick=()=>show(target);
  }
  for (const route of db.Routes.filter(r=>r.from===row.id || r.to===row.id)) {
    add(panel,'p',[route.name,route.description,route.source].join(' · '));
  }
  for (const review of (db.Review||[]).filter(r=>r.entity===row.id)) add(panel,'p',[review.subject,review.evidence,review.resolution].join(' · '));
}
function filter() {
  const query=$('query').value.trim().toLowerCase(), kind=$('classification').value;
  const results=db.Locations.filter(r=>(!$('space').value || $('space').value===r.space) && (!kind || kind===r.classification) && [r.name,r.id,r.detail,r.continent].join(' ').toLowerCase().includes(query));
  $('count').textContent=(privateMode?'Private DM':'Player')+' register · '+results.length+' records';
  $('list').replaceChildren();
  for(const row of results) add($('list'),'button',row.name).onclick=()=>show(row);
  if(results.length) show(results[0]); else $('record').textContent='No matching records.';
}
function openRegister(data, local) {
  for(const key of ['Locations','Relationships','Placements','Routes']) if(!Array.isArray(data[key])) throw Error('Missing register table');
  if(data.Locations.some(r=>!r?.id || !r.name || !r.classification)) throw Error('Invalid location');
  db=data;privateMode=local;records=new Map(data.Locations.map(r=>[r.id,r]));
  $('query').value='';$('classification').replaceChildren(new Option('All classifications',''));
  for(const kind of [...new Set(data.Locations.map(r=>r.classification))].sort()) $('classification').add(new Option(kind,kind));
  filter();
}
try {
  const [places,powers,routes,physical]=await Promise.all(['locations','factions','routes','physical'].map(read));
  openRegister({
    Locations:[...places.map(r=>({...r,chart:true,space:"surface",environment:physical.find(e=>e.id===r.id),classification:r.subtype||r.type,detail:r.description,authority:r.canon})),...powers.map(r=>({...r,space:'surface',classification:'Political power',authority:r.status}))],
    Relationships:places.flatMap(r=>powers.filter(p=>p.name===r.power).map(p=>({subject:r.id,relationship:'affiliated with',object:p.id}))),
    Placements:places.filter(r=>r.positions.hd).map(r=>({...r.positions.hd,entity:r.id,frame:'HD',source:r.positions.hd.evidence})), Routes:routes
  },false);
} catch(error){$('count').textContent=error.message;}
$('space').onchange=$('query').oninput=$('classification').onchange=filter;
$('file').onchange=async event=>{
  try{const file=event.target.files[0];if(file)openRegister(JSON.parse(await file.text()),true);}
  catch{$('count').textContent='Choose the GIS Registers.json file.';}
  event.target.value='';
};
