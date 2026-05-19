# Claude Code Monitor

一个本地实时监控 Claude Code 工作状态的可视化系统。通过浏览器以动画猫猫的形式直观展示 Claude Code 的当前状态。

## 特性

- 🎯 **零云服务** - 纯本地 Node.js，开箱即用
- ⚡ **实时推送** - SSE (Server-Sent Events) 毫秒级响应
- 🐱 **9种猫猫情绪** - 一眼可知 Claude Code 在干什么
- 📊 **完整审计** - 事件日志记录所有工具调用轨迹
- 🎨 **全屏仪表盘** - 左右分栏，零滚动设计
- 🔄 **多会话支持** - 同时监控多个 Claude Code 会话

## 快速开始

### 1. 启动监控服务

```bash
node server.js
```

服务将在 `http://localhost:3000` 启动。

### 2. 配置 Claude Code Hooks

编辑 `~/.claude/settings.json`，添加以下内容：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /c/Users/Administrator/.qclaw/workspace/claude-code-monitor/claude-hook.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /c/Users/Administrator/.qclaw/workspace/claude-code-monitor/claude-hook.js"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /c/Users/Administrator/.qclaw/workspace/claude-code-monitor/claude-hook.js"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /c/Users/Administrator/.qclaw/workspace/claude-code-monitor/claude-hook.js"
          }
        ]
      }
    ]
  }
}
```

> ⚠️ **Windows 用户注意**：Claude Code 使用 Git Bash 执行 hook 命令，必须使用正斜杠路径 `/c/Users/...`，反斜杠会被吞掉！

### 3. 打开浏览器

访问 `http://localhost:3000`，开始监控！

## 情绪状态说明

| 情绪 | 猫猫 | 触发事件 |
|------|------|----------|
| idle | 🐱 | 会话启动、子代理结束、压缩完成 |
| working | 😾 | 工具调用、子代理启动、压缩中 |
| happy | 😻 | 任务完成 |
| debugging | 🙀 | 工具调用失败 |
| sleepy | 😿 | 会话结束 |
| excited | 😸 | 收到通知 |
| thinking | 😺 | 用户输入 |
| waiting | 🐱 | 等待权限 |
| error | 😹 | 未知异常 |

## 技术架构

```
Claude Code → claude-hook.js → HTTP POST → server.js → SSE → 浏览器
```

- **claude-hook.js** - Hook 桥接脚本，同步读取 stdin JSON 并转发
- **server.js** - 监控服务端（单文件），零外部依赖
- **浏览器仪表盘** - 原生 HTML/CSS/JS，无框架依赖

## 文件说明

- `server.js` - 监控服务（含前端页面）
- `claude-hook.js` - Hook 桥接脚本
- `WHITEPAPER.md` - 系统白皮书（详细技术文档）

## 自定义

### 更换表情包

编辑 `server.js` 中的 `MOOD_ANIM` 对象，修改 `emoji` 字段即可。

### 添加新事件类型

1. 在 `EVENT_TO_MOOD` 中添加事件到情绪的映射
2. 在 `EVENT_LABELS` 中添加事件的中文标签
3. 在 `MSGS` 中添加事件的随机消息池

## 常见问题

### Hook 不触发？

检查：
1. `settings.json` 格式是否正确（必须是 `matcher` + `hooks` 嵌套结构）
2. Windows 路径是否使用正斜杠
3. 查看 `hook-debug.log` 调试日志

### 会话时长不显示？

确保 `server.js` 中包含 `if (!state.sessionStart) state.sessionStart = Date.now();` 这行代码。

### 浏览器显示旧页面？

清除浏览器缓存，或按 `Ctrl+Shift+R` 强制刷新。

## 灵感来源

本项目受 [ark-face](https://github.com/nicepkg/ark-face) 启发，将架构简化为纯本地运行版本。

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**作者**: QClaw  
**创建时间**: 2026-05-18  
**最后更新**: 2026-05-19
