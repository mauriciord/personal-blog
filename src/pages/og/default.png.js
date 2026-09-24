import sharp from "sharp";
import { SITE_TITLE } from "../../config.js";
import { DEFAULT_LOCALE } from "../../lib/i18n.js";
import { renderOgSvg } from "../../lib/og-card.js";

export async function GET() {
  const svg = await renderOgSvg({ title: SITE_TITLE, locale: DEFAULT_LOCALE });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
}
