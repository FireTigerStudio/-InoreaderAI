# Excel 模块使用说明

## 功能概述

`scripts/excel.js` 提供 Excel 文件操作功能，用于存储和管理新闻文章数据。

## API 接口

### 1. getExistingUrls(filePath)

从 Excel 文件读取已存在的 URL，用于去重。

```javascript
import { getExistingUrls } from './excel.js';

const urls = getExistingUrls('./output/news_2026-02-03.xlsx');
console.log(urls.size); // 输出 URL 数量

// 检查 URL 是否已存在
if (urls.has('https://example.com/article')) {
  console.log('文章已存在，跳过');
}
```

**参数:**
- `filePath` (string): Excel 文件路径

**返回:**
- `Set<string>`: URL 集合

**特性:**
- 文件不存在时返回空 Set
- 自动过滤空 URL
- 错误时返回空 Set 并输出错误日志

---

### 2. appendToExcel(filePath, articles)

将文章数据追加到 Excel 文件。

```javascript
import { appendToExcel } from './excel.js';

const articles = [
  {
    id: '1',
    title: 'AI 技术突破',
    url: 'https://example.com/ai-news',
    source: 'Tech News',
    publishDate: '2026-02-03',
    summary: 'AI 技术取得重大突破...',
    score: 5,
    tag: {
      name: 'AI',
      type: 'urgent'
    }
  }
];

appendToExcel('./output/news_2026-02-03.xlsx', articles);
```

**参数:**
- `filePath` (string): Excel 文件路径
- `articles` (Array): 文章对象数组

**文章对象结构:**
```javascript
{
  tag: { name: string, type: 'urgent' | 'normal' },
  url: string,
  title: string,
  summary: string,  // AI 生成的摘要
  score: number,    // AI 评分 1-5
}
```

**Excel 列映射:**
- Tag → article.tag.name
- URL → article.url
- Title → article.title
- Summary → article.summary
- Score → article.score
- Type → article.tag.type
- Date → 当前时间 (ISO 格式)

**特性:**
- 文件不存在时自动创建（带表头）
- 自动创建目录（如果不存在）
- 保留现有数据，新数据追加到末尾

---

### 3. cleanOldFiles(dir, days)

清理超过指定天数的旧 Excel 文件。

```javascript
import { cleanOldFiles } from './excel.js';

// 清理超过 7 天的文件
cleanOldFiles('./output', 7);
```

**参数:**
- `dir` (string): 目录路径
- `days` (number): 保留天数

**特性:**
- 只删除 `news_*.xlsx` 格式的文件
- 基于文件修改时间判断
- 输出删除日志
- 目录不存在时安全返回

---

### 4. generateExcelFileName(dir, date)

生成基于日期的 Excel 文件名。

```javascript
import { generateExcelFileName } from './excel.js';

// 使用当前日期
const fileName = generateExcelFileName('./output');
// 返回: ./output/news_2026-02-03.xlsx

// 使用指定日期
const customDate = new Date('2026-01-15');
const customFileName = generateExcelFileName('./output', customDate);
// 返回: ./output/news_2026-01-15.xlsx
```

**参数:**
- `dir` (string): 输出目录
- `date` (Date, 可选): 日期对象，默认当前日期

**返回:**
- `string`: 完整文件路径

**文件命名格式:**
- `news_YYYY-MM-DD.xlsx`

---

## 完整使用示例

```javascript
import {
  getExistingUrls,
  appendToExcel,
  cleanOldFiles,
  generateExcelFileName
} from './excel.js';

const OUTPUT_DIR = './output';

async function saveArticles(articles) {
  // 1. 生成今天的文件名
  const filePath = generateExcelFileName(OUTPUT_DIR);

  // 2. 读取已存在的 URL（去重）
  const existingUrls = getExistingUrls(filePath);

  // 3. 过滤新文章
  const newArticles = articles.filter(
    article => !existingUrls.has(article.url)
  );

  if (newArticles.length === 0) {
    console.log('没有新文章需要保存');
    return;
  }

  // 4. 追加到 Excel
  appendToExcel(filePath, newArticles);
  console.log(`保存了 ${newArticles.length} 篇新文章`);

  // 5. 清理 7 天前的旧文件
  cleanOldFiles(OUTPUT_DIR, 7);
}
```

---

## 测试

运行测试脚本验证功能：

```bash
node scripts/test-excel.js
```

测试覆盖：
- 文件不存在时读取 URLs
- 创建新 Excel 文件
- 读取现有文件的 URLs
- 追加数据到现有文件
- 清理旧文件

---

## 注意事项

1. **Excel 格式**: 使用 xlsx 库，生成 .xlsx 格式（Excel 2007+）
2. **字符编码**: 自动处理 UTF-8，支持中文
3. **文件大小**: 单个文件建议不超过 10000 条记录
4. **并发安全**: 不支持多进程同时写入同一文件
5. **错误处理**: 读取失败返回空数据，写入失败抛出异常

---

## 依赖

- xlsx: ^0.18.5
- Node.js fs 模块（内置）
- Node.js path 模块（内置）
