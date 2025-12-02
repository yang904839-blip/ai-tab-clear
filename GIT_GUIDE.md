# Git 使用指南

## 已完成的设置

✅ Git 仓库已初始化  
✅ 创建了 `.gitignore` 文件  
✅ 完成了首次提交（31个文件）

## 常用 Git 命令

### 查看状态
```bash
# 查看当前修改
git status

# 查看提交历史
git log --oneline

# 查看详细提交历史
git log
```

### 提交更改
```bash
# 添加所有修改的文件
git add .

# 添加特定文件
git add popup.js popup.css

# 提交更改
git commit -m "描述你的更改"

# 示例：功能性提交
git commit -m "feat: 添加历史搜索功能"

# 示例：修复提交
git commit -m "fix: 修复语言切换不生效的问题"

# 示例：样式更新
git commit -m "style: 优化顶栏 UI 设计"
```

### 查看差异
```bash
# 查看未暂存的更改
git diff

# 查看已暂存的更改
git diff --staged

# 查看特定文件的更改
git diff popup.js
```

### 撤销更改
```bash
# 撤销工作区的修改（危险操作！）
git checkout -- popup.js

# 撤销暂存区的文件
git reset HEAD popup.js

# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃更改，危险！）
git reset --hard HEAD~1
```

### 分支管理
```bash
# 创建新分支
git branch feature/new-feature

# 切换分支
git checkout feature/new-feature

# 创建并切换到新分支
git checkout -b feature/new-feature

# 查看所有分支
git branch -a

# 合并分支
git merge feature/new-feature

# 删除分支
git branch -d feature/new-feature
```

### 远程仓库
```bash
# 添加远程仓库
git remote add origin https://github.com/username/ai-tab-clear.git

# 查看远程仓库
git remote -v

# 推送到远程仓库
git push -u origin main

# 拉取远程更改
git pull origin main

# 克隆仓库
git clone https://github.com/username/ai-tab-clear.git
```

## 提交信息规范

建议使用语义化提交信息：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整（不影响功能）
- `refactor:` 重构代码
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```bash
git commit -m "feat: 添加多语言支持（9种语言）"
git commit -m "fix: 修复深色模式切换问题"
git commit -m "style: 优化顶栏渐变效果"
git commit -m "docs: 更新 README 使用说明"
```

## 工作流建议

### 日常开发流程
1. 开始新功能前创建分支
   ```bash
   git checkout -b feature/your-feature
   ```

2. 开发过程中定期提交
   ```bash
   git add .
   git commit -m "feat: 实现部分功能"
   ```

3. 功能完成后合并到主分支
   ```bash
   git checkout main
   git merge feature/your-feature
   ```

4. 推送到远程（如果有）
   ```bash
   git push origin main
   ```

### 快速保存当前工作
```bash
# 暂存当前更改
git stash

# 查看暂存列表
git stash list

# 恢复暂存的更改
git stash pop
```

## 配置 Git 用户信息

首次使用建议配置：
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

查看配置：
```bash
git config --list
```

## .gitignore 说明

已配置忽略以下内容：
- `node_modules/` - 依赖包
- `.DS_Store` - macOS 系统文件
- `.gemini/` - AI 助手工作目录
- `*.log` - 日志文件
- `*.pem`, `*.crx`, `*.zip` - 扩展打包文件

## 下一步

如果需要将代码推送到 GitHub/GitLab：

1. 在 GitHub/GitLab 创建新仓库
2. 添加远程仓库：
   ```bash
   git remote add origin <仓库URL>
   ```
3. 推送代码：
   ```bash
   git push -u origin main
   ```
