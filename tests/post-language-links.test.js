import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const stripImports = (code) => code.replace(/import\s+[\s\S]*?from\s+["'][^"']+["'];/g, "");
const i18n = runInNewContext(`${stripImports(source("../src/lib/i18n.js")).replace(/export /g, "")};
  ({ DEFAULT_LOCALE, getLocaleCopy, getLocaleInfo, getLocalizedPosts, localizedPath });`, {
  AUTHOR_DESCRIPTION: "", AUTHOR_NAME: "", SITE_DESCRIPTION: "", SITE_TITLE: "",
});
const header = source("../src/components/Header.astro");
const layout = source("../src/layouts/BlogPost.astro");

// Execute the actual frontmatter and href expressions, without a site build or
// approximating the production link-selection logic in the test.
async function links(content, posts) {
  let props = {};
  if (content) {
    const headerAttributes = layout.match(/<Header\s+([^>]+)\/>/)[1];
    const assignments = [...headerAttributes.matchAll(/(\w+)=\{([^}]+)\}/g)]
      .map(([, key, expression]) => `${JSON.stringify(key)}: (${expression})`).join(",");
    props = await runInNewContext(`(async () => {
      ${stripImports(layout.split("---")[1])}
      return { ${assignments} };
    })()`, {
      ...i18n,
      Astro: { props: { content, postId: "test" }, url: { origin: "https://example.com" } },
      getCollection: async () => posts, getTags: () => [],
      AUTHOR_IMAGE: "/author.jpg", AUTHOR_NAME: "", PERSON_ID: "", SOCIAL_LINKS: [], URL,
    });
  }
  const expressions = [...header.split('<div class="language-toggle"')[1]
    .split('<button')[0].matchAll(/href=\{([^}]+)\}/g)].map((match) => match[1]);
  return Array.from(runInNewContext(`${stripImports(header.split("---")[1])}
    [${expressions.join(",")}];`, { ...i18n, Astro: { props } }));
}

const post = (locale, slug = "shared") => ({ data: { locale, slug } });
const content = (locale) => ({ locale, slug: "shared", added: "2026-01-01", tags: [] });

for (const locale of ["en-US", "pt-BR"]) {
  test(`${locale} links both languages to their matching post, including itself`, async () => {
    assert.deepEqual(await links(content(locale), [post("en-US"), post("pt-BR")]),
      ["/post/shared/", "/pt-BR/post/shared/"]);
  });
  test(`${locale} falls back to the other home when its translation is absent`, async () => {
    assert.deepEqual(await links(content(locale), [post(locale), post(locale === "en-US" ? "pt-BR" : "en-US", "unrelated")]),
      locale === "en-US" ? ["/post/shared/", "/pt-BR/"] : ["/", "/pt-BR/post/shared/"]);
  });
  test(`${locale} matches translation keys and uses each translation's own slug`, async () => {
    const translations = [
      { data: { locale: "en-US", slug: "english-slug", translationKey: "paired" } },
      { data: { locale: "pt-BR", slug: "portuguese-slug", translationKey: "paired" } },
    ];
    const current = translations.find((entry) => entry.data.locale === locale).data;
    assert.deepEqual(
      await links({ ...content(locale), ...current }, translations),
      ["/post/english-slug/", "/pt-BR/post/portuguese-slug/"],
    );
  });
  test(`${locale} does not match unrelated explicit keys despite a shared slug`, async () => {
    const otherLocale = locale === "en-US" ? "pt-BR" : "en-US";
    assert.deepEqual(
      await links({ ...content(locale), translationKey: "current" }, [
        { data: { ...post(locale).data, translationKey: "current" } },
        { data: { ...post(otherLocale).data, translationKey: "unrelated" } },
      ]),
      locale === "en-US"
        ? ["/post/shared/", "/pt-BR/"]
        : ["/", "/pt-BR/post/shared/"],
    );
  });
}
test("unlabelled posts default to English when matching translations", async () => {
  assert.deepEqual(await links(content(undefined), [post(undefined), post("pt-BR")]),
    ["/post/shared/", "/pt-BR/post/shared/"]);
});
test("default Header retains homepage language destinations", async () => {
  assert.deepEqual(await links(), ["/", "/pt-BR/"]);
});
