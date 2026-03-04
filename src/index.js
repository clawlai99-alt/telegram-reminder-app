const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// 初始化 Express
const app = express();
const PORT = process.env.PORT || 3000;

// 配置 Telegram Bot Token（从环境变量或默认值获取）
const botToken = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(botToken, { polling: true });

// 配置 Telegram Chat ID（可从消息中动态获取）
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 身份验证
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// 初始化数据库
const db = new sqlite3.Database('./reminders.db', (err) => {
  if (err) {
    console.error('无法连接数据库:', err.message);
  } else {
    console.log('已连接到 SQLite 数据库');
    initDB();
  }
});

function initDB() {
  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    content TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    triggered BOOLEAN DEFAULT 0
  )`);

  // 设置定时任务清理已触发的提醒
  db.run(`CREATE TABLE IF NOT EXISTS triggered_reminders (
    id INTEGER PRIMARY KEY,
    reminder_id INTEGER,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 设置定时器，每小时检查一次需要触发的提醒
  setInterval(checkReminders, 60000); // 每分钟检查一次
}

// 中间件
app.use(bodyParser.json());
app.use(express.static('public'));

// 验证授权
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${AUTH_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: '未授权访问' });
  }
}

// 接收 /action/{minutes}/{content}
app.get('/action/:minutes/:content', (req, res) => {
  const { minutes, content } = req.params;

  // 对 content 进行 URL 解码
  const decodedContent = decodeURIComponent(content);

  // 验证输入
  if (!minutes || !content) {
    return res.status(400).json({ error: '请提供 minutes 和 content' });
  }

  if (minutes <= 0) {
    return res.status(400).json({ error: 'minutes 必须大于 0' });
  }

  // 如果有指定 chat_id，使用该 ID；否则使用环境变量中的默认 ID
  const targetChatId = req.query.chat_id || CHAT_ID;

  if (!targetChatId) {
    return res.status(400).json({ error: '未设置 Telegram Chat ID' });
  }

  // 保存到数据库
  const sql = `INSERT INTO reminders (chat_id, content, minutes) VALUES (?, ?, ?)`;
  db.run(sql, [targetChatId, decodedContent, parseInt(minutes)], function(err) {
    if (err) {
      console.error('保存提醒失败:', err);
      return res.status(500).json({ error: '保存提醒失败' });
    }

    console.log(`已创建提醒: chat_id=${targetChatId}, 内容="${decodedContent}", ${minutes}分钟后提醒`);

    res.json({
      success: true,
      message: `已设置提醒: ${minutes}分钟后会收到 "${decodedContent}"`,
      reminder_id: this.lastID
    });
  });
});

// 接收 JSON 格式的 POST 请求
app.post('/webhook', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: '消息格式错误' });
  }

  const chatId = message.chat.id;

  // 如果是 /action 命令，解析命令
  if (message.text && message.text.startsWith('/action')) {
    const parts = message.text.split(' ');
    if (parts.length >= 3) {
      const minutes = parts[1];
      const content = parts.slice(2).join(' ');

      db.run(`INSERT INTO reminders (chat_id, content, minutes) VALUES (?, ?, ?)`,
        [chatId, content, parseInt(minutes)], function(err) {
          if (err) {
            bot.sendMessage(chatId, '保存提醒失败');
          } else {
            bot.sendMessage(chatId, `✅ 已设置提醒: ${minutes}分钟后会收到 "${content}"`);
            console.log(`已创建提醒: chat_id=${chatId}, 内容="${content}", ${minutes}分钟后提醒 (ID: ${this.lastID})`);
          }
        }
      );
    }
  }

  res.json({ received: true });
});

// 检查并触发需要显示的提醒
function checkReminders() {
  const sql = `
    SELECT id, chat_id, content, minutes
    FROM reminders
    WHERE triggered = 0
    AND datetime(created_at + ? minutes) <= datetime('now')
  `;

  db.all(sql, [60], (err, rows) => {
    if (err) {
      console.error('查询提醒失败:', err);
      return;
    }

    rows.forEach(row => {
      // 发送提醒
      bot.sendMessage(row.chat_id, `⏰ 提醒: ${row.content}`);

      // 标记为已触发
      db.run(
        `UPDATE reminders SET triggered = 1 WHERE id = ?`,
        [row.id],
        (err) => {
          if (err) {
            console.error('更新提醒状态失败:', err);
          }
        }
      );

      console.log('已触发提醒:', row.id);
    });
  });
}

// 获取所有提醒（用于测试）
app.get('/reminders', requireAuth, (req, res) => {
  db.all('SELECT * FROM reminders ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json(rows);
  });
});

// 删除提醒
app.delete('/reminders/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM reminders WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    res.json({ success: true, message: '提醒已删除' });
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 服务器启动
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🎉 服务器启动成功！`);
  console.log(`📡 本地端口: ${PORT}`);
  console.log(`🌐 可以通过 http://localhost:${PORT} 访问`);
  console.log('='.repeat(50));
});

// 优雅退出
process.on('SIGINT', () => {
  bot.stopPolling();
  db.close((err) => {
    if (err) {
      console.error('关闭数据库错误:', err.message);
    }
    process.exit(0);
  });
});