/**
 * Copyright (c) 2020 Google Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Copyright (c) 2018 Zach Leatherman
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const { DateTime } = require("luxon");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const hasha = require("hasha");
const touch = require("touch");
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const execFile = promisify(require("child_process").execFile);
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const localImages = require("./third_party/eleventy-plugin-local-images/.eleventy.js");
const CleanCSS = require("clean-css");
const GA_ID = require("./_data/metadata.json").googleAnalyticsId;

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);

  eleventyConfig.addPlugin(localImages, {
    distPath: "_site",
    assetPath: "/img/remote",
    selector:
      "img,amp-img,amp-video,meta[property='og:image'],meta[name='twitter:image'],amp-story",
    verbose: false,
  });

  eleventyConfig.addPlugin(require("./_11ty/img-dim.js"));
  eleventyConfig.addPlugin(require("./_11ty/json-ld.js"));
  eleventyConfig.addPlugin(require("./_11ty/optimize-html.js"));
  eleventyConfig.addPlugin(require("./_11ty/apply-csp.js"));
  eleventyConfig.setDataDeepMerge(true);
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");
  eleventyConfig.addNunjucksAsyncFilter(
    "addHash",
    function (absolutePath, callback) {
      readFile(path.join(".", absolutePath), {
        encoding: "utf-8",
      })
        .then((content) => {
          return hasha.async(content);
        })
        .then((hash) => {
          callback(null, `${absolutePath}?hash=${hash.substr(0, 10)}`);
        })
        .catch((error) => {
          callback(
            new Error(`Failed to addHash to '${absolutePath}': ${error}`)
          );
        });
    }
  );

  async function lastModifiedDate(filename) {
    try {
      const { stdout } = await execFile("git", [
        "log",
        "-1",
        "--format=%cd",
        filename,
      ]);
      return new Date(stdout);
    } catch (e) {
      console.error(e.message);
      // Fallback to stat if git isn't working.
      const stats = await stat(filename);
      return stats.mtime; // Date
    }
  }
  // Cache the lastModifiedDate call because shelling out to git is expensive.
  // This means the lastModifiedDate will never change per single eleventy invocation.
  const lastModifiedDateCache = new Map();
  eleventyConfig.addNunjucksAsyncFilter(
    "lastModifiedDate",
    function (filename, callback) {
      const call = (result) => {
        result.then((date) => callback(null, date));
        result.catch((error) => callback(error));
      };
      const cached = lastModifiedDateCache.get(filename);
      if (cached) {
        return call(cached);
      }
      const promise = lastModifiedDate(filename);
      lastModifiedDateCache.set(filename, promise);
      call(promise);
    }
  );

  eleventyConfig.addFilter("encodeURIComponent", function (str) {
    return encodeURIComponent(str);
  });

  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("sitemapDateTimeString", (dateObj) => {
    const dt = DateTime.fromJSDate(dateObj, { zone: "utc" });
    if (!dt.isValid) {
      return "";
    }
    return dt.toISO();
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByTag("posts");
  });
  eleventyConfig.addCollection("tagList", require("./_11ty/getTagList"));
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("css");
  // 复制书籍文件夹中的图片（cover.jpg/png 等）
  eleventyConfig.addPassthroughCopy("books/**/*.jpg");
  eleventyConfig.addPassthroughCopy("books/**/*.jpeg");
  eleventyConfig.addPassthroughCopy("books/**/*.png");
  eleventyConfig.addPassthroughCopy("books/**/*.webp");
  eleventyConfig.addPassthroughCopy("books/**/*.avif");
  // We need to copy cached.js only if GA is used
  eleventyConfig.addPassthroughCopy(GA_ID ? "js" : "js/*[!cached].*");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("_headers");

  // We need to rebuild upon JS change to update the CSP.
  eleventyConfig.addWatchTarget("./js/");
  // We need to rebuild on CSS change to inline it.
  eleventyConfig.addWatchTarget("./css/");
  // Unfortunately this means .eleventyignore needs to be maintained redundantly.
  // But without this the JS build artefacts doesn't trigger a build.
  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.addCollection("books", function(collectionApi) {
    // 获取 books 目录下所有子文件夹中的 Markdown 文件
    const chapters = collectionApi.getFilteredByGlob("books/*/*.md");

    // 按 book 分类（从文件夹路径提取书名）
    const booksMap = {};

    chapters.forEach(item => {
      // 从文件路径提取书名：books/书名/章节.md（统一使用 / 分隔）
      const normalizedPath = item.inputPath.replace(/\\/g, '/');
      const match = normalizedPath.match(/books\/([^/]+)\//);
      if (match) {
        const bookName = match[1];
        if (!booksMap[bookName]) booksMap[bookName] = [];
        booksMap[bookName].push(item);
      }
    });

    // 对每本书的章节排序，并返回数组结构
    const books = [];
    for (let bookName in booksMap) {
      // 过滤掉 preface.md 和 author.md（这些单独处理）
      const allItems = booksMap[bookName];
      const chapters = allItems.filter(item => {
        const slug = item.inputPath.replace(/\\/g, '/').split('/').pop().toLowerCase();
        return !slug.startsWith('preface') && !slug.startsWith('author');
      });
      chapters.sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

      // 检测封面文件
      const bookDir = path.join('books', bookName);
      let cover = null;
      const coverExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
      for (const ext of coverExtensions) {
        const coverPath = path.join(bookDir, `cover.${ext}`);
        if (fs.existsSync(coverPath)) {
          cover = `/books/${bookName}/cover.${ext}`;
          break;
        }
      }

      // 检测前言文件 preface.md（直接读取文件内容）
      let preface = null;
      const prefaceItem = allItems.find(item => {
        const slug = item.inputPath.replace(/\\/g, '/').split('/').pop().toLowerCase();
        return slug.startsWith('preface');
      });
      if (prefaceItem) {
        // 直接读取文件并渲染 markdown
        const prefacePath = prefaceItem.inputPath;
        if (fs.existsSync(prefacePath)) {
          const rawContent = fs.readFileSync(prefacePath, 'utf8');
          // 移除 front matter
          const contentWithoutFrontMatter = rawContent.replace(/^---\n[\s\S]*?\n---\n*/, '');
          // 创建 markdown 渲染器并渲染
          const md = markdownIt({ html: true, breaks: true, linkify: true });
          const htmlContent = md.render(contentWithoutFrontMatter);
          preface = {
            content: htmlContent,
            url: prefaceItem.url
          };
        }
      }

      // 检测作者文件 author.md
      let author = null;
      const authorItem = allItems.find(item => {
        const slug = item.inputPath.replace(/\\/g, '/').split('/').pop().toLowerCase();
        return slug.startsWith('author');
      });
      if (authorItem) {
        const authorPath = authorItem.inputPath;
        if (fs.existsSync(authorPath)) {
          const rawContent = fs.readFileSync(authorPath, 'utf8');
          // 移除 front matter
          const contentWithoutFrontMatter = rawContent.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
          // 移除 Markdown 语法获取纯文本
          const stripMarkdown = (text) => {
            return text.replace(/\*\*(.+?)\*\*/g, '$1');
          };
          // 解析多行作者信息，每行格式：标签:名称 或 标签：名称
          const lines = contentWithoutFrontMatter.split('\n').filter(line => line.trim());
          const authorLines = lines.map(line => {
            let trimmedLine = line.trim();
            let isBold = false;
            // 检查整行是否被 **...** 包裹
            const boldMatch = trimmedLine.match(/^\*\*(.+)\*\*$/);
            if (boldMatch) {
              isBold = true;
              trimmedLine = boldMatch[1];
            }
            // 解析 标签:名称 格式
            const colonMatch = trimmedLine.match(/^([^:：]+)[：:]\s*(.+)$/);
            if (colonMatch) {
              return {
                label: colonMatch[1].trim(),
                name: colonMatch[2].trim(),
                isBold: isBold
              };
            }
            return {
              label: null,
              name: trimmedLine,
              isBold: isBold
            };
          });
          // 生成 HTML 和纯文本版本
          // 分离加粗和非加粗行
          const boldItems = authorLines.filter(item => item.isBold);
          const normalItems = authorLines.filter(item => !item.isBold);

          // 生成单行的 HTML
          const makeItemHtml = (item, forceBold = false) => {
            const isBold = forceBold || item.isBold;
            const labelHtml = item.label
              ? `<span class="author-label">${isBold ? `<strong>${item.label}</strong>` : item.label}</span><span class="author-colon">${isBold ? '<strong>：</strong>' : '：'}</span>`
              : '';
            const nameHtml = isBold ? `<strong>${item.name}</strong>` : item.name;
            return `${labelHtml}<span class="author-name">${nameHtml}</span>`;
          };

          // 加粗行单独一行（居中）
          const boldHtmlParts = boldItems.map(item => {
            return `<div class="author-row author-row-center">${makeItemHtml(item, true)}</div>`;
          });

          // 非加粗行每两个一组（左右对齐）
          const normalHtmlParts = [];
          for (let i = 0; i < normalItems.length; i += 2) {
            const item1 = normalItems[i];
            const item2 = normalItems[i + 1];
            if (item2) {
              // 两个一行，左右两端对齐
              normalHtmlParts.push(`<div class="author-row author-row-spread"><span class="author-item">${makeItemHtml(item1)}</span><span class="author-item">${makeItemHtml(item2)}</span></div>`);
            } else {
              // 剩下一个，左对齐
              normalHtmlParts.push(`<div class="author-row author-row-left"><span class="author-item">${makeItemHtml(item1)}</span></div>`);
            }
          }

          // 合并：先加粗行，再普通行
          const authorHtml = [...boldHtmlParts, ...normalHtmlParts].join('');
          const authorText = authorLines.map(item => {
            if (item.label) {
              return `${item.label}：${item.name}`;
            }
            return item.name;
          }).join(', ');
          author = {
            html: authorHtml,
            text: authorText
          };
        }
      }

      books.push({
        name: bookName,
        chapters: chapters,
        cover: cover,
        preface: preface,
        author: author,
        bookPath: path.join('books', bookName)
      });
    }

    // 按书籍文件夹的上传时间排序（最新的在前面）
    books.sort((a, b) => {
      try {
        const statA = fs.statSync(a.bookPath);
        const statB = fs.statSync(b.bookPath);
        // 按修改时间降序排列（最新的在前）
        return statB.mtime.getTime() - statA.mtime.getTime();
      } catch (e) {
        return 0;
      }
    });

    // 移除临时的 bookPath 属性
    books.forEach(book => delete book.bookPath);

    return books;
  });

  // 按书名索引的章节集合，方便模板中查找
  eleventyConfig.addCollection("bookChapters", function(collectionApi) {
    const chapters = collectionApi.getFilteredByGlob("books/*/*.md");
    const booksMap = {};

    chapters.forEach(item => {
      const normalizedPath = item.inputPath.replace(/\\/g, '/');
      const match = normalizedPath.match(/books\/([^/]+)\//);
      if (match) {
        const bookName = match[1];
        // 过滤掉 preface.md 和 author.md
        const slug = normalizedPath.split('/').pop().toLowerCase();
        if (slug.startsWith('preface') || slug.startsWith('author')) {
          return; // 跳过
        }
        if (!booksMap[bookName]) booksMap[bookName] = [];
        booksMap[bookName].push(item);
      }
    });

    // 排序
    for (let bookName in booksMap) {
      booksMap[bookName].sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
    }

    return booksMap;
  });

  /* Markdown Overrides */
  // 自定义 markdown-it 插件：把单个换行转成段落分隔
  function novelParagraphPlugin(md) {
    // 在 block 规则前添加预处理
    md.core.ruler.before('block', 'novel_paragraphs', function(state) {
      const src = state.src;
      // 把单个换行替换成双换行（跳过已有的双换行和空行）
      // 匹配：非换行字符 + 单个换行 + 非换行字符
      let result = '';
      let i = 0;
      while (i < src.length) {
        if (src[i] === '\n') {
          // 检查后面是否还有换行
          let j = i + 1;
          while (j < src.length && src[j] === '\n') {
            j++;
          }
          // 如果只有一个换行（j == i + 1），且前后都有内容，转成双换行
          if (j === i + 1 && i > 0 && i < src.length - 1) {
            // 检查前面不是换行，后面不是换行
            if (src[i - 1] !== '\n' && src[i + 1] && src[i + 1] !== '\n') {
              result += '\n\n';
              i++;
              continue;
            }
          }
          result += src.substring(i, j);
          i = j;
        } else {
          result += src[i];
          i++;
        }
      }
      state.src = result;
    });

    // 给段落添加 class
    md.renderer.rules.paragraph_open = function(tokens, idx, options, env, self) {
      return '<p class="novel-paragraph">';
    };
  }

  let markdownLibrary = markdownIt({
    html: true,
    breaks: false,
    linkify: true,
    typographer: true,
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "#",
  }).use(novelParagraphPlugin);

  eleventyConfig.setLibrary("md", markdownLibrary);

  // After the build touch any file in the test directory to do a test run.
  eleventyConfig.on("afterBuild", async () => {
    const files = await readdir("test");
    for (const file of files) {
      touch(`test/${file}`);
      break;
    }
  });

  return {
    templateFormats: ["md", "njk", "html", "liquid"],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about those.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.io/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`
    // pathPrefix: "/",

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    // These are all optional, defaults are shown:
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      // Warning hardcoded throughout repo. Find and replace is your friend :)
      output: "_site",
    },
  };
};
