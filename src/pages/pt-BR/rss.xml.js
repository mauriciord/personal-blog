import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import {
  getLocaleCopy,
  getLocaleInfo,
  getLocalizedPosts,
  localizedPath,
  sortPosts,
} from "../../lib/i18n";

const locale = "pt-BR";

export async function GET(context) {
  const copy = getLocaleCopy(locale);
  const localeInfo = getLocaleInfo(locale);
  const site = context.site ?? new URL("https://mauriciord.dev");
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
      };
    }),
  );

  return rss({
    title: copy.siteTitle || "",
    description: copy.siteDescription || "",
    site: new URL(localeInfo.home, site),
    customData: `<language>${locale}</language>`,
    items,
  });
}
