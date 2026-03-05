/**
 * Tavily API 工具
 * 封装 Tavily Search API 调用
 */

const https = require('https');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const TAVILY_API_URL = 'api.tavily.com';

/**
 * 获取日期范围（默认搜索最近1天的新闻）
 * @returns {Object} { startDate, endDate }
 */
function getDateRange() {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  
  // 往前推1天
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  const startDate = start.toISOString().split('T')[0];
  
  return { startDate, endDate };
}

/**
 * 使用 Tavily API 搜索
 * @param {string} query - 搜索关键词
 * @param {number} maxResults - 最大结果数
 * @param {Object} options - 额外选项
 * @returns {Promise<Array>} 搜索结果
 */
async function tavily_search(query, maxResults = 10, options = {}) {
  const apiKey = process.env.TAVILY_API_KEY || TAVILY_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ TAVILY_API_KEY 未配置，使用模拟数据');
    return [];
  }

  const { startDate, endDate } = getDateRange();

  const requestBody = {
    api_key: apiKey,
    topic: "news",
    query: query,
    include_answers: "advanced",
    search_depth: "advanced",
    max_results: maxResults,
    start_date: options.startDate || startDate,
    end_date: options.endDate || endDate,
  };

  const data = JSON.stringify(requestBody);

  const requestOptions = {
    hostname: TAVILY_API_URL,
    port: 443,
    path: '/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          if (process.env.DEBUG) {
            console.log(`[Tavily] Query: "${query}" 响应状态: ${res.statusCode}`);
          }
          
          const parsedData = JSON.parse(responseData);
          
          if (parsedData.error) {
            console.error(`[Tavily] API 错误: ${parsedData.error}`);
            reject(new Error(parsedData.error));
            return;
          }

          // 提取图片列表
          const images = parsedData.images || [];

          // 格式化结果
          const results = (parsedData.results || []).map((item, index) => ({
            title: item.title || '',
            summary: item.content || '',
            rawContent: item.content || '',
            url: item.url || '#',
            source: extractDomain(item.url) || 'Web',
            favicon: item.favicon || '',
            date: new Date().toISOString().split('T')[0],
            image: images[index] || getCategoryImage(query, index),
            score: item.score || 0
          }));

          resolve(results);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

/**
 * 批量搜索多个查询
 * @param {Array<string>} queries - 查询列表
 * @param {number} maxPerQuery - 每个查询最大结果
 * @returns {Promise<Array>} 合并后的结果
 */
async function tavily_search_batch(queries, maxPerQuery = 3) {
  const allResults = [];
  const usedUrls = new Set();

  for (const query of queries) {
    try {
      const results = await tavily_search(query, maxPerQuery);
      
      for (const item of results) {
        if (!usedUrls.has(item.url) && item.url !== '#') {
          usedUrls.add(item.url);
          allResults.push(item);
        }
      }

      // 避免请求过快
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.warn(`  ⚠️ 查询 "${query}" 失败: ${error.message}`);
    }
  }

  return allResults;
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

// 根据查询关键词获取分类配图 (使用 Picsum Photos)
function getCategoryImage(query, index) {
  const seed = query.length + index;
  const width = 400;
  const height = 250;
  
  // 根据关键词选择不同的图片主题
  if (query.includes('AI') || query.includes('人工智能')) {
    return `https://picsum.photos/seed/ai${seed}/${width}/${height}`;
  } else if (query.includes('电商') || query.includes('跨境')) {
    return `https://picsum.photos/seed/shop${seed}/${width}/${height}`;
  } else if (query.includes('创业') || query.includes('融资')) {
    return `https://picsum.photos/seed/startup${seed}/${width}/${height}`;
  } else if (query.includes('区块链') || query.includes('Web3') || query.includes('比特币')) {
    return `https://picsum.photos/seed/crypto${seed}/${width}/${height}`;
  } else if (query.includes('生物') || query.includes('医药') || query.includes('基因')) {
    return `https://picsum.photos/seed/bio${seed}/${width}/${height}`;
  } else if (query.includes('新能源') || query.includes('电池') || query.includes('光伏')) {
    return `https://picsum.photos/seed/energy${seed}/${width}/${height}`;
  }
  
  return `https://picsum.photos/seed/news${seed}/${width}/${height}`;
}

module.exports = {
  tavily_search,
  tavily_search_batch
};
