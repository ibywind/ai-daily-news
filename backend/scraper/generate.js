/**
 * HTML Generator
 * 生成静态日报页面
 */

const fs = require('fs');
const path = require('path');

// 加载环境变量（如果存在 .env 文件）
require('dotenv').config();

const { generateDailyNews, saveData, loadData } = require('./scraper');

// 路径配置
const PATHS = {
  data: path.join(__dirname, '../data/daily.json'),
  output: path.join(__dirname, '../../docs'),
  archive: path.join(__dirname, '../../docs/archive')
};

// HTML 模板 - MetaBlog 风格
const TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="AI日报 - 每日更新的人工智能、跨境电商、产品创业、区块链、新能源热点资讯">
  <meta name="theme-color" content="#0f172a">
  <title>{{title}}</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <nav class="nav-container">
      <a href="/" class="logo">
        <div class="logo-icon">🚀</div>
        <span class="logo-text">AI Daily</span>
      </a>
      
      <div class="nav-links">
        <a href="#" class="nav-link active">首页</a>
        {{navLinks}}
        <a href="archive/" class="nav-link">存档</a>
      </div>
      
      <div class="nav-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" placeholder="搜索...">
        </div>
        <div class="user-avatar">U</div>
      </div>
    </nav>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-card">
      <div class="hero-image"></div>
      <div class="hero-content">
        <div class="hero-tag">
          <span>📅</span>
          <span>今日日报</span>
        </div>
        <h1 class="hero-title">AI 行业情报日报<br>{{dateDisplay}}</h1>
        <div class="hero-meta">
          <div class="hero-author">
            <div class="author-avatar">🤖</div>
            <span>AI 智能助手</span>
          </div>
          <span>•</span>
          <span>{{totalNews}} 条精选资讯</span>
          <span>•</span>
          <span>{{categoryCount}} 大领域</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Content -->
  <main class="main">
    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-value">{{totalNews}}</div>
        <div class="stat-label">今日资讯</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{categoryCount}}</div>
        <div class="stat-label">分类板块</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">24h</div>
        <div class="stat-label">实时更新</div>
      </div>
      <button class="summary-btn" onclick="showDailySummary()">
        <span>📋</span>
        <span>日报汇总</span>
      </button>
    </div>

    {{content}}
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="logo-icon">🚀</div>
            <span class="logo-text">AI Daily</span>
          </div>
          <p class="footer-desc">
            AI 日报是一个自动化行业情报聚合平台，每日抓取并整理 AI、跨境电商、创业、区块链、新能源五大领域的热点资讯。
          </p>
          <div class="footer-contact">
            <p>📧 联系: ai-daily@example.com</p>
          </div>
        </div>
        
        <div class="footer-column">
          <h4 class="footer-title">快速链接</h4>
          <ul class="footer-links">
            <li><a href="/">首页</a></li>
            <li><a href="archive/">历史存档</a></li>
            <li><a href="#">关于我们</a></li>
            <li><a href="#">联系方式</a></li>
          </ul>
        </div>
        
        <div class="footer-column">
          <h4 class="footer-title">分类</h4>
          <ul class="footer-links">
            {{footerCategories}}
          </ul>
        </div>
        
        <div class="footer-column">
          <div class="newsletter">
            <h4 class="newsletter-title">订阅日报</h4>
            <p class="newsletter-desc">每日获取最新行业情报</p>
            <form class="newsletter-form">
              <input type="email" class="newsletter-input" placeholder="输入邮箱">
              <button type="submit" class="newsletter-btn">订阅</button>
            </form>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p class="footer-copyright">© 2026 AI Daily. All Rights Reserved. · 更新时间: {{updateTime}}</p>
        <div class="footer-legal">
          <a href="#">使用条款</a>
          <a href="#">隐私政策</a>
        </div>
      </div>
    </div>
  </footer>

  <script src="js/app.js"></script>
</body>
</html>`;

// 生成导航链接 HTML
function generateNavLinks(data) {
  const shortNames = {
    ai: 'AI',
    ecommerce: '电商',
    startup: '创业',
    web3: 'Web3',
    newenergy: '能源'
  };
  
  return data.categories.map(cat => 
    `<a href="#${cat.id}" class="nav-link">${shortNames[cat.id] || cat.name}</a>`
  ).join('');
}

// 生成页脚分类链接 HTML
function generateFooterCategories(data) {
  return data.categories.slice(0, 4).map(cat => 
    `<li><a href="#${cat.id}">${cat.icon} ${cat.name}</a></li>`
  ).join('');
}

// 生成新闻内容 HTML - MetaBlog 风格
function generateNewsContent(data) {
  const tagColors = {
    ai: 'ai',
    ecommerce: 'ecommerce',
    startup: 'startup',
    web3: 'web3',
    newenergy: 'newenergy'
  };
  
  return data.categories.map(cat => {
    const newsHTML = cat.items.map(item => `
      <a href="${item.url}" target="_blank" rel="noopener" class="news-card-link" data-content="${(item.content || '').replace(/"/g, '&quot;')}">
        <article class="news-card">
          <div class="news-image">
            <img src="${item.image || 'https://picsum.photos/seed/news/400/250'}" alt="${item.title}" loading="lazy">
            <div class="news-category-tag ${tagColors[cat.id]}">${item.tag || '资讯'}</div>
          </div>
          <div class="news-content">
            <h3 class="news-title">${item.title}</h3>
            <p class="news-summary">${item.summary}</p>
            <div class="news-meta">
              <div class="news-author">
                <span>📰</span>
                <span>${item.source}</span>
              </div>
              <span class="news-date">${item.time}</span>
            </div>
          </div>
        </article>
      </a>
    `).join('');
    
    return `
      <section class="category-section" id="${cat.id}" data-category="${cat.id}">
        <div class="category-header">
          <h2 class="category-title">
            <span class="category-icon">${cat.icon}</span>
            ${cat.name}
          </h2>
          <span class="category-count">${cat.items.length} 条</span>
        </div>
        <div class="news-grid">
          ${newsHTML}
        </div>
      </section>
    `;
  }).join('');
}

// 生成完整 HTML - MetaBlog 风格
function generateHTML(data) {
  const totalNews = data.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const categoryCount = data.categories.filter(cat => cat.items.length > 0).length;
  
  return TEMPLATE
    .replace('{{title}}', `AI 日报 - ${data.date.date}`)
    .replace('{{dateDisplay}}', data.date.display)
    .replace(/{{totalNews}}/g, totalNews)
    .replace(/{{categoryCount}}/g, categoryCount)
    .replace('{{navLinks}}', generateNavLinks(data))
    .replace('{{footerCategories}}', generateFooterCategories(data))
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
<body>
  <!-- Header -->
  <header class="header">
    <nav class="nav-container">
      <a href="/" class="logo">
        <div class="logo-icon">🚀</div>
        <span class="logo-text">AI Daily</span>
      </a>
      
      <div class="nav-links">
        <a href="../" class="nav-link">首页</a>
        <a href="#" class="nav-link active">存档</a>
      </div>
      
      <div class="nav-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" placeholder="搜索...">
        </div>
        <div class="user-avatar">U</div>
      </div>
    </nav>
  </header>

  <!-- Main Content -->
  <main class="main" style="padding-top: 40px;">
    <div class="section-header" style="max-width: 1280px; margin: 0 auto 2rem; padding: 0 2rem;">
      <h2 class="section-title">
        <span class="section-icon">📚</span>
        历史存档
      </h2>
    </div>
    
    <div style="max-width: 1280px; margin: 0 auto; padding: 0 2rem;">
      <div class="archive-list">
        ${listHTML}
      </div>
      <p style="text-align: center; margin-top: 40px;">
        <a href="../" class="btn-back" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; border-radius: 50px; font-weight: 600; text-decoration: none;">← 返回今日日报</a>
      </p>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer" style="margin-top: 60px;">
    <div class="footer-container">
      <div class="footer-bottom">
        <p class="footer-copyright">© 2026 AI Daily. All Rights Reserved.</p>
        <div class="footer-legal">
          <a href="#">使用条款</a>
          <a href="#">隐私政策</a>
        </div>
      </div>
    </div>
  </footer>

  <script src="../js/app.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(PATHS.archive, 'index.html'), indexHTML, 'utf-8');
  console.log('📝 已更新存档索引');
}

// 主函数
async function main() {
  console.log('🚀 AI 日报生成器 v3.0\n');
  
  const useReal = process.argv.includes('--real') || process.argv.includes('-r');
  const archiveFlag = process.argv.includes('--archive') || process.argv.includes('-a');
  
  // 必须使用 --real 参数才能生成数据
  if (!useReal) {
    console.log('⚠️  请使用 --real 参数启用真实搜索\n');
    console.log('用法:');
    console.log('  node backend/scraper/generate.js --real       # 生成日报');
    console.log('  node backend/scraper/generate.js --real -a    # 生成并存档');
    return;
  }
  
  try {
    // 生成数据
    const data = await generateDailyNews(true);
    
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
    
    // 生成日报汇总
    console.log('\n📋 正在生成日报汇总...');
    const { generateSummary } = require('./generate-summary');
    try {
      await generateSummary(data);
      
      // 复制汇总文件到前端目录
      const summarySource = path.join(PATHS.data.replace('daily.json', 'daily-summary.json'));
      const summaryDest = path.join(PATHS.output, 'data', 'daily-summary.json');
      
      // 确保目标目录存在
      if (!fs.existsSync(path.join(PATHS.output, 'data'))) {
        fs.mkdirSync(path.join(PATHS.output, 'data'), { recursive: true });
      }
      
      if (fs.existsSync(summarySource)) {
        fs.copyFileSync(summarySource, summaryDest);
        console.log(`📋 汇总已复制到前端: ${summaryDest}`);
      }
    } catch (error) {
      console.warn('⚠️  汇总生成失败:', error.message);
    }
    
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
  generateNavLinks,
  generateFooterCategories,
  generateNewsContent,
  saveArchive,
  updateArchiveIndex
};

// 直接运行
if (require.main === module) {
  main();
}
