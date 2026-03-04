#!/bin/bash

# Telegram Reminder Bot GitHub 部署脚本

BASE_DIR="/home/node/.openclaw/workspace/telegram-reminder"
cd "$BASE_DIR"

echo "🚀 Telegram Reminder Bot GitHub 部署"
echo "=================================================="
echo ""

# 检查是否在 git 目录中
if [ ! -d .git ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git config user.name "OpenClaw Bot"
    git config user.email "clawlai99@gmail.com"
fi

echo "📝 提交项目文件..."
git add .
git commit -m "$(date +'%Y-%m-%d %H:%M:%S') - Telegram Reminder Bot 项目创建"

echo ""
echo "🔗 配置 GitHub 远程仓库..."
echo "请提供以下信息："
echo ""

# 设置远程仓库地址
read -p "GitHub 仓库 URL (https://github.com/clawlai99/GITHUB_USERNAME/repo.git): " REPO_URL
read -p "GitHub 认证令牌（用于 PR）：" GITHUB_TOKEN

if [ -z "$REPO_URL" ]; then
    echo "❌ 请提供仓库 URL"
    exit 1
fi

git remote add origin "$REPO_URL"

echo ""
echo "🔄 推送到 GitHub..."
git push -u origin main

echo ""
echo "⚙️ 准备创建 Pull Request..."
echo ""

# 提取仓库信息
REPO_NAME=$(basename "$REPO_URL" .git)
BRANCH_NAME="feature/telegram-reminder-bot-$(date +%Y%m%d-%H%M%S)"

echo "📁 创建新分支: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"
git push -u origin "$BRANCH_NAME"

echo "📝 准备 PR 描述..."
PR_TITLE="🚀 新功能：Telegram Reminder Bot"
PR_DESC='## 功能概述

这是一个基于 Node.js 和 Telegram API 的自动化提醒系统。

### 包含功能

- 📱 接收 Telegram 消息 `/action {minutes} {content}`
- ⏰ 自动设置定时提醒
- 🎯 到时自动发送提醒到 Telegram
- 🗄️ 使用 SQLite 存储提醒数据
- 🌐 支持多种使用方式（Telegram 命令、HTTP API、Web 界面）

### 使用方式

1. **配置**：编辑 `.env` 文件，填写 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID`
2. **启动**：`npm start`
3. **使用**：发送 `/action 30 吃午餐` 到 Telegram

详情请查看 `README.md` 文件。

---

✨ 由 OpenClaw 自动创建 PR'
PR_BODY="$PR_DESC"

echo "💬 创建 Pull Request..."
PR_URL=$(curl -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"$(echo -n "$PR_TITLE" | jq -sRr @uri)\",
    \"body\": \"$(echo -n "$PR_BODY" | jq -sRr @uri)\",
    \"head\": \"$BRANCH_NAME\",
    \"base\": \"main\"
  }" \
  "https://api.github.com/repos/clawlai99/REPO_NAME/pulls" 2>/dev/null | \
  jq -r '.html_url' 2>/dev/null)

if [ -z "$PR_URL" ] || [ "$PR_URL" = "null" ]; then
    echo "❌ 创建 PR 失败"
    echo "💡 或者请手动创建 PR："
    echo "   1. 访问仓库: https://github.com/clawlai99/REPO_NAME"
    echo "   2. 点击 New Pull Request"
    echo "   3. 选择分支: $BRANCH_NAME"
    echo "   4. 填写标题和描述"
else
    echo "✅ Pull Request 已创建: $PR_URL"
fi

echo ""
echo "🎉 部署完成！"
echo "=================================================="