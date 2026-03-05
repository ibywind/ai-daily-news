/**
 * HTML Generator
 * 生成静态日报页面
 */

const fs = require('fs');
const path = require('path');
const { generateDailyNews, saveData, loadData } = require('./scraper');

// 路径配置
const PATHS = {
  data: path.join(__dirname, '../data/daily.json'),
  output: path.join(__dirname, '../../frontend'),
  archive: path.join(__dirname, '../../frontend/archive')
};

// HTML 模板
const TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="AI日报 - 每日更新的人工智能、跨境电商、产品创业热点资讯">
  <meta name="theme-color" content="#667eea">
  <title>{{title}}</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
</head>
<body>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🚀</span>
          <h1>AI 日报</h1>
        </div>
        <p class="subtitle">人工智能 · 跨境电商 · 产品创业</p>
        <div class="date-box">
          <span class="date-icon">📅</span>
          <span class="date-text">{{date}}</span>
        </div>
        
        <div class="stats">
          {{stats}}
        </div>
      </div>
      <div class="header-bg"></div>
    </header>

    <nav class="nav">
      <div class="nav-content">
        {{nav}}
      </div>
    </nav>

    <main class="main">
      <div class="container">
        {{content}}
      </div>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <p>📰 每日自动更新 · 数据来源于网络公开信息</p>
        <p>Generated with ❤️ · <a href="archive/">📂 历史存档</a></p>
        <p class="update-time">更新时间: {{updateTime}}</p>
      </div>
    </footer>
  </div>

  <script src="js/app.js"></script>
</body>
</html>`;

// 生成统计信息 HTML
function generateStats(data) {
  const totalNews = data.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const categories = data.categories.filter(cat => cat.items.length > 0).length;
  
  return `
    <div class="stat-item">
      <div class="stat-value">${totalNews}</div>
      <div class="stat-label">今日资讯</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${categories}</div>
      <div class="stat-label">分类板块</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">24h</div>
      <div class="stat-label">实时更新</div>
    </div>
  `;
}

// 生成导航 HTML
function generateNav(data) {
  return data.categories.map(cat => 
    `<a href="#${cat.id}" class="nav-link">${cat.icon} ${cat.name}</a>`
  ).join('');
}

// 生成新闻内容 HTML
function generateNewsContent(data) {
  return data.categories.map(cat => {
    const newsHTML = cat.items.map(item => `
      <article class="news-card">
        <div class="news-header">
          <h3 class="news-title">
            <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
          </h3>
          ${item.tag ? `<span class="news-tag">${item.tag}</span>` : ''}
        </div>
        <p class="news-summary">${item.summary}</p>
        <div class="news-meta">
          <span class="meta-source">📰 ${item.source}</span>
          <span class="meta-time">🕐 ${item.time}</span>
        </div>
      </article>
    `).join('');
    
    return `
      <section class="category" id="${cat.id}">
        <div class="category-header">
          <span class="category-icon">${cat.icon}</span>
          <h2 class="category-title">${cat.name}</h2>
          <span class="category-count">${cat.items.length} 条</span>
        </div>
        <div class="news-grid">
          ${newsHTML}
        </div>
      </section>
    `;
  }).join('');
}

// 生成完整 HTML
function generateHTML(data) {
  return TEMPLATE
    .replace('{{title}}', `AI 日报 - ${data.date.date}`)
    .replace('{{date}}', data.date.display)
    .replace('{{stats}}', generateStats(data))
    .replace('{{nav}}', generateNav(data))
    .replace('{{content}}', generateNewsContent(data))
    .replace('{{updateTime}}', new Date(data.generatedAt).toLocaleString('zh-CN'));
}

// 保存历史存档
function saveArchive(data) {
  if (!fs.existsSync(PATHS.archive)) {
    fs.mkdirSync(PATHS.archive, { recursive: true });
  }
  
  const archiveFile = path.join(PATHS.archive, `${data.date.date}.html`);
  const html = generateHTML(data);
  fs.writeFileSync(archiveFile, html, 'utf-8');
  console.log(`📁 已保存存档: ${archiveFile}`);
  
  // 更新存档索引
  updateArchiveIndex();
}

// 更新存档索引
function updateArchiveIndex() {
  if (!fs.existsSync(PATHS.archive)) return;
  
  const files = fs.readdirSync(PATHS.archive)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .sort()
    .reverse();
  
  const listHTML = files.map(file => {
    const date = file.replace('.html', '');
    const displayDate = new Date(date).toLocaleDateString('zh-CN', { 
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
    });
    return `
      <div class="archive-item">
        <a href="${file}" class="archive-link">${displayDate}</a>
        <span class="archive-date">${date}</span>
      </div>
    `;
  }).join('');
  
  const indexHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 日报 - 历史存档</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body class="archive-page">
  <div class="app">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">📚</span>
          <h1>历史存档</h1>
        </div>
        <p class="subtitle">往期 AI 日报汇总</p>
      </div>
    </header>
    
    <main class="main">
      <div class="container">
        <div class="archive-list">
          ${listHTML}
        </div>
        <p style="text-align: center; margin-top: 40px;">
          <a href="../" class="btn-back">← 返回今日日报</a>
        </p>
      </div>
    </main>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(PATHS.archive, 'index.html'), indexHTML, 'utf-8');
  console.log('📝 已更新存档索引');
}

// 主函数
async function main() {
  console.log('🚀 AI 日报生成器\n');
  
  const useMock = process.argv.includes('--mock') || process.argv.includes('-m');
  const archiveFlag = process.argv.includes('--archive') || process.argv.includes('-a');
  
  try {
    // 生成数据
    const data = await generateDailyNews();
    
    // 保存 JSON 数据
    saveData(data, PATHS.data);
    
    // 确保目录存在
    if (!fs.existsSync(PATHS.output)) {
      fs.mkdirSync(PATHS.output, { recursive: true });
    }
    
    // 生成并保存 HTML
    const html = generateHTML(data);
    fs.writeFileSync(path.join(PATHS.output, 'index.html'), html, 'utf-8');
    
    console.log(`\n✅ 日报已生成: ${path.join(PATHS.output, 'index.html')}`);
    
    // 保存存档
    if (archiveFlag) {
      saveArchive(data);
    }
    
    console.log('\n🎉 完成！');
    
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    process.exit(1);
  }
}

// 导出函数
module.exports = {
  generateHTML,
  generateStats,
  generateNav,
  generateNewsContent,
  saveArchive,
  updateArchiveIndex
};

// 直接运行
if (require.main === module) {
  main();
}
