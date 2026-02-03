# WeChat Push Quick Start

## 1. 获取 Server酱 API Key

访问: https://sct.ftqq.com/
- 使用微信扫码登录
- 复制 SendKey (格式: `SCT开头`)

## 2. 设置环境变量

```bash
export WECHAT_KEY=SCT...你的Key
```

或者在 `.env` 文件中:
```
WECHAT_KEY=SCT...你的Key
```

## 3. 基本使用

```javascript
import { pushToWechat } from './scripts/wechat.js';

// 准备文章数据
const articles = [
  {
    id: '001',
    title: '文章标题',
    url: 'https://example.com/article',
    source: 'Bloomberg',
    publishDate: '2026-02-03T10:00:00Z',
    summary: 'AI生成的摘要',
    score: 5,  // 1-5分
    tag: {
      name: '黄金-美元-利率',
      type: 'urgent'  // 'urgent' 或 'normal'
    }
  }
];

// 推送
const success = await pushToWechat(articles);
console.log(success ? '推送成功' : '推送失败');
```

## 4. 测试

```bash
# 简单测试
WECHAT_KEY=your_key node scripts/test-wechat.js

# 完整工作流测试
WECHAT_KEY=your_key GEMINI_API_KEY=your_key node scripts/example-wechat-usage.js
```

## 5. 推送效果

微信会收到通知，内容格式:

```
🚨 紧急新闻 [标签名] - 2篇

## 🚨 紧急新闻
共 2 篇新闻

---

### 1. 美联储降息50基点 (⭐⭐⭐⭐⭐)

**摘要:** 美联储宣布降息50个基点...

**来源:** Bloomberg
**时间:** 2026-02-03 18:00

🔗 [阅读原文](https://...)

---
```

## 6. 主要功能

- ✅ 自动按紧急/普通分组
- ✅ Markdown 格式美化
- ✅ 按评分自动排序
- ✅ 错误处理不中断流程
- ✅ 支持批量推送

## 7. 限制

免费版 Server酱:
- 每天最多 5 条消息
- 每条消息 4096 字符

建议策略:
- 紧急文章立即推送
- 普通文章每日汇总

## 8. 成本

- 免费版: 5条/天，够用
- 付费版: ¥9.9/月起，无限制

## 9. 故障排查

**推送失败?**

检查:
1. WECHAT_KEY 是否正确设置
2. Server酱账户是否激活
3. 是否超出每日限制
4. 网络连接是否正常

查看日志:
```bash
node scripts/test-wechat.js 2>&1 | tee wechat.log
```

**未收到推送?**

1. 检查微信 "Server酱" 公众号
2. 确认公众号未被屏蔽
3. 检查推送历史: https://sct.ftqq.com/sendkey

## 10. API 参考

完整文档: `scripts/README-wechat.md`
