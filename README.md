# AI Daily News - 智能日报系统

🚀 每日自动抓取 AI、跨境电商、产品创业、区块链、生物科技、新能源六大领域热点，生成精美日报。

## 🌐 在线访问

**日报网站**: `https://ibywind.github.io/ai-daily-news/`

## 📁 项目结构

```
ai-daily-news/
├── docs/                 # GitHub Pages 部署目录
│   ├── index.html        # 今日日报
│   ├── css/style.css     # 样式
│   ├── js/app.js         # 交互
│   └── archive/          # 历史存档
├── backend/
│   ├── scraper/          # 数据抓取
│   │   ├── scraper.js    # 核心抓取逻辑
│   │   └── generate.js   # HTML 生成器
│   └── utils/
│       └── tavily-api.js # Tavily API 封装
└── .github/workflows/    # 自动部署配置
```

## 🛠️ 技术栈

- **数据抓取**: Tavily Search API
- **后端**: Node.js
- **前端**: 静态 HTML/CSS/JS
- **部署**: GitHub Pages + GitHub Actions
- **数据源**: 六大领域实时搜索

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 使用 Tavily API 生成本地日报（需要设置 TAVILY_API_KEY）
export TAVILY_API_KEY=your_key_here
node backend/scraper/generate.js --real --archive

# 或使用模拟数据
node backend/scraper/generate.js --archive
```

## 🔧 配置说明

### 必需环境变量

| 变量 | 说明 | 获取方式 |
|------|------|----------|
| `TAVILY_API_KEY` | Tavily 搜索 API | https://tavily.com |

### GitHub Secrets 配置

在仓库 Settings → Secrets → Actions 中添加：
- `TAVILY_API_KEY`: 你的 Tavily API Key

## 📝 更新日志

- **2026-03-05** - v2.0 发布，六大分类，接入 Tavily API

## 📄 License

MIT
