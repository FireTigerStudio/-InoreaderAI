# WeChat Push Module (wechat.js)

Server酱微信推送模块文档

## 功能说明

封装 Server酱 (ServerChan) API，实现文章批量推送到微信。

## 环境变量

```bash
WECHAT_KEY=SCT...  # Server酱 API Key
```

### 获取 API Key

1. 访问 [Server酱官网](https://sct.ftqq.com/)
2. 使用微信登录
3. 复制 SendKey (格式: `SCT开头的字符串`)
4. 设置环境变量

## API 说明

### pushToWechat(articles)

批量推送文章到微信

**参数:**
- `articles` (Array): 文章列表，每个文章包含:
  - `id` (string): 文章ID
  - `title` (string): 文章标题
  - `url` (string): 文章链接
  - `source` (string): 来源名称
  - `publishDate` (string): 发布时间 (ISO格式)
  - `summary` (string): AI生成摘要
  - `score` (number): AI评分 (1-5)
  - `tag` (Object): 标签信息
    - `name` (string): 标签名称
    - `type` (string): 'urgent' | 'normal'

**返回值:**
- `Promise<boolean>`: 推送是否成功

**特性:**
- 自动按紧急/普通分组推送
- Markdown 格式化内容
- 按评分排序显示
- 错误处理：失败不抛异常，返回 false

## 使用示例

```javascript
import { pushToWechat } from './scripts/wechat.js';

const articles = [
  {
    id: '001',
    title: '美联储降息50基点',
    url: 'https://example.com/article',
    source: 'Bloomberg',
    publishDate: '2026-02-03T10:00:00Z',
    summary: '美联储宣布降息50个基点至4.75%-5.00%',
    score: 5,
    tag: {
      name: '黄金-美元-利率',
      type: 'urgent'
    }
  }
];

const success = await pushToWechat(articles);
if (success) {
  console.log('推送成功');
}
```

## 推送格式

### 紧急新闻
```
🚨 紧急新闻 [标签名] - 2篇

## 🚨 紧急新闻

共 2 篇新闻

---

### 1. 文章标题 (⭐⭐⭐⭐⭐)

**摘要:** AI生成的摘要内容

**来源:** Bloomberg
**时间:** 2026-02-03 18:00

🔗 [阅读原文](https://example.com/article)

---
```

### 普通新闻
```
📰 每日新闻 [标签名] - 3篇

## 📰 每日精选

共 3 篇新闻

---

### 1. 文章标题 (⭐⭐⭐)

...
```

## 测试

```bash
# 运行测试
WECHAT_KEY=your_key node scripts/test-wechat.js
```

## Server酱 API

### 请求格式

```
POST https://sctapi.ftqq.com/{SENDKEY}.send
Content-Type: application/json

{
  "title": "推送标题",
  "desp": "推送内容（支持Markdown）"
}
```

### 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "pushid": "123456",
    "readkey": "SCTxxx",
    "error": "SUCCESS",
    "errno": 0
  }
}
```

## 错误处理

- 未设置 `WECHAT_KEY`: 返回 false，记录错误日志
- 文章列表为空: 返回 true（无需推送）
- API 请求失败: 返回 false，记录错误日志
- API 返回错误: 返回 false，记录错误信息

## 限制说明

Server酱免费版限制:
- 每天最多 5 条消息
- 每条消息最长 4096 字符

建议:
- 合并同类型文章为一条推送
- 紧急文章单独推送
- 普通文章每日汇总推送

## 成本

- 免费版: 5条/天
- 付费版: ¥9.9/月起，无限制

详见 [Server酱定价](https://sct.ftqq.com/pricing)
