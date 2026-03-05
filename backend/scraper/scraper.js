/**
 * News Scraper Module - Tavily Search Version
 * 真实数据抓取模块 - 使用 Tavily Search API + Kimi 翻译
 */

const fs = require('fs');
const path = require('path');
const { tavily_search_batch } = require('../utils/tavily-api');
const { kimi_translate_batch } = require('../utils/kimi-api');

// ============================================
// 六大分类配置（英文搜索 + 中文显示）
// ============================================
const SOURCES = {
  ai: {
    name: 'AI 人工智能',
    icon: '🤖',
    queries: [
      'AI artificial intelligence news today March 2026',
      'OpenAI ChatGPT GPT-5 Claude LLM latest',
      'AI agents autonomous robotics humanoid',
      'machine learning deep learning breakthrough'
    ],
    keywords: ['AI', '人工智能', '大模型', 'ChatGPT', 'Claude', 'OpenAI', '机器人', '智能体'],
    tagMapping: {
      'OpenAI': 'OpenAI',
      'Google': 'Google',
      'Anthropic': 'Claude',
      'Meta': 'Meta',
      'Microsoft': 'Microsoft',
      'NVIDIA': 'NVIDIA',
      'agent': 'Agent',
      'robot': '机器人'
    }
  },
  ecommerce: {
    name: '跨境电商',
    icon: '🌍',
    queries: [
      'cross-border e-commerce news March 2026',
      'SHEIN Temu TikTok Shop Amazon global',
      'DTC brand international expansion',
      'e-commerce logistics supply chain'
    ],
    keywords: ['跨境电商', '出海', 'SHEIN', 'Temu', '亚马逊', '独立站', 'DTC'],
    tagMapping: {
      'SHEIN': 'SHEIN',
      'Temu': 'Temu',
      'TikTok': 'TikTok',
      'Amazon': 'Amazon',
      'Shopify': 'Shopify'
    }
  },
  startup: {
    name: '产品创业',
    icon: '💡',
    queries: [
      'startup funding venture capital March 2026',
      'SaaS product growth startup news',
      'tech startup funding Series A B',
      'startup IPO acquisition 2026'
    ],
    keywords: ['创业', '融资', '独角兽', 'SaaS', 'PMF', '增长', '投资'],
    tagMapping: {
      'YC': 'YC',
      'Y Combinator': 'YC',
      'seed': '种子轮',
      'Series A': 'A轮',
      'Series B': 'B轮',
      'IPO': 'IPO'
    }
  },
  web3: {
    name: '区块链 Web3',
    icon: '⛓️',
    queries: [
      'cryptocurrency Bitcoin Ethereum news March 2026',
      'DeFi Web3 blockchain latest',
      'crypto ETF institutional investment',
      'NFT metaverse digital assets'
    ],
    keywords: ['区块链', 'Web3', '加密货币', '比特币', '以太坊', 'DeFi', 'NFT', '元宇宙'],
    tagMapping: {
      'Bitcoin': 'BTC',
      'BTC': 'BTC',
      'Ethereum': 'ETH',
      'ETH': 'ETH',
      'Solana': 'SOL',
      'DeFi': 'DeFi',
      'NFT': 'NFT',
      'ETF': 'ETF'
    }
  },
  newenergy: {
    name: '新能源',
    icon: '⚡',
    queries: [
      'electric vehicle EV news March 2026',
      'battery technology energy storage',
      'renewable energy solar wind',
      'Tesla BYD CATL EV market'
    ],
    keywords: ['新能源', '电动车', '储能', '电池', '碳中和', '光伏', '氢能'],
    tagMapping: {
      'Tesla': 'Tesla',
      'BYD': 'BYD',
      'CATL': 'CATL',
      'solid-state': '固态电池',
      'battery': '电池',
      'solar': '光伏',
      'hydrogen': '氢能'
    }
  }
};

// ============================================
// Tavily 搜索 + Kimi 翻译
// ============================================

// 格式化搜索结果为新闻条目
function formatSearchResults(results, category) {
  const config = SOURCES[category];
  
  return results.map((item, index) => {
    // 提取标签
    let tag = '资讯';
    for (const [key, value] of Object.entries(config.tagMapping)) {
      if (item.title?.toLowerCase().includes(key.toLowerCase()) || 
          item.summary?.toLowerCase().includes(key.toLowerCase())) {
        tag = value;
        break;
      }
    }
    
    // 提取来源
    const source = item.source || extractDomain(item.url) || '网络';
    
    // 生成配图 URL
    const image = item.image || getMockImage(category, index);
    
    return {
      title: item.title || '',
      summary: item.summary || '',
      content: item.rawContent || '',
      source: source,
      url: item.url || '#',
      time: '今日',
      tag: tag,
      image: image
    };
  }).filter(item => item.title && item.title.length > 0);
}

// 生成模拟配图
function getMockImage(category, index) {
  const seeds = {
    ai: 'robot',
    ecommerce: 'shopping',
    startup: 'rocket',
    web3: 'crypto',
    biotech: 'dna',
    newenergy: 'solar'
  };
  const seed = seeds[category] || 'news';
  return `https://picsum.photos/seed/${seed}${index}/400/250`;
}

// 从 URL 提取域名
function extractDomain(url) {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch {
    return null;
  }
}

// ============================================
// 核心功能
// ============================================

// 获取今日日期信息
function getTodayInfo() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return {
    date: dateStr,
    display: now.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    }),
    timestamp: now.toISOString(),
    year: dateStr.split('-')[0],
    month: dateStr.split('-')[1],
    day: dateStr.split('-')[2]
  };
}

// 抓取新闻 - Tavily Search + Kimi 翻译版本
async function fetchNews(category, limit = 6) {
  console.log(`\n📡 正在抓取 [${SOURCES[category].name}] 新闻...`);
  const config = SOURCES[category];
  
  // 检查是否有 Tavily API Key
  if (!process.env.TAVILY_API_KEY) {
    console.log('  ℹ️  未配置 TAVILY_API_KEY，使用模拟数据');
    return getMockNews(category).slice(0, limit);
  }

  try {
    // 使用 Tavily 批量搜索
    const results = await tavily_search_batch(config.queries, 3);
    
    if (results.length === 0) {
      console.log('  ⚠️ Tavily 搜索无结果，使用模拟数据');
      return getMockNews(category).slice(0, limit);
    }

    // 格式化结果
    let formatted = formatSearchResults(results.slice(0, limit), category);
    
    // 使用 Kimi 翻译标题和摘要
    if (process.env.KIMI_API_KEY && formatted.length > 0) {
      console.log(`  🔄 正在翻译 ${formatted.length} 条新闻...`);
      formatted = await kimi_translate_batch(formatted);
    }
    
    console.log(`  ✅ ${config.name}: ${formatted.length} 条 (Tavily + Kimi)`);
    return formatted;
  } catch (error) {
    console.warn(`  ⚠️ Tavily 搜索失败: ${error.message}`);
    console.log('  ℹ️  使用模拟数据');
    return getMockNews(category).slice(0, limit);
  }
}

// 生成日报数据
async function generateDailyNews(useRealSearch = false) {
  const today = getTodayInfo();
  console.log(`\n🚀 AI 日报生成器 v3.0`);
  console.log(`📅 ${today.display}\n`);
  
  const hasTavilyKey = !!process.env.TAVILY_API_KEY;
  const hasKimiKey = !!process.env.KIMI_API_KEY;
  
  if (useRealSearch && hasTavilyKey) {
    console.log('🔍 使用 Tavily Search API 进行真实搜索');
    if (hasKimiKey) {
      console.log('🌐 使用 Kimi API 进行中文翻译\n');
    } else {
      console.log('⚠️  未配置 KIMI_API_KEY，将使用英文原文\n');
    }
  } else if (useRealSearch && !hasTavilyKey) {
    console.log('⚠️  未配置 TAVILY_API_KEY，将使用模拟数据\n');
  } else {
    console.log('ℹ️  使用模拟数据（使用 --real 参数启用 Tavily 搜索）\n');
  }
  
  const categories = [];
  
  for (const [key, config] of Object.entries(SOURCES)) {
    let items;
    
    if (useRealSearch && hasTavilyKey) {
      items = await fetchNews(key, 6);
    } else {
      // 模拟数据
      items = getMockNews(key);
    }
    
    if (items.length > 0) {
      categories.push({
        id: key,
        name: config.name,
        icon: config.icon,
        items: items
      });
    }
  }
  
  const data = {
    date: today,
    categories: categories,
    generatedAt: today.timestamp,
    version: '3.0.0',
    source: (useRealSearch && hasTavilyKey) ? 'tavily-kimi' : 'mock'
  };
  
  console.log(`\n📊 总计: ${categories.reduce((sum, cat) => sum + cat.items.length, 0)} 条新闻`);
  
  return data;
}

// 获取模拟新闻（用于测试或搜索失败时）
function getMockNews(category) {
  const images = {
    ai: [
      'https://picsum.photos/seed/ai0/400/250',
      'https://picsum.photos/seed/ai1/400/250',
      'https://picsum.photos/seed/ai2/400/250',
      'https://picsum.photos/seed/ai3/400/250',
      'https://picsum.photos/seed/ai4/400/250',
      'https://picsum.photos/seed/ai5/400/250'
    ],
    ecommerce: [
      'https://picsum.photos/seed/shop0/400/250',
      'https://picsum.photos/seed/shop1/400/250',
      'https://picsum.photos/seed/shop2/400/250',
      'https://picsum.photos/seed/shop3/400/250'
    ],
    startup: [
      'https://picsum.photos/seed/rocket0/400/250',
      'https://picsum.photos/seed/rocket1/400/250',
      'https://picsum.photos/seed/rocket2/400/250'
    ],
    web3: [
      'https://picsum.photos/seed/crypto0/400/250',
      'https://picsum.photos/seed/crypto1/400/250',
      'https://picsum.photos/seed/crypto2/400/250',
      'https://picsum.photos/seed/crypto3/400/250',
      'https://picsum.photos/seed/crypto4/400/250'
    ],
    newenergy: [
      'https://picsum.photos/seed/energy0/400/250',
      'https://picsum.photos/seed/energy1/400/250',
      'https://picsum.photos/seed/energy2/400/250',
      'https://picsum.photos/seed/energy3/400/250',
      'https://picsum.photos/seed/energy4/400/250',
      'https://picsum.photos/seed/energy5/400/250'
    ]
  };
  
  const mockDB = {
    ai: [
      { title: '越南《人工智能法》正式生效，成东南亚首个 AI 专门立法国家', summary: '越南于3月1日正式实施《人工智能法》，标志着东盟 AI 治理进入新阶段。', source: '环球时报', url: 'https://www.huanqiu.com', time: '今日', tag: '政策', image: images.ai[0] },
      { title: '荣耀发布机器人手机，AI 从"云端对话"走向"端侧执行"', summary: 'MWC 2026 上，荣耀推出融合具身智能的机器人手机，被视为 AI 智能体重要入口。', source: '新华网', url: 'https://www.xinhuanet.com', time: '今日', tag: '产品', image: images.ai[1] },
      { title: '阿里千问大模型负责人林俊旸卸任', summary: '阿里巴巴最年轻 P10 级技术专家宣布离开千问团队，折射 AI 人才高流动性。', source: '上观新闻', url: 'https://www.jfdaily.com', time: '今日', tag: '人事', image: images.ai[2] },
      { title: '黄仁勋：300 亿投资 OpenAI"可能是最后一次"', summary: '英伟达 CEO 表示，随着 OpenAI 准备上市，近期 300 亿美元投资可能是最后一次。', source: '新浪财经', url: 'https://finance.sina.com.cn', time: '今日', tag: '融资', image: images.ai[3] },
      { title: '蚂蚁集团联合清华发布 AReaL v1.0 强化学习框架', summary: '首个全异步训推解耦的大模型强化学习训练系统，让智能体强化学习开箱即用。', source: '科创板日报', url: 'https://www.chinastarmarket.cn', time: '昨日', tag: '开源', image: images.ai[4] },
      { title: '我国首个国家级人形机器人标准体系发布', summary: '我国首个国家级"人形机器人与具身智能标准体系"正式发布。', source: '软盟资讯', url: 'https://www.ruanmeng.com', time: '3月2日', tag: '标准', image: images.ai[5] }
    ],
    ecommerce: [
      { title: '深圳华强北发布 AI 硬件全球销售热力图', summary: '2026年1-2月数据显示，无人机海内外市场需求保持旺盛。', source: '新华社', url: 'https://www.xinhuanet.com', time: '今日', tag: '数据', image: images.ecommerce[0] },
      { title: '雷军两会建议：提高人形机器人使用率', summary: '小米 CEO 提出 5 份建议，涉及智能制造应用和人才培养。', source: 'IT之家', url: 'https://www.ithome.com', time: '今日', tag: '政策', image: images.ecommerce[1] },
      { title: '华为发布 Atlas 950 SuperPoD', summary: 'MWC 2026 期间，华为发布多款超节点产品，助力运营商智能化升级。', source: '华为官网', url: 'https://www.huawei.com', time: '昨日', tag: '产品', image: images.ecommerce[2] },
      { title: '千问"一句话下单"功能 DAU 突破 7300 万', summary: '超过 400 万 60 岁以上新用户通过 AI 完成外卖下单。', source: '新浪财经', url: 'https://finance.sina.com.cn', time: '今日', tag: '数据', image: images.ecommerce[3] }
    ],
    startup: [
      { title: 'OpenAI 完成 1100 亿美元新一轮融资', summary: '该轮融资包括英伟达、亚马逊和软银的投资承诺。', source: '彭博社', url: 'https://www.bloomberg.com', time: '今日', tag: '融资', image: images.startup[0] },
      { title: '北京数据和人工智能安全检测中心揭牌', summary: 'AI 产业迎来专业鉴定机构，七大创新成果发布。', source: '北京日报', url: 'https://www.bjd.com.cn', time: '3月2日', tag: '政策', image: images.startup[1] },
      { title: 'Honor 推出全球首款机器人手机', summary: '荣耀 CEO 表示，这是智能手机的"全新物种"。', source: 'MWC 2026', url: 'https://www.mwcbarcelona.com', time: '今日', tag: '创新', image: images.startup[2] }
    ],
    // 新增分类的模拟数据
    web3: [
      { title: '比特币 ETF 资金流入创新高，机构配置加速', summary: '美国比特币 ETF 单日净流入超 10 亿美元，显示机构投资者持续加仓。', source: 'CoinDesk', url: 'https://www.coindesk.com', time: '今日', tag: 'BTC', image: images.web3[0] },
      { title: '以太坊 Dencun 升级完成，Layer2 费用大幅下降', summary: '升级引入 EIP-4844，使 Layer2 交易费用降低 90% 以上。', source: 'The Block', url: 'https://www.theblock.co', time: '今日', tag: 'ETH', image: images.web3[1] },
      { title: '香港证监会批准首批现货加密 ETF', summary: '香港正式批准比特币和以太坊现货 ETF，预计 4 月上市交易。', source: '南华早报', url: 'https://www.scmp.com', time: '昨日', tag: 'ETF', image: images.web3[2] },
      { title: 'DeFi 协议总锁仓量突破 1000 亿美元', summary: '受市场回暖带动，DeFi 生态 TVL 创下近两年新高。', source: 'DeFiLlama', url: 'https://defillama.com', time: '今日', tag: 'DeFi', image: images.web3[3] },
      { title: '央行数字货币跨境支付试点扩大', summary: '数字人民币跨境支付试点新增 5 个国家和地区。', source: '财新', url: 'https://www.caixin.com', time: '3月3日', tag: 'CBDC', image: images.web3[4] }
    ],
    newenergy: [
      { title: '宁德时代发布新一代固态电池技术', summary: '能量密度突破 500Wh/kg，预计 2027 年量产装车。', source: '证券时报', url: 'https://www.stcn.com', time: '今日', tag: '固态电池', image: images.newenergy[0] },
      { title: '特斯拉上海储能超级工厂投产', summary: '年产能 40GWh，产品将面向全球市场供应。', source: '澎湃新闻', url: 'https://www.thepaper.cn', time: '今日', tag: 'Tesla', image: images.newenergy[1] },
      { title: '全国碳市场扩容，纳入钢铁水泥行业', summary: '碳交易市场覆盖范围扩大，推动高耗能行业绿色转型。', source: '生态环境部', url: 'https://www.mee.gov.cn', time: '昨日', tag: '碳中和', image: images.newenergy[2] },
      { title: '光伏组件出口量同比增长 35%', summary: '中国光伏产品海外需求持续旺盛，欧洲和新兴市场为主要增长点。', source: '光伏們', url: 'https://www.pvmen.com', time: '今日', tag: '光伏', image: images.newenergy[3] },
      { title: '氢能源重卡商业化运营启动', summary: '首批 100 辆氢燃料电池重卡投入物流干线运营。', source: '中国汽车报', url: 'https://www.cnautonews.com', time: '3月2日', tag: '氢能', image: images.newenergy[4] },
      { title: '比亚迪发布第五代 DM 混动技术', summary: '百公里油耗降至 2.9L，综合续航超 2000 公里。', source: '比亚迪', url: 'https://www.byd.com', time: '今日', tag: 'BYD', image: images.newenergy[5] }
    ]
  };
  
  return mockDB[category] || [];
}

// ============================================
// 数据存储
// ============================================

function saveData(data, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`💾 数据已保存: ${outputPath}`);
}

function loadData(inputPath) {
  if (!fs.existsSync(inputPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
}

// ============================================
// 导出
// ============================================

module.exports = {
  SOURCES,
  getTodayInfo,
  fetchNews,
  generateDailyNews,
  saveData,
  loadData
};
