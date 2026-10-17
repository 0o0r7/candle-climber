const TAPE = [
  {o:104,c:111,h:114,l:101},{o:111,c:107,h:113,l:104},{o:107,c:115,h:118,l:105},{o:115,c:114,h:119,l:110},
  {o:114,c:105,h:116,l:101},{o:105,c:98,h:108,l:94},{o:98,c:103,h:106,l:96},{o:103,c:112,h:116,l:101},
  {o:112,c:119,h:123,l:109},{o:119,c:116,h:121,l:113},{o:116,c:108,h:118,l:104},{o:108,c:101,h:111,l:97},
  {o:101,c:109,h:113,l:99},{o:109,c:118,h:122,l:106},{o:118,c:121,h:125,l:114},{o:121,c:113,h:123,l:109},
  {o:113,c:106,h:116,l:102},{o:106,c:110,h:114,l:103},{o:110,c:120,h:124,l:108},{o:120,c:117,h:122,l:114},
  {o:117,c:109,h:119,l:105},{o:109,c:102,h:111,l:98},{o:102,c:108,h:111,l:100},{o:108,c:116,h:120,l:106}
];
const $ = (id) => document.getElementById(id);
const laneEls = [...document.querySelectorAll('.lane')];
let state = { phase:'ready', lane:1, index:0, score:0, streak:0, bestStreak:0, clean:0, hull:3, sound:true, timer:null };
let profile = JSON.parse(localStorage.getItem('candle-current-profile') || '{"best":0,"sessions":0,"notes":0}');
const save = () => localStorage.setItem('candle-current-profile', JSON.stringify(profile));
const isUp = (c) => c.c >= c.o;
const calmLane = (i) => isUp(TAPE[i]) ? 0 : 2;
const boostLane = (i) => (i % 3 === 0 ? 1 : (calmLane(i) === 0 ? 2 : 0));
const laneName = (n) => ['HIGH','MID','LOW'][n];

function preview(){
  $('previewGrid').innerHTML = TAPE.slice(0,6).map((c,i)=>{
    const color = isUp(c) ? 'var(--cyan)' : 'var(--coral)';
    const top = 20 + ((125 - c.h) * 2.4); const height = 22 + Math.abs(c.c-c.o)*5;
    return `<div class="preview-bar ${i===0?'current':''}" style="--bar:${color};--top:${Math.max(6,top)}px;--height:${height}px"></div>`;
  }).join('');
}
function buildRail(){ $('railBars').innerHTML = TAPE.map((c,i)=>`<span class="rail-bar ${isUp(c)?'up':'down'}" data-rail="${i}"></span>`).join(''); }
function setHull(){ $('hull').textContent = '●'.repeat(state.hull) + '○'.repeat(3-state.hull); }
function updateHud(){ $('score').textContent=String(state.score).padStart(4,'0'); $('streak').textContent=String(state.streak).padStart(2,'0'); $('cellCount').textContent=String(Math.min(state.index+1,24)).padStart(2,'0')+' / 24'; setHull(); }
function renderCells(){
  laneEls.forEach(l=>l.innerHTML='');
  const start=Math.max(0,state.index-2); const end=Math.min(TAPE.length,state.index+7);
  for(let i=start;i<end;i++){
    const lane = i===state.index ? state.lane : (i===state.index+1 ? calmLane(i) : (i%3));
    const kind = lane===calmLane(i) ? 'calm' : lane===boostLane(i) ? 'boost' : 'turb';
    const x = 16 + (i-state.index+2)*14;
    const el=document.createElement('div'); el.className=`cell ${kind} ${i<state.index?'past':''} ${i===state.index?'current':''}`; el.style.left=`${x}%`; el.style.top=`${28+(i%4)*15}%`; el.textContent=kind==='calm'?'CALM':kind==='boost'?'BOOST':'ROUGH'; laneEls[lane].appendChild(el);
  }
  document.querySelectorAll('[data-rail]').forEach(el=>el.classList.toggle('current',Number(el.dataset.rail)===state.index));
  $('nextReadout').textContent = state.index<TAPE.length ? `NEXT / ${laneName(calmLane(state.index))} LANE IS CALM` : 'CROSSING COMPLETE';
  $('phaseTitle').textContent = state.index<TAPE.length ? (state.index===0?'Find the calm lane.':state.streak>1?'Clean signal. Keep the streak.':'Turbulence ahead. Read one bar forward.') : 'Tape crossed.';
}
function beep(freq=440){ if(!state.sound) return; try{const ac=window.__ccAudio||(window.__ccAudio=new AudioContext()); const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=.025;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.08)}catch(e){} }
function move(delta){ if(state.phase!=='playing') return; state.lane=Math.max(0,Math.min(2,state.lane+delta)); $('boat').style.left=`${45 + state.lane*25}%`; beep(320+state.lane*90); }
function resolveCell(){
  const i=state.index, calm=calmLane(i), boost=boostLane(i); const boat=$('boat');
  if(state.lane===calm){state.clean++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.score += 100 + state.streak*25; boat.classList.remove('hit'); beep(650);}
  else if(state.lane===boost){state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.score += 180 + state.streak*35;boat.classList.add('boost');setTimeout(()=>boat.classList.remove('boost'),260);beep(820);}
  else {state.hull--;state.streak=0;boat.classList.add('hit');setTimeout(()=>boat.classList.remove('hit'),350);beep(150);}
  state.index++;updateHud();renderCells();
  if(state.hull<=0){end(false);return} if(state.index>=TAPE.length){end(true);return} state.timer=setTimeout(resolveCell,850);
}
function start(){ clearTimeout(state.timer); state={...state,phase:'playing',lane:1,index:0,score:0,streak:0,bestStreak:0,clean:0,hull:3}; $('intro').classList.add('hidden');$('summary').classList.add('hidden');$('gameWrap').classList.remove('hidden');$('boat').style.left='70%';updateHud();renderCells();state.timer=setTimeout(resolveCell,850); }
function end(won){ clearTimeout(state.timer); state.phase='summary';profile.sessions++; if(state.score>profile.best)profile.best=state.score;if(won)profile.notes++;save();$('gameWrap').classList.add('hidden');$('summary').classList.remove('hidden');$('summaryStamp').textContent=won?'CROSSING COMPLETE':'SIGNAL LOST';$('summaryStamp').style.borderColor=won?'var(--cyan)':'var(--coral)';$('summaryStamp').style.color=won?'var(--cyan)':'var(--coral)';$('summaryTitle').textContent=won?(state.bestStreak>=6?'You found the rhythm.':'Clean signal.'):(state.clean>10?'The route was close.':'Turbulence won this tape.');$('finalScore').textContent=String(state.score).padStart(4,'0');$('cleanCells').textContent=String(state.clean).padStart(2,'0')+' / 24';$('bestStreak').textContent=String(state.bestStreak).padStart(2,'0');$('personalBest').textContent=String(profile.best).padStart(4,'0');$('summaryNote').textContent=won?`You read ${state.clean} calm cells and held a ${state.bestStreak}-cell signal streak. Your route note is saved locally — no wallet, no value, just a record of practice.`:`The break happened at cell ${Math.min(state.index,24)}. Try committing earlier to the ${laneName(calmLane(Math.min(state.index,TAPE.length-1)))} lane; the tape is deterministic, so the next crossing is a fair rematch.`; }
$('startBtn').onclick=start;$('retryBtn').onclick=start;$('resetBtn').onclick=()=>{localStorage.removeItem('candle-current-profile');profile={best:0,sessions:0,notes:0};$('personalBest').textContent='0000';};$('soundBtn').onclick=()=>{state.sound=!state.sound;$('soundBtn').textContent=state.sound?'SOUND ON':'SOUND OFF';};document.querySelectorAll('.control-btn').forEach(b=>b.onclick=()=>move(Number(b.dataset.move)));laneEls.forEach((el,i)=>el.addEventListener('click',()=>{if(state.phase==='playing'){state.lane=i;$('boat').style.left=`${45+i*25}%`;}}));document.addEventListener('keydown',e=>{if(['ArrowUp','a','A'].includes(e.key)){e.preventDefault();move(-1)}if(['ArrowDown','d','D'].includes(e.key)){e.preventDefault();move(1)}if(e.key===' '&&state.phase==='ready')start()});preview();buildRail();
