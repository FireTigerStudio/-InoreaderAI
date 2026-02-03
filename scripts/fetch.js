/**
 * Inoreader API Wrapper
 * 封装 Inoreader RSS JSON 抓取功能
 * 使用 curl 命令绕过 Node.js 网络问题
 */

import { execSync } from 'child_process';

/**
 * 抓取 Inoreader Tag 的 RSS JSON 数据
 * @param {string} url - Inoreader JSON URL
 * @param {number} limit - 返回文章数量限制，默认 10
 * @returns {Promise<Array>} 文章数组
 */
export async function fetchInoreader(url, limit = 10) {
  try {
    console.log(`正在抓取: ${url}`);

    // 使用 curl 命令抓取
    const responseText = execSync(`curl -s --max-time 30 "${url}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024  // 10MB buffer
    });

    const data = JSON.parse(responseText);

    // 提取并限制文章数量
    const items = (data.items || []).slice(0, limit);

    if (items.length === 0) {
      console.log('未找到文章');
      return [];
    }

    // 解析文章数据
    const articles = items.map(item => parseArticle(item));

    console.log(`成功抓取 ${articles.length} 篇文章`);
    return articles;

  } catch (error) {
    console.error('抓取失败:', error.message);
    return [];
  }
}

/**
 * 解析单篇文章数据
 * @param {Object} item - Inoreader item 对象
 * @returns {Object} 解析后的文章对象
 */
function parseArticle(item) {
  // URL 提取
  let url = item.url || '';
  if (!url && item.canonical && item.canonical[0]) {
    url = item.canonical[0].href;
  }
  if (!url && item.alternate && item.alternate[0]) {
    url = item.alternate[0].href;
  }

  // 来源提取
  let source = 'Unknown';
  if (item._source) {
    source = item._source;
  } else if (item.author && item.author.name) {
    source = item.author.name;
  } else if (typeof item.author === 'string') {
    source = item.author;
  }

  // 发布时间
  let publishDate = new Date().toISOString();
  if (item.date_published) {
    publishDate = item.date_published;
  } else if (item.published) {
    publishDate = new Date(item.published * 1000).toISOString();
  }

  return {
    id: item.id || '',
    title: item.title || 'Untitled',
    url: url || 'https://www.inoreader.com',
    source: source,
    publishDate: publishDate
  };
}
