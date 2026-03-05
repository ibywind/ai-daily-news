/**
 * 日报汇总生成器
 * 使用 Kimi API 生成结构化的日报汇总
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

require('dotenv').config();

const DATA_DIR = path.join(__dirname, '../data');
const DAILY_JSON = path.join(DATA_DIR, 'daily.json');
const SUMMARY_JSON = path.join(DATA_DIR, 'daily-summary.json');

const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_API_HOST = 'api.moonshot.cn';

/**
 * 调用 Kimi API 生成汇总
 */
async function generateSummary(newsData) {
  const apiKey = process.env.KIMI_API_KEY || KIMI_API_KEY;
  
  if (!apiKey) {
    console.error('⚠️ KIMI_API_KEY 未配置');
    throw new Error('KIMI_API_KEY 未配置');
  }

  const prompt = buildPrompt(newsData);
  
  console.log('🤖 正在调用 Kimi API 生成汇总...');
  
  const requestBody = {
    model: 'moonshot-v1-32k',
    messages: [
      {
        role: 'system',
        content: `你是一个专业的新闻编辑和分析师。请根据提供的新闻数据，生成一份结构化的日报汇总。

要求：
1. 整体摘要：用2-3句话概括今日所有分类的核心动态
2. 按分类汇总：
   - 为每个分类生成1-2句话的分类摘要
   - 提取3-5个该分类的关键点/趋势
   - 为每条新闻生成精简摘要（30-50字）
   - 提取每条新闻的1-2个关键洞察
   - 必须包含所有新闻，不要遗漏任何一条
3. 语言风格：简洁、专业、易读
4. 避免冗余信息，突出重点

请严格按照以下JSON格式返回，不要添加任何其他内容：
{
  "date": "日期",
  "overallSummary": "整体摘要",
  "categories": [
    {
      "id": "分类ID（必须使用原始数据中的id，如'ai'、'ecommerce'等）",
      "name": "分类名称",
      "icon": "分类图标（必须使用原始数据中的icon，如'🤖'、'🌍'等）",
      "categorySummary": "分类摘要",
      "keyPoints": ["关键点1", "关键点2", "关键点3"],
      "news": [
        {
          "title": "新闻标题",
          "summary": "精简摘要",
          "keyInsights": ["关键洞察1", "关键洞察2"]
        }
      ]
    }
  ]
}

重要：
1. 请确保返回所有新闻，不要遗漏任何一条。
2. 分类ID和图标必须使用原始数据中的值，不要修改。`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 4000
  };

  const data = JSON.stringify(requestBody);

  const options = {
    hostname: KIMI_API_HOST,
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
            console.error(`[Kimi] API 错误: ${parsedData.error.message || parsedData.error}`);
            reject(new Error(parsedData.error.message || 'API 错误'));
            return;
          }

          const content = parsedData.choices?.[0]?.message?.content?.trim() || '';
          if (!content) {
            reject(new Error('API 返回空内容'));
            return;
          }

          try {
            const summary = JSON.parse(content);
            resolve(fixSummaryIds(summary, newsData));
          } catch (parseError) {
            console.error('[Kimi] JSON 解析失败，尝试提取 JSON');
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const summary = JSON.parse(jsonMatch[0]);
              resolve(fixSummaryIds(summary, newsData));
            } else {
              reject(new Error('无法解析返回的 JSON'));
            }
          }
        } catch (error) {
          console.error(`[Kimi] 解析失败: ${error.message}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`[Kimi] 请求失败: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * 修复汇总中的分类ID和图标
 */
function fixSummaryIds(summary, newsData) {
  const categoryMap = {};
  newsData.categories.forEach(cat => {
    categoryMap[cat.name] = { id: cat.id, icon: cat.icon };
  });
  
  summary.categories.forEach(cat => {
    const original = categoryMap[cat.name];
    if (original) {
      cat.id = original.id;
      cat.icon = original.icon;
    }
  });
  
  return summary;
}

/**
 * 构建提示词
 */
function buildPrompt(newsData) {
  let prompt = `日期：${newsData.date.display}\n\n`;
  
  newsData.categories.forEach(cat => {
    prompt += `【${cat.name}】\n`;
    cat.items.forEach((item, index) => {
      prompt += `${index + 1}. 标题：${item.title}\n`;
      prompt += `   摘要：${item.summary}\n`;
      if (item.content) {
        prompt += `   内容：${item.content.substring(0, 1000)}...\n`;
      }
      prompt += `   来源：${item.source}\n\n`;
    });
    prompt += '\n';
  });
  
  return prompt;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始生成日报汇总...\n');

    const data = await fs.readFile(DAILY_JSON, 'utf8');
    const newsData = JSON.parse(data);

    const summary = await generateSummary(newsData);

    await fs.writeFile(SUMMARY_JSON, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`✅ 汇总已保存: ${SUMMARY_JSON}\n`);

    console.log('📋 汇总预览：');
    console.log(`整体摘要：${summary.overallSummary}\n`);
    summary.categories.forEach(cat => {
      console.log(`【${cat.name}】`);
      console.log(`分类摘要：${cat.categorySummary}`);
      console.log(`关键点：${cat.keyPoints.join('、')}`);
      console.log(`新闻数：${cat.news.length}\n`);
    });

    console.log('🎉 完成！');
  } catch (error) {
    console.error('❌ 生成汇总失败:', error.message);
    process.exit(1);
  }
}

module.exports = { generateSummary };

if (require.main === module) {
  main();
}