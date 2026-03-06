module.exports = {
  layout: "layouts/chapter.njk",
  tags: ["chapters"],
  eleventyComputed: {
    // 从文件路径自动提取书名
    book: (data) => {
      const inputPath = data.page.inputPath;
      // 只对 .md 文件处理
      if (!inputPath.endsWith('.md')) return data.book || '';
      const normalizedPath = inputPath.replace(/\\/g, '/');
      const match = normalizedPath.match(/books\/([^/]+)\//);
      return match ? match[1] : (data.book || '');
    },
    // 自动从文件名提取 order（如 01-标题.md → order: 1）
    order: (data) => {
      // 如果已手动设置，优先使用
      if (data.order !== undefined) return data.order;
      const inputPath = data.page.inputPath;
      if (!inputPath.endsWith('.md')) return data.order;
      const filename = inputPath.replace(/\\/g, '/').split('/').pop();
      const match = filename.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    },
    // 自动从文件名提取 title（如 01-标题.md → 标题）
    title: (data) => {
      // 如果已手动设置，优先使用
      if (data.title) return data.title;
      const inputPath = data.page.inputPath;
      if (!inputPath.endsWith('.md')) return data.title;
      const filename = inputPath.replace(/\\/g, '/').split('/').pop();
      // 移除开头的数字和分隔符，移除 .md 后缀
      const title = filename.replace(/^\d+[-_\s]*/, '').replace(/\.md$/i, '');
      return title || data.page.fileSlug;
    },
    // 自动生成 permalink（只对章节 .md 文件）
    permalink: (data) => {
      const inputPath = data.page.inputPath;
      // 如果不是 .md 文件，使用默认 permalink
      if (!inputPath.endsWith('.md')) return data.permalink;
      
      const book = data.book;
      const slug = data.page.fileSlug;
      if (book && slug) {
        return `/books/${book}/${slug}/`;
      }
      return data.permalink;
    },
  },
};
