import http from "node:http";
const KEY = process.env.KEY;
if (!KEY) console.log("ERROR: ما كايناش KEY فـ Environment Variables");
const PORT = process.env.PORT || 3000;
const LEAGUES = [2, 3, 39, 61, 78, 135, 140, 200];
const cache = {};

function KEEP(m) {
  if (LEAGUES.includes(m.league.id)) return true;
  if (m.league.country !== "World") return false;
  if (/Club/.test(m.league.name)) return false;
  return !/\bU\d\d\b|\bW\b/.test(m.teams.home.name + " " + m.teams.away.name);
}

async function api(path, key) {
  const c = cache[key];
  if (c && Date.now() - c.t < 600000) return c.data;
  const r = await fetch("https://v3.football.api-sports.io/" + path, { headers: { "x-apisports-key": KEY } });
  const j = await r.json();
  const bad = Array.isArray(j.errors) ? j.errors.length : Object.keys(j.errors || {}).length;
  if (bad) throw new Error(JSON.stringify(j.errors));
  cache[key] = { t: Date.now(), data: j.response };
  return j.response;
}

const PAGE = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>كورة</title>
<style>body{font-family:sans-serif;margin:0;background:#0f172a;color:#fff}h1{padding:16px 16px 4px;margin:0;font-size:20px}.b{padding:8px 12px}.b button,.b select,.b input{background:#1e293b;color:#fff;border:1px solid #334155;border-radius:8px;padding:8px 14px;margin:2px}.b input{width:55%}.b label{margin:0 8px;font-size:14px}.l{padding:10px 16px 2px;color:#38bdf8;font-weight:bold}.m{direction:ltr;display:flex;align-items:center;background:#1e293b;margin:6px 12px;padding:10px;border-radius:10px}.t{flex:1;text-align:center;font-size:13px}.t img{width:40px;height:40px;display:block;margin:0 auto 4px}.c{width:100px;text-align:center;font-size:13px}small{color:#94a3b8}.x{padding:16px}.lu{direction:ltr;display:flex;gap:8px;margin:0 12px 6px;font-size:12px}.tm{flex:1;background:#1e293b;border-radius:10px;padding:10px}.tm div{margin-top:3px}.ev{direction:ltr;margin:0 12px 6px;font-size:13px}td{padding:6px 4px}</style>
<h1>⚽ كورة</h1>
<div class="b"><button onclick="go(-1)">البارح</button><button onclick="go(0)">اليوم</button><button onclick="go(1)">غدا</button><label><input type="checkbox" onchange="all=this.checked;load()" style="width:auto"> كل الدوريات</label></div>
<div class="b"><select id="sel" onchange="st(this.value)"><option value="">📊 الترتيب...</option><option value="39">Premier League</option><option value="140">La Liga</option><option value="135">Serie A</option><option value="78">Bundesliga</option><option value="61">Ligue 1</option><option value="200">Botola Pro</option></select></div>
<div class="b"><input id="q" placeholder="🔍 لاعب (Messi)..."><button onclick="sp()">بحث</button></div>
<div id="app" class="x">كنحملو...</div>
<script>
var off=0,all=false,app=document.getElementById("app");
function go(n){off=n;load();}
function sp(){
 var q=document.getElementById("q").value.trim();
 document.getElementById("sel").value="";
 if(q.length<3){app.className="x";app.textContent="كتب 3 حروف على الأقل، بالحروف اللاتينية (بحال Messi)";return;}
 app.className="x";app.textContent="كنقلبو...";
 fetch("/api/players?search="+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(rows){
  if(!Array.isArray(rows)){app.textContent="الـ API ما عطات والو: "+(rows.error||"");return;}
  if(!rows.length){app.textContent="ما لقيت حتى لاعب بهاد السمية";return;}
  var h="";
  rows.forEach(function(r){
   var p=r.player;
   h+='<div class="m"><img src="'+p.photo+'" style="width:60px;height:60px;border-radius:50%"><div style="margin-left:12px;text-align:left;font-size:13px"><b>'+p.name+'</b><br><small>'+(p.firstname||"")+' '+(p.lastname||"")+'</small><br><small>'+(p.age||"?")+' سنة · '+(p.nationality||"")+'</small><br><small>'+(p.position||"")+(p.height?' · '+p.height:'')+(p.number?' · #'+p.number:'')+'</small></div></div>';
  });
  app.className="";app.innerHTML=h;
 }).catch(function(){app.textContent="وقع مشكل فالتحميل"});
}
function st(id){
 if(!id)return;
 app.className="x";app.textContent="كنحملو...";
 fetch("/api/standings?league="+id).then(function(r){return r.json()}).then(function(rows){
  if(!Array.isArray(rows)||!rows.length){app.textContent="الترتيب ما واجدش لهاد الدوري";return;}
  var h='<table dir="ltr" style="width:100%;border-collapse:collapse;font-size:13px"><tr style="color:#94a3b8"><td>#</td><td>الفريق</td><td>لعب</td><td>+/-</td><td>نقط</td></tr>';
  rows.forEach(function(r){h+='<tr style="border-top:1px solid #1e293b"><td>'+r.rank+'</td><td><img src="'+r.team.logo+'" style="width:20px;height:20px;vertical-align:middle;margin-right:6px">'+r.team.name+'</td><td>'+r.all.played+'</td><td>'+r.goalsDiff+'</td><td><b>'+r.points+'</b></td></tr>';});
  app.className="";app.innerHTML=h+'</table>';
 }).catch(function(){app.textContent="وقع مشكل فالتحميل"});
}
function lineup(id){
 var box=document.getElementById("L"+id);
 if(box.innerHTML){box.innerHTML="";return;}
 box.innerHTML='<div class="x">كنحملو...</div>';
 Promise.all([
  fetch("/api/events?fixture="+id).then(function(r){return r.json()}),
  fetch("/api/lineups?fixture="+id).then(function(r){return r.json()})
 ]).then(function(res){
  var E=res[0],L=res[1],h="";
  if(Array.isArray(E)){
   var ev=E.filter(function(e){return e.type==="Goal"||e.type==="Card"});
   if(ev.length){
    h+='<div class="tm ev">';
    ev.forEach(function(e){
     var ic=e.type==="Goal"?(e.detail==="Missed Penalty"?"❌":"⚽"):(e.detail==="Yellow Card"?"🟨":"🟥");
     var og=e.detail==="Own Goal"?" (OG)":"";
     h+='<div>'+e.time.elapsed+(e.time.extra?"+"+e.time.extra:"")+"' "+ic+" "+e.player.name+og+' <small>('+e.team.name+')</small></div>';
    });
    h+='</div>';
   }
  }
  if(Array.isArray(L)&&L.length){
   h+='<div class="lu">';
   L.forEach(function(t){
    h+='<div class="tm"><b>'+t.team.name+'</b> <small>'+(t.formation||"")+'</small><br><small>'+(t.coach&&t.coach.name?t.coach.name:"")+'</small>';
    t.startXI.forEach(function(p){h+='<div>'+p.player.number+' · '+p.player.name+'</div>';});
    h+='</div>';
   });
   h+='</div>';
  }
  if(!h)h='<div class="x">ما كاين حتى تفاصيل دابا. التشكيلة كتبان تقريبا ساعة قبل الماتش.</div>';
  box.innerHTML=h;
 }).catch(function(){box.innerHTML='<div class="x">وقع مشكل</div>'});
}
function load(){
 document.getElementById("sel").value="";
 var d=new Date();d.setDate(d.getDate()+off);
 var ds=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
 app.className="x";app.textContent="كنحملو...";
 fetch("/api/matches?date="+ds+(all?"&all=1":"")).then(function(r){return r.json()}).then(function(list){
  if(!Array.isArray(list)){app.textContent="الـ API ما عطات والو: "+(list.error||"");return;}
  if(!list.length){app.textContent="ما كاين حتى ماتش فهاد النهار. جرب خانة كل الدوريات";return;}
  list.sort(function(a,b){return a.league.name.localeCompare(b.league.name)||a.fixture.timestamp-b.fixture.timestamp});
  var html="",last="";
  list.forEach(function(m){
   if(m.league.name!==last){last=m.league.name;html+='<div class="l">'+m.league.name+' · '+m.league.country+'</div>';}
   var time=new Date(m.fixture.date).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
   var mid=m.goals.home!==null?m.goals.home+" - "+m.goals.away:time;
   html+='<div class="m" onclick="lineup('+m.fixture.id+')"><div class="t"><img src="'+m.teams.home.logo+'">'+m.teams.home.name+'</div><div class="c"><b>'+mid+'</b><br><small>'+(m.fixture.venue.name||"")+'</small></div><div class="t"><img src="'+m.teams.away.logo+'">'+m.teams.away.name+'</div></div><div id="L'+m.fixture.id+'"></div>';
  });
  app.className="";app.innerHTML=html;
 }).catch(function(){app.textContent="وقع مشكل فالتحميل"});
}
load();
</script></html>`;

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const json = (code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  try {
    if (u.pathname === "/api/matches") {
      let date = u.searchParams.get("date") || "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = new Date().toISOString().slice(0, 10);
      let data = await api("fixtures?date=" + date, "D" + date);
      if (u.searchParams.get("all") !== "1") data = data.filter(KEEP);
      json(200, data);
    } else if (u.pathname === "/api/lineups") {
      const id = u.searchParams.get("fixture") || "";
      if (!/^\d+$/.test(id)) return json(400, { error: "bad id" });
      json(200, await api("fixtures/lineups?fixture=" + id, "L" + id));
    } else if (u.pathname === "/api/events") {
      const id = u.searchParams.get("fixture") || "";
      if (!/^\d+$/.test(id)) return json(400, { error: "bad id" });
      json(200, await api("fixtures/events?fixture=" + id, "E" + id));
    } else if (u.pathname === "/api/standings") {
      const id = u.searchParams.get("league") || "";
      if (!/^\d+$/.test(id)) return json(400, { error: "bad id" });
      const d = new Date();
      const season = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
      const r = await api("standings?league=" + id + "&season=" + season, "S" + id + "-" + season);
      json(200, (r[0] && r[0].league.standings[0]) || []);
    } else if (u.pathname === "/api/players") {
      const q = (u.searchParams.get("search") || "").trim();
      if (!/^[A-Za-z ]{3,}$/.test(q)) return json(400, { error: "كتب 3 حروف لاتينية على الأقل" });
      json(200, await api("players/profiles?search=" + encodeURIComponent(q), "P" + q.toLowerCase()));
    } else {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(PAGE);
    }
  } catch (e) {
    json(502, { error: String(e.message) });
  }
}).listen(PORT, "0.0.0.0", () => console.log("running on " + PORT));
