/**
 * Tavily API 工具
 * 封装 Tavily Search API 调用
 */

const https = require('https');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const TAVILY_API_URL = 'api.tavily.com';

/**
 * 使用 Tavily API 搜索
 * @param {string} query - 搜索关键词
 * @param {number} maxResults - 最大结果数
 * @returns {Promise<Array>} 搜索结果
 */
async function tavily_search(query, maxResults = 5) {
  if (!TAVILY_API_KEY) {
    console.warn('⚠️ TAVILY_API_KEY 未配置，使用模拟数据');
    return [];
  }

  const data = JSON.stringify({
    api_key: TAVILY_API_KEY,
    query: query,
    search_depth: "advanced",
    max_results: maxResults,
    include_domains: [],
    exclude_domains: [],
    include_answer: false,
    include_images: false,
    include_raw_content: false
  });

  const options = {
    hostname: TAVILY_API_URL,
    port: 443,
    path: '/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          
          if (parsedData.error) {
            reject(new Error(parsedData.error));
            return;
          }

          // 格式化结果
          const results = (parsedData.results || []).map(item => ({
            title: item.title || '无标题',
            summary: item.content || item.snippet || '暂无摘要',
            url: item.url || '#',
            source: item.source || extractDomain(item.url) || '网络',
            date: new Date().toISOString().split('T')[0]
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

module.exports = {
  tavily_search,
  tavily_search_batch
};
