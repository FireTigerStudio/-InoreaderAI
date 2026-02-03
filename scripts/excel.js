/**
 * Excel 文件操作模块
 * 处理新闻数据的 Excel 读写和文件管理
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * 从 Excel 文件读取已存在的 URL
 * @param {string} filePath - Excel 文件路径
 * @returns {Set<string>} URL 集合（用于去重）
 */
export function getExistingUrls(filePath) {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return new Set();
    }

    // 读取 Excel 文件
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 转换为 JSON 数据
    const data = XLSX.utils.sheet_to_json(sheet);

    // 提取 URL 并返回 Set
    const urls = new Set(
      data
        .map(row => row.URL)
        .filter(url => url) // 过滤空值
    );

    return urls;
  } catch (error) {
    console.error(`读取 Excel 文件失败 (${filePath}):`, error.message);
    return new Set();
  }
}

/**
 * 将文章追加到 Excel 文件
 * @param {string} filePath - Excel 文件路径
 * @param {Array<Object>} articles - 文章数组
 * @param {string} articles[].tag.name - 标签名称
 * @param {string} articles[].url - 文章 URL
 * @param {string} articles[].title - 文章标题
 * @param {string} articles[].summary - AI 摘要
 * @param {number} articles[].score - AI 评分 (1-5)
 * @param {string} articles[].tag.type - 标签类型 ('urgent' | 'normal')
 */
export function appendToExcel(filePath, articles) {
  try {
    let existingData = [];

    // 如果文件已存在，读取现有数据
    if (fs.existsSync(filePath)) {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      existingData = XLSX.utils.sheet_to_json(sheet);
    }

    // 转换文章数据为 Excel 行格式
    const currentTime = new Date().toISOString();
    const newRows = articles.map(article => ({
      Tag: article.tag?.name || '',
      URL: article.url || '',
      Title: article.title || '',
      Summary: article.summary || '',
      Score: article.score || '',
      Type: article.tag?.type || '',
      Date: currentTime
    }));

    // 合并现有数据和新数据
    const allData = [...existingData, ...newRows];

    // 创建工作表和工作簿
    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'News');

    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    XLSX.writeFile(workbook, filePath);

    console.log(`成功追加 ${newRows.length} 条记录到 ${filePath}`);
  } catch (error) {
    console.error(`写入 Excel 文件失败 (${filePath}):`, error.message);
    throw error;
  }
}

/**
 * 清理超过指定天数的旧文件
 * @param {string} dir - 目录路径
 * @param {number} days - 保留天数
 */
export function cleanOldFiles(dir, days) {
  try {
    // 检查目录是否存在
    if (!fs.existsSync(dir)) {
      console.log(`目录不存在: ${dir}`);
      return;
    }

    const now = Date.now();
    const maxAge = days * 24 * 60 * 60 * 1000; // 转换为毫秒

    // 读取目录中的所有文件
    const files = fs.readdirSync(dir);

    let deletedCount = 0;

    files.forEach(file => {
      // 只处理 Excel 文件
      if (!file.endsWith('.xlsx') || !file.startsWith('news_')) {
        return;
      }

      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      // 如果文件超过指定天数，删除它
      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`已删除旧文件: ${file} (${Math.floor(fileAge / (24 * 60 * 60 * 1000))} 天前)`);
      }
    });

    if (deletedCount === 0) {
      console.log(`没有找到需要清理的文件 (超过 ${days} 天)`);
    } else {
      console.log(`共清理了 ${deletedCount} 个旧文件`);
    }
  } catch (error) {
    console.error(`清理旧文件失败 (${dir}):`, error.message);
    throw error;
  }
}

/**
 * 生成基于日期的 Excel 文件名
 * @param {string} dir - 输出目录
 * @param {Date} date - 日期对象（可选，默认为当前日期）
 * @returns {string} 完整文件路径
 */
export function generateExcelFileName(dir, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const fileName = `news_${year}-${month}-${day}.xlsx`;
  return path.join(dir, fileName);
}
