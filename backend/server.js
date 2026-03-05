/**
 * Express Server
 * 后端 API 服务
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { generateDailyNews, saveData, loadData } = require('./scraper/scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '../docs')));

// 数据目录
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ===== API Routes =====

// 获取今日日报
app.get('/api/daily', (req, res) => {
  try {
    const data = loadData(path.join(DATA_DIR, 'daily.json'));
    if (!data) {
      return res.status(404).json({ error: '今日日报尚未生成' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取指定日期日报
app.get('/api/daily/:date', (req, res) => {
  try {
    const { date } = req.params;
    const data = loadData(path.join(DATA_DIR, `archive/${date}.json`));
    if (!data) {
      return res.status(404).json({ error: '未找到该日期日报' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有可用日期列表
app.get('/api/dates', (req, res) => {
  try {
    const archiveDir = path.join(DATA_DIR, 'archive');
    if (!fs.existsSync(archiveDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(archiveDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort()
      .reverse();
    
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 手动触发生成日报
app.post('/api/generate', async (req, res) => {
  try {
    console.log('🔄 手动触发生成日报...');
    const data = await generateDailyNews();
    saveData(data, path.join(DATA_DIR, 'daily.json'));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取分类列表
app.get('/api/categories', (req, res) => {
  const { SOURCES } = require('./scraper/scraper');
  res.json(Object.entries(SOURCES).map(([key, value]) => ({
    id: key,
    name: value.name,
    icon: value.icon,
    keywords: value.keywords
  })));
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 前端路由兜底
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
🚀 AI 日报服务器已启动
📍 http://localhost:${PORT}

API 端点:
  GET  /api/daily       - 今日日报
  GET  /api/daily/:date - 指定日期日报
  GET  /api/dates       - 日期列表
  GET  /api/categories  - 分类列表
  GET  /api/health      - 健康检查
  POST /api/generate    - 手动生成日报
`);
});

module.exports = app;
