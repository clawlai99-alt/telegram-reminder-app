# Telegram 訊息範例 Log

此檔案記錄 Telegram 訊息的格式，用於參考和除錯。

## 範例：新的 Telegram 訊息已收到

### 訊息內容
```
3+3=?
```

### Session 資訊
- displayName: "Lai Levele id:8611719789"
- to: "telegram:8611719789"
- channel: "telegram"
- sessionId: "8a9c21e6-6f0b-465b-b45b-27ef1a626a74"

### 重要筆記
- 只需回覆 telegram 傳過來的訊息，不用主動更新自身狀態
- 回應時使用正確的 target 格式來確保訊息正確傳送