/**
 * News Scraper Module - Real Search Version
 * 真实数据抓取模块 - 使用 Tavily Search API
 */

const fs = require('fs');
const path = require('path');
const { tavily_search_batch } = require('../utils/tavily-api');

// ============================================
// 六大分类配置
// ============================================
const SOURCES = {
  ai: {
    name: 'AI 人工智能',
    icon: '🤖',
    queries: [
      'AI人工智能最新新闻 2026',
      'OpenAI ChatGPT Claude 大模型 最新动态',
      '具身智能 机器人 人形机器人 新闻',
      'AI Agent 智能体 应用落地'
    ],
    keywords: ['AI', '人工智能', '大模型', 'ChatGPT', 'Claude', 'OpenAI', '机器人', '智能体'],
    tagMapping: {
      'OpenAI': 'OpenAI',
      'Google': 'Google',
      'Anthropic': 'Claude',
      'Meta': 'Meta',
      '阿里': '阿里巴巴',
      '百度': '百度',
      '腾讯': '腾讯'
    }
  },
  ecommerce: {
    name: '跨境电商',
    icon: '🌍',
    queries: [
      '跨境电商 出海 最新动态 2026',
      'SHEIN Temu TikTok Shop 亚马逊 新闻',
      '独立站 DTC 品牌出海 融资',
      '跨境物流 海外仓 新趋势'
    ],
    keywords: ['跨境电商', '出海', 'SHEIN', 'Temu', '亚马逊', '独立站', 'DTC'],
    tagMapping: {
      'SHEIN': 'SHEIN',
      'Temu': 'Temu',
      'TikTok': 'TikTok',
      '亚马逊': 'Amazon'
    }
  },
  startup: {
    name: '产品创业',
    icon: '💡',
    queries: [
      '创业 融资 独角兽 最新 2026',
      'SaaS 产品 PMF 用户增长',
      'YC 创业加速器 投资 孵化',
      '产品经理 方法论 最佳实践'
    ],
    keywords: ['创业', '融资', '独角兽', 'SaaS', 'PMF', '增长', '投资'],
    tagMapping: {
      'YC': 'YC',
      '种子轮': '种子轮',
      'A轮': 'A轮',
      'B轮': 'B轮',
      'IPO': 'IPO'
    }
  },
  // ========== 新增三大分类 ==========
  web3: {
    name: '区块链 Web3',
    icon: '⛓️',
    queries: [
      '区块链 Web3 加密货币 最新 2026',
      '比特币 以太坊 ETF 监管动态',
      'DeFi NFT 元宇宙 融资',
      '央行数字货币 CBDC 数字人民币'
    ],
    keywords: ['区块链', 'Web3', '加密货币', '比特币', '以太坊', 'DeFi', 'NFT', '元宇宙'],
    tagMapping: {
      '比特币': 'BTC',
      '以太坊': 'ETH',
      'Solana': 'SOL',
      'DeFi': 'DeFi',
      'NFT': 'NFT',
      'ETF': 'ETF'
    }
  },
  biotech: {
    name: '生物科技',
    icon: '🧬',
    queries: [
      '生物科技 医药 最新突破 2026',
      '基因编辑 CRISPR 细胞治疗',
      '新药研发 临床试验 获批',
      '数字医疗 AI诊断 智慧医疗'
    ],
    keywords: ['生物科技', '医药', '基因', 'CRISPR', '新药', '临床', '医疗AI'],
    tagMapping: {
      'FDA': 'FDA',
      'NMPA': 'NMPA',
      '基因': '基因疗法',
      'AI药物': 'AI制药',
      '疫苗': '疫苗'
    }
  },
  newenergy: {
    name: '新能源',
    icon: '⚡',
    queries: [
      '新能源 电动车 最新 2026',
      '储能 电池技术 固态电池',
      '碳中和 ESG 绿色能源',
      '光伏 风电 氢能源 产业'
    ],
    keywords: ['新能源', '电动车', '储能', '电池', '碳中和', '光伏', '氢能'],
    tagMapping: {
      '特斯拉': 'Tesla',
      '比亚迪': 'BYD',
      '宁德时代': 'CATL',
      '固态电池': '固态电池',
      '储能': '储能'
    }
  }
};

// ============================================
// 真实搜索功能
// ============================================

// 调用 Kimi Search 进行真实搜索
async function kimiSearch(query, limit = 5) {
  try {
    // 使用 kimi_search 工具
    const result = await new Promise((resolve, reject) => {
      const searchQuery = `${query} ${new Date().getFullYear()}`;
      
      // 调用系统 kimi_search 命令
      try {
        const output = execSync(
          `cd /root/.openclaw/workspace/ai-daily-news && node -e "
            const { kimi_search } = require('./backend/utils/kimi-api');
            kimi_search('${searchQuery.replace(/'/g, "\\'")}', ${limit})
              .then(r => console.log(JSON.stringify(r)))
              .catch(e => console.log(JSON.stringify({error: e.message})));
          "`,
          { encoding: 'utf-8', timeout: 30000 }
        );
        resolve(JSON.parse(output.trim()));
      } catch (e) {
        reject(e);
      }
    });
    
    return result.results || [];
  } catch (error) {
    console.warn(`⚠️ 搜索失败: ${error.message}`);
    return [];
  }
}

// 格式化搜索结果为新闻条目
function formatSearchResults(results, category) {
  const config = SOURCES[category];
  
  return results.map((item, index) => {
    // 提取标签
    let tag = '资讯';
    for (const [key, value] of Object.entries(config.tagMapping)) {
      if (item.title?.includes(key) || item.summary?.includes(key)) {
        tag = value;
        break;
      }
    }
    
    // 提取来源域名
    const source = item.source || extractDomain(item.url) || '网络';
    
    // 判断时间
    let time = '今日';
    if (item.date) {
      const itemDate = new Date(item.date);
      const today = new Date();
      const diff = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));
      if (diff === 0) time = '今日';
      else if (diff === 1) time = '昨日';
      else if (diff < 7) time = `${diff}天前`;
      else time = itemDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
    
    return {
      title: item.title || '无标题',
      summary: item.summary || item.snippet || '暂无摘要',
      source: source,
      url: item.url || '#',
      time: time,
      tag: tag
    };
  }).filter(item => item.title !== '无标题');
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

// 抓取新闻 - Tavily 真实搜索版本
async function fetchNews(category, limit = 6) {
  console.log(`\n📡 正在抓取 [${SOURCES[category].name}] 新闻...`);
  const config = SOURCES[category];
  
  // 检查是否有 Tavily API Key
  if (!process.env.TAVILY_API_KEY) {
    console.log('  ℹ️  未配置 Tavily API Key，使用模拟数据');
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
    const formatted = formatSearchResults(results.slice(0, limit), category);
    
    console.log(`  ✅ ${config.name}: ${formatted.length} 条 (Tavily)`);
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
  console.log(`\n🚀 AI 日报生成器 v2.0`);
  console.log(`📅 ${today.display}\n`);
  
  const hasApiKey = !!process.env.TAVILY_API_KEY;
  
  if (useRealSearch && hasApiKey) {
    console.log('🔍 使用 Tavily API 进行真实搜索\n');
  } else if (useRealSearch && !hasApiKey) {
    console.log('⚠️  未配置 TAVILY_API_KEY，将使用模拟数据\n');
  } else {
    console.log('ℹ️  使用模拟数据（使用 --real 参数启用 Tavily 搜索）\n');
  }
  
  const categories = [];
  
  for (const [key, config] of Object.entries(SOURCES)) {
    let items;
    
    if (useRealSearch && hasApiKey) {
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
    version: '2.0.0',
    source: (useRealSearch && hasApiKey) ? 'tavily-api' : 'mock'
  };
  
  console.log(`\n📊 总计: ${categories.reduce((sum, cat) => sum + cat.items.length, 0)} 条新闻`);
  
  return data;
}

// 获取模拟新闻（用于测试或搜索失败时）
function getMockNews(category) {
  const mockDB = {
    ai: [
      { title: '越南《人工智能法》正式生效，成东南亚首个 AI 专门立法国家', summary: '越南于3月1日正式实施《人工智能法》，标志着东盟 AI 治理进入新阶段。', source: '环球时报', url: '#', time: '今日', tag: '政策' },
      { title: '荣耀发布机器人手机，AI 从"云端对话"走向"端侧执行"', summary: 'MWC 2026 上，荣耀推出融合具身智能的机器人手机，被视为 AI 智能体重要入口。', source: '新华网', url: '#', time: '今日', tag: '产品' },
      { title: '阿里千问大模型负责人林俊旸卸任', summary: '阿里巴巴最年轻 P10 级技术专家宣布离开千问团队，折射 AI 人才高流动性。', source: '上观新闻', url: '#', time: '今日', tag: '人事' },
      { title: '黄仁勋：300 亿投资 OpenAI"可能是最后一次"', summary: '英伟达 CEO 表示，随着 OpenAI 准备上市，近期 300 亿美元投资可能是最后一次。', source: '新浪财经', url: '#', time: '今日', tag: '融资' },
      { title: '蚂蚁集团联合清华发布 AReaL v1.0 强化学习框架', summary: '首个全异步训推解耦的大模型强化学习训练系统，让智能体强化学习开箱即用。', source: '科创板日报', url: '#', time: '昨日', tag: '开源' },
      { title: '我国首个国家级人形机器人标准体系发布', summary: '我国首个国家级"人形机器人与具身智能标准体系"正式发布。', source: '软盟资讯', url: '#', time: '3月2日', tag: '标准' }
    ],
    ecommerce: [
      { title: '深圳华强北发布 AI 硬件全球销售热力图', summary: '2026年1-2月数据显示，无人机海内外市场需求保持旺盛。', source: '新华社', url: '#', time: '今日', tag: '数据' },
      { title: '雷军两会建议：提高人形机器人使用率', summary: '小米 CEO 提出 5 份建议，涉及智能制造应用和人才培养。', source: 'IT之家', url: '#', time: '今日', tag: '政策' },
      { title: '华为发布 Atlas 950 SuperPoD', summary: 'MWC 2026 期间，华为发布多款超节点产品，助力运营商智能化升级。', source: '华为官网', url: '#', time: '昨日', tag: '产品' },
      { title: '千问"一句话下单"功能 DAU 突破 7300 万', summary: '超过 400 万 60 岁以上新用户通过 AI 完成外卖下单。', source: '新浪财经', url: '#', time: '今日', tag: '数据' }
    ],
    startup: [
      { title: 'OpenAI 完成 1100 亿美元新一轮融资', summary: '该轮融资包括英伟达、亚马逊和软银的投资承诺。', source: '彭博社', url: '#', time: '今日', tag: '融资' },
      { title: '北京数据和人工智能安全检测中心揭牌', summary: 'AI 产业迎来专业鉴定机构，七大创新成果发布。', source: '北京日报', url: '#', time: '3月2日', tag: '政策' },
      { title: 'Honor 推出全球首款机器人手机', summary: '荣耀 CEO 表示，这是智能手机的"全新物种"。', source: 'MWC 2026', url: '#', time: '今日', tag: '创新' }
    ],
    // 新增分类的模拟数据
    web3: [
      { title: '比特币 ETF 资金流入创新高，机构配置加速', summary: '美国比特币 ETF 单日净流入超 10 亿美元，显示机构投资者持续加仓。', source: 'CoinDesk', url: '#', time: '今日', tag: 'BTC' },
      { title: '以太坊 Dencun 升级完成，Layer2 费用大幅下降', summary: '升级引入 EIP-4844，使 Layer2 交易费用降低 90% 以上。', source: 'The Block', url: '#', time: '今日', tag: 'ETH' },
      { title: '香港证监会批准首批现货加密 ETF', summary: '香港正式批准比特币和以太坊现货 ETF，预计 4 月上市交易。', source: '南华早报', url: '#', time: '昨日', tag: 'ETF' },
      { title: 'DeFi 协议总锁仓量突破 1000 亿美元', summary: '受市场回暖带动，DeFi 生态 TVL 创下近两年新高。', source: 'DeFiLlama', url: '#', time: '今日', tag: 'DeFi' },
      { title: '央行数字货币跨境支付试点扩大', summary: '数字人民币跨境支付试点新增 5 个国家和地区。', source: '财新', url: '#', time: '3月3日', tag: 'CBDC' }
    ],
    biotech: [
      { title: '国产 PD-1 抗癌药获批新适应症', summary: '某生物药企 PD-1 单抗获批用于胃癌一线治疗，市场空间广阔。', source: '医药经济报', url: '#', time: '今日', tag: '新药' },
      { title: 'CRISPR 基因编辑疗法获批上市', summary: '全球首款 CRISPR 基因编辑药物在国内获批，用于治疗地中海贫血。', source: '健康界', url: '#', time: '今日', tag: '基因疗法' },
      { title: 'AI 药物研发平台获 FDA 认可', summary: '某 AI 制药公司平台通过 FDA 验证，可加速新药临床试验申请。', source: 'Fierce Biotech', url: '#', time: '昨日', tag: 'AI制药' },
      { title: 'mRNA 技术应用于癌症疫苗研发取得突破', summary: '个性化肿瘤疫苗在临床试验中显示良好疗效，为癌症治疗带来新希望。', source: 'Nature', url: '#', time: '3月2日', tag: '疫苗' },
      { title: '智慧医疗平台完成 10 亿元融资', summary: '专注于医疗影像 AI 诊断的公司获得大额融资，估值创新高。', source: '36氪', url: '#', time: '今日', tag: '融资' }
    ],
    newenergy: [
      { title: '宁德时代发布新一代固态电池技术', summary: '能量密度突破 500Wh/kg，预计 2027 年量产装车。', source: '证券时报', url: '#', time: '今日', tag: '固态电池' },
      { title: '特斯拉上海储能超级工厂投产', summary: '年产能 40GWh，产品将面向全球市场供应。', source: '澎湃新闻', url: '#', time: '今日', tag: 'Tesla' },
      { title: '全国碳市场扩容，纳入钢铁水泥行业', summary: '碳交易市场覆盖范围扩大，推动高耗能行业绿色转型。', source: '生态环境部', url: '#', time: '昨日', tag: '碳中和' },
      { title: '光伏组件出口量同比增长 35%', summary: '中国光伏产品海外需求持续旺盛，欧洲和新兴市场为主要增长点。', source: '光伏們', url: '#', time: '今日', tag: '光伏' },
      { title: '氢能源重卡商业化运营启动', summary: '首批 100 辆氢燃料电池重卡投入物流干线运营。', source: '中国汽车报', url: '#', time: '3月2日', tag: '氢能' },
      { title: '比亚迪发布第五代 DM 混动技术', summary: '百公里油耗降至 2.9L，综合续航超 2000 公里。', source: '比亚迪', url: '#', time: '今日', tag: 'BYD' }
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
