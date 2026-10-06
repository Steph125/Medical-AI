const cheerio = require("cheerio");

const fetchHtml = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) return null;
  return cheerio.load(await response.text());
};

const searchArticles = async (query) => {
  const $ = await fetchHtml(
    `https://www.webmd.com/search/search_results/default.aspx?query=${encodeURIComponent(query)}`
  );
  if (!$) return [];
  return $(".search-results-doc-container")
    .map((i, el) => ({
      link: $(el).find("a").attr("href"),
      title: $(el).find("a").text(),
    }))
    .get();
};

const doctorsBlogPosts = async () => {
  const $ = await fetchHtml("https://blogs.webmd.com/webmd-doctors/default.htm");
  if (!$) return [];
  return $(".posts-list-post-content")
    .map((i, el) => ({
      title: $(el).find("h3").text(),
      link: $(el).find("a").attr("href"),
      desc: $(el).find("p").text(),
      author: $(el).find("span").text(),
    }))
    .get();
};

module.exports = { searchArticles, doctorsBlogPosts };
