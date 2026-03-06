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
