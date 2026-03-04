#!/bin/bash

echo "🚀 启动 Telegram Reminder Bot..."
echo "=================================================="

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 未找到 .env 文件"
    echo "📄 请先复制 .env.example 并配置自己的参数"
    echo ""
    echo "1. 复制配置文件："
    echo "   cp .env.example .env"
    echo ""
    echo "2. 编辑 .env 文件，填写以下内容："
    echo "   - TELEGRAM_BOT_TOKEN your_bot_token"
    echo "   - TELEGRAM_CHAT_ID your_chat_id"
    echo ""
    exit 1
fi

# 启动服务器
echo "✅ 加载配置："
cat .env | grep -v "TOKEN\|CHAT_ID\|PASSWORD\|KEY.*="
echo "=================================================="
echo "✅ 启动中..."
echo ""

npm start