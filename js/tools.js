import {boundaryTypes, contains, dossierEditor} from './geography.js';
import {buildSymbolPicker, drawSymbol, hasSymbol, symbolLabel} from './marker-symbols.js';
import {initTravelPaths, validateTravelPaths} from './travel-paths.js';
const NS='http://www.w3.org/2000/svg',KEY='varelden-personal-atlas-v1';
export function initEditor(api){
const $=id=>document.getElementById(id);
const dossier=dossierEditor($('dossier'));
const refreshSymbol = buildSymbolPicker($('marker-icon'), $('marker-preview'));
let state={version:1,frame:'hd-3932x2614',markers:[],party:null,calibration:null},mode='pan',points=[],editing=null,drag=null;
let travelEditor;
function validate(v){if(v?.version!==1||v.frame!=='hd-3932x2614'||!Array.isArray(v.markers)||v.markers.length>2000)throw Error('Unsupported atlas save');const ids=new Set();const pos=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=3932&&p.y<=2614;for(const m of v.markers){if(typeof m.id!=='string'||m.id==='party'||m.id.length>100||ids.has(m.id)||!pos(m)||!hasSymbol(m.icon)||typeof m.name!=='string'||m.name.length>200||typeof m.locked!=='boolean')throw Error('Invalid marker');ids.add(m.id);for(const k of ['nation','quests','notes'])if(typeof m[k]!=='string'||m[k].length>20000)throw Error('Invalid marker metadata');}if(v.party&&!pos(v.party))throw Error('Invalid party position');if(v.calibration&&(!(v.calibration.kmPerPixel>0)||!Number.isFinite(v.calibration.kmPerPixel)||typeof v.calibration.evidence!=='string'))throw Error('Invalid scale');if(v.boundaries!==undefined && (!Array.isArray(v.boundaries)||v.boundaries.some(b=>!b||typeof b.id!=='string'||!boundaryTypes.includes(b.kind)||!Array.isArray(b.points)||b.points.length<3||!b.points.every(pos))))throw Error('Invalid boundary');validateTravelPaths(v.travelPaths);return v;}
try{const saved=localStorage.getItem(KEY);if(saved)state=validate(JSON.parse(saved));}catch(e){$('personal-status').textContent='Saved data could not be loaded. Import a valid backup or create a new one.';}
window.atlasHiddenBaseIds=()=>new Set(state.markers.map(m=>m.baseId).filter(Boolean));
const say=s=>$('personal-status').textContent=s;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));say('Saved in this browser. Export a backup to transfer or keep a copy.');}catch{say('Browser storage unavailable. Export a backup before leaving.');}list();api.redraw();}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),total=()=>points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0);
function formatted(px){return state.calibration?`${(px*state.calibration.kmPerPixel).toFixed(2)} km / ${(px*state.calibration.kmPerPixel/1.609344).toFixed(2)} mi (${px.toFixed(3)} px)`:`${px.toFixed(3)} source pixels · scale not calibrated`;}
function setMode(m){if(m!=='pan')travelEditor?.pause();mode=m;$('tool-mode').value=m;say(m==='pan'?'Pan map; drag unlocked markers or party.':m==='party'?'Click the map to place the party.':m==='marker'?'Click the map to place the marker.':m==='relocate'?'Click the new position for this unlocked marker.':'Click points to measure a direct segment or a multi-segment path.');}
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
function draw(){const {map,svg,scene,selected}=api.state();if(!map)return;let g=$('personal-map');if(g)g.remove();g=el('g',{id:'personal-map'},scene);const vb=svg.getAttribute('viewBox').split(' ').map(Number),scale=vb[2]/$('mapstage').clientWidth;
for(const b of state.boundaries||[]){
 if(!shown.has(b.kind))continue;
 const area=el('polygon',{points:b.points.map(p=>p.x+','+p.y).join(' '),fill:'#d4ae62','fill-opacity':0.12,stroke:'#dfba65','stroke-width':1.5*scale,'pointer-events':'none'},g);
 el('title',{},area).textContent=b.name;
}
if(points.length){el('polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:'#fff1a8','stroke-width':3*scale,'pointer-events':'none'},g);for(const p of points)el('circle',{cx:p.x,cy:p.y,r:4*scale,fill:'#fff1a8','pointer-events':'none'},g);}
for(const m of [...state.markers,...(state.party?[{...state.party,id:'party',name:'Party',icon:'party',locked:false}]:[])]){if(m.icon==='transparent')continue;const token=el('g',{transform:`translate(${m.x} ${m.y}) scale(${scale})`,'data-personal-id':m.id,class:'personal-pin',role:'button',tabindex:0,'aria-label':`${m.name}, ${symbolLabel(m.icon)}${m.locked?', locked':''}`},g);el('circle',{cx:0,cy:0,r:17,fill:m.id==='party'?'#693c8d':'#174541',stroke:m.locked?'#b9b9ae':'#ffe2a1','stroke-width':2},token);drawSymbol(token,m.icon);el('text',{x:23,y:4,class:'personal-label'},token).textContent=m.name;token.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(m.id!=='party')edit(m.id);else say('Use Place party or drag the star to move the party.');}};}
$('measure-result').textContent=points.length?`${points.length} points · ${formatted(total())}`:'Click Measure, then two or more points. Distances follow the drawn straight segments.';$('scale-status').textContent=state.calibration?`Calibrated: ${state.calibration.kmPerPixel.toPrecision(8)} km/pixel. ${state.calibration.evidence}`:'Uncalibrated: exact image coordinates, no assumed miles or kilometres.';$('party-position').textContent=state.party?`Party: X ${state.party.x.toFixed(3)} · Y ${state.party.y.toFixed(3)}`:'Party not placed.';
let out=$('party-distance');if(out)out.remove();if(state.party&&selected?.positions?.hd){out=document.createElement('p');out.id='party-distance';out.textContent='Straight-line distance from party: '+formatted(distance(state.party,selected.positions.hd));$('detail').append(out);}}
const shown=new Set(boundaryTypes);
for(const kind of boundaryTypes){
 $('boundary-kind').add(new Option(kind,kind));
 const label=document.createElement('label'),box=document.createElement('input');
 box.type='checkbox';box.checked=true;box.onchange=()=>{if(box.checked)shown.add(kind);else shown.delete(kind);draw();};
 label.append(box,kind);$('boundary-layers').append(label);
}
$('boundary-list').onchange=()=>{
 const b=(state.boundaries||[]).find(b=>b.id===$('boundary-list').value);
 if(b){$('boundary-kind').value=b.kind;$('boundary-name').value=b.name;$('boundary-source').value=b.source;$('boundary-terrain').value=b.terrain;}
};
$('boundary-save').onclick=()=>{
 const name=$('boundary-name').value.trim(),source=$('boundary-source').value.trim();
 if(!name||!source||new Set(points.map(p=>p.x+','+p.y)).size<3){say('Enter a name and source and measure three distinct corners.');return;}
 const areas=state.boundaries??=[],id=$('boundary-list').value||crypto.randomUUID();
 const b={id,name,source,terrain:$('boundary-terrain').value,kind:$('boundary-kind').value,points:points.slice()};
 const i=areas.findIndex(a=>a.id===id);if(i<0)areas.push(b);else areas[i]=b;
 points=[];setMode('pan');save();$('boundary-list').value=id;
};
function list(){const bs=$('boundary-list'),old=bs.value;bs.replaceChildren(new Option('New boundary',''));for(const b of state.boundaries||[])bs.add(new Option(b.name,b.id));bs.value=old;const s=$('personal-list');s.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Choose a personal marker';s.append(empty);for(const m of state.markers){const o=document.createElement('option');o.value=m.id;o.textContent=`${m.name} · ${symbolLabel(m.icon)}${m.locked?' · locked':''}`;s.append(o);}if(editing)s.value=editing;}
function edit(id){const m=state.markers.find(x=>x.id===id);if(!m)return;editing=id;dossier.show(m.dossier);$('location-id').textContent='Location ID · '+m.id;
$('changes').textContent=(m.changes||[]).map(c=>c.date+' · '+c.fields.join(', ')).join('\n');
$('inherited').textContent=(state.boundaries||[]).filter(b=>b.kind==='Physical region'&&contains(b.points,m)&&b.terrain).map(b=>'Regional terrain · '+b.name+' · '+b.terrain+' ('+b.source+')').join(' / ');
$('personal-list').value=id;for(const k of ['name','icon','nation','quests','notes'])$('marker-'+k).value=m[k];refreshSymbol();$('marker-locked').checked=m.locked;$('marker-x').value=m.x.toFixed(3);$('marker-y').value=m.y.toFixed(3);say(`${m.name}: ${formatted(state.party?distance(state.party,m):0)}${state.party?' from party':''}. ${m.locked?'Position locked.':''}`);}
function fields(){return {dossier:dossier.read(),name:$('marker-name').value.trim()||'Unnamed marker',icon:$('marker-icon').value,nation:$('marker-nation').value,quests:$('marker-quests').value,notes:$('marker-notes').value,locked:$('marker-locked').checked};}
function point(e){const [x,y]=api.point(e);return{x:Math.max(0,Math.min(3932,x)),y:Math.max(0,Math.min(2614,y))};}
const svg=$('mapcanvas');svg.addEventListener('pointerdown',e=>{if(travelEditor?.isDrawing())return;if(e.button!==0)return;const target=e.target.closest('[data-personal-id]');if(mode==='pan'&&!target)return;e.preventDefault();e.stopImmediatePropagation();const p=point(e);if(mode==='measure'){points.push(p);draw();return}if(mode==='party'){state.party=p;setMode('pan');save();return}if(mode==='marker'){const m={id:crypto.randomUUID(),...fields(),...p};state.markers.push(m);editing=m.id;setMode('pan');save();edit(m.id);return}if(mode==='relocate'){const m=state.markers.find(m=>m.id===editing);if(m&&!m.locked){Object.assign(m,p);save();edit(m.id)}setMode('pan');return}if(target){const id=target.dataset.personalId,m=id==='party'?state.party:state.markers.find(m=>m.id===id);if(id!=='party')edit(id);if(m&&!m.locked){drag={id,previous:{x:m.x,y:m.y},start:p};svg.setPointerCapture(e.pointerId)}}},true);
svg.addEventListener('pointermove',e=>{const p=point(e);$('coordinate-readout').textContent=`X ${p.x.toFixed(3)} · Y ${p.y.toFixed(3)} | normalized ${(p.x/3932).toFixed(6)}, ${(p.y/2614).toFixed(6)}`;if(!drag)return;e.stopImmediatePropagation();const m=drag.id==='party'?state.party:state.markers.find(m=>m.id===drag.id);m.x=Math.max(0,Math.min(3932,drag.previous.x+p.x-drag.start.x));m.y=Math.max(0,Math.min(2614,drag.previous.y+p.y-drag.start.y));draw();},true);
svg.addEventListener('pointerup',e=>{if(drag){e.stopImmediatePropagation();drag=null;save();if(editing)edit(editing)}},true);svg.addEventListener('pointercancel',()=>{if(drag){const m=drag.id==='party'?state.party:state.markers.find(m=>m.id===drag.id);Object.assign(m,drag.previous);drag=null;draw();}},true);
$('tool-mode').onchange=()=>setMode($('tool-mode').value);$('clear-measure').onclick=()=>{points=[];draw()};$('undo-measure').onclick=()=>{points.pop();draw()};
$('calibrate').onclick=()=>{const px=total(),known=Number($('known-distance').value);if(!(px>0&&known>0&&Number.isFinite(known))||!$('scale-evidence').value.trim()){say('Measure a known reference first, then enter its positive distance and source.');return}state.calibration={kmPerPixel:known*($('known-unit').value==='mi'?1.609344:1)/px,evidence:$('scale-evidence').value.trim()};save()};$('clear-scale').onclick=()=>{state.calibration=null;save()};
$('personal-list').onchange=()=>edit($('personal-list').value);
$('new-marker').onclick=()=>{editing=null;setMode('marker')};$('move-marker').onclick=()=>{const m=state.markers.find(m=>m.id===editing);if(!m||m.locked){say('Select a marker and unlock it before moving.');return}setMode('relocate')};
$('save-marker').onclick=()=>{const m=state.markers.find(m=>m.id===editing);if(!m){say('Create or select a marker first.');return}const f=fields();if(!m.locked){const x=Number($('marker-x').value),y=Number($('marker-y').value);if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>3932||y>2614){say('Coordinates must stay inside the image.');return}if($('marker-x').value!==m.x.toFixed(3))m.x=x;if($('marker-y').value!==m.y.toFixed(3))m.y=y;}const changed=Object.keys({...m.dossier,...f.dossier}).filter(k=>m.dossier?.[k]!==f.dossier[k]);
if(changed.length)(m.changes??=[]).push({date:f.dossier['Campaign date']||'Undated',fields:changed,previous:m.dossier||{},next:f.dossier});
Object.assign(m,f);save();edit(m.id)};
$('delete-marker').onclick=()=>{if(!editing)return;state.markers=state.markers.filter(m=>m.id!==editing);editing=null;save()};
$('copy-place').onclick=()=>{const l=api.state().selected,p=l?.positions?.hd;if(!p){say('Select a placed atlas location first.');return}let m=state.markers.find(m=>m.baseId===l.id);if(!m){m={id:crypto.randomUUID(),baseId:l.id,name:l.name,icon:hasSymbol(l.subtype)?l.subtype:l.type==='region'?'region':'pin',nation:l.power||'',quests:'',notes:l.description,locked:true,x:p.x,y:p.y};state.markers.push(m);save()}edit(m.id);say('Personal editable copy created, initially locked. The published canon record is unchanged.');};
$('export-personal').onclick=()=>{if(travelEditor?.hasDraft()){say('Save or discard the travel path draft before exporting.');return;}const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='varelden-personal-atlas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('import-personal').onchange=async()=>{const f=$('import-personal').files[0];if(!f)return;try{if(f.size>5000000)throw Error('Save is too large');const next=validate(JSON.parse(await f.text()));state=next;editing=null;points=[];travelEditor?.reset();save();say('Backup restored, replacing personal markers, boundaries, travel paths, party and scale.')}catch(e){say('Import rejected: '+e.message)}$('import-personal').value='';};
document.addEventListener('atlas-view',draw);travelEditor=initTravelPaths({api,getState:()=>state,save,setMode,say,formatted});list();api.redraw();draw();
}
