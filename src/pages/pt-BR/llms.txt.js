import { getCollection } from "astro:content";
import { AUTHOR_NAME } from "../../config";
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
  const posts = sortPosts(
    getLocalizedPosts(await getCollection("posts"), locale),
  );
  const site = context.site ?? new URL("https://mauriciord.dev");
  const postLinks = posts
    .map(
      (post) =>
        `- [${post.data.title}](${new URL(localizedPath(locale, `/post/${post.data.slug}/`), site)}) — ${post.data.description}`,
    )
    .join("\n");

  const body = `# ${copy.siteTitle}

> ${copy.siteDescription}

${AUTHOR_NAME}: ${copy.authorDescription}

## ${copy.llms.corePages}

- [Início](${new URL(localeInfo.home, site)}) — ${copy.llms.homeDescription}
- [Sobre](${new URL(localeInfo.about, site)}) — ${copy.llms.aboutDescription}
- [Posts](${new URL(localeInfo.posts, site)}) — ${copy.llms.postsDescription}
- [Newsletter](${new URL(localeInfo.newsletter, site)}) — ${copy.llms.newsletterDescription}
- [RSS](${new URL(localeInfo.rss, site)}) — ${copy.llms.rssDescription}
- [Sitemap](${new URL("/sitemap-index.xml", site)}) — ${copy.llms.sitemapDescription}

## ${copy.llms.posts}

${postLinks}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
