# Telegram Reminder Bot

一个基于 Node.js 和 Telegram API 的自动化提醒系统。

## 功能

- 接收 Telegram 消息 `/action {minutes} {content}`
- 自动设置定时提醒
- 到时自动发送提醒到 Telegram

## 安装

```bash
npm install
```

## 配置

1. 创建 `.env` 文件：
```bash
cp .env.example .env
```

2. 填写配置：
```env
# 必填：Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_bot_token_here

# 必填：Telegram Chat ID
TELEGRAM_CHAT_ID=your_chat_id_here

# 可选：身份验证令牌
AUTH_TOKEN=your_auth_token_here
```

3. 获取 Telegram Bot Token 和 Chat ID：
   - 动作 bot：使用 [@BotFather](https://t.me/BotFather) 创建 bot 获取 token
   - Chat ID：发送消息给你的 bot，或者通过搜索 API 获取

## 启动服务器

```bash
npm start
```

## 使用方式

### 方式 1：通过 Telegram 命令

在你的 Telegram 中发送：
```
/action 15 吃午餐
```

### 方式 2：通过 HTTP 请求

```
GET /action/30/开会
```

或者：
```
GET /action/60/session+with+Sarah?chat_id=your_chat_id
```

### 方式 3：保护接口

```
DELETE /reminders/1
```

需要包含 Authorization header:
```
Authorization: Bearer your_auth_token_here
```

## 接口列表

- `GET /health` - 健康检查
- `GET /action/:minutes/:content` - 创建提醒（支持查询参数）
- `POST /webhook` - 接收 Telegram mecessage
- `GET /reminders` - 获取所有提醒（需要认证）  
- `DELETE /reminders/:id` - 删除提醒（需要认证）

## 注意事项

- 提醒有时间限制，超过后会自动清理
- 服务需要保持运行状态
- 使用 SQLite 存储，数据保存在 `reminders.db` 文件中