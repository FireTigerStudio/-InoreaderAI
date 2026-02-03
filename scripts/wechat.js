/**
 * Server酱 (ServerChan) WeChat Push Wrapper
 * 封装微信推送功能
 * 使用 curl 命令绕过 Node.js 网络问题
 */

import { execSync } from 'child_process';

/**
 * 批量推送文章到微信
 * @param {Array} articles - 文章列表
 * @param {string} articles[].id - 文章ID
 * @param {string} articles[].title - 文章标题
 * @param {string} articles[].url - 文章链接
 * @param {string} articles[].source - 来源名称
 * @param {string} articles[].publishDate - 发布时间
 * @param {string} articles[].summary - AI生成摘要
 * @param {number} articles[].score - AI评分 (1-5)
 * @param {Object} articles[].tag - 标签信息
 * @param {string} articles[].tag.name - 标签名称
 * @param {string} articles[].tag.type - 标签类型 ('urgent' | 'normal')
 * @returns {Promise<boolean>} 返回推送是否成功
 */
export async function pushToWechat(articles) {
  try {
    // 检查 API Key
    const apiKey = process.env.WECHAT_KEY;
    if (!apiKey) {
      console.error('错误: 未设置 WECHAT_KEY 环境变量');
      return false;
    }

    // 检查文章列表
    if (!articles || articles.length === 0) {
      console.log('没有文章需要推送到微信');
      return true;
    }

    // 按标签分组（紧急 vs 普通）
    const urgentArticles = articles.filter(a => a.tag?.type === 'urgent');
    const normalArticles = articles.filter(a => a.tag?.type === 'normal');

    // 如果有紧急文章，优先推送紧急文章
    if (urgentArticles.length > 0) {
      const success = await sendPush(apiKey, urgentArticles, true);
      if (!success) return false;
    }

    // 如果有普通文章，推送普通文章
    if (normalArticles.length > 0) {
      const success = await sendPush(apiKey, normalArticles, false);
      if (!success) return false;
    }

    return true;

  } catch (error) {
    console.error('微信推送失败:', error.message);
    return false;
  }
}

/**
 * 发送推送到 Server酱
 * @param {string} apiKey - Server酱 API Key
 * @param {Array} articles - 文章列表
 * @param {boolean} isUrgent - 是否为紧急推送
 * @returns {Promise<boolean>} 推送是否成功
 */
async function sendPush(apiKey, articles, isUrgent) {
  try {
    // 格式化推送标题
    const title = formatTitle(articles, isUrgent);

    // 格式化推送内容（Markdown格式）
    const desp = formatContent(articles, isUrgent);

    // 构建 API URL
    const url = `https://sctapi.ftqq.com/${apiKey}.send`;

    // 构建请求体并转义特殊字符
    const body = JSON.stringify({ title, desp }).replace(/'/g, "'\\''");

    // 使用 curl 发送 POST 请求
    const curlCmd = `curl -s --max-time 30 -X POST '${url}' -H 'Content-Type: application/json' -d '${body}'`;

    const responseText = execSync(curlCmd, {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024
    });

    const result = JSON.parse(responseText);

    // Server酱 API 返回格式: {code: 0, message: "success", data: {...}}
    if (result.code !== 0) {
      console.error(`Server酱推送失败: ${result.message}`);
      return false;
    }

    console.log(`微信推送成功: ${articles.length} 篇文章 (${isUrgent ? '紧急' : '普通'})`);
    return true;

  } catch (error) {
    console.error(`Server酱推送异常:`, error.message);
    return false;
  }
}

/**
 * 格式化推送标题
 * @param {Array} articles - 文章列表
 * @param {boolean} isUrgent - 是否紧急
 * @returns {string} 推送标题
 */
function formatTitle(articles, isUrgent) {
  const emoji = isUrgent ? '🚨' : '📰';
  const prefix = isUrgent ? '紧急新闻' : '每日新闻';

  // 获取标签名称（取第一篇文章的标签）
  const tagName = articles[0]?.tag?.name || '未分类';

  return `${emoji} ${prefix} [${tagName}] - ${articles.length}篇`;
}

/**
 * 格式化推送内容（Markdown格式）
 * @param {Array} articles - 文章列表
 * @param {boolean} isUrgent - 是否紧急
 * @returns {string} Markdown格式的推送内容
 */
function formatContent(articles, isUrgent) {
  const lines = [];

  // 添加头部信息
  if (isUrgent) {
    lines.push('## 🚨 紧急新闻');
  } else {
    lines.push('## 📰 每日精选');
  }

  lines.push('');
  lines.push(`共 ${articles.length} 篇新闻`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 按评分排序（从高到低）
  const sortedArticles = [...articles].sort((a, b) => b.score - a.score);

  // 格式化每篇文章
  sortedArticles.forEach((article, index) => {
    // 标题和评分
    const stars = '⭐'.repeat(article.score);
    lines.push(`### ${index + 1}. ${article.title} (${stars})`);
    lines.push('');

    // 摘要
    lines.push(`**摘要:** ${article.summary}`);
    lines.push('');

    // 来源和时间
    lines.push(`**来源:** ${article.source}`);
    lines.push(`**时间:** ${formatDate(article.publishDate)}`);
    lines.push('');

    // 链接
    lines.push(`🔗 [阅读原文](${article.url})`);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  // 添加页脚
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  lines.push(`> 推送时间: ${now}`);

  return lines.join('\n');
}

/**
 * 格式化日期
 * @param {string} dateString - ISO日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}
