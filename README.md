# 📚 跑团图书馆 / TRPG Library

[中文](#中文) | [English](#english)

---

<a name="中文"></a>

## 中文

一个基于 [Eleventy](https://www.11ty.dev/) 构建的高性能小说/跑团记录图书馆网站。

### 📖 如何贡献书籍

欢迎通过 Pull Request 提交您的作品！以下是详细步骤：

#### 1. Fork 并克隆仓库

```bash
# 克隆您 fork 的仓库
git clone https://github.com/SaberArtoriaFan/eleventyblog.git
cd eleventyblog

# 安装依赖
npm install
```

#### 2. 创建新书籍

在 `books/` 文件夹下创建一个新文件夹，以书籍名称命名（建议使用英文或拼音）：

```
books/
└── 我的跑团记录/           # 书籍文件夹名称
    ├── cover.jpg          # 封面图片（可选）
    ├── preface.md         # 前言/简介（可选）
    ├── 01-序章.md         # 第一章
    ├── 02-初遇.md         # 第二章
    ├── 03-冒险开始.md     # 第三章
    └── ...
```

#### 3. 文件命名规则

| 文件类型 | 命名规则 | 说明 |
|---------|---------|------|
| 封面图片 | `cover.jpg` / `cover.png` / `cover.webp` / `cover.avif` | 放在书籍文件夹根目录，系统自动识别 |
| 前言 | `preface.md` | 书籍介绍、阅读须知等，会显示在书籍详情页 |
| 章节 | `序号-章节名.md` | 如 `01-序章.md`、`02-初遇.md` |

**章节命名示例：**
```
01-剑湾上空的告别.md     → 第一章：剑湾上空的告别
02-暗影降临.md           → 第二章：暗影降临
10-最终决战.md           → 第十章：最终决战
```

#### 4. Markdown 文件格式

章节文件支持标准 Markdown 格式：

```markdown
---
# 可选：手动指定标题和顺序（不填写则自动从文件名提取）
# title: 第一章
# order: 1
---

这里是正文内容...

每个段落会自动缩进。

换行会自动生成新段落。
```

#### 5. 本地预览

```bash
# 启动开发服务器
npx eleventy --serve

# 访问 http://localhost:8080 预览效果
```

#### 6. 提交 Pull Request

```bash
# 添加修改
git add books/我的跑团记录/

# 提交
git commit -m "添加新书籍：我的跑团记录"

# 推送到您的 fork
git push origin main

# 然后在 GitHub 上创建 Pull Request
```

---

<a name="english"></a>

## English

A high-performance novel/TRPG library website built with [Eleventy](https://www.11ty.dev/).

### 📖 How to Contribute Books

We welcome contributions via Pull Request! Here's how:

#### 1. Fork and Clone the Repository

```bash
# Clone your forked repository
git clone https://github.com/SaberArtoriaFan/eleventyblog.git
cd eleventyblog

# Install dependencies
npm install
```

#### 2. Create a New Book

Create a new folder under `books/` with your book name:

```
books/
└── my-trpg-story/         # Book folder name
    ├── cover.jpg          # Cover image (optional)
    ├── preface.md         # Preface/introduction (optional)
    ├── 01-prologue.md     # Chapter 1
    ├── 02-first-meeting.md    # Chapter 2
    ├── 03-adventure-begins.md # Chapter 3
    └── ...
```

#### 3. File Naming Rules

| File Type | Naming Rule | Description |
|-----------|-------------|-------------|
| Cover image | `cover.jpg` / `cover.png` / `cover.webp` / `cover.avif` | Place in book folder root, auto-detected |
| Preface | `preface.md` | Book introduction, rules, etc. |
| Chapters | `number-chapter-name.md` | e.g., `01-prologue.md`, `02-first-meeting.md` |

**Chapter naming examples:**
```
01-farewell-above-sword-bay.md  → Chapter 1: Farewell Above Sword Bay
02-shadow-descends.md           → Chapter 2: Shadow Descends
10-final-battle.md              → Chapter 10: Final Battle
```

#### 4. Markdown File Format

Chapter files support standard Markdown:

```markdown
---
# Optional: manually specify title and order
# title: Chapter 1
# order: 1
---

Your content here...

Each paragraph will be automatically indented.

Line breaks create new paragraphs.
```

#### 5. Preview Locally

```bash
# Start development server
npx eleventy --serve

# Visit http://localhost:8080 to preview
```

#### 6. Submit Pull Request

```bash
# Add changes
git add books/my-trpg-story/

# Commit
git commit -m "Add new book: My TRPG Story"

# Push to your fork
git push origin main

# Then create a Pull Request on GitHub
```

---

## 🚀 Development / 开发

```bash
# Install dependencies / 安装依赖
npm install

# Development mode / 开发模式
npx eleventy --serve

# Build for production / 生产构建
npm run build

# Run tests / 运行测试
npm test
```

## 📄 License / 许可证

MIT License

---

## 🙏 Acknowledgments / 致谢

This project is based on [google/eleventy-high-performance-blog](https://github.com/google/eleventy-high-performance-blog) by [Malte Ubl](https://twitter.com/cramforce).

本项目基于 [google/eleventy-high-performance-blog](https://github.com/google/eleventy-high-performance-blog) 构建，感谢 [Malte Ubl](https://twitter.com/cramforce) 的开源贡献。
