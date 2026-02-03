# 快速配置指南

本文档帮助你快速配置并启动RSS智能聚合系统的Web前端。

## 第一步：修改GitHub配置

编辑 `web/app.js` 文件的第13-15行：

```javascript
const CONFIG = {
  GITHUB_OWNER: 'YOUR_GITHUB_USERNAME',  // ← 改成你的GitHub用户名
  GITHUB_REPO: 'InoreaderAI',            // ← 确认仓库名称
  TAGS_PATH: 'config/tags.json',
  DATA_DIR: 'data'
};
```

**示例**：

如果你的GitHub用户名是 `tiger`，仓库名是 `InoreaderAI`，则配置为：

```javascript
const CONFIG = {
  GITHUB_OWNER: 'tiger',
  GITHUB_REPO: 'InoreaderAI',
  TAGS_PATH: 'config/tags.json',
  DATA_DIR: 'data'
};
```

## 第二步：获取GitHub Token

### 为什么需要Token？

GitHub Token用于让网页能够读取和更新你的GitHub仓库中的配置文件（`config/tags.json`）。

### 如何获取？

1. 访问 https://github.com/settings/tokens/new
2. 填写Token描述：`InoreaderAI Web Access`
3. 设置过期时间：建议选择 `90 days` 或 `No expiration`
4. 勾选权限：
   - ✅ `repo` (完整的仓库访问权限)
5. 点击页面底部的 `Generate token` 按钮
6. **重要**：复制生成的Token（格式：`ghp_xxxxxxxxxxxx`）

⚠️ **注意**：Token只显示一次，请妥善保存！

## 第三步：运行Web服务器

### 方式A：使用Python（推荐）

```bash
cd web
python3 -m http.server 8000
```

然后在浏览器中访问：`http://localhost:8000`

### 方式B：使用Node.js

```bash
cd web
npx http-server -p 8000
```

### 方式C：使用VSCode Live Server插件

1. 在VSCode中打开 `web` 目录
2. 右键点击 `index.html`
3. 选择 `Open with Live Server`

## 第四步：配置GitHub Token

1. 在浏览器中打开 Web 界面
2. 点击顶部的 `Tag管理` 链接
3. 向下滚动到 `GitHub Token` 部分
4. 点击 `修改Token` 按钮
5. 粘贴第二步中获取的Token
6. 点击 `保存`

✅ 如果看到绿色的"已设置"状态，说明配置成功！

## 第五步：验证功能

### 测试Tag管理

1. 在Tag管理页面，应该能看到从GitHub加载的Tag列表
2. 尝试点击 `添加新Tag` 按钮
3. 填写表单：
   - **Tag名称**：`测试Tag`
   - **Tag URL**：`https://www.inoreader.com/stream/user/1003496420/tag/test/view/json`
   - **Tag类型**：选择 `Normal`
4. 点击 `保存`
5. 返回GitHub仓库查看 `config/tags.json` 是否已更新

### 测试首页

1. 点击 `返回首页`
2. 查看今日统计（如果有数据）
3. 查看历史文件列表

## 常见问题

### Q: Token保存后还是显示"未设置"？

**A**:
1. 检查Token格式，必须以 `ghp_` 或 `github_pat_` 开头
2. 清除浏览器缓存后重试
3. 使用浏览器的无痕模式测试

### Q: 无法加载Tags配置？

**A**:
1. 确认 `app.js` 中的 `GITHUB_OWNER` 和 `GITHUB_REPO` 配置正确
2. 确认仓库中存在 `config/tags.json` 文件
3. 打开浏览器控制台（F12）查看错误信息
4. 确认Token有 `repo` 权限

### Q: 保存Tags时提示"SHA required"？

**A**: 这是正常的GitHub API行为，第一次保存可能失败，刷新页面后重试即可。

### Q: 下载文件时提示404？

**A**:
1. 确认 `data` 目录中存在对应日期的Excel文件
2. 文件命名格式必须是：`news_YYYY-MM-DD.xlsx`
3. 如果使用GitHub Pages，确认文件已推送到仓库

### Q: 能否在多台设备上使用？

**A**: 可以！只要在每台设备上都配置相同的GitHub Token，Tags配置会自动同步。

### Q: Token会过期吗？

**A**: 会，根据你创建Token时设置的过期时间。过期后需要重新生成并配置新Token。

## 安全建议

1. ✅ 使用私有仓库（避免配置泄露）
2. ✅ 定期更换Token（建议90天）
3. ✅ 不要在公共电脑上保存Token
4. ✅ Token只授予必要的权限（repo）
5. ❌ 不要将Token提交到Git仓库
6. ❌ 不要将Token分享给他人

## 下一步

配置完成后，你可以：

1. 📝 在Tag管理页面添加你的Inoreader Tags
2. ⚙️ 配置GitHub Actions定时任务（参考根目录的README）
3. 📊 查看每日生成的新闻汇总Excel文件
4. 🚀 将Web界面部署到GitHub Pages（可选）

## 获取帮助

如遇到问题，请：

1. 查看浏览器控制台（F12 → Console）
2. 检查配置文件是否正确
3. 参考 `web/README.md` 了解详细功能
4. 提交Issue到GitHub仓库

---

祝使用愉快！🎉
