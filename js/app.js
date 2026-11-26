

const BUILD=["Administration","Science Building","Library","Gymnasium","Canteen","Dormitory"];
const ZONE={"Administration":"A","Library":"A","Science Building":"B","Gymnasium":"B","Canteen":"C","Dormitory":"C"};
const CATS={"Electrical":"⚡","Plumbing":"💧","Carpentry":"🪚","IT and Network":"📶","Air Conditioning":"❄️","Cleaning":"🧹","Safety and Security":"🛡️"};
const URG={Low:{p:1,h:120},Medium:{p:2,h:72},High:{p:3,h:24},Critical:{p:4,h:4}};
const FLOW={Pending:["Assigned"],Assigned:["In Progress"],"In Progress":["Resolved"],Resolved:["Closed","In Progress"],Closed:[]};
const STEPS=["Pending","Assigned","In Progress","Resolved","Closed"];
const SEED=[
{id:1,name:"R. Santos",zone:"A",cap:4,skill:{"Electrical":.9,"IT and Network":.4,"Air Conditioning":.5}},
{id:2,name:"M. Reyes",zone:"B",cap:4,skill:{"Plumbing":.95,"Carpentry":.5,"Cleaning":.3}},
{id:3,name:"J. Dela Cruz",zone:"C",cap:3,skill:{"Carpentry":.9,"Plumbing":.4,"Safety and Security":.5}},
{id:4,name:"A. Villanueva",zone:"A",cap:5,skill:{"IT and Network":.95,"Electrical":.5}},
{id:5,name:"L. Garcia",zone:"B",cap:3,skill:{"Air Conditioning":.9,"Electrical":.6}},
{id:6,name:"P. Mendoza",zone:"C",cap:6,skill:{"Cleaning":.95,"Safety and Security":.7}}];
let DB,ME=null,F="All",W={step:1,cat:"",urg:"Medium",photo:""},AM="login",AP="",R={},AF="All",AN="",busy=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=t=>new Date(t).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
function load(){try{DB=JSON.parse(localStorage.getItem("fixit"))}catch(e){}if(!DB)DB={staff:SEED,issues:[],next:1001};DB.users=DB.users||[]}
function migrate(){const taken=new Set(DB.users.filter(u=>u.username).map(u=>u.username.toLowerCase()));
 [...DB.users].sort((a,b)=>(b.role==="admin")-(a.role==="admin")).forEach(u=>{if(u.username)return;
  const b=((u.role==="admin"?"admin":(u.sno||(u.email||"user").split("@")[0]))+"").toLowerCase().replace(/[^a-z0-9._-]/g,"")||"user";let n=b,k=1;while(taken.has(n))n=b+(++k);u.username=n;u.migrated=true;taken.add(n)})}
function save(){try{localStorage.setItem("fixit",JSON.stringify(DB))}catch(e){toast("Storage is full. Remove old data.")}}
const loadOf=s=>DB.issues.filter(i=>i.staff===s.id&&["Assigned","In Progress"].includes(i.status)).length;
const find=c=>DB.issues.find(i=>i.code===c);
/* ALGORITHM 1: MATCHING */
function scoreStaff(i,s){if(s.off)return null;const l=loadOf(s);if(l>=s.cap)return null;const skill=s.skill[i.cat]||0,cap=1-l/s.cap,zone=s.zone===ZONE[i.building]?1:.4;return{s,skill,cap,zone,total:Math.round((.5*skill+.3*cap+.2*zone)*100)}}
function match(i){const r=DB.staff.map(s=>scoreStaff(i,s)).filter(x=>x&&x.skill>0).sort((a,b)=>b.total-a.total);
 i.ranking=r.map(x=>({name:x.s.name,total:x.total,skill:x.skill,load:loadOf(x.s),cap:x.s.cap}));if(!r.length)return false;
 i.staff=r[0].s.id;move(i,"Assigned","Auto-matched to "+r[0].s.name+" (score "+r[0].total+")");return true}
function rematch(){DB.issues.filter(i=>i.status==="Pending").sort((a,b)=>priority(b)-priority(a)).forEach(match)}
function priority(i){return URG[i.urgency].p*25+(i.cat==="Safety and Security"?15:0)+Math.min((Date.now()-i.created)/36e5,24)}
/* ALGORITHM 2: STATUS TRACKING */
function move(i,to,note){if(i.status&&!FLOW[i.status].includes(to))return false;i.status=to;i.history.push({t:Date.now(),status:to,note:note||""});return true}
const due=i=>i.created+URG[i.urgency].h*36e5;
const late=i=>!["Resolved","Closed"].includes(i.status)&&Date.now()>due(i);
const toast=m=>{const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.k);toast.k=setTimeout(()=>t.classList.remove("on"),2200)};

const IC={home:'<path d="M3 11l9-8 9 8v10H3z"/>',track:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',admin:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.500-1-8-4-8-9V6z"/>',staff:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 4a4 4 0 010 8M22 21c0-3-1.500-5-4-5.500"/>',plus:'<path d="M12 5v14M5 12h14"/>'};
const TS={student:[["home","Home"],["new","New report"],["track","My reports"]],admin:[["admin","Queue"],["users","Users"],["staff","Team"]]};
function buildTabs(){$("tabs").innerHTML=TS[ME.role].map(([k,l])=>k==="new"?'<button class="fab" data-t="new" aria-label="New report" onclick="tab(\'new\')"><svg viewBox="0 0 24 24">'+IC.plus+'</svg><span class="fl">New report</span></button>':'<button class="tab" data-t="'+k+'" onclick="tab(\''+k+'\')"><svg viewBox="0 0 24 24">'+IC[k==="users"?"staff":k==="admin"?"admin":k]+'</svg><span class="tlb">'+l+'</span></button>').join("")}
function tab(k){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("on",v.id==="v-"+k));document.querySelectorAll("[data-t]").forEach(b=>b.classList.toggle("on",b.dataset.t===k));if(k==="new"){W.step=1;wizard()}$("ptitle").textContent=TITLES[k]||"";render();scrollTo(0,0)}

function card(i){const f=STEPS.indexOf(i.status);return '<div tabindex="0" role="button" class="card issue u'+URG[i.urgency].p+'" onclick="openI(\''+i.code+'\')"><div class="ico">'+(i.photo?'<img src="'+i.photo+'" alt="">':CATS[i.cat])+'</div><div class="grow"><b>'+esc(i.cat)+' at '+esc(i.room)+'</b><div class="meta">'+esc(i.building)+' &middot; '+i.code+' &middot; '+fmt(i.created)+'</div><div class="prog">'+STEPS.map((s,k)=>'<i class="'+(k<=f?"f":"")+'"></i>').join("")+'</div><span class="pill '+i.status+'">'+i.status+'</span> '+(late(i)?'<span class="late">Overdue</span>':'')+'</div></div>'}
function renderFeed(){const n=$("q").value.toLowerCase();let l=DB.issues.filter(i=>["Resolved","Closed"].includes(i.status)&&(F==="All"||i.status===F)&&(i.cat+i.room+i.building+i.code+i.desc).toLowerCase().includes(n)).sort((a,b)=>b.history[b.history.length-1].t-a.history[a.history.length-1].t);
 $("feed").innerHTML=l.length?l.map(card).join(""):'<div class="empty">No completed tasks yet.</div>'}
const stat=x=>'<div class="st"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>';
const open_=i=>!["Resolved","Closed"].includes(i.status);
const TITLES={home:"Dashboard",new:"New report",track:"My reports",admin:"Issue queue",users:"Student accounts",staff:"Maintenance team"};
const chip=(v,cur,fn)=>'<button class="chip '+(cur===v?"on":"")+'" onclick="'+fn+'(\''+v+'\')">'+v+'</button>';
const setF=v=>{F=v;render()},setAF=v=>{AF=v;render()};
function render(){if(!ME||document.hidden)return;const c=s=>DB.issues.filter(i=>i.status===s).length,done=c("Resolved")+c("Closed");
 if(ME.role==="student"){const m=DB.issues.filter(i=>i.uid===ME.id).sort((a,b)=>b.created-a.created);
  $("stats").innerHTML=[["Completed",done],["My reports",m.length],["My active",m.filter(open_).length]].map(stat).join("");
  $("note").innerHTML=ME.migrated&&!ME.ack?'<div class="card note"><b>Your username is '+esc(ME.username)+'</b><p class="meta">Accounts from the earlier version use the student ID number as the username. Use it with your existing password.</p><button class="btn s" onclick="ack()">Got it</button></div>':(ME.status!=="Verified"?'<div class="card note"><b>ID verification pending</b><p class="meta">You can view completed tasks now. Filing reports unlocks after an admin verifies your school ID.</p></div>':"");
  $("chips").innerHTML=["All","Resolved","Closed"].map(x=>chip(x,F,"setF")).join("");
  renderFeed();$("mine").innerHTML=m.length?m.map(card).join(""):'<div class="empty">You have not reported anything yet.<br>Use New report to start.</div>';return}
 $("astats").innerHTML=[["Total",DB.issues.length],["Pending",c("Pending")],["Assigned",c("Assigned")],["In progress",c("In Progress")],["Done",done]].map(stat).join("");
 $("abanner").innerHTML=ME.demo?'<div class="card note"><b>Demo administrator account</b><p class="meta">The default login (admin / admin) is for demonstration only. Replace it with secure authentication before real use.</p></div>':"";
 $("achips").innerHTML=["All","Pending","Assigned","In Progress","Resolved","Closed"].map(x=>chip(x,AF,"setAF")).join("");
 const qs=($("aq").value||"").toLowerCase();
 const q=DB.issues.filter(i=>(AF==="All"||i.status===AF)&&(i.code+i.cat+i.room+i.building+i.desc+i.name).toLowerCase().includes(qs)).sort((a,b)=>priority(b)-priority(a));
 $("queue").innerHTML=q.length?'<table class="tbl"><thead><tr><th>Code</th><th>Issue</th><th>Location</th><th>Urgency</th><th>Status</th><th>Assigned</th><th>Reported</th></tr></thead><tbody>'+q.map(i=>{const s=DB.staff.find(x=>x.id===i.staff);return '<tr class="rw" tabindex="0" onclick="openA(\''+i.code+'\')"><td data-l="Code"><b>'+i.code+'</b></td><td data-l="Issue">'+CATS[i.cat]+' '+esc(i.cat)+'</td><td data-l="Location">'+esc(i.building)+', '+esc(i.room)+'</td><td data-l="Urgency">'+i.urgency+' <span class="meta">('+Math.round(priority(i))+')</span></td><td data-l="Status"><span class="pill '+i.status+'">'+i.status+'</span>'+(late(i)?' <span class="late">Overdue</span>':'')+'</td><td data-l="Assigned">'+(s?esc(s.name):"Unassigned")+'</td><td data-l="Reported">'+fmt(i.created)+'</td></tr>'}).join("")+'</tbody></table>':'<div class="empty">No matching reports.</div>';
 const us=DB.users.filter(u=>u.role==="student");
 $("ulist").innerHTML=us.length?'<table class="tbl"><thead><tr><th>Name</th><th>Username</th><th>Student ID</th><th>Grade and section</th><th>Status</th></tr></thead><tbody>'+us.map(u=>'<tr class="rw" tabindex="0" onclick="openU(\''+u.id+'\')"><td data-l="Name"><b>'+esc(u.name)+'</b></td><td data-l="Username">'+esc(u.username)+'</td><td data-l="Student ID">'+esc(u.sno||"")+'</td><td data-l="Grade">'+esc(u.grade||"")+'</td><td data-l="Status"><span class="pill '+u.status+'">'+u.status+'</span></td></tr>').join("")+'</tbody></table>':'<div class="empty">No student has registered yet.</div>';
 $("staffl").innerHTML=DB.staff.map(s=>{const l=loadOf(s);return '<div class="card'+(s.off?" off":"")+'"><div class="rowb"><b>'+esc(s.name)+'</b><span class="meta">Zone '+s.zone+(s.off?" &middot; Inactive":"")+'</span></div><div class="meta">'+Object.entries(s.skill).map(([k,v])=>CATS[k]+" "+Math.round(v*100)+"%").join("  ")+'</div><div class="meta" style="margin-top:6px">Workload '+l+' of '+s.cap+'</div><div class="bar"><div style="width:'+Math.min(100,l/s.cap*100)+'%"></div></div><div class="act"><label class="lb inl" for="cap'+s.id+'">Capacity</label><input class="num" id="cap'+s.id+'" type="number" min="1" max="20" value="'+s.cap+'" onchange="setCap('+s.id+',this.value)"><button class="btn s g" style="margin:0" onclick="togS('+s.id+')">'+(s.off?"Activate":"Deactivate")+'</button></div></div>'}).join("")}
function setCap(id,v){const n=+v;if(!(n>=1&&n<=20)){toast("Capacity must be from 1 to 20.");render();return}DB.staff.find(s=>s.id===id).cap=n;rematch();save();render();toast("Capacity updated")}
function togS(id){const s=DB.staff.find(x=>x.id===id);s.off=!s.off;rematch();save();render();toast(s.off?"Staff deactivated":"Staff activated")}
function addStaff(){const n=$("sn").value.trim(),cap=+$("sc").value,sk=[...document.querySelectorAll("#sk input:checked")].map(x=>x.value);let bad=0;
 ["sn","sc"].forEach(x=>{$(x).classList.remove("bad");$("e_"+x).textContent=""});$("e_sk").textContent="";
 if(!n){fe("sn","Enter the staff name.");bad=1}if(!(cap>=1&&cap<=20)){fe("sc","Capacity must be from 1 to 20.");bad=1}if(!sk.length){$("e_sk").textContent="Select at least one skill.";bad=1}
 if(bad)return;DB.staff.push({id:Math.max(0,...DB.staff.map(s=>s.id))+1,name:n,zone:$("sz").value,cap,skill:Object.fromEntries(sk.map(k=>[k,.85]))});
 rematch();save();render();$("sn").value="";document.querySelectorAll("#sk input").forEach(x=>x.checked=false);toast("Staff member added")}
function ma(c){const i=find(c),s=DB.staff.find(x=>x.id==$("ms").value);if(!s||s.off){toast("Choose an active staff member.");return}
 if(loadOf(s)>=s.cap&&s.id!==i.staff){toast(s.name+" is at the workload limit.");return}
 if(i.status==="Pending"){i.staff=s.id;move(i,"Assigned","Manually assigned to "+s.name)}else if(i.staff!==s.id){i.staff=s.id;i.history.push({t:Date.now(),status:i.status,note:"Reassigned to "+s.name})}
 save();render();openA(c);toast("Assigned to "+s.name)}
function ack(){ME.ack=true;save();render()}

function wizard(){if(ME&&ME.status!=="Verified"){$("wiz").innerHTML="";$("wbody").innerHTML='<div class="card c"><div style="font-size:38px">🔒</div><h2>Reporting is locked</h2><p class="meta">An admin must verify your school ID before you can file facility reports. You can still view completed tasks on the dashboard.</p><button class="btn" onclick="tab(\'home\')">Back to dashboard</button></div>';return}const s=W.step;$("wiz").innerHTML=[1,2,3].map(k=>'<i class="'+(k<=s?"f":"")+'"></i>').join("");let h="";
 if(s===1)h='<h3>What kind of problem is it?</h3><div class="cats">'+Object.keys(CATS).map(c=>'<button class="cat '+(W.cat===c?"on":"")+'" onclick="W.cat=\''+c+'\';W.step=2;wizard()"><span>'+CATS[c]+'</span>'+c+'</button>').join("")+'</div>';
 if(s===2)h='<h3>Where is it?</h3><label style="margin-top:0" for="wb">Building</label><select id="wb">'+BUILD.map(b=>"<option "+(W.b===b?"selected":"")+">"+b+"</option>").join("")+'</select><label for="wr">Room or area</label><input id="wr" value="'+esc(W.r||"")+'" placeholder="e.g. Room 204"><div class="fe" id="e_wr" role="alert"></div><label>How urgent?</label><div class="seg">'+Object.keys(URG).map(u=>'<button class="'+(W.urg===u?"on":"")+'" onclick="keep();W.urg=\''+u+'\';wizard()">'+u+'</button>').join("")+'</div><button class="btn" onclick="keep();if(!W.r){fe(\'wr\',\'Enter the room or area.\');return}W.step=3;wizard()">Continue</button><button class="btn o" onclick="keep();W.step=1;wizard()">Back</button>';
 if(s===3)h='<h3>Add the details</h3><label style="margin-top:0" for="wd">Describe the problem</label><textarea id="wd" rows="4">'+esc(W.d||"")+'</textarea><div class="fe" id="e_wd" role="alert"></div><label>Photo (optional)</label><label class="photo" style="margin:0">'+(W.photo?'<img src="'+W.photo+'" alt="">':'<span style="font-size:26px">📷</span>')+'<span class="meta">Tap to take or choose a photo</span><input type="file" accept="image/*" capture="environment" hidden onchange="pic(this)"></label><button class="btn" onclick="keep2();submit()">Submit report</button><button class="btn o" onclick="keep2();W.step=2;wizard()">Back</button>';
 $("wbody").innerHTML=h}
const keep=()=>{if($("wb")){W.b=$("wb").value;W.r=$("wr").value.trim()}};
const keep2=()=>{W.d=$("wd").value.trim()};
function pic(el){const f=el.files[0];if(!f)return;keep2();if(!/^image\/(jpeg|png|webp)$/.test(f.type)||f.size>8e6){toast("Choose a JPG, PNG or WebP photo under 8 MB.");el.value="";return}const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement("canvas"),k=Math.min(1,200/Math.max(im.width,im.height));c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);W.photo=c.toDataURL("image/jpeg",.6);wizard()};im.src=r.result};r.readAsDataURL(f)}
function submit(){if(ME.status!=="Verified"){toast("Your account must be verified first.");return}if(!W.d){fe("wd","Describe the problem.");return}
 const i={code:"SF-"+DB.next++,uid:ME.id,name:ME.name,contact:ME.phone,building:W.b||BUILD[0],room:W.r,cat:W.cat,urgency:W.urg,desc:W.d,photo:W.photo,created:Date.now(),history:[{t:Date.now(),status:"Pending",note:"Report received"}],status:"Pending",staff:null};
 DB.issues.push(i);match(i);save();W={step:1,cat:"",urg:"Medium",photo:""};
 $("wbody").innerHTML='<div class="card" style="text-align:center"><div style="font-size:42px">✅</div><h2>Report sent</h2><p class="meta">Your tracking code</p><div style="font:700 28px Georgia,serif;color:var(--m3)">'+i.code+'</div><p>'+(i.staff?"Assigned to <b>"+esc(DB.staff.find(s=>s.id===i.staff).name)+"</b>.":"No staff member is free right now. It will be assigned when one is available.")+'</p><button class="btn" onclick="openI(\''+i.code+'\')">View progress</button><button class="btn o" onclick="tab(\'home\')">Back to home</button></div>';$("wiz").innerHTML="";render()}

function body(i,admin){const st=DB.staff.find(s=>s.id===i.staff);
 let h='<button class="x" onclick="closeS()" aria-label="Close">✕</button><h2>'+CATS[i.cat]+' '+esc(i.cat)+'</h2><span class="pill '+i.status+'">'+i.status+'</span> <span class="meta">'+i.code+'</span>'+(late(i)?' <span class="late">Overdue</span>':'');
 h+='<div class="prog" style="margin-top:14px">'+STEPS.map((s,k)=>'<i class="'+(k<=STEPS.indexOf(i.status)?"f":"")+'"></i>').join("")+'</div><div class="meta" style="display:flex;justify-content:space-between"><span>Pending</span><span>Closed</span></div>';
 h+='<div class="card" style="margin-top:12px">'+(i.photo?'<img src="'+i.photo+'" alt="" style="width:100%;border-radius:10px;margin-bottom:8px">':"")+'<b>'+esc(i.building)+', '+esc(i.room)+'</b><p>'+esc(i.desc)+'</p><div class="meta">Urgency '+i.urgency+' &middot; Target '+fmt(due(i))+'<br>'+(ME.role==="admin"||i.uid===ME.id?"Reported by "+esc(i.name)+"<br>":"")+'Assigned to: '+(st?esc(st.name):"Waiting for a match")+'</div></div>';
 if(admin){h+='<div class="card"><h3>Actions</h3>'+(i.status==="Pending"?'<button class="btn s" onclick="rm(\''+i.code+'\')">Run matching</button>':"")+FLOW[i.status].filter(n=>!(i.status==="Pending")).map(n=>'<button class="btn s" onclick="adv(\''+i.code+'\',\''+n+'\')">Mark '+n+'</button>').join("");
  if(i.ranking&&i.ranking.length)h+='<h3 style="margin-top:14px">Matching scores</h3>'+i.ranking.map(r=>'<div class="score"><span>'+esc(r.name)+'<br><small class="meta">'+(r.load!==undefined?r.load+'/'+r.cap+' tasks':'')+'</small></span><div class="bar"><div style="width:'+r.total+'%"></div></div><b>'+r.total+'</b></div>').join("");
  if(["Pending","Assigned"].includes(i.status))h+='<h3 style="margin-top:14px">Assign manually</h3><div class="act"><label class="lb inl" for="ms">Staff</label><select id="ms" style="width:auto;flex:1">'+DB.staff.filter(s=>!s.off).map(s=>'<option value="'+s.id+'" '+(loadOf(s)>=s.cap&&s.id!==i.staff?"disabled":"")+(s.id===i.staff?" selected":"")+'>'+esc(s.name)+' ('+loadOf(s)+'/'+s.cap+')</option>').join("")+'</select><button class="btn s" style="margin:0" onclick="ma(\''+i.code+'\')">Assign</button></div>';h+='</div>'}
 return h+'<div class="card"><h3>History</h3><div class="tl">'+[...i.history].reverse().map(x=>'<div><b>'+x.status+'</b> <span class="meta">'+fmt(x.t)+'</span>'+(ME.role==="admin"?'<br><span class="meta">'+esc(x.note)+'</span>':"")+'</div>').join("")+'</div></div>'}
function openI(c){$("sbody").innerHTML=body(find(c),false);openSheet()}
function openA(c){$("sbody").innerHTML=body(find(c),true);openSheet()}
function openSheet(){const h=$("sheet");if(!h.classList.contains("on"))history.pushState({s:1},"");h.classList.add("on")}
function closeS(){const h=$("sheet");if(h.classList.contains("on")){h.classList.remove("on");if(history.state&&history.state.s)history.back()}}
addEventListener("popstate",()=>$("sheet").classList.remove("on"));
function adv(c,to){const i=find(c);if(move(i,to,"Updated by admin")){if(to==="Resolved"||to==="Closed")rematch();save();render();openA(c);toast("Marked "+to)}}
function rm(c){const i=find(c);toast(match(i)?"Matched":"No staff available");save();render();openA(c)}
function lookup(){const i=DB.issues.find(x=>x.code===$("tc").value.trim().toUpperCase()&&x.uid===ME.id);$("tres").innerHTML=i?card(i):'<div class="card">No report found. Check the code and try again.</div>'}
/* AUTH */
const LOGO=c=>'<img class="lg '+c+'" alt="Northwestern Visayan Colleges logo" src="assets/nvc-logo.png" data-s="0" onerror="lgErr(this)">';
async function sha(t){try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("fixit:"+t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){let h=5381;for(const c of "fixit:"+t)h=(h*33^c.charCodeAt(0))>>>0;return"w"+h}}
const UN=/^[a-z0-9._-]{4,20}$/i;
const FIELDS=[["name","Full name","text","full","name"],["username","Username","text","","username"],["bday","Date of birth","date","","bday"],["sno","Student ID number","text",""],["grade","Grade or year and section","text",""],["email","Email address","email","full","email"],["phone","Mobile number","tel","","tel"],["addr","Home address","text","full","street-address"],["guard","Parent or guardian name and contact","text","full"]];
const fld=(id,l,t,c,ac,v)=>'<div class="'+(c||"")+'"><label for="'+id+'">'+l+'</label><input id="'+id+'" type="'+t+'" '+(ac?'autocomplete="'+ac+'" ':"")+'value="'+esc(v||"")+'"><div class="fe" id="e_'+id+'" role="alert"></div></div>';
const grab=()=>FIELDS.forEach(f=>{const e=$("r_"+f[0]);if(e)R[f[0]]=e.value.trim()});
function fe(id,m){const i=$(id),e=$("e_"+id);if(i){i.classList.add("bad");if(i.focus)i.focus()}if(e)e.textContent=m}
function eye(id,b){const i=$(id),s=i.type==="password";i.type=s?"text":"password";b.textContent=s?"Hide":"Show";b.setAttribute("aria-label",s?"Hide password":"Show password")}
const loginForm=()=>(AN?'<div class="ok" role="status">'+AN+'</div>':"")+'<form id="lf" onsubmit="doLogin(event)" novalidate><label for="lu">Username</label><input id="lu" autocomplete="username" autocapitalize="none" spellcheck="false" value="'+esc(R.lu||"")+'"><div class="fe" id="e_lu" role="alert"></div><label for="lp">Password</label><div class="pw"><input id="lp" type="password" autocomplete="current-password"><button type="button" class="eye" aria-label="Show password" onclick="eye(\'lp\',this)">Show</button></div><div class="fe" id="e_lp" role="alert"></div><div class="fe err" id="err" role="alert"></div><button class="btn" id="lb" type="submit">Log in</button></form><p class="meta c">No account yet? <a href="#" onclick="AM=\'reg\';renderAuth();return false">Register here</a></p><p class="meta c">Accounts from the earlier version: your username is your student ID number.</p>';
const regForm=()=>'<form id="rf" onsubmit="doReg(event)" novalidate><p class="meta" style="margin-top:6px">Register with your full details and a photo of your school ID. An admin verifies your account before you can file reports.</p><div class="two">'+FIELDS.map(f=>fld("r_"+f[0],f[1],f[2],f[3],f[4],R[f[0]])).join("")+'<div class="full"><span class="lb">Photo of school ID (front)</span><label class="photo" id="r_photo" style="margin:0">'+(AP?'<img src="'+AP+'" alt="Preview of your school ID" style="width:90px;height:60px;border-radius:8px;object-fit:cover">':'<span style="font-size:26px" aria-hidden="true">🪪</span>')+'<span class="meta">Tap to take or choose a photo (JPG, PNG or WebP, up to 5 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" hidden onchange="idPic(this)"></label><div class="fe" id="e_r_photo" role="alert"></div></div><div><label for="r_pw">Password (at least 8 characters)</label><div class="pw"><input id="r_pw" type="password" autocomplete="new-password"><button type="button" class="eye" aria-label="Show password" onclick="eye(\'r_pw\',this)">Show</button></div><div class="fe" id="e_r_pw" role="alert"></div></div><div><label for="r_pw2">Confirm password</label><input id="r_pw2" type="password" autocomplete="new-password"><div class="fe" id="e_r_pw2" role="alert"></div></div></div><div class="fe err" id="err" role="alert"></div><button class="btn" id="rb" type="submit">Create account</button></form>';
function renderAuth(){const lg=AM==="login";
 $("auth").innerHTML='<div class="hero">'+LOGO("big")+'<h1>FixIt Campus</h1><p>Northwestern Visayan Colleges</p><small>School Facility Reporting and Maintenance Management</small><button class="out" id="inst" style="display:none;margin:12px auto 0" onclick="inst()">Install app</button></div><div class="box"><div class="sw"><button type="button" class="'+(lg?"on":"")+'" onclick="grab();AM=\'login\';renderAuth()">Log in</button><button type="button" class="'+(lg?"":"on")+'" onclick="AM=\'reg\';renderAuth()">Register</button></div>'+(lg?loginForm():regForm())+'</div><p class="foot">National Highway, Estancia, Kalibo, Aklan 5600</p>';
 if(DP&&$("inst"))$("inst").style.display="inline-block"}
function idPic(el){const f=el.files[0];if(!f)return;grab();AP="";
 if(!/^image\/(jpeg|png|webp)$/.test(f.type)){renderAuth();fe("r_photo","Use a JPG, PNG or WebP image.");return}
 if(f.size>5e6){renderAuth();fe("r_photo","The image must be 5 MB or smaller.");return}
 const r=new FileReader();r.onerror=()=>{renderAuth();fe("r_photo","The image could not be read. Try another file.")};
 r.onload=()=>{const im=new Image();im.onerror=()=>{renderAuth();fe("r_photo","That file is not a valid image.")};im.onload=()=>{const c=document.createElement("canvas"),k=Math.min(1,700/Math.max(im.width,im.height));c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);AP=c.toDataURL("image/jpeg",.7);renderAuth()};im.src=r.result};r.readAsDataURL(f)}
function vReg(pw,pw2){const e={},lc=s=>(s||"").toLowerCase();
 FIELDS.forEach(f=>{if(!R[f[0]])e["r_"+f[0]]="This field is required."});
 if(R.name&&R.name.length<3)e.r_name="Enter your full name.";
 if(R.username){if(!UN.test(R.username))e.r_username="Use 4 to 20 letters, numbers, dots, dashes or underscores.";else if(DB.users.some(u=>lc(u.username)===lc(R.username)))e.r_username="That username is already taken."}
 if(R.bday&&new Date(R.bday)>new Date())e.r_bday="Birth date cannot be in the future.";
 if(R.sno&&DB.users.some(u=>u.sno&&u.sno===R.sno))e.r_sno="This student ID is already registered.";
 if(R.email){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(R.email))e.r_email="Enter a valid email address.";else if(DB.users.some(u=>lc(u.email)===lc(R.email)))e.r_email="This email is already registered."}
 if(R.phone&&!/^[0-9+\-\s()]{7,16}$/.test(R.phone))e.r_phone="Enter a valid mobile number.";
 if(!AP)e.r_photo="Add a photo of your school ID.";
 if(!pw)e.r_pw="This field is required.";else if(pw.length<8)e.r_pw="Use at least 8 characters.";
 if(!pw2)e.r_pw2="Confirm your password.";else if(pw&&pw!==pw2)e.r_pw2="The passwords do not match.";
 return e}
async function doReg(ev){ev.preventDefault();if(busy)return;grab();const pw=$("r_pw").value,pw2=$("r_pw2").value,e=vReg(pw,pw2),ks=Object.keys(e),er=$("err");
 document.querySelectorAll("#rf .bad").forEach(x=>x.classList.remove("bad"));document.querySelectorAll("#rf .fe").forEach(x=>x.textContent="");
 if(ks.length){ks.forEach(k=>{const i=$(k),m=$("e_"+k);if(i)i.classList.add("bad");if(m)m.textContent=e[k]});const f=$(ks[0]);if(f&&f.focus)f.focus();er.textContent="Please fix the "+ks.length+" highlighted field"+(ks.length>1?"s":"")+".";er.style.display="block";return}
 busy=true;$("rb").disabled=true;
 try{const u={id:"u"+Date.now(),role:"student",status:"Pending",pw:await sha(pw),idphoto:AP,created:Date.now()};FIELDS.forEach(f=>u[f[0]]=R[f[0]]);
  DB.users.push(u);save();AN="Account created. Your username is <b>"+esc(u.username)+"</b>. An admin will verify your school ID before you can file reports. Log in to continue.";R={lu:u.username};AP="";AM="login";renderAuth()}
 finally{busy=false}}
async function doLogin(ev){ev.preventDefault();if(busy)return;const raw=$("lu").value.trim(),p=$("lp").value,er=$("err");
 ["lu","lp"].forEach(x=>{$(x).classList.remove("bad");$("e_"+x).textContent=""});er.style.display="none";R.lu=raw;
 if(!raw){fe("lu","Enter your username.");return}if(!p){fe("lp","Enter your password.");return}
 busy=true;$("lb").disabled=true;
 try{const h=await sha(p),u=DB.users.find(x=>(x.username||"").toLowerCase()===raw.toLowerCase()&&x.pw===h);
  if(!u){$("lu").classList.add("bad");$("lp").classList.add("bad");er.textContent="Wrong username or password.";er.style.display="block";return}
  if(u.status==="Rejected"){er.textContent="This account was rejected. Contact the school office.";er.style.display="block";return}
  AN="";R={};start(u)}
 finally{busy=false;const b=$("lb");if(b)b.disabled=false}}
function start(u){ME=u;try{localStorage.setItem("fixitsess",u.id)}catch(e){}
 buildTabs();$("uname").textContent=u.name;$("urole").textContent=u.role==="admin"?"Administrator":"Student, "+(u.status==="Verified"?"verified":"awaiting verification");
 $("auth").style.display="none";$("app").style.display="flex";fx($("app"));tab(u.role==="admin"?"admin":"home")}
function logout(){ME=null;try{localStorage.removeItem("fixitsess")}catch(e){}AM="login";closeS();$("app").style.display="none";renderAuth();$("auth").style.display="flex";fx($("auth"))}
function openU(id){const u=DB.users.find(x=>x.id===id);$("sbody").innerHTML='<button class="x" onclick="closeS()" aria-label="Close">✕</button><h2>'+esc(u.name)+'</h2><span class="pill '+u.status+'">'+u.status+'</span><div class="card" style="margin-top:12px"><img class="idimg" src="'+u.idphoto+'" alt="School ID photo of '+esc(u.name)+'"><p class="meta">'+[["Username",u.username],["Student ID",u.sno],["Grade and section",u.grade],["Birth date",u.bday],["Email",u.email],["Mobile",u.phone],["Address",u.addr],["Guardian",u.guard]].map(x=>x[0]+": <b>"+esc(x[1]||"")+"</b>").join("<br>")+'</p></div><button class="btn s" onclick="setU(\''+id+'\',\'Verified\')">Verify account</button><button class="btn s" style="background:var(--g2)" onclick="setU(\''+id+'\',\'Rejected\')">Reject</button>';openSheet()}
function setU(id,st){DB.users.find(x=>x.id===id).status=st;save();render();closeS();toast("Account "+st.toLowerCase())}
const fx=e=>{e.classList.remove("fade");void e.offsetWidth;e.classList.add("fade")};
let DP=null;addEventListener("beforeinstallprompt",e=>{e.preventDefault();DP=e;const b=$("inst");if(b)b.style.display="inline-block"});
function inst(){if(DP){DP.prompt();DP=null;$("inst").style.display="none"}}
function toggleSide(){const a=$("app");a.classList.toggle("mini");try{localStorage.setItem("fixitmini",a.classList.contains("mini")?"1":"")}catch(e){}}
document.addEventListener("input",e=>{const t=e.target;if(t.classList&&t.classList.contains("bad")){t.classList.remove("bad");const m=$("e_"+t.id);if(m)m.textContent=""}});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches(".issue,.tbl tr.rw")){e.preventDefault();e.target.click()}if(e.key==="Escape")closeS()});
if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
const hideSplash=()=>$("splash").classList.add("hide");setTimeout(hideSplash,3500);
async function init(){load();migrate();
 try{if(localStorage.getItem("fixitmini"))$("app").classList.add("mini")}catch(e){}
 $("sk").innerHTML=Object.keys(CATS).map(k=>'<label class="ck"><input type="checkbox" value="'+k+'"> '+CATS[k]+' '+k+'</label>').join("");
 let a=DB.users.find(u=>u.role==="admin");
 if(!a)DB.users.push({id:"admin",role:"admin",name:"System Administrator",username:"admin",email:"admin@school.edu",pw:await sha("admin"),status:"Verified",demo:1});
 else if(!a.demo){a.pw=await sha("admin");a.username="admin";a.demo=1}
 save();let sid=null;try{sid=localStorage.getItem("fixitsess")}catch(e){}
 const u=DB.users.find(x=>x.id===sid&&x.status!=="Rejected");if(u)start(u);else{renderAuth();$("auth").style.display="flex"}}
setInterval(()=>{if(ME&&!$("sheet").classList.contains("on"))render()},60000);
init().catch(e=>{console.error(e);toast("Something went wrong while starting the app.")}).then(()=>setTimeout(hideSplash,1100));
