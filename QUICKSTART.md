# InoreaderAI Quick Start Guide

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Required for AI analysis
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Only needed for WeChat push
WECHAT_KEY=your_serverchan_key_here
```

Or export them directly:

```bash
export GEMINI_API_KEY=your_gemini_api_key_here
export WECHAT_KEY=your_serverchan_key_here
```

### 3. Configure Tags

Edit `config/tags.json` to add your Inoreader RSS feeds:

```json
{
  "tags": [
    {
      "name": "P0-Urgent",
      "url": "https://www.inoreader.com/stream/user/YOUR_USER_ID/tag/YOUR_TAG/view/json",
      "type": "urgent"
    },
    {
      "name": "Tech News",
      "url": "https://www.inoreader.com/stream/user/YOUR_USER_ID/tag/YOUR_TAG/view/json",
      "type": "normal"
    }
  ]
}
```

## Usage

### Fetch All News

```bash
npm start
# or
node scripts/main.js
```

### Fetch Only Urgent News

```bash
node scripts/main.js --type urgent
```

### Fetch Only Normal News

```bash
node scripts/main.js --type normal
```

## What Happens?

1. **Fetch** - Retrieves latest articles from Inoreader
2. **Deduplicate** - Filters out already-processed URLs
3. **Analyze** - Uses Gemini AI to generate summaries and scores
4. **Push** - Sends urgent articles to WeChat (if configured)
5. **Save** - Writes all articles to Excel (`data/news_YYYY-MM-DD.xlsx`)
6. **Cleanup** - Removes Excel files older than 7 days

## Output

### Console Output

```
========================================
[2026-02-03T14:00:00.000Z] 开始新闻抓取流程
========================================

执行模式: urgent
配置文件中共有 11 个标签
过滤后剩余 2 个 urgent 标签

Excel 文件路径: /path/to/data/news_2026-02-03.xlsx
已存在 0 条 URL 记录（用于去重）

...

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

### Excel Output

Generated file: `data/news_2026-02-03.xlsx`

| Tag | URL | Title | Summary | Score | Type | Date |
|-----|-----|-------|---------|-------|------|------|
| P0-Urgent | https://... | Article Title | AI Summary | 4 | urgent | 2026-02-03T14:00:00.000Z |

## Testing

### Test Main Script

```bash
node scripts/test-main.js
```

### Test Individual Modules

```bash
# Test fetch
node scripts/test-fetch.js

# Test AI analysis
node scripts/test-analyze.js

# Test WeChat push
node scripts/test-wechat.js

# Test Excel operations
node scripts/test-excel.js
```

## Common Issues

### Missing Environment Variables

```
错误: 未设置 GEMINI_API_KEY 环境变量
```

**Solution**: Set the `GEMINI_API_KEY` environment variable

```bash
export GEMINI_API_KEY=your_api_key
```

### Configuration Error

```
加载标签配置失败: config/tags.json 格式错误
```

**Solution**: Check the JSON syntax in `config/tags.json`

### Network Error

```
抓取失败: fetch failed
```

**Solution**: Check your internet connection and Inoreader URL

## Automation with GitHub Actions

### Setup

1. Add secrets to GitHub repository:
   - `GEMINI_API_KEY`
   - `WECHAT_KEY` (optional)

2. Create `.github/workflows/auto-fetch.yml`:

```yaml
name: Auto Fetch News

on:
  schedule:
    # Run at 8:00 UTC (16:00 Beijing) every day
    - cron: '0 8 * * *'
  workflow_dispatch: # Manual trigger

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

## Project Structure

```
InoreaderAI/
├── config/
│   └── tags.json          # RSS feed configuration
├── data/
│   └── news_*.xlsx        # Generated Excel files
├── scripts/
│   ├── main.js            # Main workflow script
│   ├── fetch.js           # Inoreader API wrapper
│   ├── analyze.js         # Gemini AI analysis
│   ├── wechat.js          # WeChat push
│   ├── excel.js           # Excel operations
│   └── test-*.js          # Test scripts
├── package.json
└── README.md
```

## Next Steps

1. **Customize tags**: Edit `config/tags.json` with your feeds
2. **Test locally**: Run `npm start` to test the full workflow
3. **Set up automation**: Configure GitHub Actions for daily runs
4. **Monitor results**: Check Excel files in `data/` directory

## Getting Help

- Read detailed documentation in `scripts/README-main.md`
- Check module-specific docs: `README-fetch.md`, `README-wechat.md`, etc.
- Run tests to verify setup: `node scripts/test-main.js`

## Tips

- **API Rate Limits**: The script includes delays to avoid rate limiting
  - 1 second between tag fetches
  - 3 seconds between AI analyses

- **Cost Management**: Each run with 10 articles costs ~10 Gemini API calls

- **Data Retention**: Excel files are kept for 7 days (configurable in code)

## License

ISC
