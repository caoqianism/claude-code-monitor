# Claude Code Monitor

涓€涓湰鍦板疄鏃剁洃鎺?Claude Code 宸ヤ綔鐘舵€佺殑鍙鍖栫郴缁熴€傞€氳繃娴忚鍣ㄤ互鍔ㄧ敾鐚尗鐨勫舰寮忕洿瑙傚睍绀?Claude Code 鐨勫綋鍓嶇姸鎬併€?
![image.png](https://pic1.imgdb.cn/item/6a0bcd5dfebbe1263e718944.png)

## 鐗规€?
- 馃幆 **闆朵簯鏈嶅姟** - 绾湰鍦?Node.js锛屽紑绠卞嵆鐢?- 鈿?**瀹炴椂鎺ㄩ€?* - SSE (Server-Sent Events) 姣绾у搷搴?- 馃惐 **9绉嶇尗鐚儏缁?* - 涓€鐪煎彲鐭?Claude Code 鍦ㄥ共浠€涔?- 馃搳 **瀹屾暣瀹¤** - 浜嬩欢鏃ュ織璁板綍鎵€鏈夊伐鍏疯皟鐢ㄨ建杩?- 馃帹 **鍏ㄥ睆浠〃鐩?* - 宸﹀彸鍒嗘爮锛岄浂婊氬姩璁捐
- 馃攧 **澶氫細璇濇敮鎸?* - 鍚屾椂鐩戞帶澶氫釜 Claude Code 浼氳瘽

## 蹇€熷紑濮?
### 1. 鍏嬮殕椤圭洰

```bash
git clone https://github.com/浣犵殑鐢ㄦ埛鍚?claude-code-monitor.git
cd claude-code-monitor
```

### 2. 鍚姩鐩戞帶鏈嶅姟

```bash
node server.js
```

鏈嶅姟灏嗗湪 `http://localhost:3000` 鍚姩銆?
### 2. 閰嶇疆 Claude Code Hooks

缂栬緫 `~/.claude/settings.json`锛堝嵆 `C:\Users\浣犵殑鐢ㄦ埛鍚峔.claude\settings.json`锛夛紝娣诲姞浠ヤ笅鍐呭锛?
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /c/Users/浣犵殑鐢ㄦ埛鍚?path/to/claude-code-monitor/claude-hook.js"
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
            "command": "node /c/Users/浣犵殑鐢ㄦ埛鍚?path/to/claude-code-monitor/claude-hook.js"
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
            "command": "node /c/Users/浣犵殑鐢ㄦ埛鍚?path/to/claude-code-monitor/claude-hook.js"
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
            "command": "node /c/Users/浣犵殑鐢ㄦ埛鍚?path/to/claude-code-monitor/claude-hook.js"
          }
        ]
      }
    ]
  }
}
```

> 鈿狅笍 **Windows 鐢ㄦ埛娉ㄦ剰**锛氬皢 `浣犵殑鐢ㄦ埛鍚?path/to` 鏇挎崲涓轰綘鐨勫疄闄呰矾寰勩€侰laude Code 浣跨敤 Git Bash 鎵ц hook 鍛戒护锛屽繀椤讳娇鐢ㄦ鏂滄潬璺緞鏍煎紡 `/c/Users/...`锛屽弽鏂滄潬浼氳绯荤粺鍚炴帀锛?
> 馃挕 璺緞绀轰緥锛?> - 浣犵殑椤圭洰鏀惧湪 `D:\MyProjects\claude-code-monitor` 鈫?`node /d/MyProjects/claude-code-monitor/claude-hook.js`
> - 浣犵殑鐢ㄦ埛鍚嶆槸 `ZhangSan` 鈫?`node /c/Users/ZhangSan/Projects/claude-code-monitor/claude-hook.js`

### 3. 鎵撳紑娴忚鍣?
璁块棶 `http://localhost:3000`锛屽紑濮嬬洃鎺э紒

## 鎯呯华鐘舵€佽鏄?
| 鎯呯华 | 鐚尗 | 瑙﹀彂浜嬩欢 |
|------|------|----------|
| idle | 馃惐 | 浼氳瘽鍚姩銆佸瓙浠ｇ悊缁撴潫銆佸帇缂╁畬鎴?|
| working | 馃樉 | 宸ュ叿璋冪敤銆佸瓙浠ｇ悊鍚姩銆佸帇缂╀腑 |
| happy | 馃樆 | 浠诲姟瀹屾垚 |
| debugging | 馃檧 | 宸ュ叿璋冪敤澶辫触 |
| sleepy | 馃樋 | 浼氳瘽缁撴潫 |
| excited | 馃樃 | 鏀跺埌閫氱煡 |
| thinking | 馃樅 | 鐢ㄦ埛杈撳叆 |
| waiting | 馃惐 | 绛夊緟鏉冮檺 |
| error | 馃樄 | 鏈煡寮傚父 |

## 鎶€鏈灦鏋?
```
Claude Code 鈫?claude-hook.js 鈫?HTTP POST 鈫?server.js 鈫?SSE 鈫?娴忚鍣?```

- **claude-hook.js** - Hook 妗ユ帴鑴氭湰锛屽悓姝ヨ鍙?stdin JSON 骞惰浆鍙?- **server.js** - 鐩戞帶鏈嶅姟绔紙鍗曟枃浠讹級锛岄浂澶栭儴渚濊禆
- **娴忚鍣ㄤ华琛ㄧ洏** - 鍘熺敓 HTML/CSS/JS锛屾棤妗嗘灦渚濊禆

## 鏂囦欢璇存槑

- `server.js` - 鐩戞帶鏈嶅姟锛堝惈鍓嶇椤甸潰锛?- `claude-hook.js` - Hook 妗ユ帴鑴氭湰
- `WHITEPAPER.md` - 绯荤粺鐧界毊涔︼紙璇︾粏鎶€鏈枃妗ｏ級

## 鑷畾涔?
### 鏇存崲琛ㄦ儏鍖?
缂栬緫 `server.js` 涓殑 `MOOD_ANIM` 瀵硅薄锛屼慨鏀?`emoji` 瀛楁鍗冲彲銆?
### 娣诲姞鏂颁簨浠剁被鍨?
1. 鍦?`EVENT_TO_MOOD` 涓坊鍔犱簨浠跺埌鎯呯华鐨勬槧灏?2. 鍦?`EVENT_LABELS` 涓坊鍔犱簨浠剁殑涓枃鏍囩
3. 鍦?`MSGS` 涓坊鍔犱簨浠剁殑闅忔満娑堟伅姹?
## 甯歌闂

### Hook 涓嶈Е鍙戯紵

妫€鏌ワ細
1. `settings.json` 鏍煎紡鏄惁姝ｇ‘锛堝繀椤绘槸 `matcher` + `hooks` 宓屽缁撴瀯锛?2. Windows 璺緞鏄惁浣跨敤姝ｆ枩鏉?3. 鏌ョ湅 `hook-debug.log` 璋冭瘯鏃ュ織

### 浼氳瘽鏃堕暱涓嶆樉绀猴紵

纭繚 `server.js` 涓寘鍚?`if (!state.sessionStart) state.sessionStart = Date.now();` 杩欒浠ｇ爜銆?
### 娴忚鍣ㄦ樉绀烘棫椤甸潰锛?
娓呴櫎娴忚鍣ㄧ紦瀛橈紝鎴栨寜 `Ctrl+Shift+R` 寮哄埗鍒锋柊銆?
## 鐏垫劅鏉ユ簮

鏈」鐩彈 [ark-face](https://github.com/nicepkg/ark-face) 鍚彂锛屽皢鏋舵瀯绠€鍖栦负绾湰鍦拌繍琛岀増鏈€?
## 璁稿彲璇?
MIT

## 璐＄尞

娆㈣繋鎻愪氦 Issue 鍜?Pull Request锛?
---

**浣滆€?*: QClaw  
**鍒涘缓鏃堕棿**: 2026-05-18  
**鏈€鍚庢洿鏂?*: 2026-05-19
