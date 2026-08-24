import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { markdownToRssHtml } from "../lib/rss-content";
import {
  DEFAULT_LOCALE,
  getLocaleCopy,
  getLocaleInfo,
  getLocalizedPosts,
  localizedPath,
  sortPosts,
} from "../lib/i18n";

export async function GET(context) {
  const locale = DEFAULT_LOCALE;
  const copy = getLocaleCopy(locale);
  const localeInfo = getLocaleInfo(locale);
  const site = context.site ?? new URL("https://mauriciord.dev");
  const feedSite = new URL(localeInfo.home, site);
  const posts = sortPosts(
    getLocalizedPosts(await getCollection("posts"), locale),
  );

  const items = await Promise.all(
    posts.map(async (post) => {
      return {
        link: localizedPath(locale, `/post/${post.data.slug}/`),
        title: post.data.title,
        pubDate: post.data.added,
        description: post.data.description,
        content: markdownToRssHtml(post.body, feedSite),
      };
    }),
  );

  return rss({
    title: copy.siteTitle || "",
    description: copy.siteDescription || "",
    site: feedSite,
    customData: `<language>${locale}</language>`,
    items,
  });
}
