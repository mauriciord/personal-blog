import { getCollection } from "astro:content";
import sharp from "sharp";
import { renderOgSvg } from "../../lib/og-card.js";

export async function getStaticPaths() {
  const posts = await getCollection("posts");

  return posts.map((post) => ({
    params: { id: post.id },
    props: { title: post.data.title, locale: post.data.locale },
  }));
}

export async function GET({ props }) {
  const svg = await renderOgSvg({ title: props.title, locale: props.locale });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
}
