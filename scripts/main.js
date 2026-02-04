/**
 * Main Workflow Script
 * 协调整个新闻抓取、分析和推送流程
 */

import { fetchInoreader } from './fetch.js';
import { analyzeWithGemini } from './analyze.js';
import { pushToWechat } from './wechat.js';
import { getExistingUrls, appendToExcel, cleanOldFiles, generateExcelFileName } from './excel.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（用于构建绝对路径）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * 延迟函数（用于控制 API 调用频率）
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 解析命令行参数
 * @returns {string} 返回类型：'urgent' | 'normal' | 'all'
 */
function parseArgs() {
  const typeIndex = process.argv.indexOf('--type');
  if (typeIndex !== -1 && typeIndex + 1 < process.argv.length) {
    const type = process.argv[typeIndex + 1];
    if (['urgent', 'normal', 'all'].includes(type)) {
      return type;
    }
    console.warn(`警告: 无效的 --type 参数 "${type}"，使用默认值 "all"`);
  }
  return 'all';
}

/**
 * 加载标签配置
 * @returns {Array} 标签数组
 */
function loadTags() {
  try {
    const configPath = path.join(projectRoot, 'config', 'tags.json');
    const data = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(data);

    if (!config.tags || !Array.isArray(config.tags)) {
      throw new Error('config/tags.json 格式错误：缺少 tags 数组');
    }

    return config.tags;
  } catch (error) {
    console.error('加载标签配置失败:', error.message);
    throw error;
  }
}

/**
 * 写入统计数据到 stats.json
 * @param {string} dataDir - 数据目录路径
 * @param {Array} allArticles - 所有文章数组
 * @param {string} type - 执行类型
 */
function writeStats(dataDir, allArticles, type) {
  const statsPath = path.join(projectRoot, 'stats.json');
  const today = new Date().toISOString().split('T')[0];

  // 读取现有 stats（如果存在且是今天的）
  let stats = { date: today, total: 0, urgent: 0, normal: 0, lastUpdate: '' };
  try {
    if (existsSync(statsPath)) {
      const existing = JSON.parse(readFileSync(statsPath, 'utf-8'));
      if (existing.date === today) {
        stats = existing;
      }
    }
  } catch (e) {
    // 忽略读取错误，使用默认值
  }

  // 累加本次新增文章数
  const urgentCount = allArticles.filter(a => a.tag?.type === 'urgent').length;
  const normalCount = allArticles.filter(a => a.tag?.type === 'normal').length;

  stats.total += allArticles.length;
  stats.urgent += urgentCount;
  stats.normal += normalCount;
  stats.lastUpdate = new Date().toISOString();

  writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
  console.log(`统计数据已写入 stats.json: total=${stats.total}, urgent=${stats.urgent}, normal=${stats.normal}`);
}

/**
 * 主流程
 */
async function main() {
  const startTime = new Date();
  console.log(`\n========================================`);
  console.log(`[${startTime.toISOString()}] 开始新闻抓取流程`);
  console.log(`========================================\n`);

  try {
    // 1. 解析命令行参数
    const type = parseArgs();
    console.log(`执行模式: ${type}`);

    // 2. 加载并过滤标签
    let tags = loadTags();
    console.log(`配置文件中共有 ${tags.length} 个标签`);

    if (type !== 'all') {
      tags = tags.filter(t => t.type === type);
      console.log(`过滤后剩余 ${tags.length} 个 ${type} 标签\n`);
    } else {
      console.log('');
    }

    if (tags.length === 0) {
      console.log('没有需要处理的标签，退出程序');
      return;
    }

    // 3. 获取今日 Excel 路径，读取已存在 URL
    const dataDir = path.join(projectRoot, 'data');
    const excelPath = generateExcelFileName(dataDir);
    console.log(`Excel 文件路径: ${excelPath}`);

    const existingUrls = getExistingUrls(excelPath);
    console.log(`已存在 ${existingUrls.size} 条 URL 记录（用于去重）\n`);

    // 4. 遍历每个标签，抓取文章
    console.log('========================================');
    console.log('开始抓取文章');
    console.log('========================================\n');

    const allArticles = [];

    for (const tag of tags) {
      console.log(`抓取标签: ${tag.name} (${tag.type})`);

      // 抓取文章（默认每个标签抓取 10 篇）
      const articles = await fetchInoreader(tag.url, 10);

      // 过滤已存在的 URL（去重）
      const newArticles = articles
        .filter(article => !existingUrls.has(article.url))
        .map(article => ({ ...article, tag }));

      console.log(`- 抓取到 ${articles.length} 篇，去重后新增 ${newArticles.length} 篇\n`);

      allArticles.push(...newArticles);

      // 每个标签之间延迟 1 秒，避免请求过快
      await sleep(1000);
    }

    console.log(`总计新增文章: ${allArticles.length} 篇\n`);

    // 如果没有新文章，跳过 AI 分析和推送
    if (allArticles.length === 0) {
      console.log('没有新文章需要处理，执行清理任务后退出\n');

      // 清理旧文件
      console.log('========================================');
      console.log('清理旧文件');
      console.log('========================================\n');
      cleanOldFiles(dataDir, 7);

      const endTime = new Date();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`\n========================================`);
      console.log(`[${endTime.toISOString()}] 流程完成`);
      console.log(`总耗时: ${duration} 秒`);
      console.log(`========================================\n`);
      return;
    }

    // 5. AI 分析（每篇文章间隔 3 秒）
    console.log('========================================');
    console.log('开始 AI 分析');
    console.log('========================================\n');

    for (let i = 0; i < allArticles.length; i++) {
      const article = allArticles[i];

      console.log(`[${i + 1}/${allArticles.length}] 分析文章: ${article.title}`);

      // 调用 AI 分析
      const { summary, score } = await analyzeWithGemini(article);
      article.summary = summary;
      article.score = score;

      // 每篇文章之间延迟 3 秒（避免 API 限流）
      if (i < allArticles.length - 1) {
        console.log(`等待 3 秒后继续...\n`);
        await sleep(3000);
      } else {
        console.log('');
      }
    }

    console.log(`AI 分析完成，共处理 ${allArticles.length} 篇文章\n`);

    // 6. 推送 urgent 类型文章到微信
    console.log('========================================');
    console.log('微信推送');
    console.log('========================================\n');

    const urgentArticles = allArticles.filter(article => article.tag?.type === 'urgent');

    if (urgentArticles.length > 0) {
      console.log(`发现 ${urgentArticles.length} 篇紧急文章，准备推送到微信...`);
      const pushSuccess = await pushToWechat(urgentArticles);

      if (pushSuccess) {
        console.log('微信推送成功\n');
      } else {
        console.error('微信推送失败\n');
      }
    } else {
      console.log('没有紧急文章需要推送到微信\n');
    }

    // 7. 写入 Excel
    console.log('========================================');
    console.log('写入 Excel');
    console.log('========================================\n');

    if (allArticles.length > 0) {
      appendToExcel(excelPath, allArticles);
      console.log('');
    }

    // 7.5 写入统计数据
    writeStats(dataDir, allArticles, type);

    // 8. 清理旧文件
    console.log('========================================');
    console.log('清理旧文件');
    console.log('========================================\n');

    cleanOldFiles(dataDir, 7);

    // 9. 输出统计日志
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n========================================`);
    console.log(`流程统计`);
    console.log(`========================================`);
    console.log(`开始时间: ${startTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    console.log(`结束时间: ${endTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    console.log(`总耗时: ${duration} 秒`);
    console.log(`执行模式: ${type}`);
    console.log(`处理标签数: ${tags.length}`);
    console.log(`新增文章数: ${allArticles.length}`);
    console.log(`紧急文章数: ${urgentArticles.length}`);
    console.log(`已推送到微信: ${urgentArticles.length > 0 ? '是' : '否'}`);
    console.log(`Excel 文件: ${path.basename(excelPath)}`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error('\n流程执行失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行主流程
main().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
