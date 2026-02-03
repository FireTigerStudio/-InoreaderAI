# RSS智能聚合与分析系统 - 项目手册

> 类型: Simple Tool (Algorithm + UI Only)
> 状态: MVP v1.0 待实现
> 生成日期: 2026-02-03

---

## 一、项目概述

基于 Inoreader RSS 订阅源，构建自动化新闻抓取、AI 分析、智能分类系统。

### 核心功能
- **自动化抓取**: GitHub Actions 定时运行，零人工干预
- **智能分析**: Gemini AI 生成一句话摘要 + 重要性评分 (1-5)
- **即时推送**: Urgent 类文章 2 小时内推送微信 (Server酱)
- **归档查阅**: 每日 Excel 文件，网页一键下载

### 数据规模
- 每日处理: 200-300 篇文章
- 文件大小: 单日 Excel < 100KB
- 保留期限: 7 天自动清理

---

## 二、技术栈

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| **运行时** | Node.js 20 | GitHub Actions 环境 |
| **定时任务** | GitHub Actions | cron 调度，免费 2000 分钟/月 |
| **AI 分析** | Google Gemini API | 摘要生成 + 评分，3秒限流 |
| **数据存储** | xlsx 库 + GitHub 仓库 | Excel 文件，自带版本历史 |
| **微信推送** | Server酱 | 付费版无限制，约 40 元/年 |
| **前端** | 静态 HTML + TailwindCSS | 无需构建步骤 |
| **部署** | GitHub Pages | 零服务器成本 |

### NPM 依赖

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "@google/generative-ai": "^0.1.0",
    "node-fetch": "^3.3.0"
  }
}
```

---

## 三、目录结构

```
InoreaderAI/
├── .github/
│   └── workflows/
│       ├── fetch-urgent.yml      # 每2小时运行 (urgent tags)
│       └── fetch-normal.yml      # 每12小时运行 (normal tags)
│
├── config/
│   └── tags.json                 # Tag 配置 (网页可编辑)
│
├── scripts/
│   ├── main.js                   # 主入口，协调所有流程
│   ├── fetch.js                  # 抓取 Inoreader JSON
│   ├── analyze.js                # 调用 Gemini API
│   ├── excel.js                  # 读写 Excel 文件
│   └── wechat.js                 # Server酱推送
│
├── data/
│   ├── news_2026-02-03.xlsx      # 今日数据
│   ├── news_2026-02-02.xlsx      # 昨日数据
│   └── ...                       # 保留最近7天
│
├── web/
│   ├── index.html                # 首页 (统计+下载)
│   ├── tags.html                 # Tag 管理页
│   ├── styles.css                # TailwindCSS 样式
│   └── app.js                    # 前端交互逻辑
│
├── docs/
│   └── plans/                    # 设计文档
│
├── CLAUDE.md                     # 本文件 - 项目手册
└── package.json                  # Node.js 依赖
```

---

## 四、开发工作流 (Subagent 分工)

### Phase 1: 架构设计 (已完成)
- **Architect**: 生成 CLAUDE.md 项目手册

### Phase 2: 集成外部服务
- **Integration Specialist**:
  - 封装 Inoreader API (fetch.js)
  - 封装 Gemini API (analyze.js)
  - 封装 Server酱 API (wechat.js)
  - 封装 GitHub API (用于 Tag 管理保存)

### Phase 3: 核心开发 (可并行)
- **Backend Developer**:
  - `scripts/main.js` - 主流程控制
  - `scripts/excel.js` - Excel 读写逻辑
  - `.github/workflows/fetch-urgent.yml`
  - `.github/workflows/fetch-normal.yml`

- **Frontend Developer**:
  - `web/index.html` - 首页 (统计+下载)
  - `web/tags.html` - Tag 管理页
  - `web/app.js` - 前端交互
  - `web/styles.css` - 响应式设计

### Phase 4: 测试
- **Test Engineer**:
  - 单元测试 (各模块)
  - 集成测试 (完整流程)
  - Mock API 测试

### Phase 5: 审查与部署
- **Code Reviewer**:
  - 安全检查 (无密钥泄露)
  - 代码质量审查
  - 部署前审批

---

## 五、环境变量配置

### GitHub Actions Secrets

| Secret 名 | 来源 | 用途 |
|-----------|------|------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) | Gemini AI 分析 |
| `WECHAT_KEY` | [Server酱后台](https://sct.ftqq.com/) | 微信推送 |

### 前端 localStorage

| 配置项 | 用途 |
|--------|------|
| `github_token` | GitHub Personal Access Token，用于保存 Tag 配置 |

### 本地开发 (.env)

```bash
# .env (不要提交到 Git)
GEMINI_API_KEY=your_gemini_api_key
WECHAT_KEY=your_wechat_key
```

---

## 六、运行命令

### 本地开发

```bash
# 安装依赖
npm install

# 抓取 Urgent 类文章 (本地测试)
node scripts/main.js --type urgent

# 抓取 Normal 类文章 (本地测试)
node scripts/main.js --type normal

# 启动本地预览 (需要简单 HTTP 服务器)
npx serve web
```

### GitHub Actions 手动触发

```bash
# 通过 GitHub CLI 手动触发
gh workflow run fetch-urgent.yml
gh workflow run fetch-normal.yml
```

---

## 七、部署说明

### 7.1 初始设置

1. **创建 GitHub 仓库**
   ```bash
   git init
   git remote add origin https://github.com/YOUR_USER/InoreaderAI.git
   ```

2. **配置 Secrets**
   - 进入 GitHub 仓库 Settings > Secrets and variables > Actions
   - 添加 `GEMINI_API_KEY`
   - 添加 `WECHAT_KEY`

3. **启用 GitHub Pages**
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: main, /web 目录

4. **配置 Actions 权限**
   - Settings > Actions > General
   - Workflow permissions: Read and write permissions

### 7.2 自动运行

配置完成后，GitHub Actions 将按以下计划自动运行:

| 工作流 | 运行频率 | 处理内容 |
|--------|----------|----------|
| `fetch-urgent.yml` | 每 2 小时 | Urgent 类 Tag，推送微信 |
| `fetch-normal.yml` | 每 12 小时 | Normal 类 Tag |

### 7.3 文件自动提交

每次运行后，Actions 会自动:
1. 将新数据写入 `data/news_YYYY-MM-DD.xlsx`
2. Git commit 并 push 到 main 分支
3. 清理超过 7 天的旧文件

---

## 八、数据结构

### tags.json 配置格式

```json
{
  "tags": [
    {
      "name": "P0-Urgent",
      "url": "https://www.inoreader.com/stream/user/USER_ID/tag/TAG_NAME/view/json",
      "type": "urgent"
    },
    {
      "name": "金银矿产业链",
      "url": "https://www.inoreader.com/stream/user/USER_ID/tag/TAG_NAME/view/json",
      "type": "normal"
    }
  ]
}
```

### Excel 字段结构

| 列名 | 类型 | 说明 |
|------|------|------|
| Tag | string | 来源标签名 |
| URL | string | 原文链接 (用于去重) |
| Title | string | 文章标题 |
| Summary | string | AI 摘要 (30字内) |
| Score | number | 重要性 1-5 |
| Type | string | "urgent" 或 "normal" |
| Date | datetime | 抓取时间戳 |

---

## 九、错误处理

| 场景 | 处理方式 |
|------|----------|
| Inoreader 抓取失败 | 跳过该 Tag，继续其他，记录日志 |
| Gemini API 失败 | 重试 1 次，仍失败则 summary="分析失败", score=0 |
| Excel 文件不存在 | 自动创建新文件 |
| 微信推送失败 | 记录日志，不影响 Excel 写入 |
| GitHub 提交失败 | Actions 自动重试机制 |

---

## 十、成本预估

| 项目 | 月成本 |
|------|--------|
| GitHub Actions | 免费 (2000 分钟/月) |
| GitHub Pages | 免费 |
| Gemini API | ~$4.5 (按 300 篇/天计算) |
| Server酱 | ~3.3 元 (40元/年) |
| **合计** | ~$5/月 |

---

## 十一、前端设计规范

- **风格**: 苹果官网商务风格
- **背景色**: 米白色 `#F5F5F7`
- **卡片**: 白色圆角卡片，轻微阴影
- **强调色**: 高饱和度时尚色 (红/金/橙/紫)
- **响应式**: 适配移动端

---

## 十二、开发检查清单

### Integration Specialist
- [x] fetch.js - Inoreader API 封装
- [x] analyze.js - Gemini API 封装
- [ ] wechat.js - Server酱 API 封装

### Backend Developer
- [ ] main.js - 主流程
- [ ] excel.js - Excel 读写
- [x] fetch-urgent.yml - 2h 定时任务
- [x] fetch-normal.yml - 12h 定时任务

### Frontend Developer
- [ ] index.html - 首页
- [ ] tags.html - Tag 管理
- [ ] app.js - 前端逻辑
- [ ] styles.css - 样式

### Test Engineer
- [ ] 单元测试
- [ ] 集成测试

### Code Reviewer
- [ ] 安全审查
- [ ] 代码质量
- [ ] 部署审批

---

*生成者: Architect Agent*
*生成时间: 2026-02-03*
