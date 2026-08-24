import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const markdown = new MarkdownIt();
const allowedTags = [...sanitizeHtml.defaults.allowedTags, "img"];

function toAbsoluteUrl(value, site) {
  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(value)
  ) {
    return value;
  }

  try {
    return new URL(value, site).href;
  } catch {
    return value;
  }
}

function normalizeUrlAttributes(tagName, attributes, site) {
  return {
    tagName,
    attribs: {
      ...attributes,
      ...(attributes.href
        ? { href: toAbsoluteUrl(attributes.href, site) }
        : {}),
      ...(attributes.src ? { src: toAbsoluteUrl(attributes.src, site) } : {}),
    },
  };
}

export function markdownToRssHtml(body = "", site) {
  return sanitizeHtml(markdown.render(body), {
    allowedTags,
    transformTags: {
      a: (tagName, attributes) =>
        normalizeUrlAttributes(tagName, attributes, site),
      img: (tagName, attributes) =>
        normalizeUrlAttributes(tagName, attributes, site),
    },
  });
}
