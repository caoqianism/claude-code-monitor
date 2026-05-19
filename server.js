#!/usr/bin/env node
// Claude Code Monitor — 多会话版
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2] || '3000', 10);

// 多会话状态：key = session_id, value = session state
const sessions = new Map();

function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      mood: 'idle',
      message: '🐱 等待 Claude Code...',
      activity: '',
      tool: '',
      updatedAt: Date.now(),
      events: [],
      sessionStart: null,
    });
  }
  return sessions.get(sessionId);
}

const sseClients = new Set();

function broadcast() {
  const allSessions = getAllSessionsState();
  const data = `data: ${JSON.stringify(allSessions)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch { sseClients.delete(res); }
  }
}

function getAllSessionsState() {
  const now = Date.now();
  // 清理超过 30 分钟不活跃的会话
  for (const [sid, s] of sessions) {
    if (now - s.updatedAt > 30 * 60 * 1000) {
      sessions.delete(sid);
    }
  }

  const sessionList = [];
  for (const [sid, s] of sessions) {
    const ma = MOOD_ANIM[s.mood] || MOOD_ANIM.idle;
    sessionList.push({
      sessionId: sid,
      mood: s.mood,
      emoji: ma.emoji,
      anim: ma.anim,
      bgColor: ma.color,
      message: s.message,
      activity: s.activity,
      tool: s.tool,
      updatedAt: s.updatedAt,
      eventCount: s.events.length,
      events: s.events.slice(0, 20),
      sessionStart: s.sessionStart,
    });
  }
  return { sessions: sessionList, ts: now };
}

function addEvent(state, event, detail) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  state.events.unshift({ ts, event, detail });
  if (state.events.length > 50) state.events.length = 50;
}

const MOOD_ANIM = {
  idle:       { emoji: '🐱', anim: 'float 3s ease-in-out infinite', color: '#1a1a2e' },
  working:    { emoji: '😾', anim: 'pulse 1s ease-in-out infinite', color: '#0f3460' },
  happy:      { emoji: '😻', anim: 'spin 2s linear infinite', color: '#16213e' },
  debugging:  { emoji: '🙀', anim: 'shake 0.5s ease-in-out infinite', color: '#1a1a2e' },
  sleepy:     { emoji: '😿', anim: 'float 4s ease-in-out infinite', color: '#0d1b2a' },
  excited:    { emoji: '😸', anim: 'bounce 0.6s ease-in-out infinite', color: '#1b2838' },
  thinking:   { emoji: '😺', anim: 'pulse 2s ease-in-out infinite', color: '#16213e' },
  waiting:    { emoji: '🐱', anim: 'pulse 1.5s ease-in-out infinite', color: '#1a1a2e' },
  error:      { emoji: '😹', anim: 'shake 0.3s ease-in-out infinite', color: '#2d1b1b' },
};

const EVENT_TO_MOOD = {
  SessionStart: 'idle',
  SessionEnd: 'sleepy',
  UserPromptSubmit: 'thinking',
  PreToolUse: 'working',
  PostToolUse: 'working',
  PostToolUseFailure: 'debugging',
  Stop: 'happy',
  SubagentStart: 'working',
  SubagentStop: 'idle',
  PreCompact: 'working',
  PostCompact: 'idle',
  Notification: 'excited',
  PermissionRequest: 'waiting',
};

const EVENT_LABELS = {
  SessionStart: '🟢 会话启动',
  SessionEnd: '🔴 会话结束',
  UserPromptSubmit: '📥 用户输入',
  PreToolUse: '⚡ 工具调用',
  PostToolUse: '✅ 工具完成',
  PostToolUseFailure: '❌ 工具失败',
  Stop: '⏹ 停止',
  SubagentStart: '🔄 子代理启动',
  SubagentStop: '🔄 子代理结束',
  PreCompact: '📦 压缩上下文',
  PostCompact: '📦 压缩完成',
  Notification: '📬 通知',
  PermissionRequest: '⏳ 等待权限',
};

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Claude Code Monitor</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.08)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-24px)}}
@keyframes glow{0%,100%{box-shadow:0 0 30px rgba(0,200,150,0.15)}50%{box-shadow:0 0 60px rgba(0,200,150,0.4)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ring{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(1.3)}100%{transform:rotate(360deg) scale(1)}}

:root{--bg:#0d1117;--card:#161b22;--border:#30363d;--border2:#21262d;--text:#e6edf3;--dim:#8b949e;--dark:#484f58;--green:#3fb950;--blue:#58a6ff;--orange:#d29922;--red:#f85149;--purple:#bc8cff}

html,body{height:100%;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);display:flex;flex-direction:column}

/* ── 顶栏 ── */
.topbar{height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-bottom:1px solid var(--border2);flex-shrink:0}
.topbar h1{font-size:15px;font-weight:600;background:linear-gradient(135deg,var(--blue),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.topbar .conn{font-size:11px;color:var(--dim);display:flex;align-items:center;gap:6px}

/* ── 主体 ── */
.main{flex:1;display:flex;overflow:hidden}

/* ── 左侧：章鱼区 ── */
.octo-zone{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden}
.octo-zone::before{content:'';position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(88,166,255,0.06) 0%,transparent 70%);pointer-events:none}
.octo-emoji{font-size:140px;line-height:1;filter:drop-shadow(0 0 40px rgba(88,166,255,0.3));z-index:1}
.octo-mood{font-size:13px;color:var(--dim);text-transform:uppercase;letter-spacing:4px;margin-top:16px;z-index:1}
.octo-msg{font-size:28px;font-weight:700;margin-top:12px;z-index:1;text-align:center;max-width:80%}
.octo-activity{font-size:15px;color:var(--blue);margin-top:8px;z-index:1;font-family:monospace;max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tool-badge{display:inline-block;background:rgba(88,166,255,0.1);border:1px solid rgba(88,166,255,0.3);border-radius:8px;padding:6px 16px;font-size:14px;color:var(--blue);font-family:monospace;margin-top:12px;z-index:1}

/* ── 底部统计条 ── */
.stats-bar{position:absolute;bottom:0;left:0;right:0;height:48px;display:flex;align-items:center;justify-content:center;gap:40px;background:linear-gradient(transparent,rgba(13,17,23,0.9));z-index:1}
.stat{display:flex;flex-direction:column;align-items:center}
.stat .label{font-size:10px;color:var(--dark)}
.stat .value{font-size:16px;font-weight:700}
.stat .value.green{color:var(--green)}
.stat .value.blue{color:var(--blue)}
.stat .value.orange{color:var(--orange)}
.stat .value.purple{color:var(--purple)}

/* ── 右侧：事件面板 ── */
.side-panel{width:360px;border-left:1px solid var(--border2);display:flex;flex-direction:column;flex-shrink:0}
.side-header{padding:12px 16px;border-bottom:1px solid var(--border2);display:flex;justify-content:space-between;align-items:center}
.side-header h2{font-size:13px;font-weight:600;color:var(--dim)}
.side-header .badge{font-size:11px;background:rgba(88,166,255,0.15);color:var(--blue);border-radius:10px;padding:2px 8px}
.events-list{flex:1;overflow-y:auto;padding:4px 0}
.events-list::-webkit-scrollbar{width:4px}
.events-list::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.event-row{display:flex;gap:10px;padding:8px 16px;font-size:12px;border-bottom:1px solid rgba(33,38,45,0.5);animation:fadeUp .3s ease}
.event-row:hover{background:rgba(88,166,255,0.04)}
.event-row .time{color:var(--dark);white-space:nowrap;font-family:monospace;min-width:60px}
.event-row .ev{color:var(--text);font-weight:500;min-width:90px}
.event-row .detail{color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}

/* ── 空状态 ── */
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--dark);gap:12px}
.empty-state .emoji{font-size:80px;opacity:0.5}
.empty-state .text{font-size:14px}

/* ── 状态点 ── */
.status-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 2s ease-in-out infinite}
.status-dot.offline{background:var(--red);animation:none}

/* ── 多会话切换 ── */
.session-tabs{display:flex;gap:6px;padding:0 16px}
.session-tab{font-size:11px;padding:4px 10px;border-radius:6px;background:transparent;border:1px solid var(--border2);color:var(--dim);cursor:pointer;transition:all .2s}
.session-tab.active{background:rgba(88,166,255,0.15);border-color:rgba(88,166,255,0.3);color:var(--blue)}
.session-tab:hover{border-color:var(--border)}

@media(max-width:800px){
  .main{flex-direction:column}
  .side-panel{width:100%;height:40%;border-left:none;border-top:1px solid var(--border2)}
  .octo-emoji{font-size:80px}
  .octo-msg{font-size:20px}
}
</style>
</head>
<body onload="document.title='CCM-v2-'+Date.now()">
<div class="topbar">
  <h1>🐱 Claude Code Monitor v2</h1>
  <div class="conn"><span class="status-dot" id="statusDot"></span><span id="statusText">连接中...</span></div>
</div>
<div class="main">
  <div class="octo-zone" id="octoZone">
    <div class="octo-emoji" id="octoEmoji" style="animation:float 3s ease-in-out infinite">🐱</div>
    <div class="octo-mood" id="octoMood">IDLE</div>
    <div class="octo-msg" id="octoMsg">等待 Claude Code...</div>
    <div class="octo-activity" id="octoAct"></div>
    <div id="toolBadge"></div>
    <div class="stats-bar">
      <div class="stat"><div class="label">会话时长</div><div class="value green" id="dur">--:--:--</div></div>
      <div class="stat"><div class="label">事件数</div><div class="value blue" id="evtCount">0</div></div>
      <div class="stat"><div class="label">最后更新</div><div class="value orange" id="lastUp">--:--:--</div></div>
    </div>
  </div>
  <div class="side-panel">
    <div class="side-header"><h2>📋 事件日志</h2><span class="badge" id="evtBadge">0</span></div>
    <div class="session-tabs" id="sessionTabs"></div>
    <div class="events-list" id="eventsList"><div class="empty-state"><div class="emoji">🐱</div><div class="text">等待事件...</div></div></div>
  </div>
</div>
<script>
const $=id=>document.getElementById(id);
let activeSession=null;

function render(data) {
  const sessions=data.sessions||[];
  // 更新连接状态
  if(sessions.length>0){
    $('statusText').textContent=sessions.length+' 个会话';
  }

  // 多会话标签
  const tabs=$('sessionTabs');
  if(sessions.length>1){
    if(!activeSession||!sessions.find(s=>s.sessionId===activeSession))activeSession=sessions[0].sessionId;
    tabs.innerHTML=sessions.map(s=>'<div class="session-tab'+(s.sessionId===activeSession?' active':'')+'" data-sid="'+s.sessionId+'">'+s.sessionId.substring(0,8)+'</div>').join('');
    tabs.querySelectorAll('.session-tab').forEach(t=>t.onclick=()=>switchSession(t.dataset.sid));
  } else {
    tabs.innerHTML='';
    activeSession=sessions.length?sessions[0].sessionId:null;
  }

  if(!sessions.length){
    $('octoEmoji').textContent='🐱';
    $('octoEmoji').style.animation='float 3s ease-in-out infinite';
    $('octoMood').textContent='IDLE';
    $('octoMsg').textContent='等待 Claude Code...';
    $('octoAct').textContent='';
    $('toolBadge').innerHTML='';
    $('dur').textContent='--:--:--';
    $('evtCount').textContent='0';
    $('lastUp').textContent='--:--:--';
    $('evtBadge').textContent='0';
    $('eventsList').innerHTML='<div class="empty-state"><div class="emoji">🐱</div><div class="text">等待事件...</div></div>';
    return;
  }

  const s=sessions.find(x=>x.sessionId===activeSession)||sessions[0];

  // 章鱼区
  $('octoEmoji').textContent=s.emoji||'🐱';
  $('octoEmoji').style.animation=s.anim||'float 3s ease-in-out infinite';
  $('octoMood').textContent=(s.mood||'idle').toUpperCase();
  $('octoMsg').textContent=s.message||'';
  $('octoAct').textContent=s.activity||'';
  $('toolBadge').innerHTML=s.tool?'<div class="tool-badge">'+s.tool+'</div>':'';
  $('evtCount').textContent=s.eventCount||0;
  $('evtBadge').textContent=s.eventCount||0;
  $('lastUp').textContent=s.updatedAt?new Date(s.updatedAt).toLocaleTimeString('zh-CN',{hour12:false}):'--:--:--';

  // 事件列表
  const el=$('eventsList');
  if(s.events&&s.events.length>0){
    el.innerHTML=s.events.map(e=>'<div class="event-row"><span class="time">'+e.ts+'</span><span class="ev">'+e.event+'</span><span class="detail">'+(e.detail||'')+'</span></div>').join('');
  } else {
    el.innerHTML='<div class="empty-state"><div class="emoji">🐱</div><div class="text">等待事件...</div></div>';
  }
}

function switchSession(sid){activeSession=sid;render(globalState)}

let globalState={sessions:[]};

const es=new EventSource('/sse');
es.onopen=()=>{console.log('SSE OPEN');$('statusDot').className='status-dot';$('statusText').textContent='已连接';render(globalState)};
es.onmessage=e=>{console.log('SSE MSG',e.data.substring(0,100));try{const d=JSON.parse(e.data);globalState=d;render(d)}catch(err){console.log('SSE parse err',err)}};
es.onerror=(err)=>{console.log('SSE ERR',es.readyState,err);$('statusDot').className='status-dot offline';$('statusText').textContent='重连中...'};
$('statusText').textContent='SSE连接中('+es.readyState+')';

// 每秒更新计时器
setInterval(()=>{
  const sessions=globalState.sessions||[];
  const s=sessions.find(x=>x.sessionId===activeSession)||sessions[0];
  if(s&&s.sessionStart){
    const t=Math.floor((Date.now()-s.sessionStart)/1000);
    $('dur').textContent=String(Math.floor(t/3600)).padStart(2,'0')+':'+String(Math.floor(t%3600/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
  }
},1000);
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
    res.end(HTML);
    return;
  }

  if (req.method === 'GET' && req.url === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(`data: ${JSON.stringify(getAllSessionsState())}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (req.method === 'GET' && req.url === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getAllSessionsState()));
    return;
  }

  if (req.method === 'POST' && req.url === '/hook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const input = JSON.parse(body);
        handleHook(input);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

function handleHook(input) {
  const event = input.event || input.hook_event_name;
  if (!event) return;

  const sessionId = input.session_id || 'unknown';
  const state = getOrCreateSession(sessionId);

  const mood = EVENT_TO_MOOD[event] || 'working';
  state.mood = mood;

  const label = EVENT_LABELS[event] || event;

  let detail = '';
  if (input.tool_name) detail = input.tool_name;
  else if (input.tool_input) {
    try {
      const ti = typeof input.tool_input === 'string' ? JSON.parse(input.tool_input) : input.tool_input;
      detail = ti.command ? ti.command.substring(0, 60) : (ti.content || '').substring(0, 60);
    } catch { detail = String(input.tool_input).substring(0, 60); }
  }
  if (input.tool_result) {
    const tr = String(input.tool_result).substring(0, 80);
    detail = detail ? detail + ' → ' + tr : tr;
  }

  state.tool = input.tool_name || '';
  state.activity = detail;

  const MSGS = {
    SessionStart: ['🐱 Claude Code 启动了', '新会话开始'],
    SessionEnd: ['👋 会话结束，再见', '走了走了'],
    UserPromptSubmit: ['📥 用户发来指令', '收到新任务'],
    PreToolUse: ['⚡ 工具调用中...', '正在使用工具...'],
    PostToolUse: ['✅ 工具完成', '搞定一个'],
    PostToolUseFailure: ['❌ 工具失败了', '出错了'],
    Stop: ['🎉 任务完成', '搞完收工'],
    SubagentStart: ['🔄 子代理启动', '分身后术！'],
    SubagentStop: ['🔄 子代理结束', '合体！'],
    PreCompact: ['📦 压缩上下文中...', '整理记忆中...'],
    PostCompact: ['📦 压缩完成', '脑子清醒了'],
    Notification: ['📬 有通知', '叫~'],
    PermissionRequest: ['⏳ 等待用户授权', '需要批准'],
  };
  const pool = MSGS[event];
  state.message = pool ? pool[Math.floor(Math.random() * pool.length)] : label;

  if (!state.sessionStart) state.sessionStart = Date.now();
  if (event === 'SessionEnd') state.sessionStart = null;

  state.updatedAt = Date.now();
  addEvent(state, label, detail);
  broadcast();
}

// ── 文件监听事件（旧版兼容） ──
const EVENT_FILE = path.join(__dirname, 'latest-event.json');
let lastMtime = 0;

setInterval(() => {
  try {
    const stats = fs.statSync(EVENT_FILE);
    if (stats.mtime.getTime() !== lastMtime) {
      lastMtime = stats.mtime.getTime();
      const data = fs.readFileSync(EVENT_FILE, 'utf8');
      const evt = JSON.parse(data);
      handleHook(evt);
    }
  } catch (e) {
    // 文件可能还不存在
  }
}, 100);

server.listen(PORT, () => {
  console.log('🐱 Claude Code Monitor (multi-session) running at http://localhost:' + PORT);
  console.log('   Hook URL: POST http://localhost:' + PORT + '/hook');
  console.log('   State:    GET  http://localhost:' + PORT + '/state');
  console.log('👀 Watching ' + EVENT_FILE + ' for changes...');
});