# Main Workflow Script (main.js)

## Overview

`main.js` 是整个新闻抓取系统的核心调度脚本，协调所有模块完成完整的工作流程。

## Features

1. **命令行参数支持** - 通过 `--type` 参数过滤标签类型
2. **智能去重** - 读取当日 Excel 文件，过滤已抓取的 URL
3. **批量抓取** - 遍历所有标签，抓取最新文章
4. **AI 分析** - 使用 Gemini AI 生成摘要和评分
5. **微信推送** - 自动推送紧急文章到微信
6. **数据持久化** - 将所有文章写入 Excel
7. **自动清理** - 删除 7 天前的旧文件
8. **详细日志** - 输出完整的执行统计信息

## Usage

### 基本用法

```bash
# 抓取所有类型的标签
node scripts/main.js

# 或使用 npm script
npm start
```

### 命令行参数

```bash
# 仅抓取 urgent 类型标签
node scripts/main.js --type urgent

# 仅抓取 normal 类型标签
node scripts/main.js --type normal

# 抓取所有类型（默认）
node scripts/main.js --type all
```

## Environment Variables

需要配置以下环境变量（推荐使用 `.env` 文件）：

```bash
# Gemini AI API Key（必需）
GEMINI_API_KEY=your_gemini_api_key_here

# Server酱 API Key（仅推送微信时需要）
WECHAT_KEY=your_serverchan_key_here
```

## Workflow

### 完整流程

```
1. 解析命令行参数 (--type)
   ↓
2. 加载 config/tags.json
   ↓
3. 根据 type 过滤标签
   ↓
4. 获取今日 Excel 文件路径
   ↓
5. 读取已存在的 URL（用于去重）
   ↓
6. 遍历每个标签：
   - 调用 fetch.js 抓取文章
   - 过滤已存在的 URL
   - 添加到文章列表
   - 延迟 1 秒（避免请求过快）
   ↓
7. 遍历每篇新文章：
   - 调用 analyze.js 进行 AI 分析
   - 获取摘要和评分
   - 延迟 3 秒（避免 API 限流）
   ↓
8. 过滤出 urgent 类型文章
   ↓
9. 如果有 urgent 文章：
   - 调用 wechat.js 推送到微信
   ↓
10. 将所有文章写入 Excel
    ↓
11. 清理 7 天前的旧 Excel 文件
    ↓
12. 输出统计日志
```

### 时间控制

- **标签抓取间隔**: 1 秒（避免 Inoreader API 请求过快）
- **AI 分析间隔**: 3 秒（避免 Gemini API 限流）

## Configuration

### tags.json 结构

```json
{
  "tags": [
    {
      "name": "P0-Urgent",
      "url": "https://www.inoreader.com/stream/user/xxx/tag/xxx/view/json",
      "type": "urgent"
    },
    {
      "name": "金银矿产业链",
      "url": "https://www.inoreader.com/stream/user/xxx/tag/xxx/view/json",
      "type": "normal"
    }
  ]
}
```

### 标签类型说明

- **`urgent`**: 紧急文章，会推送到微信
- **`normal`**: 普通文章，只写入 Excel，不推送

## Output

### 控制台日志

```
========================================
[2026-02-03T14:00:00.000Z] 开始新闻抓取流程
========================================

执行模式: urgent
配置文件中共有 11 个标签
过滤后剩余 2 个 urgent 标签

Excel 文件路径: /path/to/data/news_2026-02-03.xlsx
已存在 50 条 URL 记录（用于去重）

========================================
开始抓取文章
========================================

抓取标签: P0-Urgent (urgent)
正在抓取: https://www.inoreader.com/stream/...
成功抓取 10 篇文章
- 抓取到 10 篇，去重后新增 5 篇

总计新增文章: 5 篇

========================================
开始 AI 分析
========================================

[1/5] 分析文章: Article Title
分析完成: "Article Title" -> score:4
等待 3 秒后继续...

...

AI 分析完成，共处理 5 篇文章

========================================
微信推送
========================================

发现 5 篇紧急文章，准备推送到微信...
微信推送成功: 5 篇文章 (紧急)
微信推送成功

========================================
写入 Excel
========================================

成功追加 5 条记录到 /path/to/data/news_2026-02-03.xlsx

========================================
清理旧文件
========================================

已删除旧文件: news_2026-01-26.xlsx (8 天前)
共清理了 1 个旧文件

========================================
流程统计
========================================
开始时间: 2026-02-03 14:00:00
结束时间: 2026-02-03 14:01:25
总耗时: 85.32 秒
执行模式: urgent
处理标签数: 2
新增文章数: 5
紧急文章数: 5
已推送到微信: 是
Excel 文件: news_2026-02-03.xlsx
========================================
```

### Excel 输出

生成的 Excel 文件位于 `data/news_YYYY-MM-DD.xlsx`，包含以下列：

| Tag | URL | Title | Summary | Score | Type | Date |
|-----|-----|-------|---------|-------|------|------|
| P0-Urgent | https://... | 文章标题 | AI 生成摘要 | 4 | urgent | 2026-02-03T14:00:00.000Z |

## Error Handling

### 常见错误

1. **缺少环境变量**
   ```
   错误: 未设置 GEMINI_API_KEY 环境变量
   ```
   解决: 设置 `GEMINI_API_KEY` 环境变量

2. **配置文件错误**
   ```
   加载标签配置失败: config/tags.json 格式错误
   ```
   解决: 检查 `config/tags.json` 格式是否正确

3. **网络请求失败**
   ```
   抓取失败: fetch failed
   ```
   解决: 检查网络连接和 URL 是否正确

### 错误处理策略

- **抓取失败**: 返回空数组，继续处理其他标签
- **AI 分析失败**: 返回默认值 `{summary: '分析失败', score: 0}`
- **微信推送失败**: 记录错误日志，继续执行后续流程
- **Excel 写入失败**: 抛出异常，终止流程

## Dependencies

### 内部模块

- `scripts/fetch.js` - Inoreader 抓取
- `scripts/analyze.js` - Gemini AI 分析
- `scripts/wechat.js` - 微信推送
- `scripts/excel.js` - Excel 读写和文件管理

### 外部依赖

- `xlsx` - Excel 文件操作
- `@google/generative-ai` - Gemini AI SDK
- `node-fetch` - HTTP 请求（Node.js 内置）

## Automation

### GitHub Actions 示例

```yaml
name: Auto Fetch News

on:
  schedule:
    # 每天 8:00 UTC (北京时间 16:00) 执行
    - cron: '0 8 * * *'

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Fetch urgent news
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          WECHAT_KEY: ${{ secrets.WECHAT_KEY }}
        run: node scripts/main.js --type urgent

      - name: Upload Excel
        uses: actions/upload-artifact@v3
        with:
          name: news-data
          path: data/*.xlsx
```

## Performance

### 预期执行时间

假设：
- 2 个 urgent 标签
- 每个标签抓取 10 篇文章
- 去重后共 5 篇新文章

计算：
```
抓取时间: 2 标签 × (1秒 请求 + 1秒 延迟) = ~4 秒
AI 分析: 5 文章 × (2秒 API + 3秒 延迟) = ~25 秒
微信推送: ~2 秒
Excel 写入: ~1 秒
文件清理: ~1 秒
------
总计: ~33 秒
```

### 优化建议

1. **并行抓取**: 可以考虑并行抓取多个标签（需注意 API 限流）
2. **批量分析**: 如果 Gemini API 支持批量请求，可以减少延迟
3. **缓存机制**: 缓存已分析的文章，避免重复分析

## Limitations

1. **API 限流**: 需要遵守 Inoreader 和 Gemini 的 API 限流规则
2. **文章数量**: 默认每个标签抓取 10 篇文章（可修改 `fetchInoreader` 的 `limit` 参数）
3. **微信推送**: 仅推送 `urgent` 类型文章
4. **去重策略**: 基于 URL 去重，无法识别同一文章的不同 URL

## Troubleshooting

### Debug 模式

如需查看详细的 API 请求和响应，可以在代码中添加 `console.log`：

```javascript
// 在 main.js 中添加
console.log('Fetched articles:', JSON.stringify(articles, null, 2));
```

### 测试单个模块

```bash
# 测试 fetch
node scripts/test-fetch.js

# 测试 analyze
node scripts/test-analyze.js

# 测试 wechat
node scripts/test-wechat.js

# 测试 excel
node scripts/test-excel.js
```

## License

ISC

## Author

InoreaderAI Team
