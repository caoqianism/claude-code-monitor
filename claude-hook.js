#!/usr/bin/env node
// Claude Code Hook - 等待 HTTP 完成后再退出

const fs = require('fs');
const http = require('http');

const MONITOR_URL = 'http://localhost:3000/hook';
const DEBUG_LOG = 'C:\\Users\\Administrator\\.qclaw\\workspace\\claude-code-monitor\\hook-debug.log';

// 超时保护：2秒后强制退出
const timer = setTimeout(() => {
  try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] TIMEOUT\n`); } catch(e) {}
  process.exit(0);
}, 2000);

// 读取 stdin
let stdinData = '';
try {
  stdinData = fs.readFileSync(0, 'utf8').replace(/^\uFEFF/, '').trim();
} catch (e) {
  try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] STDIN_ERROR: ${e.message}\n`); } catch(e2) {}
  clearTimeout(timer);
  process.exit(0);
}

// 记录收到的原始数据
try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] RECV: ${stdinData.substring(0, 200)}\n`); } catch(e) {}

// 解析并发送
let payload;
try {
  const input = JSON.parse(stdinData);
  payload = {
    event: input.hook_event_name || 'Unknown',
    tool_name: input.tool_name || '',
    timestamp: Date.now(),
  };
} catch (e) {
  payload = { event: 'ParseError', raw: stdinData.substring(0, 100), timestamp: Date.now() };
}

const data = JSON.stringify(payload);
const url = new URL(MONITOR_URL);
const options = {
  hostname: url.hostname,
  port: url.port || 80,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
  timeout: 1000,
};

const req = http.request(options, (res) => {
  res.resume();
  try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] SENT_OK: ${payload.event} ${payload.tool_name}\n`); } catch(e) {}
  clearTimeout(timer);
  process.exit(0);
});

req.on('error', (e) => {
  try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] HTTP_ERROR: ${e.message}\n`); } catch(e2) {}
  clearTimeout(timer);
  process.exit(0);
});

req.on('timeout', () => {
  req.destroy();
  try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] HTTP_TIMEOUT\n`); } catch(e) {}
  clearTimeout(timer);
  process.exit(0);
});

req.end(data);
