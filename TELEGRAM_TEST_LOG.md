測試 Telegram 發送功能

目標：
發送測試消息 "我是 open claw" 到 channel

問題：
❌ Bot 不是該 channel 的成員 (403 Forbidden)

解決方案：
1. 取得 channel ID
2. 將 bot 加入該 channel
3. 使用 channel ID 發送

查看可用參數：
- channel: telegram
- to: unknown (需要提供目標)
- target: unknown (需要提供目標)