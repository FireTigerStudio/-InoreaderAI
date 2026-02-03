# Inoreader API Wrapper (fetch.js)

## 功能说明

封装 Inoreader RSS JSON 抓取功能，提供简单易用的接口。

## 使用方法

```javascript
import { fetchInoreader } from './scripts/fetch.js';

// 抓取文章 (默认 10 篇)
const articles = await fetchInoreader('https://www.inoreader.com/stream/user/xxx/tag/xxx/view/json');

// 自定义数量
const articles = await fetchInoreader(url, 20);
```

## 返回数据格式

```javascript
[
  {
    id: "tag:google.com,2005:reader/item/...",
    title: "文章标题",
    url: "https://example.com/article",
    source: "来源名称",
    publishDate: "2025-02-03T10:00:00.000Z"
  },
  // ...
]
```

## 数据提取规则

### URL 提取优先级
1. `item.url`
2. `item.canonical[0].href`
3. `item.alternate[0].href`
4. 默认: `https://www.inoreader.com`

### 来源 (source) 提取优先级
1. `item.origin.title`
2. `item.author`
3. 默认: `"Unknown"`

### 发布时间 (publishDate)
- 从 `item.published` (Unix 时间戳，秒) 转换为 ISO 字符串
- 如果不存在，使用当前时间

## 错误处理

- 网络错误: 返回空数组 `[]`
- HTTP 错误: 返回空数组 `[]`
- JSON 解析错误: 返回空数组 `[]`
- 所有错误均记录到 `console.error`
- 请求超时: 15 秒

## 示例

```javascript
// 抓取科技类文章
const techArticles = await fetchInoreader(
  'https://www.inoreader.com/stream/user/1003496420/tag/tech/view/json',
  5
);

console.log(`抓取到 ${techArticles.length} 篇文章`);
techArticles.forEach(article => {
  console.log(`${article.title} - ${article.source}`);
});
```

## 测试

```bash
# 简单测试 (错误处理)
node scripts/test-fetch-simple.js

# 完整测试 (需要有效的 Inoreader URL)
node scripts/test-fetch.js
```

## 依赖

- Node.js 18+ (使用原生 fetch API)
- 无需额外依赖
