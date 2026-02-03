# Web Frontend - RSS智能聚合系统

这是RSS智能聚合系统的Web前端界面。

## 文件结构

```
web/
├── app.js          # 核心JavaScript模块（GitHub API、Token管理、工具函数）
├── index.html      # 首页（显示今日统计、历史文件下载）
├── tags.html       # Tag管理页面（管理Inoreader Tags配置）
└── README.md       # 本文档
```

## 功能特性

### 1. 首页 (index.html)

- **今日新闻下载**: 一键下载当天生成的Excel文件
- **实时统计**: 显示今日文章总数、Urgent文章数、Normal文章数
- **历史文件**: 浏览和下载历史生成的Excel文件
- **自动更新**: 自动检测最新文件并显示更新时间

### 2. Tag管理页面 (tags.html)

- **Tag列表**: 显示所有配置的Inoreader Tags
- **添加/编辑/删除**: 完整的CRUD操作
- **类型管理**: 设置Tag类型（Urgent/Normal）
- **GitHub同步**: 自动同步配置到GitHub仓库
- **Token管理**: 配置GitHub Personal Access Token

### 3. 核心模块 (app.js)

提供统一的API接口供页面调用：

#### 配置常量

```javascript
const CONFIG = {
  GITHUB_OWNER: 'YOUR_GITHUB_USERNAME',  // 需要修改为你的GitHub用户名
  GITHUB_REPO: 'InoreaderAI',            // 仓库名
  TAGS_PATH: 'config/tags.json',         // Tags配置文件路径
  DATA_DIR: 'data',                      // Excel文件目录
};
```

#### Token管理

```javascript
App.getToken()           // 获取GitHub Token
App.setToken(token)      // 设置GitHub Token
App.removeToken()        // 删除GitHub Token
App.hasToken()           // 检查是否已设置Token
App.isValidToken(token)  // 验证Token格式
```

#### GitHub API

```javascript
// 读取文件
const data = await App.githubGet('config/tags.json');

// 更新文件
const result = await App.githubPut(
  'config/tags.json',
  content,
  sha,
  'Update tags configuration'
);

// 列出目录中的文件
const files = await App.githubListFiles('data');
```

#### Tags管理

```javascript
// 从GitHub加载Tags
const { tags, sha } = await App.loadTagsFromGitHub();

// 保存Tags到GitHub
await App.saveTagsToGitHub(tags, sha);

// 从localStorage加载Tags（缓存）
const tags = App.loadTagsFromLocalStorage();

// 保存Tags到localStorage（缓存）
App.saveTagsToLocalStorage(tags);
```

#### 工具函数

```javascript
App.formatDate(date)                    // 格式化日期 YYYY-MM-DD
App.formatTime(date)                    // 格式化时间 HH:MM
App.downloadFile(url, filename)         // 下载文件
App.showNotification(message, type)     // 显示通知
App.showLoading(element, message)       // 显示加载状态
App.showError(element, message)         // 显示错误状态
App.escapeHtml(text)                    // HTML转义（防XSS）
App.getRelativeDateLabel(dateStr)       // 获取相对日期标签
```

## 配置步骤

### 1. 修改配置

编辑 `app.js` 文件，修改以下配置：

```javascript
const CONFIG = {
  GITHUB_OWNER: 'YOUR_GITHUB_USERNAME',  // 改为你的GitHub用户名
  GITHUB_REPO: 'InoreaderAI',            // 确认仓库名正确
  TAGS_PATH: 'config/tags.json',
  DATA_DIR: 'data'
};
```

### 2. 获取GitHub Token

1. 访问 [GitHub Settings - Personal Access Tokens](https://github.com/settings/tokens/new)
2. 创建新的Token
3. 勾选权限：`repo` (完整访问私有仓库)
4. 生成Token并复制

### 3. 配置Token

1. 打开Tag管理页面 (`tags.html`)
2. 点击"修改Token"按钮
3. 粘贴GitHub Token
4. 保存

### 4. 部署方式

#### 方式一：GitHub Pages（推荐）

1. 将web目录下的文件推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择分支和目录（如：main分支 /web目录）
4. 访问 `https://YOUR_USERNAME.github.io/InoreaderAI/`

#### 方式二：本地服务器

```bash
cd web
python3 -m http.server 8000
```

访问 `http://localhost:8000`

#### 方式三：Netlify/Vercel

将web目录作为根目录部署即可。

## 使用说明

### 首页使用

1. **查看今日统计**: 页面自动加载并显示今日新闻统计
2. **下载今日新闻**: 点击大按钮下载今天的Excel文件
3. **浏览历史文件**: 滚动到底部查看历史文件列表
4. **下载历史文件**: 点击任意历史文件的"下载"按钮

### Tag管理

1. **查看所有Tags**: 页面加载时自动从GitHub获取
2. **添加新Tag**:
   - 点击"添加新Tag"按钮
   - 填写Tag名称、URL、选择类型
   - 点击"保存"
3. **编辑Tag**:
   - 点击Tag卡片上的"编辑"按钮
   - 修改信息
   - 点击"保存"
4. **删除Tag**:
   - 点击Tag卡片上的"删除"按钮
   - 确认删除
5. **修改类型**: 直接在Tag卡片上的下拉菜单中选择新类型

### 获取Inoreader Tag URL

1. 登录Inoreader
2. 找到要添加的Tag
3. 右键点击Tag -> 复制RSS地址
4. 粘贴到Tag管理页面的URL字段
5. 确保URL格式为：`https://www.inoreader.com/stream/user/XXXXX/tag/TagName/view/json`

## 数据存储

### GitHub同步

当设置了GitHub Token后：
- Tags配置会自动同步到 `config/tags.json`
- 每次修改都会创建一个新的commit
- 支持多设备同步

### 本地缓存

- Tags配置会缓存到localStorage
- 即使没有GitHub Token也能正常使用
- 重新设置Token后会自动同步到GitHub

## 安全注意事项

1. **Token安全**:
   - Token存储在浏览器localStorage中
   - 不要在公共电脑上保存Token
   - 定期更换Token

2. **权限控制**:
   - Token只需要 `repo` 权限
   - 不要授予不必要的权限

3. **私有仓库**:
   - 建议使用私有仓库
   - 避免泄露个人配置信息

## 故障排除

### 无法加载Tags

1. 检查GitHub Token是否正确设置
2. 检查Token权限是否包含 `repo`
3. 检查 `app.js` 中的 `GITHUB_OWNER` 和 `GITHUB_REPO` 配置
4. 打开浏览器控制台查看错误信息

### 无法保存到GitHub

1. 确认Token有写入权限
2. 检查网络连接
3. 查看浏览器控制台的错误信息
4. 确认仓库中存在 `config/tags.json` 文件

### 下载文件失败

1. 确认data目录中存在对应的Excel文件
2. 检查文件命名格式：`news_YYYY-MM-DD.xlsx`
3. 对于GitHub Pages部署，确认文件已推送到仓库

## 技术栈

- **前端框架**: 原生JavaScript (ES6+)
- **UI库**: Tailwind CSS
- **API**: GitHub REST API v3
- **存储**: localStorage + GitHub
- **部署**: GitHub Pages / 静态服务器

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 不支持IE

## License

MIT License
