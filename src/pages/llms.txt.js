import { getCollection } from "astro:content";
import {
  AUTHOR_DESCRIPTION,
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "../config";

export async function GET(context) {
  const posts = await getCollection("posts");
  const site = context.site ?? new URL("https://mauriciord.dev");
  const sortedPosts = posts.sort(
    (a, b) =>
      new Date(b.data.updated || b.data.added).valueOf() -
      new Date(a.data.updated || a.data.added).valueOf(),
  );

  const postLinks = sortedPosts
    .map(
      (post) =>
        `- [${post.data.title}](${new URL(`/post/${post.data.slug}/`, site)}) — ${post.data.description}`,
    )
    .join("\n");

  const body = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

${AUTHOR_NAME}: ${AUTHOR_DESCRIPTION}

## Core pages

- [Home](${new URL("/", site)}) — Latest posts and topic tags.
- [About](${new URL("/about/", site)}) — Author profile and contact/social links.
- [Posts](${new URL("/posts/", site)}) — Full blog archive.
- [Newsletter](${new URL("/newsletter/", site)}) — Email updates, archive, and newsletter RSS.
- [Blog RSS](${new URL("/rss.xml", site)}) — Feed for new posts.
- [Sitemap](${new URL("/sitemap-index.xml", site)}) — Crawlable URL index.

## Posts

${postLinks}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
