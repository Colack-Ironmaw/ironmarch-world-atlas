export const travelTypes = {
  road: {label:'Road', color:'#e8bb77', dash:''},
  trail: {label:'Trail / track', color:'#d8c9a7', dash:'3 5'},
  'river-boat': {label:'River boat passage', color:'#78d5ff', dash:'10 4'},
  barge: {label:'Barge route', color:'#54bdbb', dash:'12 3 2 3'},
  ferry: {label:'Ferry crossing', color:'#b4e9ff', dash:'3 3'},
  shipping: {label:'Shipping lane', color:'#9daeff', dash:'16 6'}
};
export const pathLength = points => points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);
export function validateTravelPaths(paths) {
  if(paths===undefined)return;
  if(!Array.isArray(paths)||paths.length>500)throw Error('Invalid travel paths');
  const ids=new Set();
  for(const p of paths){
    if(!p||typeof p.id!=='string'||!p.id||p.id.length>100||ids.has(p.id)||!Object.hasOwn(travelTypes,p.kind)||typeof p.locked!=='boolean')throw Error('Invalid travel path identity or type');
    ids.add(p.id);
    for(const [field,max] of Object.entries({name:200,from:200,to:200,direction:40,status:40,source:2000,notes:20000}))if(typeof p[field]!=='string'||p[field].length>max)throw Error('Invalid travel path '+field);
    if(!p.name.trim()||!['both','forward'].includes(p.direction)||!['proposed','working','confirmed'].includes(p.status))throw Error('Invalid travel path details');
    if(!Array.isArray(p.points)||p.points.length<2||p.points.length>2000||p.points.some(q=>!q||!Number.isFinite(q.x)||!Number.isFinite(q.y)||q.x<0||q.y<0||q.x>3932||q.y>2614)||pathLength(p.points)===0)throw Error('Travel paths need distinct points within the HD map');
  }
}

export function initTravelPaths({api,getState,save,setMode,say,formatted}){
  const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
  const panel=document.createElement('details');panel.id='travel-tools';panel.open=true;
  panel.innerHTML=`<summary>Travel paths</summary>
    <p class="muted">Draw along rivers, roads or sea passages. Routes stay in your personal browser save and JSON backup.</p>
    <label><input id="travel-visible" type="checkbox" checked> Show personal travel paths</label>
    <label for="travel-list">Saved path</label><select id="travel-list"><option value="">Choose a path</option></select>
    <button id="travel-new">New path</button><button id="travel-edit">Edit selected path</button>
    <label for="travel-name">Path name</label><input id="travel-name" maxlength="200">
    <label for="travel-kind">Travel type</label><select id="travel-kind"></select>
    <div class="filters"><label>From<input id="travel-from" maxlength="200"></label><label>To<input id="travel-to" maxlength="200"></label></div>
    <label>Direction<select id="travel-direction"><option value="both">Both directions</option><option value="forward">One way: first point → last point</option></select></label>
    <label>Authority<select id="travel-status"><option value="proposed">Proposed</option><option value="working">Working</option><option value="confirmed">Confirmed by you</option></select></label>
    <label>Source / placement evidence<input id="travel-source" maxlength="2000"></label>
    <label>Route notes<textarea id="travel-notes" maxlength="20000" placeholder="Conditions, travel estimates, tolls, navigability, hazards…"></textarea></label>
    <label><input id="travel-locked" type="checkbox"> Lock path shape</label>
    <p id="travel-result" class="muted" aria-live="polite"></p>
    <button id="travel-draw">Draw / extend: click map</button><button id="travel-move">Move points: drag handles</button><button id="travel-insert">Insert bend: click near segment</button>
    <label>Selected point<select id="travel-point"></select></label>
    <div class="filters"><label>X<input id="travel-x" type="number" min="0" max="3932" step="any"></label><label>Y<input id="travel-y" type="number" min="0" max="2614" step="any"></label></div>
    <button id="travel-point-save">Update point</button><button id="travel-point-delete">Remove point</button><button id="travel-undo">Undo shape change</button><button id="travel-reverse">Reverse path</button>
    <button id="travel-save">Save path</button><button id="travel-cancel">Discard edits</button><button id="travel-delete">Delete selected path</button>
    <p id="travel-status-message" role="status" class="muted">Choose New path, then click two or more points on the map.</p>`;
  $('export-personal').before(panel);
  for(const [id,t]of Object.entries(travelTypes))$('travel-kind').add(new Option(t.label,id));
  let draft=null,action=null,pointIndex=0,history=[],drag=null;
  const message=t=>{$('travel-status-message').textContent=t;};
  const fields=['name','kind','from','to','direction','status','source','notes'];
  const checkpoint=()=>{history.push(structuredClone({points:draft.points,from:draft.from,to:draft.to}));if(history.length>100)history.shift();};
  function read(){if(!draft)return;for(const f of fields)draft[f]=$('travel-'+f).value;draft.locked=$('travel-locked').checked;}
  function editable(){if(!draft){message('Choose New path or Edit selected path first.');return false;}read();if(draft.locked){message('Unlock the path shape to change its points.');return false;}return true;}
  function list(){const select=$('travel-list'),old=select.value;select.replaceChildren(new Option('Choose a path',''));for(const r of getState().travelPaths||[])select.add(new Option(r.name+' · '+travelTypes[r.kind].label,r.id));select.value=old;}
  function pointFields(){const select=$('travel-point');select.replaceChildren();if(!draft)return;draft.points.forEach((_,i)=>select.add(new Option(`${i+1}${i===0?' · start':i===draft.points.length-1?' · end':''}`,String(i))));pointIndex=Math.max(0,Math.min(pointIndex,draft.points.length-1));select.value=String(pointIndex);const p=draft.points[pointIndex];$('travel-x').value=p?.x??'';$('travel-y').value=p?.y??'';}
  function show(){if(draft){for(const f of fields)$('travel-'+f).value=draft[f];$('travel-locked').checked=draft.locked;}pointFields();draw();}
  function begin(r){setMode('pan');draft=structuredClone(r);action=draft.locked?null:'move';history=[];pointIndex=0;show();message('Editing a draft. Save path to keep changes, or Discard edits.');}
  function allowSwitch(){if(!draft)return true;message('Save the current path or Discard edits before selecting another.');return false;}
  function draw(){let g=$('travel-map');g?.remove();$('travel-handles')?.remove();if(!api.state().map||api.state().map.id!=='hd')return;
    const scene=api.state().scene;g=document.createElementNS(ns,'g');g.id='travel-map';scene.insertBefore(g,$('personal-map'));const handles=document.createElementNS(ns,'g');handles.id='travel-handles';scene.append(handles);
    const add=(tag,attrs,parent=g)=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;};
    const scale=Number($('mapcanvas').getAttribute('viewBox').split(' ')[2])/$('mapstage').clientWidth;
    if($('travel-visible').checked)for(const r of [...(getState().travelPaths||[]).filter(r=>r.id!==draft?.id),...(draft?[draft]:[])]){
      if(!r.points.length)continue;const t=travelTypes[r.kind]||travelTypes.road,selected=r.id===draft?.id||r.id===$('travel-list').value;
      const pts=r.points.map(p=>p.x+','+p.y).join(' ');
      add('polyline',{points:pts,fill:'none',stroke:'#102829','stroke-width':(selected?8:6)*scale,'pointer-events':'none'});
      const line=add('polyline',{points:pts,fill:'none',stroke:t.color,'stroke-width':(selected?4:3)*scale,'stroke-dasharray':t.dash.split(' ').filter(Boolean).map(n=>Number(n)*scale).join(' '),'stroke-linecap':'round','stroke-linejoin':'round','pointer-events':'none'});add('title',{},line).textContent=r.name+' · '+t.label;
      if(r.direction==='forward')for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b.x-a.x,b.y-a.y);if(len<12*scale)continue;const x=(a.x+b.x)/2,y=(a.y+b.y)/2;add('path',{d:'M-6 -5L0 0L-6 5',transform:`translate(${x} ${y}) rotate(${Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI}) scale(${scale})`,fill:'none',stroke:t.color,'stroke-width':2,'pointer-events':'none'});}
      if(selected){const p=r.points[0];add('text',{x:p.x+10*scale,y:p.y-12*scale,class:'personal-label','font-size':12*scale,'pointer-events':'none'}).textContent=r.name||'New path';}
      if(r===draft)r.points.forEach((p,i)=>{const h=add('circle',{cx:p.x,cy:p.y,r:(i===pointIndex?7:5)*scale,fill:i===pointIndex?'#fff1a8':t.color,stroke:'#102829','stroke-width':2*scale,'data-travel-point':i,tabindex:0,role:'button','aria-label':`Select path point ${i+1}`},handles);h.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pointIndex=i;pointFields();draw();}};});
    }
    const r=draft||(getState().travelPaths||[]).find(r=>r.id===$('travel-list').value);
    $('travel-result').textContent=r?`${draft?'Unsaved draft · ':''}${r.points.length} points · ${formatted(pathLength(r.points))}${r.direction==='forward'?' · one way':''}`:'No path selected.';
  }
  $('travel-new').onclick=()=>{if(!allowSwitch())return;begin({id:crypto.randomUUID(),name:'New travel path',kind:'road',from:'',to:'',direction:'both',status:'proposed',source:'',notes:'',locked:false,points:[]});action='draw';message('Click along the route to add points. Save path when finished.');};
  $('travel-edit').onclick=()=>{if(!allowSwitch())return;const r=(getState().travelPaths||[]).find(r=>r.id===$('travel-list').value);if(r)begin(r);else message('Select a saved path first.');};
  $('travel-list').onchange=()=>{if(draft){$('travel-list').value=draft.id;message('Save or Discard edits first.');return;}const r=(getState().travelPaths||[]).find(r=>r.id===$('travel-list').value);if(r){for(const f of fields)$('travel-'+f).value=r[f];$('travel-locked').checked=r.locked;}draw();};
  for(const mode of ['draw','move','insert'])$('travel-'+mode).onclick=()=>{if(!editable())return;setMode('pan');action=mode;draw();message(mode==='draw'?'Click the map to append points.':mode==='move'?'Drag a point handle to move it.':'Click near a path segment to insert a bend.');};
  for(const f of fields)$('travel-'+f).addEventListener('input',()=>{if(draft){read();draw();}});
  $('travel-locked').onchange=()=>{if(draft){read();action=null;draw();}};
  $('travel-point').onchange=()=>{pointIndex=Number($('travel-point').value);pointFields();draw();};
  $('travel-point-save').onclick=()=>{if(!editable()||!draft.points.length)return;const xs=$('travel-x').value,ys=$('travel-y').value,x=Number(xs),y=Number(ys);if(!xs||!ys||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>3932||y>2614){message('Enter coordinates inside the HD map.');return;}checkpoint();draft.points[pointIndex]={x,y};pointFields();draw();};
  $('travel-point-delete').onclick=()=>{if(!editable()||!draft.points.length)return;checkpoint();draft.points.splice(pointIndex,1);pointFields();draw();};
  $('travel-undo').onclick=()=>{if(!editable()||!history.length)return;Object.assign(draft,history.pop());show();};
  $('travel-reverse').onclick=()=>{if(!editable())return;checkpoint();draft.points.reverse();[draft.from,draft.to]=[draft.to,draft.from];show();};
  $('travel-save').onclick=()=>{if(!draft){message('Choose New path or Edit selected path first.');return;}read();try{validateTravelPaths([draft]);const state=getState(),paths=state.travelPaths??=[],i=paths.findIndex(r=>r.id===draft.id),id=draft.id;if(i<0&&paths.length>=500)throw Error('Maximum 500 saved paths');if(i<0)paths.push(structuredClone(draft));else paths[i]=structuredClone(draft);draft=null;action=null;history=[];save();list();$('travel-list').value=id;draw();message('Path saved. Export personal backup to keep a transferable copy.');}catch(e){message(e.message);}};
  $('travel-cancel').onclick=()=>{draft=null;action=null;drag=null;history=[];pointFields();draw();message('Draft discarded; saved paths unchanged.');};
  $('travel-delete').onclick=()=>{if(draft){message('Save or Discard edits before deleting a saved path.');return;}const state=getState(),r=(state.travelPaths||[]).find(r=>r.id===$('travel-list').value);if(!r)return;if(!confirm(`Delete travel path “${r.name}”?`))return;state.travelPaths=state.travelPaths.filter(p=>p.id!==r.id);save();list();draw();message('Path deleted.');};
  $('travel-visible').onchange=draw;
  const svg=$('mapcanvas');
  svg.addEventListener('pointerdown',e=>{if(e.button!==0||!draft||!action||api.state().map.id!=='hd')return;e.preventDefault();e.stopImmediatePropagation();if(!editable())return;const [x,y]=api.point(e);if(x<0||y<0||x>3932||y>2614)return;const p={x,y},handle=e.target.closest('[data-travel-point]');
    if(handle){pointIndex=Number(handle.dataset.travelPoint);if(action==='move'){checkpoint();drag={index:pointIndex,previous:structuredClone(draft.points)};svg.setPointerCapture(e.pointerId);}pointFields();draw();return;}
    if(action==='draw'){if(draft.points.length>=2000){message('Maximum 2,000 points per path.');return;}checkpoint();draft.points.push(p);pointIndex=draft.points.length-1;}
    if(action==='insert'){if(draft.points.length<2||draft.points.length>=2000){message('Insertion needs an existing segment and fewer than 2,000 points.');return;}let best=Infinity,index=1;for(let i=1;i<draft.points.length;i++){const a=draft.points[i-1],b=draft.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1))),dist=Math.hypot(x-a.x-t*dx,y-a.y-t*dy);if(dist<best){best=dist;index=i;}}const scale=Number(svg.getAttribute('viewBox').split(' ')[2])/$('mapstage').clientWidth;if(best>24*scale){message('Click closer to the segment where you want a bend.');return;}checkpoint();draft.points.splice(index,0,p);pointIndex=index;}
    pointFields();draw();
  },true);
  svg.addEventListener('pointermove',e=>{if(!drag||!draft)return;e.preventDefault();e.stopImmediatePropagation();const [x,y]=api.point(e);draft.points[drag.index]={x:Math.max(0,Math.min(3932,x)),y:Math.max(0,Math.min(2614,y))};pointFields();draw();},true);
  svg.addEventListener('pointerup',e=>{if(drag){e.stopImmediatePropagation();drag=null;message('Point moved in draft. Save path to keep it.');}},true);
  svg.addEventListener('pointercancel',()=>{if(drag&&draft){draft.points=drag.previous;history.pop();drag=null;pointFields();draw();}},true);
  $('tool-mode').addEventListener('change',()=>{action=null;message(draft?'Drawing paused. Draft retained; Save path or resume a path tool.':'Choose New path to draw.');});
  document.addEventListener('atlas-view',draw);
  list();draw();
  return {reset(){draft=null;action=null;drag=null;history=[];list();pointFields();draw();message('Travel paths loaded from the restored backup.');},pause(){action=null;},hasDraft:()=>!!draft,isDrawing:()=>!!draft&&!!action&&api.state().map.id==='hd'};
}
