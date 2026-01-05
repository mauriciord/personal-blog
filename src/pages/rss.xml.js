import rss from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../config";

export async function GET(context) {
	let posts = await getCollection("posts");

	posts = posts.sort(
		(a, b) =>
			new Date(b.data.updated || b.data.added).valueOf() -
			new Date(a.data.updated || a.data.added).valueOf()
	);

	const items = await Promise.all(
		posts.map(async (post) => {
			const { Content, headings, remarkPluginFrontmatter } = await render(post);
			return {
				link: `/post/${post.data.slug}`,
				title: post.data.title,
				pubDate: post.data.added,
				description: post.data.description,
				customData: post.data.updated
					? `<updated>${post.data.updated}</updated>`
					: "",
			};
		})
	);

	return rss({
		title: SITE_TITLE || "",
		description: SITE_DESCRIPTION || "",
		site: context.site,
		items,
		stylesheet: "/rss-styles.xsl",
	});
}
